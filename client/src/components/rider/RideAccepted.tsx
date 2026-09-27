import { Bike, Car, Phone, Shield, Star, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { ActiveRide, RideLocation } from "@/types"

interface RideAcceptedProps {
  ride: ActiveRide
  pickup?: RideLocation | null
  dropoff?: RideLocation | null
  onCancel: () => void
}

export default function RideAccepted({ ride, pickup, dropoff, onCancel }: RideAcceptedProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Active Trip Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 mb-1">
            Driver En Route
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Active Trip</h2>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end font-bold text-lg">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span>{ride.rating?.toFixed(1) ?? "5.0"}</span>
          </div>
          <p className="text-xs text-muted-foreground">Verified Driver</p>
        </div>
      </div>

      {/* Driver & Vehicle Summary */}
      <div className="flex items-center gap-4 rounded-2xl bg-muted/50 p-4 border border-border shadow-xs">
        <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
          {ride.vehicleType === "Bike" ? <Bike className="size-7" /> : <Car className="size-7" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-foreground truncate">{ride.driverName}</h3>
          <p className="text-xs text-muted-foreground">{ride.vehicleType}</p>
          <div className="mt-1.5">
            <Badge variant="outline" className="font-mono text-xs tracking-widest px-2.5 py-0.5 font-bold border-2">
              {ride.licensePlate}
            </Badge>
          </div>
        </div>
      </div>

      {/* OTP Display Section */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 dark:bg-primary/10 p-4 text-center space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verification OTP Code</p>
        <div className="flex items-center justify-center gap-2">
          <Shield className="size-5 text-primary shrink-0" />
          <div className="flex gap-1.5">
            {ride.otp.split("").map((digit, i) => (
              <div
                key={`${digit}-${i}`}
                className="flex size-9 sm:size-10 items-center justify-center rounded-xl border border-primary/30 bg-background font-mono text-lg sm:text-xl font-bold text-primary shadow-xs"
              >
                {digit}
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">Share this OTP code with your driver before starting</p>
      </div>

      {/* Trip Addresses */}
      {(pickup || dropoff) && (
        <div className="rounded-2xl bg-muted/40 p-4 border border-border space-y-3 text-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trip Details</p>
          {pickup && (
            <div className="flex items-center gap-3">
              <div className="size-2.5 rounded-full bg-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Pickup Point</p>
                <p className="font-medium text-foreground truncate">{pickup.address}</p>
              </div>
            </div>
          )}
          {pickup && dropoff && <div className="ml-1 w-px h-3 bg-border" />}
          {dropoff && (
            <div className="flex items-center gap-3">
              <MapPin className="size-4 text-destructive shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="font-medium text-foreground truncate">{dropoff.address}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Action Controls */}
      <div className="flex gap-3">
        {ride.phoneNumber ? (
          <Button variant="outline" className="flex-1 rounded-xl gap-2 font-medium h-11" asChild>
            <a href={`tel:${ride.phoneNumber}`}>
              <Phone className="size-4 text-primary" />
              Call Driver
            </a>
          </Button>
        ) : (
          <Button variant="outline" className="flex-1 rounded-xl gap-2 font-medium h-11" disabled>
            <Phone className="size-4" />
            No Phone
          </Button>
        )}
        <Button
          variant="destructive"
          className="flex-1 rounded-xl font-semibold h-11 bg-red-600 hover:bg-red-700 text-white"
          onClick={onCancel}
        >
          Cancel Ride
        </Button>
      </div>
    </div>
  )
}
