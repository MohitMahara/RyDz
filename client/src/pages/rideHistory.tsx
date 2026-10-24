import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getRiderHistory} from "@/services/rydz"
import type {Ride} from "@/types"
import { ArrowLeft, Clock, MapPin, CheckCircle2, XCircle, History } from "lucide-react"

export default function RideHistory() {
  const navigate = useNavigate()
  const [riderRides, setRiderRides] = useState<Ride[]>([])
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all")

  useEffect(() => {

    const fetchRides = async () => {
      try {
        const riderHistoryParams = {
          status: filter,
          limit: 20,
          page: 1,
          sortBy: "requestedAt",
          sortOrder: "desc",
        }
        const rides = await getRiderHistory(riderHistoryParams)
        setRiderRides(rides)
      } catch (error) {
        console.error("Error fetching rider history:", error)
      }
    }

    fetchRides()
  }, [filter])


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
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 border bg-muted/60 p-1.5 rounded-2xl text-xs font-semibold w-full sm:w-auto">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all ${
              filter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Rides ({riderRides.length})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all ${
              filter === "completed" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all ${
              filter === "cancelled" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Rides List */}
        <div className="space-y-4">
          {riderRides.length === 0 ? (
            <Card className="border border-dashed border-border p-8 text-center rounded-3xl bg-card space-y-2">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <History className="size-6" />
              </div>
              <p className="font-semibold text-sm text-foreground">No bookings found</p>
              <p className="text-xs text-muted-foreground">You haven't booked any rides matching this filter yet.</p>
            </Card>
          ) : (
            riderRides.map((ride) => (
              <Card key={ride.id} className="border border-border shadow-xs rounded-3xl overflow-hidden bg-card transition-all hover:shadow-md">
                <CardContent className="p-5 space-y-4">
                  {/* Top Status & Date */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Clock className="size-3.5" /> {ride.requestedAt ? new Date(ride.requestedAt).toLocaleString() : "N/A"}
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
                        <p className="font-semibold text-foreground truncate">{ride.pickupAddress}</p>
                      </div>
                    </div>
                    <div className="ml-1 w-px h-3 bg-border" />
                    <div className="flex items-center gap-2.5">
                      <MapPin className="size-4 text-destructive shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-muted-foreground">Destination</p>
                        <p className="font-semibold text-foreground truncate">{ride.dropoffAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    <div>
                      <span>Vehicle: <strong className="text-foreground">{ride.requestedVehicleType}</strong></span>
                      {ride.driver && <span className="ml-3">Driver: <strong className="text-foreground">{ride.driver.name}</strong></span>}
                    </div>
                    <span className="text-base font-extrabold text-foreground">₹{ride.estimatedFare}</span>
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
