import { useCallback, useEffect, useMemo, useState } from "react"
import { UseAuth } from "@/contexts/authContext"
import { persistAuth } from "@/lib/auth-storage"
import { getApiErrorMessage } from "@/services/api"
import {
  createDriverProfile,
  getDriverProfile,
  getDriverRides,
  setDriverAvailability,
  updateUserName,
} from "@/services/rydz"
import type { DriverProfile, DriverRideSummary, User } from "@/types"

export type DriverWorkspaceState =
  | "NO_PROFILE"
  | "NOT_READY"
  | "OFFLINE"
  | "ONLINE"
  | "ACTIVE_RIDE"

type OnboardingDetails = {
  name?: string
  licenseNumber: string
  licenseExpiryDate: string
}

const emptyRideSummary: DriverRideSummary = {
  activeRide: null,
  history: [],
  stats: { completedRideCount: 0, earnings: 0 },
}

export function useDriverWorkspace() {
  const { userInfo, setUserInfo } = UseAuth()
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [rideSummary, setRideSummary] = useState<DriverRideSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const saveAuth = useCallback(
    (next: { token?: string; user?: User }) => {
      setUserInfo((current) => {
        const updated = {
          token: next.token ?? current.token,
          user: next.user ?? current.user,
        }
        persistAuth(updated)
        return updated
      })
    },
    [setUserInfo],
  )

  const refresh = useCallback(async () => {
    const result = await getDriverProfile()
    setProfile(result.driverProfile)

    if (!result.driverProfile) {
      setRideSummary(null)
      return
    }

    setRideSummary(await getDriverRides())
  }, [])

  useEffect(() => {
    let active = true

    if (!userInfo.token) {
      setProfile(null)
      setRideSummary(null)
      setLoading(false)
      return () => {
        active = false
      }
    }

    setLoading(true)
    Promise.all([getDriverProfile()])
      .then(async ([result]) => {
        if (!active) return
        const rides = result.driverProfile ? await getDriverRides() : null
        if (!active) return
        setProfile(result.driverProfile)
        setRideSummary(rides)
      })
      .catch((loadError) => {
        if (active) setError(getApiErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userInfo.token])

  const ready = useMemo(
    () =>
      Boolean(
        profile?.kycStatus === "APPROVED" &&
          profile.licenseVerified &&
          profile.activeVehicle?.isVerified &&
          profile.activeVehicle.status === "ACTIVE",
      ),
    [profile],
  )

  const state: DriverWorkspaceState = useMemo(() => {
    if (!profile) return "NO_PROFILE"
    if (rideSummary?.activeRide) return "ACTIVE_RIDE"
    if (!ready) return "NOT_READY"
    return profile.isAvailable ? "ONLINE" : "OFFLINE"
  }, [profile, ready, rideSummary?.activeRide])

  useEffect(() => {
    if (profile?.isAvailable) localStorage.setItem("rydz_driver_online", "true")
    else localStorage.removeItem("rydz_driver_online")
  }, [profile?.isAvailable])

  const run = useCallback(async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true)
    setError(null)
    setNotice(null)

    try {
      await action()
      setNotice(successMessage)
      return true
    } catch (actionError) {
      setError(getApiErrorMessage(actionError))
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const createProfile = useCallback(
    async ({ name, licenseNumber, licenseExpiryDate }: OnboardingDetails) => {
      await run(async () => {
        if (name) {
          const updatedUser = await updateUserName(name)
          if (updatedUser) saveAuth({ user: updatedUser })
        }

        const created = await createDriverProfile(licenseNumber, licenseExpiryDate)
        if (!created.driverProfile) throw new Error("Driver profile response was empty")

        saveAuth({ token: created.token })
        setProfile(created.driverProfile)
        setRideSummary(emptyRideSummary)
      }, "Driver profile created. Complete verification and add a vehicle before going online.")
    },
    [run, saveAuth],
  )

  const updateAvailability = useCallback(
    async (isAvailable: boolean) => {
      return run(async () => {
        const updated = await setDriverAvailability(isAvailable)
        if (!updated) throw new Error("Availability response was empty")
        setProfile(updated)
      }, isAvailable ? "You are online and ready for requests." : "You are now offline.")
    },
    [run],
  )

  const refreshAfterRide = useCallback(
    async (message?: string) => {
      try {
        await refresh()
        if (message) setNotice(message)
      } catch (refreshError) {
        setError(getApiErrorMessage(refreshError))
      }
    },
    [refresh],
  )

  return {
    userInfo,
    profile,
    rideSummary,
    activeRide: rideSummary?.activeRide ?? null,
    state,
    ready,
    loading,
    busy,
    error,
    notice,
    setError,
    setNotice,
    createProfile,
    updateAvailability,
    refreshAfterRide,
  }
}
