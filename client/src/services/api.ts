import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rydz_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("rydz_token")
    }
    return Promise.reject(error)
  }
)

export default api

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
