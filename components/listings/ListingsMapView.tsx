'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, X } from 'lucide-react'
import { formatEGP } from '@/lib/utils/format'

interface MapListing {
  id: string
  titleAr: string
  titleEn: string
  governorate: string
  city: string
  compound?: string | null
  pricePerNight: number
  averageRating?: number | null
  latitude?: number | null
  longitude?: number | null
  images: Array<{ url: string; isCover: boolean }>
  propertyType: string
}

interface ListingsMapViewProps {
  listings: MapListing[]
  locale: string
}

/** Default coordinates for Egyptian destinations without GPS data */
const GOVERNORATE_COORDS: Record<string, [number, number]> = {
  'North Coast': [31.0, 27.8],
  'Ain Sokhna': [29.6, 32.35],
  'Cairo': [30.06, 31.23],
  'Hurghada': [27.26, 33.82],
  'El Gouna': [27.4, 33.68],
  'Dahab': [28.51, 34.51],
  'Sharm El-Sheikh': [27.91, 34.33],
  'Alexandria': [31.2, 29.92],
  'Other': [26.82, 30.8],
}

function jitter(base: number, seed: string, index: number): number {
  // deterministic small offset to spread overlapping markers
  const hash = (seed + index).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return base + ((hash % 40) - 20) * 0.003
}

export function ListingsMapView({ listings, locale }: ListingsMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [selected, setSelected] = useState<MapListing | null>(null)
  const isRTL = locale === 'ar'

  // Derive coords for each listing
  const listingsWithCoords = listings.map((l, i) => {
    const lat = l.latitude ?? jitter((GOVERNORATE_COORDS[l.governorate] ?? [30, 31])[0], l.governorate, i)
    const lng = l.longitude ?? jitter((GOVERNORATE_COORDS[l.governorate] ?? [30, 31])[1], l.id, i)
    return { ...l, lat, lng }
  })

  useEffect(() => {
    if (!mapRef.current) return
    let cancelled = false

    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current || (mapRef.current as any)._leaflet_id) return

      // Center on first valid location or Egypt center
      const firstCoord = listingsWithCoords[0] ?? { lat: 27, lng: 30 }
      const map = L.map(mapRef.current, {
        center: [firstCoord.lat, firstCoord.lng],
        zoom: listingsWithCoords.length === 1 ? 14 : 7,
        scrollWheelZoom: true,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(map)

      // Custom price pin icons
      listingsWithCoords.forEach((listing) => {
        const price = formatEGP(listing.pricePerNight, locale)
        const iconHtml = `
          <div style="
            background: white;
            border: 1.5px solid #1C1613;
            border-radius: 20px;
            padding: 4px 10px;
            font-family: Outfit, sans-serif;
            font-weight: 600;
            font-size: 12px;
            color: #1C1613;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(28,22,19,0.18);
            cursor: pointer;
            transition: all 0.15s;
          ">${price}</div>
        `
        const icon = L.divIcon({ html: iconHtml, className: '', iconAnchor: [0, 0] })
        const marker = L.marker([listing.lat, listing.lng], { icon })
          .addTo(map)
          .on('click', () => {
            setSelected(listing)
            // Highlight selected marker
            markersRef.current.forEach((m, idx) => {
              const isSelected = listingsWithCoords[idx]?.id === listing.id
              const el = m.getElement()
              if (el) {
                const inner = el.querySelector('div')
                if (inner) {
                  inner.style.background = isSelected ? '#1C1613' : 'white'
                  inner.style.color = isSelected ? 'white' : '#1C1613'
                  inner.style.transform = isSelected ? 'scale(1.1)' : 'scale(1)'
                }
              }
            })
          })
        markersRef.current.push(marker)
      })

      leafletRef.current = map
    })

    return () => {
      cancelled = true
      markersRef.current = []
      if (leafletRef.current) {
        leafletRef.current.remove()
        leafletRef.current = null
      }
    }
  }, []) // Only once on mount

  const coverImage = (l: MapListing) => l.images.find((i) => i.isCover) ?? l.images[0]

  return (
    <div className="relative w-full h-full" style={{ minHeight: '100%' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: 'inherit' }} />

      {/* Selected listing card popup */}
      {selected && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-72 bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#EDE0CC]"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Close */}
          <button
            onClick={() => {
              setSelected(null)
              // Reset all markers
              markersRef.current.forEach((m) => {
                const el = m.getElement()
                if (el) {
                  const inner = el.querySelector('div')
                  if (inner) { inner.style.background = 'white'; inner.style.color = '#1C1613'; inner.style.transform = 'scale(1)' }
                }
              })
            }}
            className="absolute top-2 end-2 z-10 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow-sm"
          >
            <X className="w-3.5 h-3.5 text-[#1C1613]" />
          </button>

          {/* Image */}
          <Link href={`/${locale}/listings/${selected.id}`}>
            <div className="relative h-36 bg-[#EDE0CC]">
              {coverImage(selected) && (
                <Image
                  src={coverImage(selected)!.url}
                  alt={locale === 'ar' ? selected.titleAr : selected.titleEn}
                  fill
                  className="object-cover"
                  sizes="280px"
                />
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="text-xs text-[#9A8878] mb-0.5">
                {selected.compound ? `${selected.compound}, ` : ''}{selected.city}
              </p>
              <p
                className="text-[#1C1613] font-medium text-sm line-clamp-1 mb-1.5"
                style={{ fontFamily: isRTL ? "'Tajawal', sans-serif" : 'Outfit, sans-serif', fontWeight: isRTL ? 300 : 500 }}
              >
                {locale === 'ar' ? selected.titleAr : selected.titleEn}
              </p>
              <div className="flex items-center justify-between">
                {selected.averageRating ? (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#C9973A] text-[#C9973A]" />
                    <span className="text-xs text-[#1C1613] font-medium">{selected.averageRating.toFixed(1)}</span>
                  </div>
                ) : <span />}
                <div className="flex items-baseline gap-0.5">
                  <span className="text-sm font-semibold text-[#1C1613]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {formatEGP(selected.pricePerNight, locale)}
                  </span>
                  <span className="text-xs text-[#9A8878]">{locale === 'ar' ? '/ليلة' : '/night'}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
