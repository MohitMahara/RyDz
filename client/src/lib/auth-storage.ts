import type { UserInfo } from "@/contexts/authContext"

export function persistAuth(auth: UserInfo) {
  localStorage.setItem("rydz-auth", JSON.stringify(auth))
}
