import { useState } from "react"
import { AlertCircle, CheckCircle, Clock, IndianRupee, MapPin, Navigation, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { RideRequest } from "@/types"

interface DriverFeedProps {
  requests: RideRequest[]
  onAccept: (request: RideRequest) => void
  onReject: (request: RideRequest) => void
}

export default function DriverFeed({ requests, onAccept, onReject }: DriverFeedProps) {
  const [rejecting, setRejecting] = useState<string | null>(null)

  const handleReject = (request: RideRequest) => {
    setRejecting(request.id)
    window.setTimeout(() => {
      onReject(request)
      setRejecting(null)
    }, 250)
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center">
          <AlertCircle className="size-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold">No requests right now</h3>
        <p className="text-sm text-muted-foreground">Ride requests will appear here</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Nearby Requests</h2>
        <Badge variant="secondary" className="gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Live
        </Badge>
      </div>

      <div className="flex flex-col gap-3 max-h-[calc(100vh-22rem)] overflow-y-auto pr-0.5">
        {requests.map((req) => (
          <div
            key={req.id}
            className={`rounded-xl border bg-card shadow-sm transition-all duration-300 overflow-hidden ${
              rejecting === req.id ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
          >
            <div className="p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 size-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Pickup</p>
                    <p className="text-sm font-medium truncate">{req.pickup}</p>
                  </div>
                </div>
                <div className="ml-[0.45rem] w-px h-3 bg-border" />
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-3.5 text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Drop-off</p>
                    <p className="text-sm font-medium truncate">{req.dropoff}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/60 px-2 py-2">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                    <Navigation className="size-3" />
                    <p className="text-xs">To Pickup</p>
                  </div>
                  <p className="text-sm font-bold">{req.unpaidDistance}</p>
                </div>
                <div className="rounded-lg bg-muted/60 px-2 py-2">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                    <Clock className="size-3" />
                    <p className="text-xs">Trip</p>
                  </div>
                  <p className="text-sm font-bold">{req.paidDistance}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2 py-2 border border-emerald-200 dark:border-emerald-900">
                  <div className="flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-400 mb-0.5">
                    <IndianRupee className="size-3" />
                    <p className="text-xs">Fare</p>
                  </div>
                  <div className="flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    <IndianRupee className="size-3" />
                    <span>{req.fare}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-lg h-9 text-muted-foreground border-border hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5"
                  onClick={() => handleReject(req)}
                >
                  <X className="size-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="flex-1 rounded-lg h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onAccept(req)}
                >
                  <CheckCircle className="size-4 mr-1" />
                  Accept
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
