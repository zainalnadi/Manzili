'use client'

import dynamic from 'next/dynamic'

const ListingsMapView = dynamic(
  () => import('./ListingsMapView').then((m) => m.ListingsMapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#EDE0CC] animate-pulse flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C4582A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-[#7A6A5E]">Loading map...</p>
        </div>
      </div>
    ),
  }
)

export { ListingsMapView }
