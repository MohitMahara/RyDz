import axios from "axios"
import type { InternalAxiosRequestConfig } from "axios"

const baseURL = import.meta.env.VITE_BACKEND_URL;
const apiBaseURL = `${baseURL}/api/v1`

type AuthResponse = {
  token: string
  data?: { user?: unknown }
}

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as RetriableRequestConfig | undefined
    const isRefreshRequest = request?.url?.includes("/auth/refresh")
    const hadAccessToken = Boolean(request?.headers?.Authorization)

    if (error.response?.status !== 401 || !request || !hadAccessToken || request._retry || isRefreshRequest) {
      return Promise.reject(error)
    }

    request._retry = true

    try {
      const refreshed = await refreshAccessToken()
      request.headers.Authorization = `Bearer ${refreshed}`
      return api(request)
    } catch (refreshError) {
      localStorage.removeItem("rydz-auth")
      return Promise.reject(refreshError)
    }
  }
)

let refreshPromise: Promise<string> | null = null

function getStoredAccessToken() {
  try {
    const data = localStorage.getItem("rydz-auth")
    const auth = data ? JSON.parse(data) : null
    return typeof auth?.token === "string" ? auth.token : null
  } catch {
    return null
  }
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<AuthResponse>(`${apiBaseURL}/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => {
        if (!data.token) {
          throw new Error("Refresh response did not include an access token")
        }

        const storedAuth = localStorage.getItem("rydz-auth")
        const auth = storedAuth ? JSON.parse(storedAuth) : {}
        localStorage.setItem("rydz-auth", JSON.stringify({ ...auth, token: data.token, user: data.data?.user ?? auth.user }))
        return data.token
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export const getApiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as {
      message?: string
      errors?: Array<{ message: string }>
    } | undefined

    return data?.errors?.[0]?.message ?? data?.message ?? error.message
  }

  return error instanceof Error ? error.message : "Something went wrong"
}

export default api
