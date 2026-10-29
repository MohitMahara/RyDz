import { useCallback, useEffect, useState } from "react"
import { UseAuth } from "@/contexts/authContext"
import { persistAuth } from "@/lib/auth-storage"
import { getApiErrorMessage } from "@/services/api"
import { getDriverProfile } from "@/services/rydz"
import type { DriverProfile } from "@/types"

export function useDriverProfileManagement() {
  const { userInfo, setUserInfo } = UseAuth()
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const result = await getDriverProfile()
    setProfile(result.driverProfile)
    return result.driverProfile
  }, [])

  useEffect(() => {
    let active = true

    if (!userInfo.token) {
      setLoading(false)
      return () => {
        active = false
      }
    }

    setLoading(true)
    getDriverProfile()
      .then((result) => {
        if (active) setProfile(result.driverProfile)
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

  const saveToken = useCallback(
    (token?: string) => {
      if (!token) return
      setUserInfo((current) => {
        const updated = { ...current, token }
        persistAuth(updated)
        return updated
      })
    },
    [setUserInfo],
  )

  const run = useCallback(
    async (action: () => Promise<DriverProfile | null | undefined>, successMessage: string) => {
      setBusy(true)
      setError(null)
      setNotice(null)

      try {
        const updated = await action()
        if (updated) setProfile(updated)
        else await refresh()
        setNotice(successMessage)
        return true
      } catch (actionError) {
        setError(getApiErrorMessage(actionError))
        return false
      } finally {
        setBusy(false)
      }
    },
    [refresh],
  )

  return {
    userInfo,
    profile,
    loading,
    busy,
    error,
    notice,
    setProfile,
    saveToken,
    run,
  }
}
