import api from "@/services/api"
import type {
  AuthResult,
  BackendVehicleType,
  DriverProfile,
  DriverRideSummary,
  DriverVehicle,
  PaymentMethod,
  RideLocation,
  User,
  VehicleOption,
} from "@/types"

type ApiEnvelope<T> = {
  status: string
  message?: string
  token?: string
  data?: T
  KycStatus?: string
}

type EstimateVehicle = {
  type: BackendVehicleType
  fare: number
  distance: number | string
  eta: number | string
}

export interface RideHistoryItem {
  id: string
  date: string
  pickup: string
  dropoff: string
  fare: number
  vehicleType: string
  status: "COMPLETED" | "CANCELLED"
  role: "rider" | "driver"
  driverName?: string
  riderName?: string
}

const vehicleLabels: Record<BackendVehicleType, VehicleOption["type"]> = {
  BIKE: "Bike",
  AUTO: "Auto",
  CAB_ECONOMY: "Economy Cab",
  CAB_PREMIUM: "Premium Cab",
}

const formatMaybeNumber = (value: number | string, suffix: string) =>
  typeof value === "number" ? `${value} ${suffix}` : value

export async function requestPhoneOtp(phoneNumber: string) {
  await api.post("/auth/phone/request-otp", { phoneNumber })
}

export async function verifyPhoneOtp(phoneNumber: string, otp: string): Promise<AuthResult> {
  const { data } = await api.post<ApiEnvelope<{ user: User; isNewUser: boolean }> & { token: string }>(
    "/auth/phone/verify-otp",
    { phoneNumber, otp }
  )

  if (!data.data?.user || !data.token) {
    throw new Error("Authentication response was missing user or token")
  }


  return {
    user: data.data.user,
    token: data.token,
    isNewUser: data.data.isNewUser,
  }
}

export async function completeUserProfile(name: string, email: string) {
  const { data } = await api.patch<ApiEnvelope<{ user: User }>>("/users/profile", {
    name,
    email,
  })

  if (data.data?.user) {
    localStorage.setItem("rydz_user", JSON.stringify(data.data.user))
  }

  return data.data?.user
}

export async function updateUserName(name: string) {
  const { data } = await api.patch<ApiEnvelope<{ user: User }>>("/users/profile", { name })
  return data.data?.user ?? null
}

export async function getUserProfile() {
  const { data } = await api.get<ApiEnvelope<{ user: User }>>("/users/profile")
  return data.data?.user ?? null
}

export async function estimateRide(pickup: RideLocation, dropoff: RideLocation) {
  const { data } = await api.post<
    ApiEnvelope<{
      tripDetails: { distance: number; time: number }
      encodedPolyline: string
      vehicles: EstimateVehicle[]
    }>
  >("/rides/estimate", {
    pick_up_lat: pickup.lat,
    pick_up_lng: pickup.lng,
    drop_off_lat: dropoff.lat,
    drop_off_lng: dropoff.lng,
  })

  const vehicles =
    data.data?.vehicles.map((vehicle) => ({
      id: vehicle.type.toLowerCase(),
      type: vehicleLabels[vehicle.type],
      backendType: vehicle.type,
      fare: vehicle.fare,
      eta: formatMaybeNumber(vehicle.eta, "min"),
      distance: formatMaybeNumber(vehicle.distance, "km"),
    })) ?? []

  return {
    tripDetails: data.data?.tripDetails ?? null,
    vehicles,
  }
}

export async function bookRide(
  pickup: RideLocation,
  dropoff: RideLocation,
  requestedVehicleType: BackendVehicleType,
  paymentMethod: PaymentMethod = "CASH"
) {
  const { data } = await api.post<
    ApiEnvelope<{
      rideId: string
      otp: string
      broadcastedTo: number
    }>
  >("/rides/book", {
    pick_up_lat: pickup.lat,
    pick_up_lng: pickup.lng,
    pick_up_address: pickup.address,
    drop_off_lat: dropoff.lat,
    drop_off_lng: dropoff.lng,
    drop_off_address: dropoff.address,
    requested_vehicle_type: requestedVehicleType,
    payment_method: paymentMethod,
  })

  if (!data.data) {
    throw new Error("Ride booking response was empty")
  }

  return data.data
}

// DRIVER PROFILE API FUNCTIONS

export async function getDriverProfile() {
  const { data } = await api.get<ApiEnvelope<{ hasDriverProfile: boolean; driverProfile: DriverProfile | null }>>(
    "/drivers/profile"
  )

  return data.data ?? { hasDriverProfile: false, driverProfile: null }
}

export async function createDriverProfile(licenseNumber: string, licenseExpiryDate?: string) {
  const payload: Record<string, string> = { licenseNumber }
  if (licenseExpiryDate) payload.licenseExpiryDate = licenseExpiryDate

  const { data } = await api.post<ApiEnvelope<{ driverProfile: DriverProfile }>>("/drivers/profile", payload)
  return { driverProfile: data.data?.driverProfile ?? null, token: data.token }
}

