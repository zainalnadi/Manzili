import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatEGP } from '@/lib/utils/format'
import Image from 'next/image'
import Link from 'next/link'
import { TripsClient } from './TripsClient'

export default async function TripsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isRTL = locale === 'ar'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const now = new Date()

  const bookings = await prisma.booking.findMany({
    where: { guestId: user.id },
    include: {
      listing: {
        select: {
          titleAr: true, titleEn: true,
          governorate: true, city: true,
          images: { take: 1, orderBy: { order: 'asc' } },
          cancellationPolicy: true,
        },
      },
      review: { select: { id: true } },
    },
    orderBy: { checkIn: 'desc' },
  })

  const upcoming = bookings.filter((b) => new Date(b.checkOut) >= now && !['CANCELLED', 'REJECTED'].includes(b.status))
  const past = bookings.filter((b) => new Date(b.checkOut) < now || ['CANCELLED', 'REJECTED'].includes(b.status))

  const statusLabels: Record<string, { ar: string; en: string; color: string }> = {
    PENDING:    { ar: 'في الانتظار', en: 'Pending',    color: '#C9973A' },
    CONFIRMED:  { ar: 'مؤكد',       en: 'Confirmed',  color: '#8FA68B' },
    CHECKED_IN: { ar: 'في العقار',  en: 'Checked In', color: '#C4582A' },
    COMPLETED:  { ar: 'مكتمل',      en: 'Completed',  color: '#7A6A5E' },
    CANCELLED:  { ar: 'ملغي',       en: 'Cancelled',  color: '#9A8878' },
    REJECTED:   { ar: 'مرفوض',      en: 'Rejected',   color: '#9A8878' },
  }

  const headingStyle = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200 }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' as const }

  function BookingCard({ b }: { b: typeof bookings[0] }) {
    const title = locale === 'ar' ? b.listing.titleAr : b.listing.titleEn
    const image = b.listing.images[0]?.url ?? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80'
    const sl = statusLabels[b.status] ?? statusLabels.PENDING
    const isUpcoming = new Date(b.checkOut) >= now && !['CANCELLED', 'REJECTED'].includes(b.status)
    const canReview = !isUpcoming && b.status === 'COMPLETED' && !b.review
    const canCancel = isUpcoming && ['PENDING', 'CONFIRMED'].includes(b.status)

    return (
      <div className="bg-white border border-[#EDE0CC] rounded-xl overflow-hidden flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-44 h-44 flex-shrink-0">
          <Image src={image} alt={title ?? ''} fill className="object-cover" sizes="176px" />
        </div>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="text-[#1C1613] text-sm line-clamp-1" style={headingStyle}>{title}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 whitespace-nowrap"
                style={{ backgroundColor: `${sl.color}18`, color: sl.color }}>
                {locale === 'ar' ? sl.ar : sl.en}
              </span>
            </div>
            <p className="text-xs text-[#7A6A5E] mb-2">{b.listing.governorate}, {b.listing.city}</p>
            <p className="text-xs text-[#1C1613]">
              {new Date(b.checkIn).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB')}
              {' → '}
              {new Date(b.checkOut).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB')}
              {' · '}
              {b.nights} {locale === 'ar' ? 'ليلة' : b.nights === 1 ? 'night' : 'nights'}
              {' · '}
              {b.adultsCount + b.childrenCount} {locale === 'ar' ? 'ضيوف' : 'guests'}
            </p>
          </div>
          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <p className="font-bold text-[#1C1613]">{formatEGP(Number(b.totalGuestPays), locale)}</p>
            <div className="flex gap-2 flex-wrap">
              <Link href={`/${locale}/listings/${b.listingId}`}
                className="text-xs text-[#7A6A5E] border border-[#EDE0CC] px-3 py-1.5 rounded-lg hover:bg-[#F7F0E6] transition-colors">
                {locale === 'ar' ? 'عرض العقار' : 'View listing'}
              </Link>
              {canReview && (
                <Link href={`/${locale}/bookings/${b.id}/review`}
                  className="text-xs text-[#C4582A] border border-[#C4582A]/30 px-3 py-1.5 rounded-lg hover:bg-[#C4582A]/5 transition-colors">
                  {locale === 'ar' ? 'اكتب تقييم' : 'Leave a review'}
                </Link>
              )}
              {canCancel && (
                <TripsClient bookingId={b.id} locale={locale} policy={b.listing.cancellationPolicy} checkIn={b.checkIn.toISOString()} />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Outfit, sans-serif' }}>
      <h1 className="text-2xl text-[#1C1613] mb-8" style={headingStyle}>
        {locale === 'ar' ? 'رحلاتي' : 'My Trips'}
      </h1>

      {/* Upcoming */}
      <div className="mb-10">
        <h2 className="text-sm text-[#7A6A5E] mb-4"
          style={{ ...headingStyle, fontSize: '0.75rem' }}>
          {locale === 'ar' ? `القادمة (${upcoming.length})` : `Upcoming (${upcoming.length})`}
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-[#F7F0E6] rounded-xl p-8 text-center">
            <p className="text-[#7A6A5E] text-sm mb-4">
              {locale === 'ar' ? 'لا توجد رحلات قادمة' : 'No upcoming trips'}
            </p>
            <Link href={`/${locale}/listings`}
              className="inline-block bg-[#C4582A] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#A8471F] transition-colors">
              {locale === 'ar' ? 'استكشف العقارات' : 'Explore Listings'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((b) => <BookingCard key={b.id} b={b} />)}
          </div>
        )}
      </div>

      {/* Past */}
      <div>
        <h2 className="text-sm text-[#7A6A5E] mb-4"
          style={{ ...headingStyle, fontSize: '0.75rem' }}>
          {locale === 'ar' ? `السابقة (${past.length})` : `Past (${past.length})`}
        </h2>
        {past.length === 0 ? (
          <p className="text-[#7A6A5E] text-sm py-4">{locale === 'ar' ? 'لا توجد رحلات سابقة' : 'No past trips'}</p>
        ) : (
          <div className="space-y-4">
            {past.map((b) => <BookingCard key={b.id} b={b} />)}
          </div>
        )}
      </div>
    </div>
  )
}
