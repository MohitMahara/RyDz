import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { getUserProfile } from "@/services/rydz"
import { UseAuth } from "@/contexts/authContext"
import {
  User as UserIcon,
  Phone,
  Mail,
  ShieldCheck,
  Car,
  CheckCircle2,
  Star,
  ChevronRight,
  CreditCard,
  Lock,
  Sparkles,
  History,
} from "lucide-react"


export default function ProfilePage() {
  const navigate = useNavigate()
  const { userInfo, setUserInfo } = UseAuth()
  const user = userInfo.user
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userInfo.token) {
      getUserProfile()
        .then((fetchedUser) => {
          if (fetchedUser) {
            setUserInfo((prev) => ({ ...prev, user: fetchedUser }))
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [userInfo.token])

  const handleLogoutClick = () => {
    setUserInfo({ user: null, token: null })
    localStorage.removeItem("rydz-auth");
    navigate("/")
  }

  if (loading) {
    return (
      <div className="min-h-dvh w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading account profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh w-full bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto pb-24 md:pb-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Account</h1>
          {user && (
            <Badge variant="outline" className="gap-1 px-3 py-1 text-xs font-semibold rounded-full border-primary/30 text-primary bg-primary/5">
              <Sparkles className="size-3.5 text-primary" />
              RyDz Member
            </Badge>
          )}
        </div>

        {user ? (
          <div className="space-y-6">
            {/* Uber-Style Hero User Profile Card */}
            <Card className="border border-border shadow-md rounded-3xl overflow-hidden bg-card">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-3xl border-2 border-primary/20 shadow-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="size-10" />}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1 ring-2 ring-background">
                      <CheckCircle2 className="size-3.5 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">{user.name || "RyDz Rider"}</h2>
                    <p className="text-sm font-mono text-muted-foreground">{user.phoneNumber}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                      <div className="flex items-center gap-1 text-amber-500 text-sm font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                        <Star className="size-4 fill-amber-500" />
                        <span>5.0</span>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        Verified Rider
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Activity & Navigation Option: My Bookings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Rides & Activity
              </h3>

              <div className="rounded-3xl border border-border bg-card overflow-hidden divide-y divide-border shadow-xs">
                {/* My Bookings Option */}
                <div
                  onClick={() => navigate("/bookings")}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <History className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">My Bookings</p>
                      <p className="text-xs text-muted-foreground">View all your completed and cancelled rides</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Personal Information
              </h3>

              <div className="rounded-3xl border border-border bg-card overflow-hidden divide-y divide-border shadow-xs">
                {/* Name */}
                <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <UserIcon className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Full Name</p>
                      <p className="font-semibold text-sm text-foreground">{user.name || "Not provided"}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>

                {/* Phone */}
                <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <Phone className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone Number</p>
                      <p className="font-semibold text-sm font-mono text-foreground">{user.phoneNumber}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                    Verified
                  </Badge>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email Address</p>
                      <p className="font-semibold text-sm text-foreground">{user.email || "Add email address"}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Security & Driver Profile Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Security & Driver Profile
              </h3>

              <div className="rounded-3xl border border-border bg-card overflow-hidden divide-y divide-border shadow-xs">
                {/* Account Security */}
                <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Security & 2-Factor OTP</p>
                      <p className="text-xs text-muted-foreground">Phone number authentication active</p>
                    </div>
                  </div>
                  <CheckCircle2 className="size-5 text-emerald-500" />
                </div>

                {/* Driver Status */}
                <div
                  onClick={() => navigate("/driver")}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Car className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Driver Profile</p>
                      <p className="text-xs text-muted-foreground">
                        {user.driverProfile ? `KYC Status: ${user.driverProfile.kycStatus}` : "Create driver profile to earn with RyDz"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>

                {/* Payment Preferences */}
                <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <CreditCard className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Default Payment</p>
                      <p className="text-xs text-muted-foreground">Cash / Digital Payments</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-base transition-colors shadow-md flex items-center justify-center gap-2"
            >
              Logout
            </button>
          </div>
        ) : (
          /* Guest / Not Logged In View */
          <Card className="border border-border shadow-xl rounded-3xl p-8 text-center space-y-6 bg-card">
            <div className="size-20 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Lock className="size-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Sign in to your Account</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Log in with your phone number to access your rider profile, saved trips, and driver preferences.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full h-12 rounded-2xl font-semibold text-base shadow-md"
              onClick={(() => navigate("/auth"))}
            >
              Sign In
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
