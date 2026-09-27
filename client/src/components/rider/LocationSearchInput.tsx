import { useState, useRef, useEffect } from "react"
import { MapPin, X, Check, AlertCircle } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { searchPhotonLocations } from "@/services/photon"
import type { RideLocation } from "@/types"
import { cn } from "@/lib/utils"

interface LocationSearchInputProps {
  selectedLocation: RideLocation | null
  onSelect: (location: RideLocation | null) => void
  placeholder: string
  icon: React.ReactNode
}

export default function LocationSearchInput({
  selectedLocation,
  onSelect,
  placeholder,
  icon,
}: LocationSearchInputProps) {
  const [query, setQuery] = useState(selectedLocation?.address || "")
  const [suggestions, setSuggestions] = useState<RideLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (selectedLocation) {
      setQuery(selectedLocation.address)
    }
  }, [selectedLocation])

  const handleInputChange = (val: string) => {
    setQuery(val)
    if (selectedLocation) {
      onSelect(null)
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortControllerRef.current) abortControllerRef.current.abort()

    if (!val.trim() || val.trim().length < 2) {
      setSuggestions([])
      setLoading(false)
      setError(null)
      setIsOpen(false)
      return
    }

    setLoading(true)
    setError(null)
    setIsOpen(true)

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const results = await searchPhotonLocations(val, controller.signal)
        setSuggestions(results)
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return
        setError("Unable to load suggestions")
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleSelectSuggestion = (loc: RideLocation) => {
    setQuery(loc.address)
    onSelect(loc)
    setSuggestions([])
    setIsOpen(false)
    setError(null)
  }

  const handleClear = () => {
    setQuery("")
    onSelect(null)
    setSuggestions([])
    setIsOpen(false)
    setError(null)
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full">
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border bg-background px-4 py-3 transition-all",
          isOpen ? "border-ring shadow-md ring-2 ring-ring/20" : "border-border shadow-xs"
        )}
      >
        <span className="shrink-0 text-muted-foreground">{icon}</span>

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 || (query.trim().length >= 2 && !selectedLocation)) {
              setIsOpen(true)
            }
          }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />

        {loading && <Spinner className="size-4 shrink-0 text-muted-foreground" />}

        {!loading && selectedLocation && (
          <Check className="size-4 shrink-0 text-emerald-500" />
        )}

        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-1.5 max-h-60 overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl">
          {loading && suggestions.length === 0 && (
            <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground justify-center">
              <Spinner className="size-3.5" />
              Searching locations...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && suggestions.length === 0 && query.trim().length >= 2 && (
            <div className="p-3 text-center text-xs text-muted-foreground">
              No matching places found. Try typing another city or address.
            </div>
          )}

          {suggestions.map((item, idx) => (
            <button
              key={`${item.lat}-${item.lng}-${idx}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelectSuggestion(item)
              }}
              className="w-full flex items-start gap-3 rounded-xl p-2.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <MapPin className="size-4 shrink-0 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{item.address}</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
