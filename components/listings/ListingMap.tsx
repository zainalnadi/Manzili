'use client'

import dynamic from 'next/dynamic'

const GoogleMapComponent = dynamic(() => import('./GoogleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#EDE0CC] animate-pulse flex items-center justify-center">
      <span className="text-[#7A6A5E] text-sm">Loading map...</span>
    </div>
  ),
})

interface ListingMapProps {
  lat: number
  lng: number
  title: string
}

export function ListingMap({ lat, lng, title }: ListingMapProps) {
  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-[#EDE0CC]">
      <GoogleMapComponent lat={lat} lng={lng} title={title} />
    </div>
  )
}
