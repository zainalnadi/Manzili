import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'

function formatEGP(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency', currency: 'EGP', maximumFractionDigits: 0,
  }).format(amount)
}

export default async function BookingConfirmedPage({
  params,
}: {
  params: Promise<{ locale: string; bookingId: string }>
}) {
  const { locale, bookingId } = await params
  const isRTL = locale === 'ar'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        include: { images: { take: 1, orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!booking || booking.guestId !== user.id) notFound()

  const title = locale === 'ar' ? booking.listing.titleAr : booking.listing.titleEn
  const coverImage = booking.listing.images[0]?.url
  const reference = `MNZ-${bookingId.slice(0, 6).toUpperCase()}`
  const isInstant = booking.status === 'CONFIRMED'

  const headingStyle = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200 }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' as const }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      <div className="w-full max-w-md">
        {/* Animated checkmark */}
        <div className="flex justify-center mb-8">
          <div className="relative w-24 h-24">
            <svg
              width="96"
              height="96"
              viewBox="0 0 96 96"
              fill="none"
              className="absolute inset-0"
            >
              {/* Circle */}
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="#EDE0CC"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="#C4582A"
                strokeWidth="2"
                fill="none"
                strokeDasharray="276.46"
                strokeDashoffset="276.46"
                strokeLinecap="round"
                style={{
                  animation: 'draw-circle 600ms cubic-bezier(0.23,1,0.32,1) 100ms both',
                  transformOrigin: 'center',
                  transform: 'rotate(-90deg)',
                }}
              />
              {/* Checkmark */}
              <path
                d="M28 50 L42 64 L68 36"
                stroke="#C4582A"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray="60"
                strokeDashoffset="60"
                style={{
                  animation: 'draw-check 400ms cubic-bezier(0.23,1,0.32,1) 600ms both',
                }}
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl text-[#1C1613] mb-2" style={headingStyle}>
            {isInstant
              ? (locale === 'ar' ? 'تم تأكيد الحجز!' : 'Booking Confirmed!')
              : (locale === 'ar' ? 'تم إرسال الطلب!' : 'Request Sent!')
            }
          </h1>
          <p className="text-sm text-[#7A6A5E] max-w-xs mx-auto leading-relaxed">
            {isInstant
              ? (locale === 'ar'
                  ? 'حجزك مؤكد. ستصلك رسالة بالتفاصيل على بريدك الإلكتروني.'
                  : 'Your booking is confirmed. A summary has been sent to your email.')
              : (locale === 'ar'
                  ? 'أرسلنا طلبك للمضيف. سيتم الرد خلال 24 ساعة.'
                  : "We've sent your request to the host. They'll respond within 24 hours.")
            }
          </p>
        </div>

        {/* Reference badge */}
        <div className="flex justify-center mb-8">
          <div
            className="px-5 py-2.5 rounded-full"
            style={{ background: 'rgba(196,88,42,0.08)', border: '1px solid rgba(196,88,42,0.2)' }}
          >
            <span className="text-xs text-[#7A6A5E]"
              style={{ fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '0.1em' }}>
              {locale === 'ar' ? 'رقم الحجز' : 'Reference'}
            </span>
            <span
              className="ms-2 text-sm font-bold"
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 100,
                letterSpacing: '0.2em',
                color: '#C4582A',
              }}
            >
              {reference}
            </span>
          </div>
        </div>

        {/* Summary card */}
        <div
          className="bg-white border border-[#EDE0CC] rounded-2xl overflow-hidden mb-8"
          style={{ boxShadow: '0 4px 24px rgba(28,22,19,0.08)' }}
        >
          {/* Listing image */}
          {coverImage && (
            <div className="relative w-full h-40">
              <Image src={coverImage} alt={title ?? ''} fill className="object-cover" sizes="(max-width: 448px) 100vw, 448px" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(28,22,19,0.4) 0%, transparent 60%)' }} />
              <div className="absolute bottom-3 start-4 text-white">
                <p className="text-sm font-medium line-clamp-1">{title}</p>
                <p className="text-xs opacity-80">{booking.listing.city}, {booking.listing.governorate}</p>
              </div>
            </div>
          )}
          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#7A6A5E]">{locale === 'ar' ? 'تسجيل الدخول' : 'Check-in'}</span>
              <span className="font-medium text-[#1C1613]">
                {format(new Date(booking.checkIn), 'EEE, d MMM yyyy').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A6A5E]">{locale === 'ar' ? 'تسجيل الخروج' : 'Check-out'}</span>
              <span className="font-medium text-[#1C1613]">
                {format(new Date(booking.checkOut), 'EEE, d MMM yyyy').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A6A5E]">{locale === 'ar' ? 'الضيوف' : 'Guests'}</span>
              <span className="font-medium text-[#1C1613]">
                {booking.adultsCount + booking.childrenCount}
              </span>
            </div>
            <div className="border-t border-[#EDE0CC] pt-3 flex justify-between font-bold">
              <span className="text-[#1C1613]">{locale === 'ar' ? 'المجموع' : 'Total'}</span>
              <span style={{ color: '#C4582A' }}>{formatEGP(Number(booking.totalGuestPays), locale)}</span>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/${locale}/bookings`}
            className="flex-1 text-center py-3.5 text-white rounded-full text-sm transition-all active:scale-[0.98]"
            style={{
              background: '#C4582A',
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 100,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              boxShadow: '0 4px 16px rgba(196,88,42,0.25)',
            }}
          >
            {locale === 'ar' ? 'حجوزاتي' : 'My Bookings'}
          </Link>
          <Link
            href={`/${locale}`}
            className="flex-1 text-center py-3.5 rounded-full text-sm transition-all active:scale-[0.98]"
            style={{
              border: '1.5px solid rgba(122,106,94,0.25)',
              color: '#7A6A5E',
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 100,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {locale === 'ar' ? 'الصفحة الرئيسية' : 'Back to Home'}
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes draw-circle {
          from { stroke-dashoffset: 276.46; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes draw-check {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}
