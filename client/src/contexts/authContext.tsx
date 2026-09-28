import { useState, createContext, useContext, useEffect } from "react"
import type { ReactNode } from "react"
import type { User } from "@/types"

export interface UserInfo {
  user: User | null
  token: string | null
}

export interface AuthContextType {
  userInfo: UserInfo
  loading: boolean
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo>>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<UserInfo>({
    user: null,
    token: null,
  })

  useEffect(() => {
    const data = localStorage.getItem("rydz-auth")
    const storedAuth = data ? JSON.parse(data) : null

    const user = storedAuth?.user ?? null
    const token = storedAuth?.token ?? null

    setUserInfo({ user, token })
    setLoading(false)
  }, [])


  return (
    <AuthContext.Provider value={{ userInfo, loading, setUserInfo }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const UseAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}