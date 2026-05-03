'use client'

import dynamic from 'next/dynamic'

const ListingsMapViewDynamic = dynamic(
  () => import('./ListingsMapView').then((m) => m.ListingsMapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#EDE0CC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C4582A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-[#7A6A5E]">Loading map...</p>
        </div>
      </div>
    ),
  }
)

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

interface ListingsMapWrapperProps {
  listings: MapListing[]
  locale: string
}

export function ListingsMapWrapper({ listings, locale }: ListingsMapWrapperProps) {
  return <ListingsMapViewDynamic listings={listings} locale={locale} />
}
