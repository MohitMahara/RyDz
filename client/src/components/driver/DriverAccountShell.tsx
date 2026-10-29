import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function DriverAccountShell({
  title,
  description,
  backTo = "/profile/driver",
  children,
}: {
  title: string
  description: string
  backTo?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-full overflow-y-auto bg-background px-4 py-6 pb-24 sm:px-6 lg:px-8 md:pb-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-0.5 rounded-xl" asChild>
            <Link to={backTo} aria-label="Go back"><ArrowLeft className="size-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}

export function DriverAccountFeedback({ error, notice }: { error: string | null; notice: string | null }) {
  if (!error && !notice) return null
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${
      error
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    }`}>
      {error ?? notice}
    </div>
  )
}

export function DriverAccountState({ children }: { children: ReactNode }) {
  return <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">{children}</div>
}
