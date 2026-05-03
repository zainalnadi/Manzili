import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatEGP } from '@/lib/utils/format'
import Link from 'next/link'
import { Plus, Edit2, Pause, Play, CalendarDays, Home } from 'lucide-react'
import Image from 'next/image'

export default async function HostListingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isRTL = locale === 'ar'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || !['HOST', 'PROPERTY_MANAGER', 'ADMIN'].includes(dbUser.role)) {
    redirect(`/${locale}`)
  }

  const listings = await prisma.listing.findMany({
    where: { hostId: user.id },
    include: { images: { take: 1, orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })

  const statusConfig: Record<string, { labelAr: string; labelEn: string; bg: string; text: string }> = {
    DRAFT:          { labelAr: 'مسودة',          labelEn: 'Draft',          bg: '#F3F2EF', text: '#7A6A5E' },
    PENDING_REVIEW: { labelAr: 'قيد المراجعة',   labelEn: 'Pending Review', bg: '#FDF3E0', text: '#C9973A' },
    ACTIVE:         { labelAr: 'نشط',             labelEn: 'Active',         bg: '#E6F4F1', text: '#8FA68B' },
    PAUSED:         { labelAr: 'موقوف مؤقتاً',   labelEn: 'Paused',         bg: '#E8F2F8', text: '#C4582A' },
    REJECTED:       { labelAr: 'مرفوض',           labelEn: 'Rejected',       bg: '#FDECEA', text: '#C4582A' },
  }

  const headingStyle = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200 }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' as const }

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl text-[#1C1613]" style={headingStyle}>
            {locale === 'ar' ? 'إعلاناتي' : 'My Listings'}
          </h1>
          <p className="text-[#7A6A5E] text-sm mt-0.5">
            {locale === 'ar'
              ? `${listings.length} إعلان`
              : `${listings.length} listing${listings.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href={`/${locale}/host/listings/new`}
          className="flex items-center gap-2 bg-[#1C1613] hover:bg-[#C4582A] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          {locale === 'ar' ? 'إضافة إعلان' : 'Add Listing'}
        </Link>
      </div>

      {/* Empty state */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F7F0E6] flex items-center justify-center mb-5">
            <Home className="w-8 h-8 text-[#D0C8BE]" />
          </div>
          <h2 className="text-lg text-[#1C1613] mb-2" style={headingStyle}>
            {locale === 'ar' ? 'لا توجد إعلانات بعد' : 'No listings yet'}
          </h2>
          <p className="text-[#7A6A5E] text-sm mb-6 max-w-xs">
            {locale === 'ar'
              ? 'أضف أول إعلان لك وابدأ في استقبال الحجوزات'
              : 'Create your first listing and start accepting bookings'}
          </p>
          <Link
            href={`/${locale}/host/listings/new`}
            className="flex items-center gap-2 bg-[#C4582A] hover:bg-[#155a82] text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            {locale === 'ar' ? 'إنشاء أول إعلان' : 'Create your first listing'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => {
            const title = locale === 'ar' ? listing.titleAr : listing.titleEn
            const coverImage = listing.images[0]?.url ?? null
            const status = listing.status
            const cfg = statusConfig[status] ?? statusConfig.DRAFT
            const isActive = status === 'ACTIVE'
            const isPaused = status === 'PAUSED'
            const canToggle = isActive || isPaused

            return (
              <div
                key={listing.id}
                className="bg-white border border-[#EDE0CC] rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Cover image */}
                <div className="relative h-44 bg-[#F7F0E6] flex-shrink-0">
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-10 h-10 text-[#D0C8BE]" />
                    </div>
                  )}
                  {/* Status badge */}
                  <span
                    className="absolute top-3 start-3 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: cfg.bg, color: cfg.text }}
                  >
                    {locale === 'ar' ? cfg.labelAr : cfg.labelEn}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-[#1C1613] text-base leading-snug mb-1 line-clamp-2" style={headingStyle}>
                    {title}
                  </h3>
                  <p className="text-sm text-[#7A6A5E] mb-1">
                    {listing.city}, {listing.governorate}
                  </p>
                  <p className="text-[#C9973A] font-bold text-sm mb-4">
                    {formatEGP(Number(listing.pricePerNight), locale)}
                    <span className="text-[#7A6A5E] font-normal">
                      {locale === 'ar' ? ' / ليلة' : ' / night'}
                    </span>
                  </p>

                  {/* Action buttons */}
                  <div className="mt-auto flex items-center gap-2 flex-wrap">
                    {/* Edit */}
                    <Link
                      href={`/${locale}/host/listings/${listing.id}/edit`}
                      className="flex items-center gap-1.5 text-xs font-medium bg-[#F7F0E6] hover:bg-[#EDE0CC] text-[#1C1613] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      {locale === 'ar' ? 'تعديل' : 'Edit'}
                    </Link>

                    {/* Pause / Activate toggle */}
                    {canToggle && (
                      <form action={`/api/host/listings/${listing.id}`} method="POST">
                        <input type="hidden" name="_method" value="PATCH" />
                        <input
                          type="hidden"
                          name="status"
                          value={isActive ? 'PAUSED' : 'ACTIVE'}
                        />
                        <button
                          type="submit"
                          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-[#E8F2F8] hover:bg-[#d4e9f5] text-[#C4582A]'
                              : 'bg-[#E6F4F1] hover:bg-[#d0ece8] text-[#8FA68B]'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              {locale === 'ar' ? 'إيقاف مؤقت' : 'Pause'}
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              {locale === 'ar' ? 'تفعيل' : 'Activate'}
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* Calendar */}
                    <Link
                      href={`/${locale}/host/calendar/${listing.id}`}
                      className="flex items-center gap-1.5 text-xs font-medium bg-[#F7F0E6] hover:bg-[#EDE0CC] text-[#1C1613] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      {locale === 'ar' ? 'التقويم' : 'Calendar'}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
