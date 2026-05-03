import { prisma } from '@/lib/prisma'
import { ListingCard, type ListingCardData } from '@/components/listings/ListingCard'
import { ListingCardSkeleton } from '@/components/listings/ListingCardSkeleton'
import { SearchBar } from '@/components/search/SearchBar'
import { CategoryPills } from '@/components/search/CategoryPills'
import { SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { SortSelect } from '@/components/search/SortSelect'
import { MapToggle } from '@/components/listings/MapToggle'
import { ListingsMapWrapper } from '@/components/listings/ListingsMapWrapper'

interface SearchPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    where?: string
    checkin?: string
    checkout?: string
    guests?: string
    type?: string
    minPrice?: string
    maxPrice?: string
    bedrooms?: string
    instantBook?: string
    bnpl?: string
    sort?: string
    view?: string
  }>
}

export default async function ListingsPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params
  const sp = await searchParams
  const isRTL = locale === 'ar'

  // Build Prisma filter
  const where: Prisma.ListingWhereInput = { status: 'ACTIVE' }

  if (sp.where) {
    const dest = sp.where.toLowerCase().replace(/-/g, ' ')
    where.OR = [
      { governorate: { contains: dest, mode: 'insensitive' } },
      { city: { contains: dest, mode: 'insensitive' } },
      { compound: { contains: dest, mode: 'insensitive' } },
      { titleEn: { contains: dest, mode: 'insensitive' } },
      { titleAr: { contains: dest, mode: 'insensitive' } },
    ]
  }

  if (sp.type) where.propertyType = sp.type as any
  if (sp.minPrice) where.pricePerNight = { ...((where.pricePerNight as any) ?? {}), gte: Number(sp.minPrice) }
  if (sp.maxPrice) where.pricePerNight = { ...((where.pricePerNight as any) ?? {}), lte: Number(sp.maxPrice) }
  if (sp.bedrooms) where.bedrooms = { gte: Number(sp.bedrooms) }
  if (sp.instantBook === 'true') where.instantBook = true
  if (sp.bnpl === 'true') where.bnplEnabled = true

  let orderBy: Prisma.ListingOrderByWithRelationInput[] = [{ totalBookings: 'desc' }, { createdAt: 'desc' }]
  if (sp.sort === 'price_low') orderBy = [{ pricePerNight: 'asc' }]
  else if (sp.sort === 'price_high') orderBy = [{ pricePerNight: 'desc' }]
  else if (sp.sort === 'rating') orderBy = [{ averageRating: 'desc' }, { totalBookings: 'desc' }]
  else if (sp.sort === 'newest') orderBy = [{ createdAt: 'desc' }]

  let listings: any[] = []
  try {
    listings = await prisma.listing.findMany({
      where,
      orderBy,
      take: 24,
      include: {
        images: { take: 1, orderBy: { isCover: 'desc' } },
        host: { select: { nationalIdVerified: true } },
      },
    })
  } catch {
    listings = []
  }

  const PROPERTY_TYPES = ['APARTMENT', 'CHALET', 'VILLA', 'STUDIO', 'TOWNHOUSE', 'PENTHOUSE']
  const propertyTypeLabels: Record<string, { ar: string; en: string }> = {
    APARTMENT: { ar: 'شقة', en: 'Apartment' },
    CHALET: { ar: 'شاليه', en: 'Chalet' },
    VILLA: { ar: 'فيلا', en: 'Villa' },
    STUDIO: { ar: 'استوديو', en: 'Studio' },
    TOWNHOUSE: { ar: 'تاون هاوس', en: 'Townhouse' },
    PENTHOUSE: { ar: 'بنتهاوس', en: 'Penthouse' },
  }

  const buildUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams()
    const current = { ...sp, ...updates }
    Object.entries(current).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    return `/${locale}/listings?${params.toString()}`
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Outfit, sans-serif' }}>
      {/* Search bar + category pills */}
      <div className="bg-white border-b border-[#EDE0CC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <SearchBar
              locale={locale}
              initialWhere={sp.where}
              initialCheckIn={sp.checkin}
              initialCheckOut={sp.checkout}
              initialGuests={sp.guests ? Number(sp.guests) : 2}
            />
          </div>
          <div className="pb-3">
            <CategoryPills
              locale={locale}
              activeType={sp.type ?? ''}
              currentParams={Object.fromEntries(
                Object.entries(sp).filter(([, v]) => v != null) as [string, string][]
              )}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="bg-white border border-[#EDE0CC] rounded-2xl p-4 space-y-5 sticky top-20">
              <h3
                className="text-[#1C1613] flex items-center gap-2 text-xs"
                style={isRTL
                  ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 300 }
                  : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.18em', textTransform: 'uppercase' }
                }
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {locale === 'ar' ? 'تصفية النتائج' : 'Filters'}
              </h3>

              {/* Property Type */}
              <div>
                <p className="text-xs font-semibold text-[#7A6A5E] mb-2 uppercase tracking-wide">
                  {locale === 'ar' ? 'نوع العقار' : 'Property Type'}
                </p>
                <div className="space-y-1">
                  {PROPERTY_TYPES.map((type) => (
                    <Link
                      key={type}
                      href={buildUrl({ type: sp.type === type ? '' : type })}
                      className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        sp.type === type
                          ? 'bg-[#C4582A] text-white'
                          : 'text-[#1C1613] hover:bg-[#F7F0E6]'
                      }`}
                    >
                      {locale === 'ar' ? propertyTypeLabels[type].ar : propertyTypeLabels[type].en}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <p className="text-xs font-semibold text-[#7A6A5E] mb-2 uppercase tracking-wide">
                  {locale === 'ar' ? 'غرف النوم' : 'Bedrooms'}
                </p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((n) => (
                    <Link
                      key={n}
                      href={buildUrl({ bedrooms: sp.bedrooms === String(n) ? '' : String(n) })}
                      className={`px-2.5 py-1 rounded-lg text-sm border transition-colors ${
                        sp.bedrooms === String(n)
                          ? 'bg-[#C4582A] text-white border-[#C4582A]'
                          : 'border-[#EDE0CC] text-[#1C1613] hover:border-[#C4582A]'
                      }`}
                    >
                      {n}+
                    </Link>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <Link
                  href={buildUrl({ instantBook: sp.instantBook === 'true' ? '' : 'true' })}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${
                    sp.instantBook === 'true'
                      ? 'bg-[#C4582A]/10 border-[#C4582A] text-[#C4582A]'
                      : 'border-[#EDE0CC] text-[#1C1613]'
                  }`}
                >
                  <span>{locale === 'ar' ? 'حجز فوري فقط' : 'Instant Book Only'}</span>
                  {sp.instantBook === 'true' && <span>✓</span>}
                </Link>
                <Link
                  href={buildUrl({ bnpl: sp.bnpl === 'true' ? '' : 'true' })}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${
                    sp.bnpl === 'true'
                      ? 'bg-[#C9973A]/10 border-[#C9973A] text-[#C9973A]'
                      : 'border-[#EDE0CC] text-[#1C1613]'
                  }`}
                >
                  <span>{locale === 'ar' ? 'تقسيط متاح' : 'BNPL Available'}</span>
                  {sp.bnpl === 'true' && <span>✓</span>}
                </Link>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Sort + results count + map toggle */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[#7A6A5E]">
                {listings.length} {locale === 'ar' ? 'نتيجة' : 'results'}
              </p>
              <div className="flex items-center gap-2">
                <MapToggle locale={locale} isMapView={sp.view === 'map'} />
                <SortSelect
                  locale={locale}
                  currentSort={sp.sort ?? ''}
                  searchParams={Object.fromEntries(
                    Object.entries(sp).filter(([, v]) => v != null) as [string, string][]
                  )}
                />
              </div>
            </div>

            {/* Map view — Airbnb-style split: list left, map right */}
            {sp.view === 'map' && listings.length > 0 ? (
              <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
                {/* Scrollable listing list */}
                <div className="w-full lg:w-[45%] flex-shrink-0 overflow-y-auto space-y-3 pr-2">
                  {listings.map((listing) => {
                    const cardData: ListingCardData = {
                      id: listing.id,
                      titleAr: listing.titleAr,
                      titleEn: listing.titleEn,
                      governorate: listing.governorate,
                      city: listing.city,
                      compound: listing.compound,
                      pricePerNight: Number(listing.pricePerNight),
                      averageRating: listing.averageRating,
                      totalBookings: listing.totalBookings,
                      images: listing.images.map((img: any) => ({ url: img.url, isCover: img.isCover })),
                      bnplEnabled: listing.bnplEnabled,
                      instantBook: listing.instantBook,
                      host: listing.host,
                      propertyType: listing.propertyType,
                    }
                    return <ListingCard key={listing.id} listing={cardData} locale={locale} />
                  })}
                </div>
                {/* Sticky map */}
                <div className="hidden lg:block flex-1 rounded-2xl overflow-hidden border border-[#EDE0CC] sticky top-20" style={{ height: 'calc(100vh-180px)' }}>
                  <ListingsMapWrapper
                    listings={listings.map((l: any) => ({
                      id: l.id,
                      titleAr: l.titleAr,
                      titleEn: l.titleEn,
                      governorate: l.governorate,
                      city: l.city,
                      compound: l.compound,
                      pricePerNight: Number(l.pricePerNight),
                      averageRating: l.averageRating,
                      latitude: l.latitude,
                      longitude: l.longitude,
                      images: l.images.map((img: any) => ({ url: img.url, isCover: img.isCover })),
                      propertyType: l.propertyType,
                    }))}
                    locale={locale}
                  />
                </div>
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {listings.map((listing) => {
                  const cardData: ListingCardData = {
                    id: listing.id,
                    titleAr: listing.titleAr,
                    titleEn: listing.titleEn,
                    governorate: listing.governorate,
                    city: listing.city,
                    compound: listing.compound,
                    pricePerNight: Number(listing.pricePerNight),
                    averageRating: listing.averageRating,
                    totalBookings: listing.totalBookings,
                    images: listing.images.map((img: any) => ({
                      url: img.url,
                      isCover: img.isCover,
                    })),
                    bnplEnabled: listing.bnplEnabled,
                    instantBook: listing.instantBook,
                    host: listing.host,
                    propertyType: listing.propertyType,
                  }
                  return (
                    <ListingCard key={listing.id} listing={cardData} locale={locale} />
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-[#F7F0E6] flex items-center justify-center text-4xl mb-5">
                  🔍
                </div>
                <h3
                  className="text-[#1C1613] mb-2"
                  style={isRTL
                    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200, fontSize: '1.25rem' }
                    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '1rem' }
                  }
                >
                  {locale === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                </h3>
                <p className="text-[#7A6A5E] text-sm mb-7 max-w-xs" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {locale === 'ar'
                    ? 'جرب تعديل البحث أو تصفح كل الأماكن المتاحة'
                    : 'Try adjusting your search or browse all available places'}
                </p>
                <Link
                  href={`/${locale}/listings`}
                  className="inline-flex items-center px-6 py-2.5 bg-[#1C1613] text-white rounded-full text-sm hover:bg-[#C4582A] transition-colors"
                  style={isRTL
                    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 300 }
                    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.78rem' }
                  }
                >
                  {locale === 'ar' ? 'عرض كل الأماكن' : 'Browse all listings'}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
