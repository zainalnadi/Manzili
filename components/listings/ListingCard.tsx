'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Star, Zap } from 'lucide-react'
import { formatEGP } from '@/lib/utils/format'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

export interface ListingCardData {
  id: string
  titleAr: string
  titleEn: string
  governorate: string
  city: string
  compound?: string | null
  pricePerNight: number
  averageRating?: number | null
  totalBookings: number
  images: Array<{ url: string; isCover: boolean }>
  bnplEnabled: boolean
  instantBook: boolean
  host?: { nationalIdVerified: boolean } | null
  propertyType: string
}

interface ListingCardProps {
  listing: ListingCardData
  locale: string
  wishlisted?: boolean
  onWishlistToggle?: (id: string) => void
}

/* BNPL info tooltip */
function BNPLBadge({ locale }: { locale: string }) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="relative inline-flex items-center gap-1"
      style={{
        fontFamily: "'Josefin Sans', sans-serif",
        fontWeight: 100,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontSize: '9px',
        background: 'rgba(201,150,58,0.12)',
        color: '#C9963A',
        border: '0.5px solid rgba(201,150,58,0.4)',
        borderRadius: '999px',
        padding: '2px 8px',
      }}
    >
      {locale === 'ar' ? 'تقسيط' : 'BNPL'}
      <button
        type="button"
        aria-label="BNPL info"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        style={{ lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <span style={{ fontSize: '9px', color: '#C9963A' }}>ⓘ</span>
      </button>
      {show && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '130%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1C1613',
            color: '#F7F0E6',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '11px',
            width: '180px',
            textAlign: 'center',
            lineHeight: 1.4,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 300,
            letterSpacing: 'normal',
            textTransform: 'none',
            whiteSpace: 'normal',
            zIndex: 10,
            pointerEvents: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          {locale === 'ar'
            ? 'قسّط إجازتك مع فاليو على 3، 6، أو 12 شهر'
            : 'Buy Now, Pay Later with ValU — split into 3, 6, or 12 months'}
        </span>
      )}
    </span>
  )
}

export function ListingCard({ listing, locale, wishlisted = false, onWishlistToggle }: ListingCardProps) {
  const t = useTranslations('search')
  const isRTL = locale === 'ar'
  const router = useRouter()
  const [imgError, setImgError] = useState(false)
  const [hearted, setHearted] = useState(wishlisted)
  const [heartPulse, setHeartPulse] = useState(false)
  const [heartLoading, setHeartLoading] = useState(false)

  const coverImage = listing.images.find((i) => i.isCover) ?? listing.images[0]
  const title = locale === 'ar' ? listing.titleAr : listing.titleEn
  const location = listing.compound
    ? `${listing.compound}, ${listing.city}`
    : `${listing.city}, ${listing.governorate}`

  // Show star rating when listing has a rating
  const showRating = listing.averageRating && listing.averageRating > 0

  const handleHeart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (heartLoading) return
    setHeartLoading(true)
    setHearted((prev) => !prev)
    setHeartPulse(true)
    setTimeout(() => setHeartPulse(false), 300)
    onWishlistToggle?.(listing.id)
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })
      if (res.status === 401) {
        setHearted((prev) => !prev) // revert
        router.push(`/${locale}/auth/login`)
      } else if (!res.ok) {
        setHearted((prev) => !prev) // revert
      }
    } catch {
      setHearted((prev) => !prev) // revert
    } finally {
      setHeartLoading(false)
    }
  }

  return (
    <Link
      href={`/${locale}/listings/${listing.id}`}
      className="group block card-item focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4582A] rounded-2xl"
    >
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{
          border: '0.5px solid rgba(122,106,94,0.15)',
          transition: 'box-shadow 400ms cubic-bezier(0.25,0.46,0.45,0.94)',
          willChange: 'transform',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(28,22,19,0.12)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'none'
        }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] bg-[#EDE0CC] overflow-hidden">
          {coverImage && !imgError ? (
            <Image
              src={coverImage.url}
              alt={title}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:[transform:scale(1.03)] transition-transform duration-[400ms] ease-out"
              style={{ willChange: 'transform' }}
              onError={() => setImgError(true)}
            />
          ) : (
            /* Skeleton shimmer placeholder */
            <div className="w-full h-full skeleton-shimmer" />
          )}

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-2.5 start-2.5 flex flex-col gap-1.5">
            {listing.instantBook && (
              <span
                className="inline-flex items-center gap-1"
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 100,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontSize: '9px',
                  background: '#C4582A',
                  color: 'white',
                  borderRadius: '999px',
                  padding: '2px 8px',
                }}
              >
                <Zap className="w-2.5 h-2.5" />
                {locale === 'ar' ? 'فوري' : 'Instant'}
              </span>
            )}
            {listing.bnplEnabled && <BNPLBadge locale={locale} />}
            {listing.host?.nationalIdVerified && (
              <span
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 100,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontSize: '9px',
                  background: 'rgba(143,166,139,0.85)',
                  color: 'white',
                  borderRadius: '999px',
                  padding: '2px 8px',
                }}
              >
                {t('verified_badge')}
              </span>
            )}
          </div>

          {/* Heart / wishlist */}
          <button
            type="button"
            onClick={handleHeart}
            aria-label={hearted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-2.5 end-2.5 w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-sm"
            style={{ transition: 'background 150ms ease, transform 150ms ease' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'white' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.85)' }}
          >
            <Heart
              className="w-4 h-4 transition-colors"
              style={{
                fill: hearted ? '#C4582A' : 'transparent',
                color: hearted ? '#C4582A' : '#7A6A5E',
                animation: heartPulse ? 'heart-pulse 300ms ease-out both' : 'none',
              }}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5">
          {/* Location */}
          <p
            className="text-[#9A8878] text-xs mb-1 truncate"
            style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
          >
            {location}
          </p>

          {/* Title */}
          <h3
            className="text-[#1C1613] leading-snug mb-3 line-clamp-2"
            style={{
              fontFamily: isRTL ? "'Tajawal', sans-serif" : "'Outfit', sans-serif",
              fontWeight: isRTL ? 300 : 500,
              fontSize: '0.875rem',
            }}
          >
            {title}
          </h3>

          {/* Rating + Price */}
          <div className="flex items-center justify-between">
            {/* Rating — only if ≥ 10 bookings */}
            <div className="flex items-center gap-1">
              {showRating ? (
                <>
                  <Star className="w-3 h-3 fill-[#C9963A] text-[#C9963A]" />
                  <span className="text-xs text-[#1C1613] font-medium">{listing.averageRating!.toFixed(1)}</span>
                  {listing.totalBookings > 0 && (
                    <span className="text-xs text-[#9A8878]">· {listing.totalBookings}</span>
                  )}
                </>
              ) : (
                <span
                  style={{
                    fontSize: '10px',
                    background: 'rgba(143,166,139,0.18)',
                    color: '#5A8A5E',
                    borderRadius: '999px',
                    padding: '1px 7px',
                    fontFamily: "'Josefin Sans', sans-serif",
                    fontWeight: 100,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {locale === 'ar' ? 'جديد' : 'New'}
                </span>
              )}
            </div>

            {/* Price with hierarchy */}
            <div className="flex items-baseline gap-0.5 text-end">
              <span style={{ fontSize: '11px', color: '#9A8878', fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}>EGP</span>
              <span style={{ fontSize: '17px', fontWeight: 600, color: '#1C1613', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em' }}>
                {listing.pricePerNight.toLocaleString()}
              </span>
              <span style={{ fontSize: '11px', color: '#9A8878', fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}>
                {t('per_night')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
