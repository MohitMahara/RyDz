import { ArrowRight, Car, Gauge, ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"
import DriverAccountShell, { DriverAccountFeedback, DriverAccountState } from "@/components/driver/DriverAccountShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDriverProfileManagement } from "@/hooks/useDriverProfileManagement"

export default function DriverAccountPage() {
  const account = useDriverProfileManagement()

  if (account.loading) return <DriverAccountState>Loading driver account...</DriverAccountState>

  return (
    <DriverAccountShell title="Driver account" description="Manage your verification and vehicles." backTo="/profile">
      <DriverAccountFeedback error={account.error} notice={account.notice} />

      {!account.userInfo.token ? (
        <DriverAccountState><Button asChild><Link to="/auth">Sign in</Link></Button></DriverAccountState>
      ) : !account.profile ? (
        <Card className="rounded-3xl">
          <CardHeader><CardTitle>No driver profile yet</CardTitle><CardDescription>Create one from the driver workspace first.</CardDescription></CardHeader>
          <CardContent><Button asChild><Link to="/driver">Create driver profile</Link></Button></CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AccountLink
            to="/profile/driver/verification"
            icon={<ShieldCheck className="size-5" />}
            title="KYC & license"
            description={`KYC ${account.profile.kycStatus.replace("_", " ")} · License ${account.profile.licenseVerified ? "verified" : "pending"}`}
          />
          <AccountLink
            to="/profile/driver/vehicles"
            icon={<Car className="size-5" />}
            title="Vehicles"
            description={`${account.profile.vehicles?.length ?? 0} vehicle${account.profile.vehicles?.length === 1 ? "" : "s"} added`}
          />
          <AccountLink
            to="/driver/dashboard"
            icon={<Gauge className="size-5" />}
            title="Driver dashboard"
            description="View earnings, completed rides, and ride history"
          />
          <AccountLink
            to="/driver"
            icon={<Car className="size-5" />}
            title="Driver workspace"
            description="Go online and receive ride requests"
          />
        </div>
      )}
    </DriverAccountShell>
  )
}

function AccountLink({ to, icon, title, description }: { to: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link to={to} className="group rounded-3xl border bg-card p-5 shadow-sm transition hover:bg-muted/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
          <div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
        </div>
        <ArrowRight className="mt-2 size-4 text-muted-foreground transition group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
