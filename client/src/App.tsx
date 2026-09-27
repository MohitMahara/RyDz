import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Layout from "@/components/layout/Layout"
import HomePage from "@/pages/homepage.tsx"
import RidesPage from "@/pages/ridespage.tsx"
import DriverPage from "@/pages/driverpage.tsx"
import AuthPage from "@/pages/authpage.tsx"
import ProfilePage from "@/pages/profilepage.tsx"
import BookingsPage from "@/pages/bookingspage.tsx"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="rides" element={<RidesPage />} />
          <Route path="driver" element={<DriverPage />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
