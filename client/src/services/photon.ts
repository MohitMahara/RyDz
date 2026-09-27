import type { RideLocation } from "@/types"

export interface PhotonFeature {
  geometry: {
    coordinates: [number, number] // [lng, lat]
  }
  properties: {
    name?: string
    street?: string
    housenumber?: string
    city?: string
    state?: string
    country?: string
    postcode?: string
  }
}

export interface PhotonResponse {
  features: PhotonFeature[]
}

export async function searchPhotonLocations(
  query: string,
  signal?: AbortSignal
): Promise<RideLocation[]> {
  const trimmed = query.trim()
  if (!trimmed || trimmed.length < 2) return []

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=5`

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error("Failed to fetch location suggestions")
  }

  const data: PhotonResponse = await response.json()

  return (data.features || []).map((feature) => {
    const p = feature.properties
    const parts = [
      p.name,
      p.street ? `${p.street}${p.housenumber ? " " + p.housenumber : ""}` : null,
      p.city,
      p.state,
      p.country,
    ].filter(Boolean)

    const address = Array.from(new Set(parts)).join(", ")

    return {
      address: address || p.name || "Selected Location",
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    }
  })
}
