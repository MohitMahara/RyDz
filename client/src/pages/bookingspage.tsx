import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getRiderHistory, type RideHistoryItem } from "@/services/rydz"
import { ArrowLeft, Clock, MapPin, CheckCircle2, XCircle, History } from "lucide-react"

export default function BookingsPage() {
  const navigate = useNavigate()
  const [riderRides, setRiderRides] = useState<RideHistoryItem[]>([])
  const [filter, setFilter] = useState<"ALL" | "COMPLETED" | "CANCELLED">("ALL")

  useEffect(() => {
    setRiderRides(getRiderHistory())
  }, [])

  const filteredRides = riderRides.filter((r) => {
    if (filter === "COMPLETED") return r.status === "COMPLETED"
    if (filter === "CANCELLED") return r.status === "CANCELLED"
    return true
  })

  return (
    <div className="min-h-dvh w-full bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto pb-24 md:pb-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl size-9"
              onClick={() => navigate("/profile")}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">My Bookings</h1>
              <p className="text-xs text-muted-foreground">View all your past and cancelled rides</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1 px-3 py-1 text-xs font-semibold rounded-full border-primary/30 text-primary bg-primary/5">
            <History className="size-3.5 text-primary" />
            Rider History
          </Badge>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 border bg-muted/60 p-1.5 rounded-2xl text-xs font-semibold w-full sm:w-auto">
          <button
            onClick={() => setFilter("ALL")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all ${
              filter === "ALL" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Rides ({riderRides.length})
          </button>
          <button
            onClick={() => setFilter("COMPLETED")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all ${
              filter === "COMPLETED" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter("CANCELLED")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all ${
              filter === "CANCELLED" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Rides List */}
        <div className="space-y-4">
          {filteredRides.length === 0 ? (
            <Card className="border border-dashed border-border p-8 text-center rounded-3xl bg-card space-y-2">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <History className="size-6" />
              </div>
              <p className="font-semibold text-sm text-foreground">No bookings found</p>
              <p className="text-xs text-muted-foreground">You haven't booked any rides matching this filter yet.</p>
              <Button size="sm" className="rounded-xl mt-2 font-semibold" onClick={() => navigate("/rides")}>
                Book a Ride
              </Button>
            </Card>
          ) : (
            filteredRides.map((ride) => (
              <Card key={ride.id} className="border border-border shadow-xs rounded-3xl overflow-hidden bg-card transition-all hover:shadow-md">
                <CardContent className="p-5 space-y-4">
                  {/* Top Status & Date */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Clock className="size-3.5" /> {ride.date}
                    </span>
                    {ride.status === "COMPLETED" ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold gap-1 px-2.5 py-0.5">
                        <CheckCircle2 className="size-3" /> Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-semibold gap-1 px-2.5 py-0.5">
                        <XCircle className="size-3" /> Cancelled
                      </Badge>
                    )}
                  </div>

                  {/* Route */}
                  <div className="space-y-2 text-sm bg-muted/30 p-3.5 rounded-2xl border border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="size-2.5 rounded-full bg-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-muted-foreground">Pickup</p>
                        <p className="font-semibold text-foreground truncate">{ride.pickup}</p>
                      </div>
                    </div>
                    <div className="ml-1 w-px h-3 bg-border" />
                    <div className="flex items-center gap-2.5">
                      <MapPin className="size-4 text-destructive shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-muted-foreground">Destination</p>
                        <p className="font-semibold text-foreground truncate">{ride.dropoff}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    <div>
                      <span>Vehicle: <strong className="text-foreground">{ride.vehicleType}</strong></span>
                      {ride.driverName && <span className="ml-3">Driver: <strong className="text-foreground">{ride.driverName}</strong></span>}
                    </div>
                    <span className="text-base font-extrabold text-foreground">₹{ride.fare}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
