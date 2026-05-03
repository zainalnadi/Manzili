import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { differenceInDays, format, parseISO } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { BookingConfirmClient } from './BookingConfirmClient'
import { AuthGuard } from '@/components/shared/AuthGuard'

function formatEGP(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency', currency: 'EGP', maximumFractionDigits: 0,
  }).format(amount)
}

export default async function BookingConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; listingId: string }>
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string; adults?: string; children?: string; payment?: string; valuMonths?: string }>
}) {
  const { locale, listingId } = await params
  const sp = await searchParams
  const isRTL = locale === 'ar'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <AuthGuard locale={locale}>
        <div />
      </AuthGuard>
    )
  }

  if (!sp.checkIn || !sp.checkOut) redirect(`/${locale}/listings/${listingId}`)

  const listing = await prisma.listing.findUnique({
    where: { id: listingId, status: 'ACTIVE' },
    include: {
      images: { take: 1, orderBy: { order: 'asc' } },
      host: { select: { fullNameAr: true, fullNameEn: true } },
    },
  })
  if (!listing) notFound()

  const checkIn = parseISO(sp.checkIn!)
  const checkOut = parseISO(sp.checkOut!)
  const nights = differenceInDays(checkOut, checkIn)
  const adults = Number(sp.adults ?? sp.guests ?? 2)
  const children = Number(sp.children ?? 0)

  if (nights <= 0) redirect(`/${locale}/listings/${listingId}`)

  // Per-day pricing overrides
  const overrides = await prisma.pricingOverride.findMany({
    where: { listingId, date: { gte: checkIn, lt: checkOut } },
  })
  const overrideMap = new Map(overrides.map((o: typeof overrides[number]) => [format(o.date, 'yyyy-MM-dd'), Number(o.price)]))

  let nightlyTotal = 0
  for (let i = 0; i < nights; i++) {
    const d = new Date(checkIn)
    d.setDate(d.getDate() + i)
    nightlyTotal += overrideMap.get(format(d, 'yyyy-MM-dd')) ?? Number(listing.pricePerNight)
  }

  const cleaningFee = Number(listing.cleaningFee ?? 0)
  const serviceFee = Math.round((nightlyTotal + cleaningFee) * 0.10)
  const total = nightlyTotal + cleaningFee + serviceFee

  const title = locale === 'ar' ? listing.titleAr : listing.titleEn
  const coverImage = listing.images[0]?.url

  const headingStyle = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200 }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' as const }

  const cancellationLabel: Record<string, { ar: string; en: string }> = {
    FLEXIBLE: { ar: 'إلغاء مجاني حتى 24 ساعة من الوصول', en: 'Free cancellation up to 24h before check-in' },
    MODERATE: { ar: 'إلغاء مجاني حتى 5 أيام من الوصول', en: 'Free cancellation up to 5 days before check-in' },
    STRICT:   { ar: 'غير قابل للاسترداد', en: 'Non-refundable' },
  }
  const cancelText = cancellationLabel[listing.cancellationPolicy] ?? cancellationLabel.MODERATE

  return (
    <div
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Back link */}
      <Link
        href={`/${locale}/listings/${listingId}`}
        className="inline-flex items-center gap-1 text-xs text-[#7A6A5E] hover:text-[#C4582A] transition-colors mb-6"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {locale === 'ar' ? 'العودة للعقار' : 'Back to listing'}
      </Link>

      <h1 className="text-2xl text-[#1C1613] mb-8" style={headingStyle}>
        {locale === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ─── Left ── listing + breakdown ─────────────────────── */}
        <div className="space-y-4">
          {/* Listing card */}
          <div
            className="flex gap-3 p-4 bg-white border border-[#EDE0CC] rounded-2xl"
            style={{ boxShadow: '0 2px 12px rgba(28,22,19,0.06)' }}
          >
            {coverImage && (
              <div className="relative w-24 h-20 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={coverImage} alt={title ?? ''} fill className="object-cover" sizes="96px" />
              </div>
            )}
            <div className="min-w-0 flex flex-col justify-between">
              <div>
                <p className="font-medium text-[#1C1613] text-sm line-clamp-2 leading-snug">{title}</p>
                <p className="text-xs text-[#7A6A5E] mt-1">{listing.city}, {listing.governorate}</p>
              </div>
              <p className="text-[10px] text-[#9A8878]">
                {locale === 'ar' ? 'المضيف: ' : 'Host: '}
                {locale === 'ar' ? listing.host.fullNameAr : listing.host.fullNameEn}
              </p>
            </div>
          </div>

          {/* Trip dates */}
          <div className="bg-[#F7F0E6] rounded-2xl p-4 space-y-2.5 text-sm">
            <p className="text-[10px] font-bold text-[#7A6A5E] uppercase tracking-widest"
              style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
              {locale === 'ar' ? 'تفاصيل الرحلة' : 'Trip Details'}
            </p>
            <div className="flex justify-between">
              <span className="text-[#7A6A5E]">{locale === 'ar' ? 'تسجيل الدخول' : 'Check-in'}</span>
              <span className="font-medium text-[#1C1613]">
                {format(checkIn, 'EEE, d MMM yyyy').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A6A5E]">{locale === 'ar' ? 'تسجيل الخروج' : 'Check-out'}</span>
              <span className="font-medium text-[#1C1613]">
                {format(checkOut, 'EEE, d MMM yyyy').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A6A5E]">{locale === 'ar' ? 'الضيوف' : 'Guests'}</span>
              <span className="font-medium text-[#1C1613]">
                {adults + children} {locale === 'ar' ? 'ضيف' : adults + children === 1 ? 'guest' : 'guests'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A6A5E]">{locale === 'ar' ? 'المدة' : 'Duration'}</span>
              <span className="font-medium text-[#1C1613]">
                {nights} {locale === 'ar' ? 'ليلة' : nights === 1 ? 'night' : 'nights'}
              </span>
            </div>
          </div>

          {/* Price breakdown */}
          <div
            className="bg-white border border-[#EDE0CC] rounded-2xl p-4 space-y-2 text-sm"
            style={{ boxShadow: '0 2px 12px rgba(28,22,19,0.06)' }}
          >
            <p className="text-[10px] font-bold text-[#7A6A5E] uppercase tracking-widest mb-3"
              style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
              {locale === 'ar' ? 'تفاصيل السعر' : 'Price Breakdown'}
            </p>
            <div className="flex justify-between text-[#7A6A5E]">
              <span>
                {formatEGP(Number(listing.pricePerNight), locale)} × {nights}{' '}
                {locale === 'ar' ? 'ليلة' : nights === 1 ? 'night' : 'nights'}
              </span>
              <span>{formatEGP(nightlyTotal, locale)}</span>
            </div>
            {cleaningFee > 0 && (
              <div className="flex justify-between text-[#7A6A5E]">
                <span>{locale === 'ar' ? 'رسوم التنظيف' : 'Cleaning fee'}</span>
                <span>{formatEGP(cleaningFee, locale)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#7A6A5E]">
              <span>{locale === 'ar' ? 'رسوم الخدمة (10%)' : 'Service fee (10%)'}</span>
              <span>{formatEGP(serviceFee, locale)}</span>
            </div>
            <div className="border-t border-[#EDE0CC] pt-2.5 flex justify-between font-bold text-[#1C1613]">
              <span>{locale === 'ar' ? 'المجموع' : 'Total'}</span>
              <span style={{ color: '#C4582A' }}>{formatEGP(total, locale)}</span>
            </div>
          </div>

          {/* Cancellation policy */}
          <div className="flex items-start gap-2 text-xs text-[#7A6A5E] px-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0 mt-0.5 text-[#8FA68B]">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            {locale === 'ar' ? cancelText.ar : cancelText.en}
          </div>
        </div>

        {/* ─── Right ── payment + confirm ──────────────────────── */}
        <BookingConfirmClient
          locale={locale}
          listingId={listingId}
          checkIn={sp.checkIn!}
          checkOut={sp.checkOut!}
          adults={adults}
          children={children}
          instantBook={listing.instantBook}
          bnplEnabled={listing.bnplEnabled}
          total={total}
          initialPayment={sp.payment ?? 'CARD'}
          initialValuMonths={sp.valuMonths ? Number(sp.valuMonths) : 6}
        />
      </div>
    </div>
  )
}
