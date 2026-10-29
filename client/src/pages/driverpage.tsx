import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Car, CheckCircle2, CircleAlert, Gauge, Power, Settings, ShieldCheck } from "lucide-react"
import ActiveTrip from "@/components/driver/ActiveTrip"
import DriverFeed from "@/components/driver/DriverFeed"
import DriverOnboarding from "@/components/driver/DriverOnboarding"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useDriverOperations } from "@/hooks/useDriverOperations"
import { useDriverWorkspace } from "@/hooks/useDriverWorkspace"
import { getApiErrorMessage } from "@/services/api"
import type { DriverProfile, DriverRide, RideRequest } from "@/types"

const asRideRequest = (ride: DriverRide): RideRequest => ({
  id: ride.id,
  pickup: ride.pickupAddress,
  dropoff: ride.dropoffAddress,
  unpaidDistance: "—",
  paidDistance: `${ride.distanceInKm.toFixed(1)} km`,
  fare: ride.finalFare ?? ride.estimatedFare,
})

export default function DriverPage() {
  const [onboarding, setOnboarding] = useState(false)
  const workspace = useDriverWorkspace()
  const operations = useDriverOperations({
    profile: workspace.profile,
    activeRide: workspace.activeRide,
    onRideChanged: workspace.refreshAfterRide,
    onError: workspace.setError,
    onNotice: workspace.setNotice,
  })

  const toggleAvailability = async () => {
    if (!workspace.profile || workspace.activeRide) return

    workspace.setError(null)
    if (!workspace.profile.isAvailable) {
      try {
        await operations.ensureLocationPermission()
      } catch (locationError) {
        workspace.setError(getApiErrorMessage(locationError))
        return
      }
    }

    await workspace.updateAvailability(!workspace.profile.isAvailable)
  }

  if (workspace.loading) return <PageState text="Loading your driver workspace..." />

  if (!workspace.userInfo.token) {
    return <PageState text="Sign in to create or access your driver profile." action="/auth" actionLabel="Sign in" />
  }

  if (workspace.state === "NO_PROFILE" && onboarding) {
    return (
      <DriverOnboarding
        userName={workspace.userInfo.user?.name}
        loading={workspace.busy}
        error={workspace.error}
        onSubmit={workspace.createProfile}
        onCancel={() => {
          setOnboarding(false)
          workspace.setError(null)
        }}
      />
    )
  }

  if (workspace.state === "NO_PROFILE") {
    return <DriverEmptyState onCreate={() => setOnboarding(true)} />
  }

  const profile = workspace.profile
  if (!profile) return null

  const actionBusy = workspace.busy || operations.responding

  return (
    <div className="min-h-full overflow-y-auto bg-background px-4 py-6 pb-24 sm:px-6 lg:px-8 md:pb-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">Driver workspace</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Drive with RyDz</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Go online, respond to requests, and manage your active ride.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl" asChild>
              <Link to="/driver/dashboard"><Gauge className="size-4" />Dashboard</Link>
            </Button>
            <Button
              className={`h-10 rounded-xl ${
                profile.isAvailable ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              disabled={actionBusy || Boolean(workspace.activeRide) || (!profile.isAvailable && !workspace.ready)}
              onClick={() => void toggleAvailability()}
            >
              {workspace.busy ? <Spinner className="size-4" /> : <Power className="size-4" />}
              {workspace.activeRide ? "Ride in progress" : profile.isAvailable ? "Go offline" : "Go online"}
            </Button>
          </div>
        </header>

        <Feedback error={workspace.error} notice={workspace.notice} />

        {workspace.state === "NOT_READY" && <DriverReadiness profile={profile} />}
        {workspace.state === "OFFLINE" && <OfflineState profile={profile} />}

        {workspace.state === "ONLINE" && (
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="size-2.5 animate-pulse rounded-full bg-emerald-500" />
                <CardTitle>You are online</CardTitle>
              </div>
              <CardDescription>Nearby requests matching your active vehicle appear below.</CardDescription>
            </CardHeader>
            <CardContent>
              <DriverFeed
                requests={operations.requests}
                loading={actionBusy}
                onAccept={operations.acceptRequest}
                onReject={operations.rejectRequest}
              />
            </CardContent>
          </Card>
        )}

        {workspace.state === "ACTIVE_RIDE" && workspace.activeRide && (
          <Card className="mx-auto max-w-2xl rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>Active ride</CardTitle>
              <CardDescription>Complete each trip stage before accepting another request.</CardDescription>
            </CardHeader>
            <CardContent>
              <ActiveTrip
                key={`${workspace.activeRide.id}-${workspace.activeRide.status}`}
                request={asRideRequest(workspace.activeRide)}
                status={workspace.activeRide.status as "ACCEPTED" | "ARRIVED" | "IN_PROGRESS"}
                onComplete={() => void workspace.refreshAfterRide("Trip completed successfully.")}
                onCancel={() => void workspace.refreshAfterRide("Trip cancelled.")}
              />
            </CardContent>
          </Card>
        )}

        <DriverAccountLinks profile={profile} />
      </div>
    </div>
  )
}

function DriverReadiness({ profile }: { profile: DriverProfile }) {
  const checks = [
    { label: "KYC approved", ready: profile.kycStatus === "APPROVED", href: "/profile/driver/verification" },
    { label: "License verified", ready: profile.licenseVerified, href: "/profile/driver/verification" },
    {
      label: "Verified active vehicle",
      ready: Boolean(profile.activeVehicle?.isVerified && profile.activeVehicle.status === "ACTIVE"),
      href: "/profile/driver/vehicles",
    },
  ]

  return (
    <Card className="rounded-3xl border-amber-500/30 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleAlert className="size-5 text-amber-600" />Finish setting up your driver account
        </CardTitle>
        <CardDescription>All readiness checks must pass before you can go online.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {checks.map((check) => (
          <Link
            key={check.label}
            to={check.href}
            className="flex items-center justify-between rounded-2xl border bg-card p-4 transition hover:bg-muted/40"
          >
            <span className="text-sm font-medium">{check.label}</span>
            {check.ready ? <CheckCircle2 className="size-5 text-emerald-600" /> : <ArrowRight className="size-5 text-amber-600" />}
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

function OfflineState({ profile }: { profile: DriverProfile }) {
  return (
    <Card className="rounded-3xl shadow-sm">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Power className="size-9" />
        </div>
        <h2 className="mt-5 text-2xl font-bold">You are offline</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Go online when you are in your active vehicle and ready to receive nearby ride requests.
        </p>
        {profile.activeVehicle && (
          <div className="mt-5 rounded-2xl border bg-muted/30 px-5 py-3 text-sm">
            <span className="text-muted-foreground">Active vehicle: </span>
            <span className="font-semibold">
              {profile.activeVehicle.make} {profile.activeVehicle.model} · {profile.activeVehicle.plateNumber}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DriverAccountLinks({ profile }: { profile: DriverProfile }) {
  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Settings className="size-5 text-primary" />Driver account</CardTitle>
        <CardDescription>Documents and vehicle settings are managed from your profile.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" className="h-auto justify-between rounded-2xl p-4" asChild>
          <Link to="/profile/driver/verification">
            <span className="flex items-center gap-2"><ShieldCheck className="size-4" />Verification: {profile.kycStatus.replace("_", " ")}</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button variant="outline" className="h-auto justify-between rounded-2xl p-4" asChild>
          <Link to="/profile/driver/vehicles">
            <span className="flex items-center gap-2"><Car className="size-4" />Vehicles: {profile.vehicles?.length ?? 0}</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function Feedback({ error, notice }: { error: string | null; notice: string | null }) {
  if (!error && !notice) return null
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${
      error
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    }`}>
      {error ?? notice}
    </div>
  )
}

function DriverEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-full items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md rounded-3xl p-3 text-center shadow-xl">
        <CardContent className="space-y-5 pt-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Car className="size-8" /></div>
          <div>
            <h1 className="text-2xl font-bold">Drive with RyDz</h1>
            <p className="mt-2 text-sm text-muted-foreground">Create your driver profile, complete verification, and start receiving rides.</p>
          </div>
          <Button className="w-full rounded-xl" onClick={onCreate}>Create driver profile</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function PageState({ text, action, actionLabel }: { text: string; action?: string; actionLabel?: string }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm text-muted-foreground">{text}</p>
      {action && actionLabel && <Button asChild><Link to={action}>{actionLabel}</Link></Button>}
    </div>
  )
}
