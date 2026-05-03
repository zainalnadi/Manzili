'use client'

import { useJsApiLoader, GoogleMap as GMap, Circle } from '@react-google-maps/api'
import { useEffect, useRef, useState, useCallback } from 'react'

interface GoogleMapProps {
  lat: number
  lng: number
  title: string
}

const CIRCLE_OPTIONS = {
  strokeColor: '#C4582A',
  strokeOpacity: 0.9,
  strokeWeight: 2,
  fillColor: '#C4582A',
  fillOpacity: 0.12,
  radius: 300,
}

const MAP_OPTIONS: google.maps.MapOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
}

function LeafletFallback({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const instance = useRef<any>(null)

  useEffect(() => {
    if (!ref.current) return
    let cancelled = false
    import('leaflet').then((L) => {
      if (cancelled || !ref.current || (ref.current as any)._leaflet_id) return
      delete (L.Icon.Default.prototype as any)._getIconUrl
      const map = L.map(ref.current, { center: [lat, lng], zoom: 14, scrollWheelZoom: false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)
      L.circle([lat, lng], { radius: 300, color: '#C4582A', fillColor: '#C4582A', fillOpacity: 0.15, weight: 2 }).addTo(map)
      instance.current = map
    })
    return () => {
      cancelled = true
      if (instance.current) { instance.current.remove(); instance.current = null }
    }
  }, [lat, lng])

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div ref={ref} className="w-full h-full" />
    </>
  )
}

function GoogleMapInner({ lat, lng }: { lat: number; lng: number; onError: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  // Watch the container for Google Maps error overlay elements
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new MutationObserver(() => {
      const el = containerRef.current
      if (!el) return
      // Google Maps injects a div with class 'gm-err-container' on API errors
      if (el.querySelector('.gm-err-container') || el.querySelector('[class*="gm-err"]')) {
        setFailed(true)
        observer.disconnect()
      }
    })
    observer.observe(containerRef.current, { childList: true, subtree: true })
    // Also set a 2s deadline: if no tiles loaded, fall back
    const timer = setTimeout(() => {
      if (containerRef.current && !containerRef.current.querySelector('.gm-style img')) {
        setFailed(true)
      }
    }, 2500)
    return () => { observer.disconnect(); clearTimeout(timer) }
  }, [])

  if (failed) return <LeafletFallback lat={lat} lng={lng} />

  return (
    <div ref={containerRef} className="w-full h-full">
      <GMap
        mapContainerClassName="w-full h-full"
        center={{ lat, lng }}
        zoom={15}
        options={MAP_OPTIONS}
      >
        <Circle center={{ lat, lng }} options={CIRCLE_OPTIONS} />
      </GMap>
    </div>
  )
}

export default function GoogleMapComponent({ lat, lng, title }: GoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: apiKey })

  if (!apiKey || loadError) return <LeafletFallback lat={lat} lng={lng} />
  if (!isLoaded) return (
    <div className="w-full h-full flex items-center justify-center bg-[#F7F0E6]">
      <div className="w-6 h-6 border-2 border-[#C4582A] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return <GoogleMapInner lat={lat} lng={lng} onError={() => {}} />
}
