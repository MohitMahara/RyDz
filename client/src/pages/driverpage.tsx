import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Car, CheckCircle2, CircleAlert, IndianRupee, Power, ShieldCheck } from "lucide-react"
import ActiveTrip from "@/components/driver/ActiveTrip"
import DriverFeed from "@/components/driver/DriverFeed"
import DriverOnboarding from "@/components/driver/DriverOnboarding"
import DriverVehicleManager from "@/components/driver/DriverVehicleManager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { UseAuth } from "@/contexts/authContext"
import { getApiErrorMessage } from "@/services/api"
import { addDriverVehicle, createDriverProfile, deleteDriverVehicle, getDriverProfile, getDriverRides, initiateDriverKyc, setActiveDriverVehicle, setDriverAvailability, updateUserName, verifyDriverVehicle } from "@/services/rydz"
import socket from "@/services/socket"
import type { DriverProfile, DriverRide, DriverRideSummary, RideRequest } from "@/types"

const asRideRequest = (ride: DriverRide): RideRequest => ({ id: ride.id, pickup: ride.pickupAddress, dropoff: ride.dropoffAddress, unpaidDistance: "—", paidDistance: `${ride.distanceInKm.toFixed(1)} km`, fare: ride.finalFare ?? ride.estimatedFare })

