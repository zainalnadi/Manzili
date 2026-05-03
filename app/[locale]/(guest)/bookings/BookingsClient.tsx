'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'REJECTED'

type Tab = 'UPCOMING' | 'PAST' | 'CANCELLED'

interface Booking {
  id: string
  status: BookingStatus
  checkIn: string
  checkOut: string
  nights: number
  adultsCount: number
  childrenCount: number
  totalGuestPays: number
  listing: {
    titleAr: string | null
    titleEn: string | null
    governorate: string
    city: string
    image: string | null
  }
}

const STATUS_META: Record<BookingStatus, { ar: string; en: string; color: string; bg: string }> = {
  PENDING:    { ar: 'في الانتظار', en: 'Pending',    color: '#C9963A', bg: 'rgba(201,150,58,0.1)' },
  CONFIRMED:  { ar: 'مؤكد',       en: 'Confirmed',  color: '#8FA68B', bg: 'rgba(143,166,139,0.1)' },
  CHECKED_IN: { ar: 'في العقار',  en: 'Checked In', color: '#C4582A', bg: 'rgba(196,88,42,0.1)' },
  COMPLETED:  { ar: 'مكتمل',      en: 'Completed',  color: '#7A6A5E', bg: 'rgba(122,106,94,0.1)' },
  CANCELLED:  { ar: 'ملغي',       en: 'Cancelled',  color: '#C4582A', bg: 'rgba(196,88,42,0.1)' },
  REJECTED:   { ar: 'مرفوض',      en: 'Rejected',   color: '#C4582A', bg: 'rgba(196,88,42,0.1)' },
}

function formatEGP(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency', currency: 'EGP', maximumFractionDigits: 0,
  }).format(amount)
}

function classifyBooking(b: Booking): Tab {
  if (['CANCELLED', 'REJECTED'].includes(b.status)) return 'CANCELLED'
  if (['COMPLETED'].includes(b.status)) return 'PAST'
  if (b.status === 'CHECKED_IN') return 'UPCOMING'
  // future check-in = UPCOMING, past check-in with non-completed = PAST
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(b.checkOut) > today ? 'UPCOMING' : 'PAST'
}

