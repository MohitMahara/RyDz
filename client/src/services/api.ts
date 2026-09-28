import axios from "axios"

const baseURL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

const api = axios.create({
  baseURL: `${baseURL}/api/v1`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const data = localStorage.getItem("rydz-auth")
  const token = data ? JSON.parse(data)?.token : null

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("rydz-auth")
    }

    return Promise.reject(error)
  }
)

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