export async function initiateDriverKyc() {
  const { data } = await api.post<ApiEnvelope<{ driverProfile: DriverProfile }>>("/drivers/kyc/initiate")
  return { driverProfile: data.data?.driverProfile ?? null, token: data.token }
}

export async function addDriverVehicle(vehicle: {
  vehicleType: BackendVehicleType
  make: string
  model: string
  plateNumber: string
  color: string
}) {
  const { data } = await api.post<ApiEnvelope<{ vehicle: DriverVehicle; driverProfile: DriverProfile }>>(
    "/drivers/vehicles",
    vehicle
  )
  return data.data
}

export async function verifyDriverVehicle(vehicleId: string) {
  const { data } = await api.post<ApiEnvelope<{ vehicle: DriverVehicle; isVerified: boolean }>>(
    `/drivers/vehicles/${vehicleId}/verify`
  )
  return data.data
}

export async function setActiveDriverVehicle(vehicleId: string) {
  const { data } = await api.patch<ApiEnvelope<{ driverProfile: DriverProfile }>>(
    `/drivers/vehicles/${vehicleId}/active`
  )
  return data.data?.driverProfile
}

export async function deleteDriverVehicle(vehicleId: string) {
  const { data } = await api.delete<ApiEnvelope<{ driverProfile: DriverProfile }>>(`/drivers/vehicles/${vehicleId}`)
  return data.data?.driverProfile ?? null
}

export async function setDriverAvailability(isAvailable: boolean) {
  const { data } = await api.patch<ApiEnvelope<{ driverProfile: DriverProfile }>>("/drivers/availability", {
    isAvailable,
  })

  return data.data?.driverProfile
}

export async function getDriverRides() {
  const { data } = await api.get<ApiEnvelope<DriverRideSummary>>("/drivers/rides")

  if (!data.data) {
    throw new Error("Driver ride data was missing")
  }

  return data.data
}

// RIDE HISTORY HELPERS (Local storage + API fallback)

const INITIAL_RIDER_HISTORY: RideHistoryItem[] = [
  {
    id: "ride-101",
    date: "Sep 26, 2026 • 02:45 PM",
    pickup: "Connaught Place, New Delhi",
    dropoff: "Cyber Hub, Gurugram",
    fare: 340,
    vehicleType: "Economy Cab",
    status: "COMPLETED",
    role: "rider",
    driverName: "Vikram Singh",
  },
  {
    id: "ride-102",
    date: "Sep 24, 2026 • 11:15 AM",
    pickup: "Hauz Khas Village, Delhi",
    dropoff: "Saket Select Citywalk",
    fare: 120,
    vehicleType: "Auto",
    status: "COMPLETED",
    role: "rider",
    driverName: "Rajesh Kumar",
  },
  {
    id: "ride-103",
    date: "Sep 20, 2026 • 09:30 PM",
    pickup: "IGI Airport Terminal 3",
    dropoff: "Vasant Kunj Sector B",
    fare: 450,
    vehicleType: "Premium Cab",
    status: "CANCELLED",
    role: "rider",
  },
]

const INITIAL_DRIVER_HISTORY: RideHistoryItem[] = [
  {
    id: "d-ride-201",
    date: "Sep 26, 2026 • 05:20 PM",
    pickup: "Nehru Place Metro Station",
    dropoff: "Noida Sector 62",
    fare: 280,
    vehicleType: "Economy Cab",
    status: "COMPLETED",
    role: "driver",
    riderName: "Priya Sharma",
  },
  {
    id: "d-ride-202",
    date: "Sep 25, 2026 • 08:10 AM",
    pickup: "Karol Bagh Market",
    dropoff: "Chandni Chowk",
    fare: 95,
    vehicleType: "Auto",
    status: "COMPLETED",
    role: "driver",
    riderName: "Amit Verma",
  },
  {
    id: "d-ride-203",
    date: "Sep 23, 2026 • 06:40 PM",
    pickup: "Lajpat Nagar Central Market",
    dropoff: "Greater Kailash 1",
    fare: 150,
    vehicleType: "Economy Cab",
    status: "CANCELLED",
    role: "driver",
  },
]

export function getRiderHistory(): RideHistoryItem[] {
  const stored = localStorage.getItem("rydz_rider_history")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // ignore
    }
  }
  localStorage.setItem("rydz_rider_history", JSON.stringify(INITIAL_RIDER_HISTORY))
  return INITIAL_RIDER_HISTORY
}

export function getDriverHistory(): RideHistoryItem[] {
  const stored = localStorage.getItem("rydz_driver_history")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // ignore
    }
  }
  localStorage.setItem("rydz_driver_history", JSON.stringify(INITIAL_DRIVER_HISTORY))
  return INITIAL_DRIVER_HISTORY
}

export function addRideToHistory(ride: RideHistoryItem) {
  const historyKey = ride.role === "rider" ? "rydz_rider_history" : "rydz_driver_history"
  const current = ride.role === "rider" ? getRiderHistory() : getDriverHistory()
  const updated = [ride, ...current]
  localStorage.setItem(historyKey, JSON.stringify(updated))
}
