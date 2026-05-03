'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface SavedListing {
  id: string
  titleAr: string | null
  titleEn: string | null
  governorate: string
  city: string
  compound: string | null
  pricePerNight: number
  image: string | null
}

function formatEGP(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency', currency: 'EGP', maximumFractionDigits: 0,
  }).format(amount)
}

export function SavedClient({ locale, initialItems }: { locale: string; initialItems: SavedListing[] }) {
  const isRTL = locale === 'ar'
  const [items, setItems] = useState(initialItems)
  const undoRef = useRef<Map<string, SavedListing>>(new Map())

  const headingStyle = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200 }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' as const }

  const handleRemove = async (listingId: string) => {
    const item = items.find((i) => i.id === listingId)
    if (!item) return

    // Optimistic remove
    setItems((prev) => prev.filter((i) => i.id !== listingId))
    undoRef.current.set(listingId, item)

    // Fire API
    try {
      await fetch(`/api/wishlist/${listingId}`, { method: 'DELETE' })
    } catch {
      // Restore on error
      setItems((prev) => [...prev, item].sort((a, b) => initialItems.findIndex(i => i.id === a.id) - initialItems.findIndex(i => i.id === b.id)))
      toast.error(locale === 'ar' ? 'فشل الحذف' : 'Failed to remove')
      return
    }

    // Toast with undo
    toast(locale === 'ar' ? 'تمت الإزالة من المحفوظات' : 'Removed from saved', {
      duration: 4000,
      action: {
        label: locale === 'ar' ? 'تراجع' : 'UNDO',
        onClick: async () => {
          const removed = undoRef.current.get(listingId)
          if (!removed) return
          try {
            await fetch(`/api/wishlist/${listingId}`, { method: 'POST' })
            setItems((prev) => {
              const updated = [removed, ...prev]
              return updated
            })
            undoRef.current.delete(listingId)
          } catch {
            toast.error(locale === 'ar' ? 'فشل التراجع' : 'Undo failed')
          }
        },
      },
      style: { background: '#1C1613', color: 'white', border: 'none' },
      className: 'font-[Outfit]',
    })
  }

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl text-[#1C1613]" style={headingStyle}>
          {locale === 'ar' ? 'المحفوظات' : 'Saved'}
        </h1>
        {items.length > 0 && (
          <p className="text-[#7A6A5E] mt-1 text-sm">
            {locale === 'ar'
              ? `${items.length} ${items.length === 1 ? 'عقار' : 'عقارات'}`
              : `${items.length} ${items.length === 1 ? 'property' : 'properties'}`}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState locale={locale} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((listing) => {
            const title = locale === 'ar' ? listing.titleAr : listing.titleEn
            const location = listing.compound
              ? `${listing.compound}, ${listing.city}`
              : `${listing.city}, ${listing.governorate}`

            return (
              <div
                key={listing.id}
                className="group bg-white border border-[#EDE0CC] rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200"
                style={{ boxShadow: '0 2px 8px rgba(28,22,19,0.06)' }}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[#F7F0E6]">
                  <Link href={`/${locale}/listings/${listing.id}`}>
                    {listing.image ? (
                      <Image
                        src={listing.image}
                        alt={title ?? ''}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(122,106,94,0.3)" strokeWidth="1">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                    )}
                  </Link>

                  {/* Remove heart button */}
                  <button
                    onClick={() => handleRemove(listing.id)}
                    className="absolute top-2.5 end-2.5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors active:scale-90"
                    aria-label={locale === 'ar' ? 'إزالة من المحفوظات' : 'Remove from saved'}
                    style={{ transition: 'transform 100ms ease, background 150ms ease' }}
                  >
                    <Heart className="w-4 h-4 fill-[#C4582A] text-[#C4582A]" />
                  </button>
                </div>

                {/* Card body */}
                <Link href={`/${locale}/listings/${listing.id}`} className="block p-3.5">
                  <div className="flex items-start gap-1 mb-1 text-[#9A8878]">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <p className="text-xs truncate">{location}</p>
                  </div>
                  <h3 className="text-[#1C1613] text-sm font-medium leading-snug mb-2 line-clamp-2">
                    {title}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#1C1613] font-bold text-base">
                      {formatEGP(listing.pricePerNight, locale)}
                    </span>
                    <span className="text-[#9A8878] text-xs">
                      {locale === 'ar' ? '/ ليلة' : '/ night'}
                    </span>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ locale }: { locale: string }) {
  const isRTL = locale === 'ar'
  return (
    <div
      className="flex flex-col items-center justify-center py-24 text-center"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Arch logomark */}
      <div className="mb-6">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <rect x="10" y="38" width="52" height="24" rx="4" fill="rgba(237,224,204,0.7)" />
          <path d="M10 38 Q10 10 36 10 Q62 10 62 38" fill="rgba(237,224,204,0.5)" stroke="rgba(196,88,42,0.2)" strokeWidth="1.5" />
          <rect x="27" y="48" width="18" height="14" rx="2" fill="rgba(196,88,42,0.12)" />
          {/* Heart */}
          <path d="M36 30 C36 30 32 26 29 28 C26 30 26 34 29 36 L36 43 L43 36 C46 34 46 30 43 28 C40 26 36 30 36 30Z"
            fill="rgba(196,88,42,0.15)" stroke="rgba(196,88,42,0.3)" strokeWidth="1" />
        </svg>
      </div>
      <p
        className="text-[#1C1613] mb-2 text-base"
        style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.1em', textTransform: 'uppercase' }}
      >
        {locale === 'ar' ? 'لا توجد عقارات محفوظة' : 'No saved properties'}
      </p>
      <p className="text-sm text-[#9A8878] mb-7 max-w-xs">
        {locale === 'ar'
          ? 'اضغط على قلب أي عقار لحفظه هنا'
          : 'Tap the heart on any listing to save it here'}
      </p>
      <a
        href={`/${locale}/listings`}
        className="inline-block text-sm text-white px-6 py-3 rounded-full transition-all active:scale-[0.98]"
        style={{
          background: '#C4582A',
          fontFamily: "'Josefin Sans', sans-serif",
          fontWeight: 100,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          boxShadow: '0 4px 16px rgba(196,88,42,0.25)',
        }}
      >
        {locale === 'ar' ? 'استكشف العقارات' : 'Explore Listings'}
      </a>
    </div>
  )
}
