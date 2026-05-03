import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { formatEGP, formatDate } from '@/lib/utils/format'
import Image from 'next/image'
import Link from 'next/link'
import {
  CalendarDays,
  MapPin,
  MessageCircle,
  Star,
  ChevronRight,
  ChevronLeft,
  Moon,
} from 'lucide-react'

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { ar: string; en: string; color: string; bg: string }> = {
  PENDING:    { ar: 'في الانتظار', en: 'Pending',    color: '#C9973A', bg: '#C9973A18' },
  CONFIRMED:  { ar: 'مؤكد',       en: 'Confirmed',  color: '#8FA68B', bg: '#8FA68B18' },
  CHECKED_IN: { ar: 'في العقار',  en: 'Checked In', color: '#C4582A', bg: '#C4582A18' },
  COMPLETED:  { ar: 'مكتمل',      en: 'Completed',  color: '#7A6A5E', bg: '#7A6A5E18' },
  CANCELLED:  { ar: 'ملغي',       en: 'Cancelled',  color: '#C4582A', bg: '#C4582A18' },
  REJECTED:   { ar: 'مرفوض',      en: 'Rejected',   color: '#C4582A', bg: '#C4582A18' },
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const isRTL = locale === 'ar'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: {
        include: {
          images: { take: 1, orderBy: { order: 'asc' } },
        },
      },
      review: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          sender: {
            select: { id: true, fullNameAr: true, fullNameEn: true, avatarUrl: true },
          },
        },
      },
    },
  })

  if (!booking || booking.guestId !== user.id) notFound()

  const title = locale === 'ar' ? booking.listing.titleAr : booking.listing.titleEn
  const coverImage = booking.listing.images[0]?.url ?? null
  const statusMeta = STATUS_META[booking.status] ?? STATUS_META.PENDING
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status)
  const canReview = booking.status === 'COMPLETED' && !booking.review

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight

  return (
    <div
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Back link */}
      <Link
        href={`/${locale}/bookings`}
        className="inline-flex items-center gap-1.5 text-sm text-[#C4582A] hover:underline mb-6"
      >
        {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        {locale === 'ar' ? 'حجوزاتي' : 'My Bookings'}
      </Link>

      {/* Listing card */}
      <div className="bg-white border border-[#EDE0CC] rounded-2xl overflow-hidden mb-6">
        <div className="flex gap-4 p-4">
          {/* Thumbnail */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-[#F7F0E6]">
            {coverImage ? (
              <Image
                src={coverImage}
                alt={title}
                fill
                sizes="128px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-3xl">🏠</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/${locale}/listings/${booking.listingId}`}
                className="font-semibold text-[#1C1613] hover:text-[#C4582A] line-clamp-2 leading-snug"
              >
                {title}
              </Link>
              {/* Status badge */}
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}
              >
                {locale === 'ar' ? statusMeta.ar : statusMeta.en}
              </span>
            </div>

            <div className="flex items-center gap-1 mt-1.5 text-[#7A6A5E] text-xs">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {[booking.listing.compound, booking.listing.city, booking.listing.governorate]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-1.5 mt-2 text-sm text-[#1C1613]">
              <CalendarDays className="w-4 h-4 text-[#C4582A] flex-shrink-0" />
              <span>
                {formatDate(booking.checkIn, locale)}
                <span className="mx-1.5 text-[#7A6A5E]">→</span>
                {formatDate(booking.checkOut, locale)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1 text-sm text-[#7A6A5E]">
              <Moon className="w-4 h-4 flex-shrink-0" />
              <span>
                {booking.nights}{' '}
                {locale === 'ar'
                  ? booking.nights === 1 ? 'ليلة' : 'ليالٍ'
                  : booking.nights === 1 ? 'night' : 'nights'}
              </span>
              <span className="mx-1">·</span>
              <span>
                {booking.adultsCount + booking.childrenCount}{' '}
                {locale === 'ar' ? 'ضيف' : 'guests'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="bg-white border border-[#EDE0CC] rounded-2xl p-5 mb-6">
        <h2 className="font-semibold text-[#1C1613] mb-4">
          {locale === 'ar' ? 'تفاصيل السعر' : 'Price Breakdown'}
        </h2>

        <div className="space-y-3 text-sm">
          {/* Nightly total */}
          <div className="flex items-center justify-between">
            <span className="text-[#1C1613]">
              {locale === 'ar'
                ? `إجمالي الليالي (${booking.nights} ليلة)`
                : `Nightly total (${booking.nights} ${booking.nights === 1 ? 'night' : 'nights'})`}
            </span>
            <span className="font-medium text-[#1C1613]">
              {formatEGP(Number(booking.nightlyTotal), locale)}
            </span>
          </div>

          {/* Cleaning fee */}
          {Number(booking.cleaningFee) > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[#1C1613]">
                {locale === 'ar' ? 'رسوم التنظيف' : 'Cleaning fee'}
              </span>
              <span className="font-medium text-[#1C1613]">
                {formatEGP(Number(booking.cleaningFee), locale)}
              </span>
            </div>
          )}

          {/* Service fee */}
          <div className="flex items-center justify-between">
            <span className="text-[#1C1613]">
              {locale === 'ar' ? 'رسوم الخدمة' : 'Service fee'}
            </span>
            <span className="font-medium text-[#1C1613]">
              {formatEGP(Number(booking.serviceFeeGuest), locale)}
            </span>
          </div>

          {/* Discount */}
          {booking.discountAmount && Number(booking.discountAmount) > 0 && (
            <div className="flex items-center justify-between text-[#8FA68B]">
              <span>
                {locale === 'ar'
                  ? `خصم${booking.promoCode ? ` (${booking.promoCode})` : ''}`
                  : `Discount${booking.promoCode ? ` (${booking.promoCode})` : ''}`}
              </span>
              <span className="font-medium">
                -{formatEGP(Number(booking.discountAmount), locale)}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-[#EDE0CC] pt-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1C1613]">
                {locale === 'ar' ? 'الإجمالي' : 'Total'}
              </span>
              <span className="font-bold text-[#1C1613] text-base">
                {formatEGP(Number(booking.totalGuestPays), locale)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Leave a review */}
        {canReview && (
          <Link
            href={`/${locale}/bookings/${booking.id}/review`}
            className="inline-flex items-center gap-2 bg-[#C9973A] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#b3852f] transition-colors text-sm"
          >
            <Star className="w-4 h-4" />
            {locale === 'ar' ? 'اكتب تقييماً' : 'Leave a Review'}
          </Link>
        )}

        {/* Messages */}
        <Link
          href={`/${locale}/messages/${booking.id}`}
          className="inline-flex items-center gap-2 border border-[#C4582A] text-[#C4582A] px-5 py-2.5 rounded-xl font-medium hover:bg-[#C4582A]/5 transition-colors text-sm"
        >
          <MessageCircle className="w-4 h-4" />
          {locale === 'ar' ? 'الرسائل' : 'Messages'}
        </Link>

        {/* Cancel */}
        {canCancel && (
          <form action={`/api/bookings/${booking.id}/cancel`} method="POST">
            <button
              type="submit"
              className="inline-flex items-center gap-2 border border-[#C4582A]/40 text-[#C4582A] px-5 py-2.5 rounded-xl font-medium hover:bg-[#C4582A]/5 transition-colors text-sm"
            >
              {locale === 'ar' ? 'إلغاء الحجز' : 'Cancel Booking'}
            </button>
          </form>
        )}
      </div>

      {/* Review already left */}
      {booking.review && (
        <div className="bg-[#F7F0E6] border border-[#EDE0CC] rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 fill-[#C9973A] text-[#C9973A]" />
            <span className="font-semibold text-[#1C1613] text-sm">
              {locale === 'ar' ? 'تقييمك' : 'Your Review'}
            </span>
            <div className="flex items-center gap-0.5 ms-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < booking.review!.overallRating
                      ? 'fill-[#C9973A] text-[#C9973A]'
                      : 'text-[#EDE0CC]'
                  }`}
                />
              ))}
            </div>
          </div>
          {booking.review.commentAr || booking.review.commentEn ? (
            <p className="text-sm text-[#1C1613] leading-relaxed">
              {locale === 'ar'
                ? booking.review.commentAr ?? booking.review.commentEn
                : booking.review.commentEn ?? booking.review.commentAr}
            </p>
          ) : null}
        </div>
      )}

      {/* Recent messages */}
      {booking.messages.length > 0 && (
        <div className="bg-white border border-[#EDE0CC] rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1C1613]">
              {locale === 'ar' ? 'آخر الرسائل' : 'Recent Messages'}
            </h2>
            <Link
              href={`/${locale}/messages/${booking.id}`}
              className="inline-flex items-center gap-1 text-xs text-[#C4582A] hover:underline"
            >
              {locale === 'ar' ? 'عرض الكل' : 'View all'}
              <ChevronIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {[...booking.messages].reverse().map((msg) => {
              const isMine = msg.senderId === user.id
              const senderName = locale === 'ar'
                ? msg.sender.fullNameAr ?? msg.sender.fullNameEn ?? '—'
                : msg.sender.fullNameEn ?? msg.sender.fullNameAr ?? '—'

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  {!isMine && (
                    <span className="text-xs text-[#7A6A5E] mb-1 px-1">{senderName}</span>
                  )}
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? 'bg-[#C4582A] text-white rounded-br-sm'
                        : 'bg-[#F7F0E6] text-[#1C1613] rounded-bl-sm'
                    }`}
                  >
                    {msg.body}
                  </div>
                  <span className="text-[10px] text-[#7A6A5E] mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString(
                      locale === 'ar' ? 'ar-EG' : 'en-EG',
                      { hour: '2-digit', minute: '2-digit' }
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Map placeholder */}
      {booking.listing.latitude && booking.listing.longitude && (
        <div className="bg-white border border-[#EDE0CC] rounded-2xl overflow-hidden mb-6">
          <div className="p-4 border-b border-[#EDE0CC]">
            <h2 className="font-semibold text-[#1C1613]">
              {locale === 'ar' ? 'الموقع' : 'Location'}
            </h2>
          </div>
          <div className="bg-[#F7F0E6] h-48 flex flex-col items-center justify-center gap-2">
            <MapPin className="w-8 h-8 text-[#C4582A]" />
            <p className="text-sm text-[#7A6A5E]">
              {booking.listing.latitude.toFixed(6)}, {booking.listing.longitude.toFixed(6)}
            </p>
            <a
              href={`https://www.google.com/maps?q=${booking.listing.latitude},${booking.listing.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#C4582A] hover:underline"
            >
              {locale === 'ar' ? 'فتح في خرائط Google' : 'Open in Google Maps'}
            </a>
          </div>
        </div>
      )}

      {/* Booking reference */}
      <div className="text-center text-xs text-[#7A6A5E]">
        {locale === 'ar' ? 'رقم الحجز:' : 'Booking reference:'}{' '}
        <span className="font-mono text-[#1C1613]">{booking.id.slice(0, 8).toUpperCase()}</span>
      </div>
    </div>
  )
}
