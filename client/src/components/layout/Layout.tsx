import { Outlet } from "react-router-dom"
import Navbar from "@/components/layout/Navbar"

export default function Layout() {
  return (
    <div className="min-h-dvh w-full flex flex-col bg-background text-foreground">
      {/* Responsive Navbar */}
      <Navbar />

      {/* Main Page Area (Starts right after top navbar) */}
      <main className="flex-1 w-full flex flex-col overflow-hidden pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
