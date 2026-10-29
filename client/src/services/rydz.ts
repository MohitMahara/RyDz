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
  Ride,
  getRideHistoryParams,
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


const vehicleLabels: Record<BackendVehicleType, VehicleOption["type"]> = {
  BIKE: "Bike",
  AUTO: "Auto",
  CAB_ECONOMY: "Economy Cab",
  CAB_PREMIUM: "Premium Cab",
}

const formatMaybeNumber = (value: number | string, suffix: string) =>
  typeof value === "number" ? `${value} ${suffix}` : value

export async function requestPhoneOtp(phoneNumber: string, recaptchaToken?: string) {
  await api.post("/auth/phone/request-otp", {
    phoneNumber,
    ...(recaptchaToken ? { recaptchaToken } : {}),
  })
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

export async function updateDriverProfile(details: {
  licenseNumber?: string
  licenseExpiryDate?: string
}) {
  const { data } = await api.patch<ApiEnvelope<{ driverProfile: DriverProfile }>>("/drivers/profile", details)
  return data.data?.driverProfile ?? null
}

export async function verifyDriverLicense() {
  const { data } = await api.post<
    ApiEnvelope<{ verificationStatus: DriverProfile["kycStatus"]; driverProfile: DriverProfile }>
  >("/drivers/license/verify")

  return data.data
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


export async function getRiderHistory({status, page, limit, sortBy, sortOrder} : getRideHistoryParams) : Promise<Ride[]> {

  const {data } = await api.get("/users/rides", {
    params: {
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    }
    }
  );

  const rides = data.data.rides;

  return rides;
}
