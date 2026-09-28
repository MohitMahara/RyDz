import { useState } from "react"
import { Car, CheckCircle2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import type { BackendVehicleType, DriverProfile, DriverVehicle } from "@/types"

const vehicleLabels: Record<BackendVehicleType, string> = {
  BIKE: "Bike",
  AUTO: "Auto",
  CAB_ECONOMY: "Economy Cab",
  CAB_PREMIUM: "Premium Cab",
}

type VehicleForm = {
  vehicleType: BackendVehicleType
  make: string
  model: string
  plateNumber: string
  color: string
}

const emptyVehicle: VehicleForm = { vehicleType: "BIKE", make: "", model: "", plateNumber: "", color: "" }

export default function DriverVehicleManager({
  profile,
  loading,
  onAdd,
  onVerify,
  onSetActive,
  onDelete,
}: {
  profile: DriverProfile
  loading: boolean
  onAdd: (vehicle: VehicleForm) => Promise<void>
  onVerify: (vehicleId: string) => Promise<void>
  onSetActive: (vehicleId: string) => Promise<void>
  onDelete: (vehicleId: string) => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const [vehicle, setVehicle] = useState<VehicleForm>(emptyVehicle)

  const addVehicle = async () => {
    await onAdd({ ...vehicle, plateNumber: vehicle.plateNumber.toUpperCase() })
    setVehicle(emptyVehicle)
    setAdding(false)
  }

  return (
    <Card className="rounded-3xl border-border shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div><CardTitle className="flex items-center gap-2"><Car className="size-5 text-primary" />Vehicles</CardTitle><CardDescription className="mt-1">Select a verified vehicle before going online.</CardDescription></div>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setAdding((current) => !current)} disabled={loading}><Plus className="size-4" />Add</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {adding && <div className="space-y-3 rounded-2xl border bg-muted/30 p-4"><div className="grid gap-3 sm:grid-cols-2"><Input label="Make" value={vehicle.make} onChange={(make) => setVehicle({ ...vehicle, make })} /><Input label="Model" value={vehicle.model} onChange={(model) => setVehicle({ ...vehicle, model })} /><Input label="Plate number" value={vehicle.plateNumber} onChange={(plateNumber) => setVehicle({ ...vehicle, plateNumber })} /><Input label="Color" value={vehicle.color} onChange={(color) => setVehicle({ ...vehicle, color })} /><label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">Vehicle type<select className="h-11 rounded-xl border bg-background px-3 font-normal" value={vehicle.vehicleType} onChange={(event) => setVehicle({ ...vehicle, vehicleType: event.target.value as BackendVehicleType })}>{Object.entries(vehicleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><Button className="w-full rounded-xl" onClick={() => void addVehicle()} disabled={loading || !vehicle.make || !vehicle.model || !vehicle.plateNumber || !vehicle.color}>{loading ? <Spinner className="size-4" /> : "Add vehicle"}</Button></div>}
        {profile.vehicles?.length ? profile.vehicles.map((vehicleItem) => <VehicleRow key={vehicleItem.id} vehicle={vehicleItem} isActive={vehicleItem.id === profile.activeVehicleId} loading={loading} onVerify={onVerify} onSetActive={onSetActive} onDelete={onDelete} />) : <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">No vehicles added yet.</p>}
      </CardContent>
    </Card>
  )
}

function VehicleRow({ vehicle, isActive, loading, onVerify, onSetActive, onDelete }: { vehicle: DriverVehicle; isActive: boolean; loading: boolean; onVerify: (id: string) => Promise<void>; onSetActive: (id: string) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  return <div className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{vehicle.make} {vehicle.model}</p>{isActive && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Active</span>}</div><p className="mt-1 text-sm text-muted-foreground">{vehicleLabels[vehicle.vehicleType]} · {vehicle.color} · {vehicle.plateNumber}</p><p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${vehicle.isVerified ? "text-emerald-600" : "text-amber-600"}`}>{vehicle.isVerified && <CheckCircle2 className="size-3.5" />}{vehicle.isVerified ? "Verified" : "Verification required"}</p></div><div className="flex flex-wrap gap-2">{!vehicle.isVerified && <Button size="sm" variant="outline" className="rounded-xl" disabled={loading} onClick={() => void onVerify(vehicle.id)}>Verify</Button>}{vehicle.isVerified && !isActive && <Button size="sm" className="rounded-xl" disabled={loading} onClick={() => void onSetActive(vehicle.id)}>Set active</Button>}<Button size="icon" variant="ghost" className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={loading || isActive} onClick={() => void onDelete(vehicle.id)}><Trash2 className="size-4" /><span className="sr-only">Delete vehicle</span></Button></div></div>
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="flex flex-col gap-1.5 text-sm font-medium">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border bg-background px-4 font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
}
