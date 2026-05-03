'use client'

import { useEffect, useRef } from 'react'

interface LeafletMapProps {
  lat: number
  lng: number
  title: string
}

export default function LeafletMap({ lat, lng, title }: LeafletMapProps) {
  const ref = useRef<HTMLDivElement>(null)
  const instance = useRef<any>(null)

  useEffect(() => {
    if (!ref.current) return
    let cancelled = false

    import('leaflet').then((L) => {
      // Bail out if the effect was cleaned up while the import was in flight
      if (cancelled || !ref.current) return
      // Bail out if Leaflet already owns this container (Strict Mode double-invoke)
      if ((ref.current as any)._leaflet_id) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
      const map = L.map(ref.current, { center: [lat, lng], zoom: 14, scrollWheelZoom: false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map)
      L.circle([lat, lng], { radius: 300, color: '#C4582A', fillColor: '#C4582A', fillOpacity: 0.15, weight: 2 }).addTo(map)
      instance.current = map
    })

    return () => {
      cancelled = true
      if (instance.current) {
        instance.current.remove()
        instance.current = null
      }
    }
  }, [lat, lng])

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div ref={ref} className="w-full h-full" />
    </>
  )
}
