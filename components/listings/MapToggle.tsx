'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Map, List } from 'lucide-react'

interface MapToggleProps {
  locale: string
  isMapView: boolean
}

export function MapToggle({ locale, isMapView }: MapToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const toggle = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (isMapView) {
      params.delete('view')
    } else {
      params.set('view', 'map')
    }
    router.push(`/${locale}/listings?${params.toString()}`)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#1C1613] text-[#1C1613] hover:bg-[#1C1613] hover:text-white transition-all text-xs"
      style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.1em', textTransform: 'uppercase' }}
    >
      {isMapView ? (
        <><List className="w-3.5 h-3.5" />{locale === 'ar' ? 'قائمة' : 'List'}</>
      ) : (
        <><Map className="w-3.5 h-3.5" />{locale === 'ar' ? 'الخريطة' : 'Map'}</>
      )}
    </button>
  )
}
