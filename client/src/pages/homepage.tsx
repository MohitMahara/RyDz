import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navigation, Car, ShieldCheck, Zap, MapPin, Clock, ArrowRight, Star } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-full w-full bg-background text-foreground flex flex-col overflow-y-auto">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <Badge variant="secondary" className="px-4 py-1.5 text-sm rounded-full gap-2 border border-primary/20 bg-primary/10 text-primary">
            <Zap className="size-4 text-primary" />
            <span>Next-Generation Ride Hailing</span>
          </Badge>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Fast, Reliable & Safe Rides <br className="hidden sm:inline" />
            <span className="text-primary bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
              Whenever You Need
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Experience seamless city travel with instant driver matching, upfront fare estimation, and real-time GPS tracking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-base font-semibold rounded-2xl gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all" asChild>
              <Link to="/rides">
                <Navigation className="size-5" />
                Book a Ride
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-8 text-base font-semibold rounded-2xl gap-2 border-2 hover:bg-muted" asChild>
              <Link to="/driver">
                <Car className="size-5 text-primary" />
                Become a Driver
              </Link>
            </Button>
          </div>

          {/* Social Proof */}
          <div className="pt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="size-4 fill-amber-500" />
              <Star className="size-4 fill-amber-500" />
              <Star className="size-4 fill-amber-500" />
              <Star className="size-4 fill-amber-500" />
              <Star className="size-4 fill-amber-500" />
              <span className="font-semibold text-foreground ml-1">4.9/5</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">10,000+ Rides Completed</span>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Why Choose RyDz?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Built for modern commuters and drivers with fairness, safety, and efficiency at the core.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-3xl border border-border bg-card p-8 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Clock className="size-6" />
            </div>
            <h3 className="text-xl font-bold">Instant Booking</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Set your pickup and dropoff points to view instant fares across Bikes, Autos, Economy & Premium cabs.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MapPin className="size-6" />
            </div>
            <h3 className="text-xl font-bold">Live GPS Tracking</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Track your driver in real-time with WebSockets live feed from request confirmation to destination.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="size-6" />
            </div>
            <h3 className="text-xl font-bold">Verified Drivers</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              All driver accounts undergo license verification and KYC check to ensure maximum safety.
            </p>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="my-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ready to Get Moving?</h2>
            <p className="text-primary-foreground/90 max-w-lg mx-auto text-base sm:text-lg">
              Hop in and experience fast, transparent ride hailing right now.
            </p>
            <div className="pt-2">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-bold rounded-xl shadow-lg" asChild>
                <Link to="/rides">
                  Book Your Ride Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