export default function DriverPage() {
  const { userInfo, setUserInfo } = UseAuth()
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [rideSummary, setRideSummary] = useState<DriverRideSummary | null>(null)
  const [requests, setRequests] = useState<RideRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [onboarding, setOnboarding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const locationWatch = useRef<number | null>(null)

  const saveToken = useCallback((token?: string) => {
    if (!token) return
    setUserInfo((current) => {
      const next = { ...current, token }
      localStorage.setItem("rydz-auth", JSON.stringify(next))
      return next
    })
  }, [setUserInfo])

  const refresh = useCallback(async () => {
    const nextProfile = await getDriverProfile()
    setProfile(nextProfile.driverProfile)
    setRideSummary(nextProfile.driverProfile ? await getDriverRides() : null)
  }, [])

  useEffect(() => {
    if (!userInfo.token) { setLoading(false); return }
    refresh().catch((loadError) => setError(getApiErrorMessage(loadError))).finally(() => setLoading(false))
  }, [refresh, userInfo.token])

  const stopLocationWatch = useCallback(() => {
    if (locationWatch.current !== null) {
      navigator.geolocation.clearWatch(locationWatch.current)
      locationWatch.current = null
    }
  }, [])

  const startLocationWatch = useCallback(() => {
    if (!profile?.activeVehicle || !navigator.geolocation) return
    stopLocationWatch()
    locationWatch.current = navigator.geolocation.watchPosition(
      ({ coords }) => socket.emit("driver:update-location", { vehicleType: profile.activeVehicle!.vehicleType, lat: coords.latitude, lng: coords.longitude }),
      () => setError("Location permission is required to receive nearby requests."),
      { enableHighAccuracy: true, maximumAge: 15000 }
    )
  }, [profile?.activeVehicle, stopLocationWatch])

  useEffect(() => () => stopLocationWatch(), [stopLocationWatch])

  useEffect(() => {
    if (!profile?.isAvailable) return
    if (!socket.connected) socket.connect()
    socket.emit("driver:go-online")
    startLocationWatch()
    return stopLocationWatch
  }, [profile?.isAvailable, startLocationWatch, stopLocationWatch])

  useEffect(() => {
    const handleRequest = (payload: { rideId: string; pickup: { address: string }; dropoff: { address: string }; tripDetails: { distanceInKm: number; fare: number }; riderDistanceInKm: number }) => {
      setRequests((current) => [...current.filter((request) => request.id !== payload.rideId), { id: payload.rideId, pickup: payload.pickup.address, dropoff: payload.dropoff.address, unpaidDistance: `${payload.riderDistanceInKm.toFixed(1)} km`, paidDistance: `${payload.tripDetails.distanceInKm.toFixed(1)} km`, fare: payload.tripDetails.fare }])
      setNotice("New nearby ride request received.")
    }
    socket.on("ride:new-request", handleRequest)
    return () => { socket.off("ride:new-request", handleRequest) }
  }, [])

  const eligible = useMemo(() => Boolean(profile?.kycStatus === "APPROVED" && profile.licenseVerified && profile.activeVehicle?.isVerified && profile.activeVehicle.status === "ACTIVE"), [profile])
  const activeRide = rideSummary?.activeRide ?? null

  const run = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true); setError(null); setNotice(null)
    try { await action(); await refresh(); setNotice(successMessage) }
    catch (actionError) { setError(getApiErrorMessage(actionError)) }
    finally { setBusy(false) }
  }

  const createProfile = async ({ name, licenseNumber, licenseExpiryDate }: { name?: string; licenseNumber: string; licenseExpiryDate: string }) => {
    setBusy(true); setError(null)
    try {
      if (name) {
        const updatedUser = await updateUserName(name)
        if (updatedUser) setUserInfo((current) => ({ ...current, user: updatedUser }))
      }
      const created = await createDriverProfile(licenseNumber, licenseExpiryDate)
      saveToken(created.token)
      const kyc = await initiateDriverKyc()
      saveToken(kyc.token)
      setProfile(kyc.driverProfile ?? created.driverProfile)
      setOnboarding(false)
      setNotice("Your driver profile request has been submitted. Your KYC will be approved within 4–5 hours.")
    } catch (createError) { setError(getApiErrorMessage(createError)) }
    finally { setBusy(false) }
  }

  const toggleAvailability = async () => {
    if (!profile) return
    await run(async () => {
      if (!profile.isAvailable && !eligible) throw new Error("KYC approval, license verification, and a verified active vehicle are required before going online.")
      if (activeRide) throw new Error("Availability cannot be changed during an active driver ride.")
      if (!profile.isAvailable) {
        if (!navigator.geolocation) throw new Error("Location services are unavailable in this browser.")
        await new Promise<void>((resolve, reject) => navigator.geolocation.getCurrentPosition(() => resolve(), () => reject(new Error("Location permission is required to go online.")), { enableHighAccuracy: true }))
        await setDriverAvailability(true)
        if (!socket.connected) socket.connect()
        socket.emit("driver:go-online")
        startLocationWatch()
      } else {
        await setDriverAvailability(false)
        socket.emit("driver:go-offline")
        stopLocationWatch()
        setRequests([])
      }
    }, profile.isAvailable ? "You are offline." : "You are online and ready for requests.")
  }

  const acceptRequest = (request: RideRequest) => {
    setBusy(true); setError(null)
    socket.emit("ride:respond", { rideId: request.id, decision: "ACCEPT" }, async (result: { success: boolean; message: string }) => {
      setBusy(false)
      if (!result.success) { setError(result.message); return }
      setRequests([])
      await refresh()
      setNotice("Ride accepted. Head to the pickup point.")
    })
  }

  if (loading) return <PageState text="Loading your driver workspace..." />
  if (!userInfo.token) return <PageState text="Sign in to manage your driver profile." />
  if (!profile && onboarding) return <DriverOnboarding userName={userInfo.user?.name} loading={busy} error={error} onSubmit={createProfile} onCancel={() => { setOnboarding(false); setError(null) }} />
  if (!profile) return <DriverEmptyState onCreate={() => setOnboarding(true)} />

  return <div className="min-h-full overflow-y-auto bg-background px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto w-full max-w-6xl space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Driver workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Drive with RyDz</h1><p className="mt-2 text-sm text-muted-foreground">Your vehicle, availability, and trips in one place.</p></div><Button className={`h-11 rounded-xl ${profile.isAvailable ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}`} disabled={busy || Boolean(activeRide) || (!profile.isAvailable && !eligible)} onClick={() => void toggleAvailability()}>{busy ? <Spinner className="size-4" /> : <Power className="size-4" />}{profile.isAvailable ? "Go offline" : "Go online"}</Button></header>
    {(error || notice) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"}`}>{error ?? notice}</div>}
    {profile.kycStatus !== "APPROVED" ? <KycState profile={profile} busy={busy} onInitiate={() => void run(async () => { const result = await initiateDriverKyc(); saveToken(result.token) }, "Your KYC request has been submitted.")} /> : <><section className="grid gap-4 sm:grid-cols-3"><StatCard label="Earnings" value={`₹${rideSummary?.stats.earnings.toFixed(0) ?? "0"}`} icon={<IndianRupee className="size-5" />} /><StatCard label="Completed rides" value={String(rideSummary?.stats.completedRideCount ?? 0)} icon={<CheckCircle2 className="size-5" />} /><StatCard label="KYC status" value="Approved" icon={<ShieldCheck className="size-5" />} /></section><div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.85fr)]"><div className="space-y-6">{activeRide ? <Card className="rounded-3xl shadow-sm"><CardHeader><CardTitle>Active ride</CardTitle><CardDescription>Keep the ride updated as you reach the pickup and destination.</CardDescription></CardHeader><CardContent><ActiveTrip request={asRideRequest(activeRide)} status={activeRide.status as "ACCEPTED" | "ARRIVED" | "IN_PROGRESS"} onComplete={() => void run(async () => undefined, "Trip completed successfully.")} onCancel={() => void run(async () => undefined, "Trip cancelled.")} /></CardContent></Card> : <Card className="rounded-3xl shadow-sm"><CardHeader><CardTitle>Incoming requests</CardTitle><CardDescription>{profile.isAvailable ? "Nearby eligible requests will appear here." : "Go online to receive ride requests."}</CardDescription></CardHeader><CardContent><DriverFeed requests={profile.isAvailable ? requests : []} onAccept={acceptRequest} onReject={(request) => { socket.emit("ride:respond", { rideId: request.id, decision: "REJECT" }, () => undefined); setRequests((current) => current.filter((item) => item.id !== request.id)) }} /></CardContent></Card>}<RideHistory rides={rideSummary?.history ?? []} /></div><div className="space-y-6"><DriverVehicleManager profile={profile} loading={busy} onAdd={(vehicle) => run(async () => { await addDriverVehicle(vehicle) }, "Vehicle added successfully.")} onVerify={(id) => run(async () => { await verifyDriverVehicle(id) }, "Vehicle verified successfully.")} onSetActive={(id) => run(async () => { await setActiveDriverVehicle(id) }, "Active vehicle updated.")} onDelete={(id) => run(async () => { await deleteDriverVehicle(id) }, "Vehicle deleted.")} /><Readiness profile={profile} /></div></div></>}
  </div></div>
}

