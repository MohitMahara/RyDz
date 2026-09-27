import { lazy, Suspense, useEffect, useState } from "react"

import RiderHome from "@/components/rider/RiderHome"
import VehicleSelect from "@/components/rider/VehicleSelect"
import SearchingRide from "@/components/rider/SearchingRide"
import RideAccepted from "@/components/rider/RideAccepted"

import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage } from "@/services/api"
import { bookRide } from "@/services/rydz"
import socket from "@/services/socket"

import type {
  ActiveRide,
  RideLocation,
  VehicleOption,
} from "@/types"

const RydzMap = lazy(() => import("@/components/map/RydzMap"))

type RideStep =
  | "search-ride"
  | "vehicle-selection"
  | "booking"
  | "searching-drivers"
  | "accepted"

type AcceptedPayload = {
  rideId: string
  status: "ACCEPTED"
  otp: string
  driver: {
    name: string | null
    phoneNumber: string
    rating: number
  }
  vehicle: {
    type: string
    make: string
    model: string
    color: string
    plateNumber: string
  }
}

const getVehicleLabel = (type: string) => {
  switch (type) {
    case "BIKE":
      return "Bike"
    case "AUTO":
      return "Auto"
    case "CAB_PREMIUM":
      return "Premium Cab"
    default:
      return "Economy Cab"
  }
}

export default function RidesPage() {
  const [step, setStep] = useState<RideStep>("search-ride")
  const [pickup, setPickup] = useState<RideLocation | null>(null)
  const [dropoff, setDropoff] = useState<RideLocation | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null)
  const [rideId, setRideId] = useState<string | null>(null)
  const [broadcastedTo, setBroadcastedTo] = useState(0)
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)

  useEffect(() => {
    if (!socket.connected) {
      socket.connect()
    }

    const handleRideAccepted = (payload: AcceptedPayload) => {
      setActiveRide({
        driverName: payload.driver.name ?? "RyDz Driver",
        phoneNumber: payload.driver.phoneNumber,
        rating: payload.driver.rating,
        licensePlate: payload.vehicle.plateNumber,
        vehicleType: getVehicleLabel(payload.vehicle.type),
        otp: payload.otp,
      })

      setStep("accepted")
    }

    socket.on("ride:accepted", handleRideAccepted)

    return () => {
      socket.off("ride:accepted", handleRideAccepted)
    }
  }, [])

  const handleFindRide = (
    pickupLocation: RideLocation,
    dropoffLocation: RideLocation
  ) => {
    if (localStorage.getItem("rydz_driver_online") === "true") {
      setLocationError(
        "Driver Mode is active! You cannot book a ride while online as a driver. Please turn off driver availability in your Driver Profile first."
      )
      return
    }

    if (!pickupLocation || !dropoffLocation) {
      setLocationError("Please select both a pickup and drop-off location.")
      return
    }

    setLocationError(null)
    setPickup(pickupLocation)
    setDropoff(dropoffLocation)
    setStep("vehicle-selection")
  }

  const handleConfirmVehicle = async (
    vehicle: VehicleOption
  ) => {
    if (!pickup || !dropoff) return

    setSelectedVehicle(vehicle)
    setBookingError(null)
    setStep("booking")

    try {
      const ride = await bookRide(
        pickup,
        dropoff,
        vehicle.backendType,
        "CASH"
      )

      setRideId(ride.rideId)
      setBroadcastedTo(ride.broadcastedTo)

      if (!socket.connected) {
        socket.connect()
      }

      socket.emit("ride:join", {
        rideId: ride.rideId,
      })

      setStep("searching-drivers")
    } catch (error) {
      setBookingError(getApiErrorMessage(error))
      setStep("vehicle-selection")
    }
  }

  const handleBackToSearch = () => {
    setStep("search-ride")
    setLocationError(null)
    setBookingError(null)
  }

  const handleCancel = () => {
    setStep("search-ride")

    setPickup(null)
    setDropoff(null)
    setSelectedVehicle(null)

    setRideId(null)
    setBroadcastedTo(0)

    setActiveRide(null)

    setLocationError(null)
    setBookingError(null)
  }

  return (
    <div className="flex h-screen w-full overflow-y-hidden flex-col-reverse overflow-hidden lg:flex-row">
      <aside className="lg:h-full w-full bg-card md:border-r lg:w-[550px]">
        <div className="flex flex-col justify-center lg:h-full w-full px-6 py-8 md:py-0">
          {step === "search-ride" && (
            <>
              <RiderHome onFindRide={handleFindRide} />

              {locationError && (
                <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {locationError}
                </div>
              )}
            </>
          )}

          {step === "vehicle-selection" &&
            pickup &&
            dropoff && (
              <>
                <VehicleSelect
                  pickup={pickup}
                  dropoff={dropoff}
                  onConfirm={handleConfirmVehicle}
                  onBack={handleBackToSearch}
                />

                {bookingError && (
                  <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {bookingError}
                  </div>
                )}
              </>
            )}

          {step === "booking" && (
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />

              <div>
                <p className="font-medium">
                  Booking your ride
                </p>

                <p className="text-sm text-muted-foreground">
                  Confirming your ride request...
                </p>
              </div>
            </div>
          )}

          {step === "searching-drivers" && (
            <>
              <SearchingRide
                vehicleType={selectedVehicle?.type ?? "Cab"}
                broadcastedTo={broadcastedTo}
              />

              {rideId && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Ride ID: {rideId}
                </p>
              )}

              <button
                type="button"
                onClick={handleCancel}
                className="mt-4 w-full rounded-xl border border-destructive/30 py-2.5 text-sm text-destructive hover:bg-destructive/10"
              >
                Cancel Ride Search
              </button>
            </>
          )}

          {step === "accepted" && activeRide && (
            <RideAccepted
              ride={activeRide}
              pickup={pickup}
              dropoff={dropoff}
              onCancel={handleCancel}
            />
          )}
        </div>
      </aside>

      <main className="h-[30vh] md:h-[60v] flex-1 lg:h-full">
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <RydzMap />
        </Suspense>
      </main>
    </div>
  )
}