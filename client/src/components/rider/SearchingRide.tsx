import { Bike, Car } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchingRideProps {
  vehicleType: string
  broadcastedTo: number
}

export default function SearchingRide({ vehicleType, broadcastedTo }: SearchingRideProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="relative flex items-center justify-center">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "absolute rounded-full border-2 border-primary/30 animate-ping",
              i === 1 && "size-16",
              i === 2 && "size-28 animation-delay-150",
              i === 3 && "size-40 animation-delay-300"
            )}
            style={{ animationDelay: `${(i - 1) * 0.25}s`, animationDuration: "1.5s" }}
          />
        ))}
        <div className="relative z-10 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
          {vehicleType === "Bike" ? <Bike className="size-8" /> : <Car className="size-8" />}
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-semibold tracking-tight">Finding your {vehicleType}</h2>
        <p className="text-sm text-muted-foreground mt-1">Broadcasting to nearby drivers...</p>
      </div>

      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="size-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <div className="w-full rounded-xl bg-muted/60 p-4 text-sm text-center text-muted-foreground">
        <p>
          {broadcastedTo > 0
            ? `${broadcastedTo} drivers notified. Waiting for one to accept.`
            : "No matching drivers were online nearby. Keep this open while drivers come online."}
        </p>
      </div>
    </div>
  )
}
