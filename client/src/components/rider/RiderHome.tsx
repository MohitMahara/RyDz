import { useState } from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import LocationSearchInput from "@/components/rider/LocationSearchInput"
import type { RideLocation } from "@/types"

interface RiderHomeProps {
  onFindRide: (pickup: RideLocation, dropoff: RideLocation) => void
}

export default function RiderHome({ onFindRide }: RiderHomeProps) {
  const [pickup, setPickup] = useState<RideLocation | null>(null)
  const [dropoff, setDropoff] = useState<RideLocation | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Where to?</h2>
        <p className="text-sm md:text-lg text-muted-foreground mt-0.5">
          Search and select pickup and drop-off locations
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative flex flex-col gap-2 space-y-3">
          <LocationSearchInput
            selectedLocation={pickup}
            onSelect={setPickup}
            placeholder="Pickup location"
            icon={<div className="size-3 rounded-full bg-primary" />}
          />
          <div className="absolute left-[1.4rem] top-[3.0rem] h-4 w-px bg-border z-10" />
          <LocationSearchInput
            selectedLocation={dropoff}
            onSelect={setDropoff}
            placeholder="Where are you going?"
            icon={<MapPin className="size-4 text-destructive" />}
          />
        </div>
      </div>

      <Button
        size="lg"
        className="w-full font-semibold text-base h-12 rounded-xl"
        disabled={!pickup || !dropoff}
        onClick={() => {
          if (pickup && dropoff) {
            onFindRide(pickup, dropoff)
          }
        }}
      >
        Find Ride
      </Button>
    </div>
  )
}
