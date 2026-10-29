import { Link } from "react-router-dom"
import DriverAccountShell, { DriverAccountFeedback, DriverAccountState } from "@/components/driver/DriverAccountShell"
import DriverVehicleManager from "@/components/driver/DriverVehicleManager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDriverProfileManagement } from "@/hooks/useDriverProfileManagement"
import { addDriverVehicle, deleteDriverVehicle, setActiveDriverVehicle, verifyDriverVehicle } from "@/services/rydz"

export default function DriverVehiclesPage() {
  const account = useDriverProfileManagement()

  if (account.loading) return <DriverAccountState>Loading vehicles...</DriverAccountState>

  return (
    <DriverAccountShell title="Driver vehicles" description="Add, verify, and choose the vehicle used for rides.">
      <DriverAccountFeedback error={account.error} notice={account.notice} />

      {!account.userInfo.token ? (
        <DriverAccountState><Button asChild><Link to="/auth">Sign in</Link></Button></DriverAccountState>
      ) : !account.profile ? (
        <Card className="rounded-3xl">
          <CardHeader><CardTitle>No driver profile</CardTitle><CardDescription>Create your driver profile before adding a vehicle.</CardDescription></CardHeader>
          <CardContent><Button asChild><Link to="/driver">Open driver workspace</Link></Button></CardContent>
        </Card>
      ) : (
        <DriverVehicleManager
          profile={account.profile}
          loading={account.busy}
          onAdd={async (vehicle) => {
            return account.run(async () => (await addDriverVehicle(vehicle))?.driverProfile, "Vehicle added successfully.")
          }}
          onVerify={async (id) => {
            await account.run(async () => {
              await verifyDriverVehicle(id)
              return undefined
            }, "Vehicle verification completed.")
          }}
          onSetActive={async (id) => {
            await account.run(() => setActiveDriverVehicle(id), "Active vehicle updated.")
          }}
          onDelete={async (id) => {
            await account.run(() => deleteDriverVehicle(id), "Vehicle deleted.")
          }}
        />
      )}
    </DriverAccountShell>
  )
}
