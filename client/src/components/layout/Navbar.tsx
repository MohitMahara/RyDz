import { Link, NavLink } from "react-router-dom"
import { ModeToggle } from "@/components/theme/mode-toggle"
import { Home, Navigation, Car, LogIn, User } from "lucide-react"
import { UseAuth } from "@/contexts/authContext"

export default function Navbar() {
  const { userInfo } = UseAuth()
  const isLoggedIn = !!(userInfo.user || userInfo.token)

  return (
    <>
      {/* MOBILE TOP HEADER: Only visible on smaller screens (< md) */}
      <header className="flex md:hidden items-center justify-between w-full bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-[999]">
        <Link to="/" className="flex items-center gap-1 font-bold text-xl tracking-tight">
          <span className="text-primary text-2xl">Ry</span>
          <span className="text-foreground text-2xl">Dz</span>
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </header>

      {/* DESKTOP NAVBAR: Full width top navbar for larger screens (>= md) */}
      <header className="hidden md:flex w-full bg-background/95 backdrop-blur-md border-b border-border px-6 lg:px-10 py-3 items-center justify-between sticky top-0 z-[999] shadow-xs">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-1 font-bold text-2xl tracking-tight hover:opacity-90 transition-opacity">
          <span className="text-primary">Ry</span>
          <span className="text-foreground">Dz</span>
        </Link>

        <nav className="flex items-center gap-1 lg:gap-2">
          {/* 1. Home */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-semibold rounded-full transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-primary/10 text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`
            }
          >
            <Home className="size-4" />
            Home
          </NavLink>

          {/* 2. Rides */}
          <NavLink
            to="/rides"
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-semibold rounded-full transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-primary/10 text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`
            }
          >
            <Navigation className="size-4" />
            Rides
          </NavLink>

          {/* 3. Driver Profile */}
          <NavLink
            to="/driver"
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-semibold rounded-full transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-primary/10 text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`
            }
          >
            <Car className="size-4" />
            Driver Profile
          </NavLink>

          {isLoggedIn ? (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-semibold rounded-full transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`
              }
            >
              <User className="size-4" />
              Profile
            </NavLink>
          ) : (
            <NavLink
              to="/auth"
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-semibold rounded-full transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`
              }
            >
              <LogIn className="size-4" />
              Sign In
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <ModeToggle />
        </div>
      </header>

      {/* MOBILE BOTTOM NAVBAR: Only visible on smaller screens (< md) */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-[999] items-center justify-around bg-background/95 backdrop-blur-xl border-t border-border px-2 py-2 shadow-[0_-4px_25px_rgba(0,0,0,0.15)]">
        {/* 1. Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? "text-primary font-bold scale-105"
                : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Home className="size-5" />
          <span className="text-[10px] mt-0.5 font-medium">Home</span>
        </NavLink>

        {/* 2. Rides */}
        <NavLink
          to="/rides"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? "text-primary font-bold scale-105"
                : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Navigation className="size-5" />
          <span className="text-[10px] mt-0.5 font-medium">Rides</span>
        </NavLink>

        {/* 3. Driver */}
        <NavLink
          to="/driver"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? "text-primary font-bold scale-105"
                : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Car className="size-5" />
          <span className="text-[10px] mt-0.5 font-medium">Driver</span>
        </NavLink>

        {isLoggedIn ? (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? "text-primary font-bold scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <User className="size-5" />
            <span className="text-[10px] mt-0.5 font-medium">Profile</span>
          </NavLink>
        ) : (
          <NavLink
            to="/auth"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? "text-primary font-bold scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <LogIn className="size-5" />
            <span className="text-[10px] mt-0.5 font-medium">Sign In</span>
          </NavLink>
        )}
      </nav>
    </>
  )
}
