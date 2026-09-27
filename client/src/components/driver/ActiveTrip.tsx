import { useState } from "react"
import { AlertCircle, CheckCircle, IndianRupee, MapPin, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import socket from "@/services/socket"
import type { RideRequest } from "@/types"

interface ActiveTripProps {
  request: RideRequest
  onComplete: () => void
}

type TripStage = "accepted" | "arrived" | "started"
type SocketAck = { success: boolean; message: string }

export default function ActiveTrip({ request, onComplete }: ActiveTripProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<TripStage>("accepted")

  const runRideAction = (event: "ride:arrive" | "ride:start" | "ride:complete", payload: object) => {
    setLoading(true)
    setError(null)

    socket.emit(event, payload, (result: SocketAck) => {
      setLoading(false)
      if (!result.success) {
        setError(result.message)
        return
      }

      if (event === "ride:arrive") setStage("arrived")
      if (event === "ride:start") setStage("started")
      if (event === "ride:complete") onComplete()
    })
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    setError(null)

    if (value && index < otp.length - 1) {
      const nextInput = document.getElementById(`trip-otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`trip-otp-${index - 1}`)
      prev?.focus()
    }
  }

  const enteredOtp = otp.join("")

  if (stage === "started") {
    return (
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
          <CheckCircle className="size-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Trip Started</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Navigate to <span className="font-medium text-foreground">{request.dropoff}</span>
          </p>
        </div>

        <div className="w-full rounded-xl bg-muted/60 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Trip Distance</span>
            <span className="font-semibold">{request.paidDistance}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-muted-foreground">Fare</span>
            <span className="inline-flex items-center font-bold text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="size-3.5" />
              {request.fare}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-center gap-2 text-destructive text-sm">
            <AlertCircle className="size-4" />
            <span>{error}</span>
          </div>
        )}

        <Button
          size="lg"
          className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          onClick={() => runRideAction("ride:complete", { rideId: request.id })}
          disabled={loading}
        >
          {loading ? <Spinner className="size-4" /> : "Complete Trip"}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Request</p>
        <h2 className="text-xl font-semibold tracking-tight mt-0.5">
          {stage === "accepted" ? "Head to pickup" : "Verify & Start Trip"}
        </h2>
      </div>

      <div className="rounded-xl bg-muted/60 p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 size-2.5 rounded-full bg-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Pickup</p>
            <p className="text-sm font-medium">{request.pickup}</p>
          </div>
        </div>
        <div className="ml-[0.35rem] w-px h-3 bg-border" />
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 size-3.5 text-destructive shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Drop-off</p>
            <p className="text-sm font-medium">{request.dropoff}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-sm">
            <Navigation className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{request.paidDistance}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
            <IndianRupee className="size-3.5" />
            <span>{request.fare}</span>
          </div>
        </div>
      </div>

      {stage === "arrived" && (
        <div>
          <p className="text-sm font-medium mb-3 text-center">Ask rider for their 6-digit OTP</p>
          <div className="flex gap-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`trip-otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`size-11 sm:size-12 rounded-xl border-2 text-center text-xl font-bold bg-background outline-none transition-all focus:scale-105 ${
                  digit
                    ? "border-primary bg-primary/5 dark:bg-primary/10 text-primary"
                    : "border-input"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center gap-2 text-destructive text-sm">
          <AlertCircle className="size-4" />
          <span>{error}</span>
        </div>
      )}

      {stage === "accepted" ? (
        <Button
          size="lg"
          className="w-full h-12 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={loading}
          onClick={() => runRideAction("ride:arrive", { rideId: request.id })}
        >
          {loading ? <Spinner className="size-4" /> : "Mark Arrived"}
        </Button>
      ) : (
        <Button
          size="lg"
          className="w-full h-12 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={enteredOtp.length !== 6 || loading}
          onClick={() => runRideAction("ride:start", { rideId: request.id, otp: enteredOtp })}
        >
          {loading ? <Spinner className="size-4" /> : "Start Trip"}
        </Button>
      )}
    </div>
  )
}
