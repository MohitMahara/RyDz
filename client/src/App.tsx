import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Layout from "@/components/layout/Layout"
import HomePage from "@/pages/homepage.tsx"
import RidesPage from "@/pages/ridespage.tsx"
import DriverPage from "@/pages/driverpage.tsx"
import AuthPage from "@/pages/authpage.tsx"
import ProfilePage from "@/pages/profilepage.tsx"
import RideHistory from "@/pages/rideHistory"
import DriverAccountPage from "@/pages/driverAccountPage"
import DriverDashboardPage from "@/pages/driverDashboardPage"
import DriverVehiclesPage from "@/pages/driverVehiclesPage"
import DriverVerificationPage from "@/pages/driverVerificationPage"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="rides" element={<RidesPage />} />
          <Route path="driver" element={<DriverPage />} />
          <Route path="driver/dashboard" element={<DriverDashboardPage />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/driver" element={<DriverAccountPage />} />
          <Route path="profile/driver/verification" element={<DriverVerificationPage />} />
          <Route path="profile/driver/vehicles" element={<DriverVehiclesPage />} />
          <Route path="bookings" element={<RideHistory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
