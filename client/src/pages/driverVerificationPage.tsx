import { useEffect, useState } from "react"
import { CheckCircle2, CircleAlert, ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"
import DriverAccountShell, { DriverAccountFeedback, DriverAccountState } from "@/components/driver/DriverAccountShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useDriverProfileManagement } from "@/hooks/useDriverProfileManagement"
import { initiateDriverKyc, updateDriverProfile, verifyDriverLicense } from "@/services/rydz"

export default function DriverVerificationPage() {
  const account = useDriverProfileManagement()
  const [licenseNumber, setLicenseNumber] = useState("")
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("")

  useEffect(() => {
    if (!account.profile) return
    setLicenseNumber(account.profile.licenseNumber)
    setLicenseExpiryDate(account.profile.licenseExpiryDate?.slice(0, 10) ?? "")
  }, [account.profile?.id, account.profile?.licenseExpiryDate, account.profile?.licenseNumber])

  if (account.loading) return <DriverAccountState>Loading verification...</DriverAccountState>

  const profile = account.profile

  const saveLicense = async () => {
    await account.run(
      () => updateDriverProfile({ licenseNumber: licenseNumber.trim(), licenseExpiryDate }),
      "License details updated. Verify the license again before going online.",
    )
  }

  const submitKyc = async () => {
    await account.run(async () => {
      const result = await initiateDriverKyc()
      account.saveToken(result.token)
      return result.driverProfile
    }, "KYC verification completed.")
  }

  return (
    <DriverAccountShell title="KYC & license" description="Keep your driving credentials verified and up to date.">
      <DriverAccountFeedback error={account.error} notice={account.notice} />

      {!account.userInfo.token ? (
        <DriverAccountState><Button asChild><Link to="/auth">Sign in</Link></Button></DriverAccountState>
      ) : !profile ? (
        <Card className="rounded-3xl">
          <CardHeader><CardTitle>No driver profile</CardTitle><CardDescription>Create your driver profile before submitting verification.</CardDescription></CardHeader>
          <CardContent><Button asChild><Link to="/driver">Open driver workspace</Link></Button></CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            <StatusCard title="KYC status" value={profile.kycStatus.replace("_", " ")} complete={profile.kycStatus === "APPROVED"} />
            <StatusCard title="License status" value={profile.licenseVerified ? "VERIFIED" : "VERIFICATION REQUIRED"} complete={profile.licenseVerified} />
          </section>

          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>Driving license</CardTitle>
              <CardDescription>Changing these details requires the license to be verified again.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="License number" value={licenseNumber} onChange={setLicenseNumber} />
                <Field label="Expiry date" type="date" value={licenseExpiryDate} onChange={setLicenseExpiryDate} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled={account.busy || licenseNumber.trim().length < 4 || !licenseExpiryDate} onClick={() => void saveLicense()}>
                  {account.busy ? <Spinner className="size-4" /> : "Save license details"}
                </Button>
                {!profile.licenseVerified && (
                  <Button disabled={account.busy} onClick={() => void account.run(async () => (await verifyDriverLicense())?.driverProfile, "License verification completed.")}>
                    {account.busy ? <Spinner className="size-4" /> : "Verify license"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" />Identity verification</CardTitle>
              <CardDescription>
                {profile.kycStatus === "APPROVED"
                  ? "Your driver identity is approved."
                  : profile.kycStatus === "IN_PROGRESS"
                    ? "Your verification is currently being reviewed."
                    : "Submit your driver details for verification."}
              </CardDescription>
            </CardHeader>
            {(profile.kycStatus === "NOT_STARTED" || profile.kycStatus === "REJECTED") && (
              <CardContent>
                <Button disabled={account.busy} onClick={() => void submitKyc()}>
                  {account.busy ? <Spinner className="size-4" /> : profile.kycStatus === "REJECTED" ? "Resubmit KYC" : "Submit KYC"}
                </Button>
              </CardContent>
            )}
          </Card>
        </>
      )}
    </DriverAccountShell>
  )
}

function StatusCard({ title, value, complete }: { title: string; value: string; complete: boolean }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div><p className="text-sm text-muted-foreground">{title}</p><Badge variant="outline" className="mt-2">{value}</Badge></div>
        {complete ? <CheckCircle2 className="size-6 text-emerald-600" /> : <CircleAlert className="size-6 text-amber-600" />}
      </CardContent>
    </Card>
  )
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border bg-background px-4 font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20" />
    </label>
  )
}