function DriverEmptyState({ onCreate }: { onCreate: () => void }) { return <div className="flex min-h-full items-center justify-center bg-background p-6"><Card className="w-full max-w-md rounded-3xl p-3 text-center shadow-xl"><CardContent className="space-y-5 pt-6"><div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Car className="size-8" /></div><div><h1 className="text-2xl font-bold">Earn with Rydz</h1><p className="mt-2 text-sm text-muted-foreground">Create your driver profile and start earning.</p></div><Button className="w-full rounded-xl" onClick={onCreate}>Create Driver Profile</Button></CardContent></Card></div> }
function PageState({ text }: { text: string }) { return <div className="flex min-h-full items-center justify-center p-6"><p className="text-sm text-muted-foreground">{text}</p></div> }
function KycState({ profile, busy, onInitiate }: { profile: DriverProfile; busy: boolean; onInitiate: () => void }) { const rejected = profile.kycStatus === "REJECTED"; return <Card className="mx-auto max-w-2xl rounded-3xl shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" />KYC {profile.kycStatus.replace("_", " ")}</CardTitle><CardDescription>{rejected ? "Your verification was not approved. Check your license details and submit KYC again." : "Your driver profile request has been submitted. Your KYC will be approved within 4–5 hours."}</CardDescription></CardHeader><CardContent>{(profile.kycStatus === "NOT_STARTED" || rejected) && <Button className="rounded-xl" disabled={busy} onClick={onInitiate}>{busy ? <Spinner className="size-4" /> : "Submit KYC"}</Button>}</CardContent></Card> }
function Readiness({ profile }: { profile: DriverProfile }) { const rows = [["KYC approved", profile.kycStatus === "APPROVED"], ["License verified", profile.licenseVerified], ["Verified active vehicle", Boolean(profile.activeVehicle?.isVerified && profile.activeVehicle.status === "ACTIVE")]]; return <Card className="rounded-3xl shadow-sm"><CardHeader><CardTitle>Driver readiness</CardTitle><CardDescription>These server-verified checks control availability.</CardDescription></CardHeader><CardContent className="space-y-3">{rows.map(([label, complete]) => <div key={String(label)} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5 text-sm"><span>{label}</span>{complete ? <CheckCircle2 className="size-5 text-emerald-600" /> : <CircleAlert className="size-5 text-amber-600" />}</div>)}</CardContent></Card> }
function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <Card className="rounded-2xl shadow-sm"><CardContent className="flex items-center gap-3 p-5"><div className="rounded-xl bg-primary/10 p-2.5 text-primary">{icon}</div><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-0.5 text-xl font-bold">{value}</p></div></CardContent></Card> }
function RideHistory({ rides }: { rides: DriverRide[] }) { return <Card className="rounded-3xl shadow-sm"><CardHeader><CardTitle>Driver ride history</CardTitle><CardDescription>Completed and cancelled rides.</CardDescription></CardHeader><CardContent className="space-y-3">{rides.length ? rides.map((ride) => <div key={ride.id} className="rounded-xl border p-3 text-sm"><div className="flex justify-between gap-3"><p className="font-medium">{ride.pickupAddress}</p><span className={ride.status === "COMPLETED" ? "text-emerald-600" : "text-muted-foreground"}>{ride.status}</span></div><p className="mt-1 text-muted-foreground">To {ride.dropoffAddress} · {ride.rider.name ?? "Rider"}</p><p className="mt-2 font-medium">₹{ride.finalFare ?? ride.estimatedFare}</p></div>) : <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">No completed or cancelled driver rides yet.</p>}</CardContent></Card> }
