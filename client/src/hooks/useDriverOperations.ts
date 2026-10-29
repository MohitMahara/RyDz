import { useCallback, useEffect, useRef, useState } from "react"
import socket from "@/services/socket"
import { setDriverAvailability } from "@/services/rydz"
import type { DriverProfile, DriverRide, RideReqPayload, RideRequest } from "@/types"

type SocketAck = { success: boolean; message: string }

type DriverOperationsOptions = {
  profile: DriverProfile | null
  activeRide: DriverRide | null
  onRideChanged: (message?: string) => Promise<void>
  onError: (message: string | null) => void
  onNotice: (message: string | null) => void
}

let pendingRouteExitOffline: number | null = null

function toRideRequest(payload: RideReqPayload): RideRequest {
  return {
    id: payload.rideId,
    pickup: payload.pickup.address,
    dropoff: payload.dropoff.address,
    unpaidDistance: `${payload.riderDistanceInKm.toFixed(1)} km`,
    paidDistance: `${payload.tripDetails.distanceInKm.toFixed(1)} km`,
    fare: payload.tripDetails.fare,
  }
}

export function useDriverOperations({
  profile,
  activeRide,
  onRideChanged,
  onError,
  onNotice,
}: DriverOperationsOptions) {
  const [requests, setRequests] = useState<RideRequest[]>([])
  const [responding, setResponding] = useState(false)
  const locationWatch = useRef<number | null>(null)
  const isAvailable = useRef(Boolean(profile?.isAvailable))
  isAvailable.current = Boolean(profile?.isAvailable)

  const stopLocationWatch = useCallback(() => {
    if (locationWatch.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(locationWatch.current)
      locationWatch.current = null
    }
  }, [])

  const startLocationWatch = useCallback(() => {
    const vehicle = profile?.activeVehicle
    if (!vehicle || !navigator.geolocation) return

    stopLocationWatch()
    locationWatch.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        socket.emit("driver:update-location", {
          vehicleType: vehicle.vehicleType,
          lat: coords.latitude,
          lng: coords.longitude,
        })
      },
      () => onError("Location permission is required while you are online."),
      { enableHighAccuracy: true, maximumAge: 15_000 },
    )
  }, [onError, profile?.activeVehicle, stopLocationWatch])

  const ensureLocationPermission = useCallback(
    () =>
      new Promise<void>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Location services are unavailable in this browser."))
          return
        }

        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          () => reject(new Error("Location permission is required to go online.")),
          { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 },
        )
      }),
    [],
  )

  useEffect(() => {
    if (pendingRouteExitOffline !== null) {
      window.clearTimeout(pendingRouteExitOffline)
      pendingRouteExitOffline = null
    }

    return () => {
      if (!isAvailable.current) return

      pendingRouteExitOffline = window.setTimeout(() => {
        pendingRouteExitOffline = null
        localStorage.removeItem("rydz_driver_online")
        if (socket.connected) socket.emit("driver:go-offline")
        void setDriverAvailability(false).catch(() => undefined)
      }, 0)
    }
  }, [])

  useEffect(() => {
    if (!profile?.isAvailable || !profile.activeVehicle) {
      setRequests([])
      stopLocationWatch()
      return
    }

    const announceOnline = () => socket.emit("driver:go-online")
    const handleConnectError = () => onError("Unable to connect to live ride requests.")

    socket.on("connect", announceOnline)
    socket.on("connect_error", handleConnectError)

    if (!socket.connected) socket.connect()
    else announceOnline()

    startLocationWatch()

    return () => {
      socket.off("connect", announceOnline)
      socket.off("connect_error", handleConnectError)
      if (socket.connected) socket.emit("driver:go-offline")
      stopLocationWatch()
    }
  }, [onError, profile?.activeVehicle, profile?.isAvailable, startLocationWatch, stopLocationWatch])

  useEffect(() => {
    if (!profile?.isAvailable || activeRide) return

    const handleRequest = (payload: RideReqPayload) => {
      const request = toRideRequest(payload)
      setRequests((current) => [
        ...current.filter((item) => item.id !== request.id),
        request,
      ])
      onNotice("New nearby ride request received.")
    }

    socket.on("ride:new-request", handleRequest)
    return () => {
      socket.off("ride:new-request", handleRequest)
    }
  }, [activeRide, onNotice, profile?.isAvailable])

  useEffect(() => {
    if (!activeRide) return

    const handleStatusChange = (payload: { rideId: string; status: string }) => {
      if (payload.rideId === activeRide.id) void onRideChanged()
    }

    if (!socket.connected) socket.connect()
    socket.emit("ride:join", { rideId: activeRide.id }, (result: SocketAck) => {
      if (!result.success) onError(result.message)
    })
    socket.on("ride:status-changed", handleStatusChange)

    return () => {
      socket.off("ride:status-changed", handleStatusChange)
    }
  }, [activeRide?.id, onError, onRideChanged])

  const respond = useCallback(
    (request: RideRequest, decision: "ACCEPT" | "REJECT") => {
      setResponding(true)
      onError(null)

      if (!socket.connected) socket.connect()

      let settled = false
      const timeout = window.setTimeout(() => {
        settled = true
        setResponding(false)
        onError("The ride response timed out. Please try again.")
      }, 10_000)

      socket.emit("ride:respond", { rideId: request.id, decision }, async (result: SocketAck) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeout)
        setResponding(false)

        if (!result.success) {
          onError(result.message)
          return
        }

        setRequests((current) => current.filter((item) => item.id !== request.id))

        if (decision === "ACCEPT") {
          setRequests([])
          await onRideChanged("Ride accepted. Head to the pickup point.")
        }
      })
    },
    [onError, onRideChanged],
  )

  return {
    requests,
    responding,
    ensureLocationPermission,
    acceptRequest: (request: RideRequest) => respond(request, "ACCEPT"),
    rejectRequest: (request: RideRequest) => respond(request, "REJECT"),
  }
}
