import { useEffect } from "react"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

const DELHI_CENTER: [number, number] = [28.6139, 77.209]

const driverIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #18181b;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,.3);
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5S16.67 13 17.5 13s1.5.67 1.5 1.5S18.33 16 17.5 16zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const MOCK_DRIVERS: Array<{
  id: number
  position: [number, number]
}> = [
  { id: 1, position: [28.617, 77.212] },
  { id: 2, position: [28.611, 77.205] },
  { id: 3, position: [28.615, 77.215] },
  { id: 4, position: [28.609, 77.208] },
]

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center)
  }, [center, map])

  return null
}

interface RydzMapProps {
  center?: [number, number]
  showDriverMarkers?: boolean
}

export default function RydzMap({
  center = DELHI_CENTER,
  showDriverMarkers = true,
}: RydzMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={14}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <RecenterMap center={center} />

      {showDriverMarkers &&
        MOCK_DRIVERS.map((driver) => (
          <Marker
            key={driver.id}
            position={driver.position}
            icon={driverIcon}
          >
            <Popup>Driver #{driver.id}</Popup>
          </Marker>
        ))}
    </MapContainer>
  )
}