export function BookingsClient({ locale, bookings }: { locale: string; bookings: Booking[] }) {
  const isRTL = locale === 'ar'
  const [activeTab, setActiveTab] = useState<Tab>('UPCOMING')
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [localBookings, setLocalBookings] = useState(bookings)

  const headingStyle = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200 }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' as const }

  const tabs: { key: Tab; ar: string; en: string }[] = [
    { key: 'UPCOMING', ar: 'القادمة',  en: 'Upcoming' },
    { key: 'PAST',     ar: 'الماضية',  en: 'Past' },
    { key: 'CANCELLED',ar: 'الملغية',  en: 'Cancelled' },
  ]

  const filtered = localBookings.filter((b) => classifyBooking(b) === activeTab)

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/bookings/${cancelTarget}/cancel`, { method: 'POST' })
      if (!res.ok) throw new Error()
      setLocalBookings((prev) =>
        prev.map((b) => b.id === cancelTarget ? { ...b, status: 'CANCELLED' as BookingStatus } : b)
      )
      toast.success(locale === 'ar' ? 'تم إلغاء الحجز' : 'Booking cancelled')
    } catch {
      toast.error(locale === 'ar' ? 'فشل الإلغاء' : 'Cancellation failed')
    } finally {
      setCancelling(false)
      setCancelTarget(null)
    }
  }

  return (
    <div
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Heading */}
      <h1 className="text-2xl text-[#1C1613] mb-8" style={headingStyle}>
        {locale === 'ar' ? 'حجوزاتي' : 'My Bookings'}
      </h1>

      {/* Tabs */}
      <div className="flex border-b border-[#EDE0CC] mb-7 gap-6">
        {tabs.map((t) => {
          const count = localBookings.filter((b) => classifyBooking(b) === t.key).length
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="relative pb-3 text-sm transition-colors flex items-center gap-1.5"
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 100,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: activeTab === t.key ? '#1C1613' : '#9A8878',
              }}
            >
              {locale === 'ar' ? t.ar : t.en}
              {count > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: activeTab === t.key ? 'rgba(196,88,42,0.12)' : 'rgba(122,106,94,0.08)',
                    color: activeTab === t.key ? '#C4582A' : '#9A8878',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 400,
                  }}
                >
                  {count}
                </span>
              )}
              {activeTab === t.key && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#C4582A] rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Booking list */}
      {filtered.length === 0 ? (
        <EmptyState tab={activeTab} locale={locale} />
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              locale={locale}
              onCancel={() => setCancelTarget(b.id)}
            />
          ))}
        </div>
      )}

      {/* Cancel modal */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(28,22,19,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setCancelTarget(null) }}
        >
          <div
            className="bg-white w-full p-6 space-y-5"
            style={{
              maxWidth: 400,
              borderRadius: 20,
              boxShadow: '0 24px 80px rgba(28,22,19,0.2)',
              animation: 'modal-in 200ms cubic-bezier(0.23,1,0.32,1) both',
            }}
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#C4582A]/10 flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4582A" strokeWidth="1.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
              <h3 className="text-[#1C1613] mb-2" style={{ ...headingStyle, fontSize: 16 }}>
                {locale === 'ar' ? 'إلغاء الحجز' : 'Cancel Booking'}
              </h3>
              <p className="text-sm text-[#7A6A5E]">
                {locale === 'ar'
                  ? 'هل أنت متأكد من إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.'
                  : 'Are you sure you want to cancel? This action cannot be undone.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-3 rounded-full text-sm transition-all"
                style={{
                  border: '1.5px solid rgba(122,106,94,0.25)',
                  color: '#7A6A5E',
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 100,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {locale === 'ar' ? 'إلغاء' : 'Go Back'}
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancelling}
                className="flex-1 py-3 rounded-full text-sm text-white transition-all active:scale-[0.98]"
                style={{
                  background: cancelling ? 'rgba(196,88,42,0.45)' : '#C4582A',
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 100,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  boxShadow: !cancelling ? '0 4px 16px rgba(196,88,42,0.25)' : 'none',
                }}
              >
                {cancelling
                  ? (locale === 'ar' ? 'جاري...' : 'Processing...')
                  : (locale === 'ar' ? 'تأكيد الإلغاء' : 'Confirm Cancel')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking, locale, onCancel,
}: {
  booking: Booking
  locale: string
  onCancel: () => void
}) {
  const isRTL = locale === 'ar'
  const title = locale === 'ar' ? booking.listing.titleAr : booking.listing.titleEn
  const sm = STATUS_META[booking.status] ?? STATUS_META.PENDING
  const reference = `MNZ-${booking.id.slice(0, 6).toUpperCase()}`
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status)

  return (
    <div
      className="bg-white border border-[#EDE0CC] rounded-2xl overflow-hidden flex flex-col sm:flex-row"
      style={{ boxShadow: '0 2px 12px rgba(28,22,19,0.06)' }}
    >
      {/* Image */}
      <div className="relative w-full sm:w-32 h-36 sm:h-auto flex-shrink-0 overflow-hidden bg-[#F0E8DC]">
        {booking.listing.image ? (
          <Image
            src={booking.listing.image}
            alt={title ?? ''}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 128px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(122,106,94,0.4)" strokeWidth="1">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between" dir={isRTL ? 'rtl' : 'ltr'}>
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-[#1C1613] text-sm font-medium line-clamp-1 leading-snug">
              {title}
            </h3>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{
                background: sm.bg,
                color: sm.color,
                fontFamily: "'Josefin Sans', sans-serif",
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {locale === 'ar' ? sm.ar : sm.en}
            </span>
          </div>
          <p className="text-xs text-[#9A8878] mb-2">
            {booking.listing.city}, {booking.listing.governorate}
          </p>
          <p className="text-xs text-[#7A6A5E]">
            {format(new Date(booking.checkIn), 'd MMM')} → {format(new Date(booking.checkOut), 'd MMM yyyy')}
            {' · '}
            {booking.nights} {locale === 'ar' ? 'ليلة' : booking.nights === 1 ? 'night' : 'nights'}
            {' · '}
            {booking.adultsCount + booking.childrenCount} {locale === 'ar' ? 'ضيف' : 'guests'}
          </p>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F0E8DC]">
          <div>
            <span
              className="text-xs"
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 100,
                letterSpacing: '0.1em',
                color: '#C4582A',
              }}
            >
              {reference}
            </span>
            <span className="mx-2 text-[#EDE0CC]">·</span>
            <span className="text-sm font-bold text-[#1C1613]">
              {formatEGP(booking.totalGuestPays, locale)}
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/${locale}/bookings/${booking.id}`}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                border: '1px solid rgba(196,88,42,0.3)',
                color: '#C4582A',
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 100,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {locale === 'ar' ? 'التفاصيل' : 'Details'}
            </Link>
            {canCancel && (
              <button
                onClick={onCancel}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  border: '1px solid rgba(196,88,42,0.2)',
                  color: '#9A8878',
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 100,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ tab, locale }: { tab: Tab; locale: string }) {
  const isRTL = locale === 'ar'
  const messages = {
    UPCOMING: {
      ar: { title: 'لا توجد حجوزات قادمة', sub: 'ابحث عن عقارك المثالي وابدأ رحلتك التالية' },
      en: { title: 'No upcoming bookings', sub: 'Find your perfect stay and plan your next trip' },
    },
    PAST: {
      ar: { title: 'لا توجد حجوزات سابقة', sub: 'رحلاتك المكتملة ستظهر هنا' },
      en: { title: 'No past bookings', sub: 'Your completed stays will appear here' },
    },
    CANCELLED: {
      ar: { title: 'لا توجد حجوزات ملغية', sub: '' },
      en: { title: 'No cancelled bookings', sub: '' },
    },
  }
  const msg = messages[tab]
  const { title, sub } = locale === 'ar' ? msg.ar : msg.en

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Arch logomark */}
      <div className="mb-6">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="32" width="48" height="24" rx="4" fill="rgba(237,224,204,0.6)" />
          <path d="M8 32 Q8 8 32 8 Q56 8 56 32" fill="rgba(237,224,204,0.4)" stroke="rgba(196,88,42,0.25)" strokeWidth="1.5" />
          <rect x="24" y="44" width="16" height="12" rx="2" fill="rgba(196,88,42,0.15)" />
        </svg>
      </div>
      <p
        className="text-[#1C1613] mb-2 text-base"
        style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.1em', textTransform: 'uppercase' }}
      >
        {title}
      </p>
      {sub && <p className="text-sm text-[#9A8878] mb-6 max-w-xs">{sub}</p>}
      {tab === 'UPCOMING' && (
        <a
          href={`/${locale}/listings`}
          className="inline-block text-sm text-white px-6 py-3 rounded-full active:scale-[0.98] transition-all"
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
      )}
    </div>
  )
}
