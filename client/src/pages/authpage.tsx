import { useState } from "react"
import type { SubmitEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Phone, User as UserIcon, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/services/api"
import { completeUserProfile, requestPhoneOtp, verifyPhoneOtp} from "@/services/rydz"
import { UseAuth } from "@/contexts/authContext"


export default function AuthPage() {
  const navigate = useNavigate()
  const { setUserInfo } = UseAuth()

  const [mode, setMode] = useState<"login" | "signup">("login")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedPhone = phone.trim().startsWith("+")
    ? phone.trim()
    : `+91${phone.replace(/\D/g, "")}`

  const resetMode = (nextMode: "login" | "signup") => {
    setMode(nextMode)
    setStep("phone")
    setError(null)
  }

  const handleRequestOtp = async (event: SubmitEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await requestPhoneOtp(normalizedPhone)
      setStep("otp")
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (event: SubmitEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const auth = await verifyPhoneOtp(normalizedPhone, otp)
      let finalAuth = auth

      if (mode === "signup") {
        const user = await completeUserProfile(name.trim(), email.trim())

        if (user) {
          finalAuth = { ...auth, user }
        }
      }

      setUserInfo({
        user: finalAuth.user,
        token: finalAuth.token,
      })

      localStorage.setItem("rydz-auth", JSON.stringify(finalAuth))
      navigate("/rides");
      
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-y-auto bg-background p-4 text-foreground sm:p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

      <div className="relative z-10 flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-card p-6 shadow-2xl sm:p-8">
        <header className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h1>

          <p className="mt-1.5 text-sm text-muted-foreground">
            {step === "phone"
              ? "Sign in or sign up using your phone number"
              : `Enter the 6-digit OTP sent to ${normalizedPhone}`}
          </p>
        </header>

        <div className="flex gap-1 rounded-xl border bg-muted p-1">
          {(["login", "signup"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => resetMode(value)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                mode === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {value === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form
          onSubmit={step === "phone" ? handleRequestOtp : handleVerifyOtp}
          className="flex flex-col gap-4"
        >
          {mode === "signup" && step === "phone" && (
            <>
              <Field
                label="Full Name"
                icon={<UserIcon />}
                value={name}
                onChange={setName}
                placeholder="Aarav Sharma"
              />

              <Field
                label="Email"
                icon={<Mail />}
                value={email}
                onChange={setEmail}
                placeholder="aarav@example.com"
                type="email"
              />
            </>
          )}

          {step === "phone" ? (
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Phone className="size-3.5 text-muted-foreground" />
                Phone Number
              </label>

              <div className="flex gap-2">
                <div className="flex shrink-0 items-center gap-2 rounded-xl border bg-background px-3 text-sm text-muted-foreground">
                  <span>IN</span>
                  <span>+91</span>
                </div>

                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="98765 43210"
                  type="tel"
                  required
                  className="h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Lock className="size-3.5 text-muted-foreground" />
                  OTP Code
                </label>

                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Change phone
                </button>
              </div>

              <input
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                inputMode="numeric"
                autoFocus
                required
                className="h-12 w-full rounded-xl border bg-background px-4 text-center font-mono text-xl tracking-[0.5em] outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="mt-1 h-12 w-full rounded-xl font-semibold"
            disabled={loading || (step === "otp" && otp.length !== 6)}
          >
            {loading ? (
              <Spinner className="size-4" />
            ) : step === "phone" ? (
              "Send Verification OTP"
            ) : (
              "Verify OTP & Continue"
            )}
          </Button>
        </form>
      </div>
    </main>
  )
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  icon: React.ReactNode
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        <span className="size-3.5 text-muted-foreground">{icon}</span>
        {label}
      </label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        required
        className="h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
    </div>
  )
}