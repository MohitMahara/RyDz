import { useState } from "react"
import { ArrowLeft, ArrowRight, Car, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

type OnboardingDetails = {
  name?: string
  licenseNumber: string
  licenseExpiryDate: string
}

export default function DriverOnboarding({
  userName,
  loading,
  error,
  onSubmit,
  onCancel,
}: {
  userName?: string | null
  loading: boolean
  error: string | null
  onSubmit: (details: OnboardingDetails) => Promise<void>
  onCancel: () => void
}) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(userName ?? "")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("")
  const needsName = !userName?.trim()

  const canContinue =
    step === 1 ||
    (step === 2 && (!needsName || name.trim().length >= 2)) ||
    (step === 3 && licenseNumber.trim().length >= 4) ||
    (step === 4 && Boolean(licenseExpiryDate)) ||
    step === 5

  const submit = () =>
    onSubmit({
      ...(needsName ? { name: name.trim() } : {}),
      licenseNumber: licenseNumber.trim(),
      licenseExpiryDate,
    })

  return (
    <div className="min-h-full overflow-y-auto bg-background px-4 py-8 sm:px-6">
      <Card className="mx-auto max-w-xl rounded-3xl border-border bg-card shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Car className="size-7" />
          </div>
          <div>
            <CardTitle className="text-2xl">Drive with RyDz</CardTitle>
            <CardDescription className="mt-1">Step {step} of 5</CardDescription>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className={`h-1.5 rounded-full ${item <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && <Step title="Your city" description="RyDz driver onboarding is currently available in Delhi."><div className="rounded-2xl border bg-primary/5 px-4 py-3 font-medium text-primary">Delhi</div></Step>}
          {step === 2 && <Step title="Your name" description={needsName ? "Add the name that will be shown to riders." : "We’ll use the name already on your RyDz account."}>{needsName ? <Input label="Full name" value={name} onChange={setName} placeholder="Your full name" /> : <div className="rounded-2xl border bg-muted/40 px-4 py-3 font-medium">{userName}</div>}</Step>}
          {step === 3 && <Step title="Driving license" description="Enter the license number used for your verification."><Input label="License number" value={licenseNumber} onChange={setLicenseNumber} placeholder="DL-XXXXXXXXXXXX" /></Step>}
          {step === 4 && <Step title="License expiry" description="Your license must remain valid while you drive with RyDz."><Input label="Expiry date" value={licenseExpiryDate} onChange={setLicenseExpiryDate} type="date" /></Step>}
          {step === 5 && <Step title="Review your details" description="Confirm the information before submitting your driver profile."><div className="space-y-3 rounded-2xl border bg-muted/30 p-4 text-sm"><Detail label="City" value="Delhi" /><Detail label="Name" value={needsName ? name : userName ?? ""} /><Detail label="License" value={licenseNumber} /><Detail label="Expiry" value={licenseExpiryDate ? new Date(`${licenseExpiryDate}T00:00:00`).toLocaleDateString() : ""} /></div></Step>}

          {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">{error}</div>}

          <div className="flex gap-3">
            {step === 1 ? <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel}>Cancel</Button> : <Button type="button" variant="outline" className="rounded-xl" onClick={() => setStep((current) => current - 1)} disabled={loading}><ArrowLeft className="size-4" />Back</Button>}
            {step === 5 ? <Button type="button" className="flex-1 rounded-xl" onClick={() => void submit()} disabled={loading}>{loading ? <Spinner className="size-4" /> : <><CheckCircle2 className="size-4" />Submit profile</>}</Button> : <Button type="button" className="flex-1 rounded-xl" onClick={() => setStep((current) => current + 1)} disabled={!canContinue || loading}>Continue<ArrowRight className="size-4" /></Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Step({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="space-y-3"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{children}</div>
}

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="flex flex-col gap-1.5 text-sm font-medium">{label}<input required type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border bg-background px-4 font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div>
}
