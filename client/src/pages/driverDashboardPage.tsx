import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock, History, IndianRupee, MapPin, XCircle } from "lucide-react"
import { Link } from "react-router-dom"
import DriverAccountShell, { DriverAccountState } from "@/components/driver/DriverAccountShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UseAuth } from "@/contexts/authContext"
import { getApiErrorMessage } from "@/services/api"
import { getDriverProfile, getDriverRides } from "@/services/rydz"
import type { DriverRide, DriverRideSummary } from "@/types"

type HistoryFilter = "ALL" | "COMPLETED" | "CANCELLED"

export default function DriverDashboardPage() {
  const { userInfo } = UseAuth()
  const [summary, setSummary] = useState<DriverRideSummary | null>(null)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [filter, setFilter] = useState<HistoryFilter>("ALL")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    if (!userInfo.token) {
      setLoading(false)
      setHasProfile(false)
      return () => {
        active = false
      }
    }

    setLoading(true)
    getDriverProfile()
      .then(async ({ driverProfile }) => {
        if (!active) return
        const rides = driverProfile ? await getDriverRides() : null
        if (!active) return
        setHasProfile(Boolean(driverProfile))
        setSummary(rides)
      })
      .catch((loadError) => {
        if (active) setError(getApiErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userInfo.token])

  const rides = useMemo(
    () => summary?.history.filter((ride) => filter === "ALL" || ride.status === filter) ?? [],
    [filter, summary?.history],
  )

  if (loading) return <DriverAccountState>Loading driver dashboard...</DriverAccountState>

  return (
    <DriverAccountShell title="Driver dashboard" description="Your earnings and completed ride activity." backTo="/driver">
      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {!userInfo.token ? (
        <DriverAccountState><Button asChild><Link to="/auth">Sign in</Link></Button></DriverAccountState>
      ) : !hasProfile ? (
        <Card className="rounded-3xl">
          <CardHeader><CardTitle>No driver profile</CardTitle><CardDescription>Create a driver profile to start building your dashboard.</CardDescription></CardHeader>
          <CardContent><Button asChild><Link to="/driver">Open driver workspace</Link></Button></CardContent>
        </Card>
      ) : summary ? (
        <>
          {summary.activeRide && (
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
              <div><p className="font-semibold">You have an active ride</p><p className="text-sm text-muted-foreground">Return to the workspace to continue the trip.</p></div>
              <Button asChild><Link to="/driver">Open active ride</Link></Button>
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Total earnings" value={formatCurrency(summary.stats.earnings)} icon={<IndianRupee className="size-5" />} />
            <StatCard label="Completed rides" value={String(summary.stats.completedRideCount)} icon={<CheckCircle2 className="size-5" />} />
          </section>

          <Card className="rounded-3xl shadow-sm">
            <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div><CardTitle>Ride history</CardTitle><CardDescription className="mt-1">Completed and cancelled driver rides.</CardDescription></div>
              <div className="flex rounded-xl border bg-muted/50 p-1">
                {(["ALL", "COMPLETED", "CANCELLED"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filter === value ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                  >
                    {value.charAt(0) + value.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {rides.length ? rides.map((ride) => <RideHistoryCard key={ride.id} ride={ride} />) : (
                <div className="flex flex-col items-center py-10 text-center">
                  <History className="size-8 text-muted-foreground" />
                  <p className="mt-3 font-medium">No rides in this view</p>
                  <p className="mt-1 text-sm text-muted-foreground">Completed or cancelled rides will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </DriverAccountShell>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="flex items-center gap-3 p-5">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">{icon}</div>
        <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-0.5 text-xl font-bold">{value}</p></div>
      </CardContent>
    </Card>
  )
}

function RideHistoryCard({ ride }: { ride: DriverRide }) {
  const completed = ride.status === "COMPLETED"
  return (
    <div className="rounded-2xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3.5" />{new Date(ride.requestedAt).toLocaleString()}</span>
        <Badge variant="outline" className={completed ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600" : "border-destructive/20 bg-destructive/10 text-destructive"}>
          {completed ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}{ride.status}
        </Badge>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex items-start gap-2"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /><span>{ride.pickupAddress}</span></div>
        <div className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-destructive" /><span>{ride.dropoffAddress}</span></div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-muted-foreground">{ride.distanceInKm.toFixed(1)} km · {ride.vehicle?.vehicleType.replace("_", " ") ?? "Vehicle unavailable"}</span>
        <span className="font-bold">{formatCurrency(ride.finalFare ?? ride.estimatedFare)}</span>
      </div>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)
}
