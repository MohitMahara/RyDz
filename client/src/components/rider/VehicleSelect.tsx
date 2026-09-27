import { useEffect, useState } from "react"
import { Bike, Car, ChevronRight, Clock, IndianRupee, MapPin, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/services/api"
import { estimateRide } from "@/services/rydz"
import type { RideLocation, VehicleOption } from "@/types"

interface VehicleSelectProps {
  pickup: RideLocation
  dropoff: RideLocation
  onConfirm: (vehicle: VehicleOption) => void
  onBack: () => void
}

const vehicleIcon = (type: VehicleOption["type"]) =>
  type === "Bike" ? <Bike className="size-7" /> : <Car className="size-7" />

export default function VehicleSelect({ pickup, dropoff, onConfirm, onBack }: VehicleSelectProps) {
  const [selected, setSelected] = useState<string>("")
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [trip, setTrip] = useState<{ distance: number; time: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadEstimate = async () => {
      setLoading(true)
      setError(null)

      try {
        const estimate = await estimateRide(pickup, dropoff)
        if (cancelled) return

        setVehicles(estimate.vehicles)
        setTrip(estimate.tripDetails)
        setSelected(estimate.vehicles.find((v) => v.backendType === "AUTO")?.id ?? estimate.vehicles[0]?.id ?? "")
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadEstimate()
    return () => {
      cancelled = true
    }
  }, [pickup, dropoff])

  const selectedVehicle = vehicles.find((v) => v.id === selected)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-4 py-3">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary shrink-0" />
            <p className="text-xs text-muted-foreground truncate">{pickup.address}</p>
          </div>
          <div className="ml-1 w-px h-3 bg-border" />
          <div className="flex items-center gap-2">
            <MapPin className="size-3 text-destructive shrink-0" />
            <p className="text-xs text-muted-foreground truncate">{dropoff.address}</p>
          </div>
        </div>
        <button onClick={onBack} className="text-xs text-primary font-medium hover:underline shrink-0">
          Edit
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight">Choose a ride</h2>
        <p className="text-sm text-muted-foreground">
          {trip ? `${trip.distance.toFixed(1)} km - Est. ${Math.round(trip.time)} min` : "Estimating trip"}
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center rounded-xl border bg-muted/40 py-8">
          <Spinner className="size-5" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-2">
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v.id)}
              className={cn(
                "flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                selected === v.id
                  ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                  : "border-border bg-background hover:bg-accent"
              )}
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-primary">
                {vehicleIcon(v.type)}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{v.type}</p>
                  {v.backendType === "AUTO" && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                      <Zap className="size-2.5 mr-0.5" />
                      Popular
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                  <Clock className="size-3" />
                  <span className="text-xs">{v.eta} away</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end font-bold text-base">
                  <IndianRupee className="size-4" />
                  <span>{v.fare}</span>
                </div>
                <p className="text-xs text-muted-foreground">Cash</p>
              </div>
              {selected === v.id && (
                <div className="size-5 rounded-full bg-primary flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <Separator />

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Payment</span>
        <div className="flex items-center gap-2 font-medium">
          <span>Cash</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </div>
      </div>

      <Button
        size="lg"
        className="w-full font-semibold text-base h-12 rounded-xl"
        onClick={() => selectedVehicle && onConfirm(selectedVehicle)}
        disabled={!selectedVehicle || loading}
      >
        {selectedVehicle ? (
          <>
            Confirm {selectedVehicle.type} <IndianRupee className="size-4 mx-1" /> {selectedVehicle.fare}
          </>
        ) : (
          "Select a ride"
        )}
      </Button>
    </div>
  )
}
