export type RiderState =
  | "home"
  | "auth"
  | "vehicle-select"
  | "searching"
  | "ride-accepted"

export type DriverState = "offline" | "online-feed" | "active-trip"

export type AppMode = "rider" | "driver"

export type BackendVehicleType = "BIKE" | "AUTO" | "CAB_ECONOMY" | "CAB_PREMIUM"
export type PaymentMethod = "CASH" | "UPI" | "CARD"

export interface User {
  id: string
  phoneNumber: string
  email?: string | null
  name?: string | null
  avatarUrl?: string | null
  isPhoneVerified: boolean
  driverProfile?: DriverProfile | null
}

export interface AuthResult {
  user: User
  token: string
  isNewUser: boolean
}

export interface DriverVehicle {
  id: string
  vehicleType: BackendVehicleType
  make: string
  model: string
  plateNumber: string
  color: string
  status: "ACTIVE" | "INACTIVE" | "DELETED"
  isVerified: boolean
}

export interface DriverProfile {
  id: string
  licenseNumber: string
  licenseExpiryDate?: string | null
  licenseVerified: boolean
  kycStatus: "NOT_STARTED" | "IN_PROGRESS" | "APPROVED" | "REJECTED"
  isAvailable: boolean
  activeVehicleId?: string | null
  activeVehicle?: DriverVehicle | null
  vehicles?: DriverVehicle[]
}

export interface RideLocation {
  address: string
  lat: number
  lng: number
}

export interface VehicleOption {
  id: string
  type: "Bike" | "Auto" | "Economy Cab" | "Premium Cab"
  backendType: BackendVehicleType
  eta: string
  fare: number
  distance: string
}

export interface RideRequest {
  id: string
  pickup: string
  dropoff: string
  unpaidDistance: string
  paidDistance: string
  fare: number
  riderId?: string
  otp?: string
}

export interface ActiveRide {
  driverName: string
  licensePlate: string
  otp: string
  vehicleType: string
  rating?: number
  phoneNumber?: string
  riderName?: string
}
