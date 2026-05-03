'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'
import { Calendar, X } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { PriceBreakdown } from './PriceBreakdown'
import { ValUWidget } from './ValUWidget'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store/authStore'
import { useAuthModal } from '@/components/shared/AuthModal'
import { formatEGP } from '@/lib/utils/format'

interface BookingWidgetProps {
  listing: {
    id: string
    pricePerNight: number
    cleaningFee?: number
    weeklyDiscount?: number
    monthlyDiscount?: number
    minimumNights: number
    maximumNights?: number
    maxGuests: number
    instantBook: boolean
    bnplEnabled: boolean
  }
  locale: string
}

const PAYMENT_METHODS = [
  { id: 'CARD',         labelAr: 'بطاقة ائتمانية / خصم',  labelEn: 'Credit / Debit Card',     svgPath: 'M2 6h20v2H2zM2 10h20v2H2zM4 15h4v1H4z' },
  { id: 'FAWRY',        labelAr: 'فوري',                   labelEn: 'Fawry',                    svgPath: 'M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9zm0 4v10M8 12h8' },
  { id: 'VODAFONE_CASH',labelAr: 'فودافون كاش',            labelEn: 'Vodafone Cash',            svgPath: 'M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-5 16a1 1 0 1 1 0-2 1 1 0 0 1 0 2z' },
  { id: 'MEEZA',        labelAr: 'ميزة',                   labelEn: 'Meeza',                    svgPath: 'M3 7h18v10H3zM7 12h2M11 12h2' },
  { id: 'VALU_BNPL',   labelAr: 'فاليو — تقسيط',          labelEn: 'ValU — Installments',      svgPath: 'M3 6h18v2H3zM3 16h18v2H3zM7 11h4v2H7z' },
]

/* DayPicker CSS (injected once) */
const dpStyles = `
  .bw-rdp { --rdp-accent-color: #C4582A; --rdp-accent-background-color: #F0D5C5; --rdp-day-height:36px; --rdp-day-width:36px; font-family:'Outfit',sans-serif; font-size:13px; }
  .bw-rdp .rdp-selected .rdp-day_button { background:#C4582A; color:white; border-radius:999px; }
  .bw-rdp .rdp-today:not(.rdp-selected) .rdp-day_button { color:#C4582A; font-weight:600; }
  .bw-rdp .rdp-day_button:hover:not(:disabled) { background:#F0D5C5; border-radius:999px; }
  .bw-rdp .rdp-nav_button:hover { background:#F0D5C5; }
  .bw-rdp .rdp-month_caption { font-family:'Josefin Sans',sans-serif; font-weight:100; letter-spacing:.12em; text-transform:uppercase; font-size:11px; color:#1C1613; }
  .bw-rdp .rdp-weekday { font-family:'Josefin Sans',sans-serif; font-weight:100; letter-spacing:.08em; text-transform:uppercase; font-size:9px; color:#9A8878; }
`

function DatePopover({
  label, value, onChange, minDate, locale, align = 'start',
}: {
  label: string; value: Date | undefined; onChange: (d: Date | undefined) => void; minDate?: Date; locale: string; align?: 'start' | 'end'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div className="relative flex-1" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-start p-3 hover:bg-[#F7F0E6]/60 transition-colors focus:outline-none"
      >
        <div className="text-[9px] font-bold text-[#1C1613] uppercase tracking-widest mb-1">
          {label}
        </div>
        <div className="text-sm text-[#1C1613] flex items-center justify-between gap-1">
          {value ? (
            <span style={{ fontFamily: "'Outfit', sans-serif" }}>{format(value, 'd MMM yyyy')}</span>
          ) : (
            <span className="text-[#B0A89E]" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {locale === 'ar' ? 'أضف تاريخ' : 'Add date'}
            </span>
          )}
          {value ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(undefined) }}
              className="text-[#9A8878] hover:text-[#C4582A] transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <Calendar className="w-3.5 h-3.5 text-[#C4582A]" />
          )}
        </div>
      </button>
      {open && (
        <div
          className={`absolute top-full z-50 bg-white rounded-2xl mt-1 ${align === 'end' ? 'end-0' : 'start-0'}`}
          style={{ border: '0.5px solid rgba(122,106,94,0.2)', boxShadow: '0 8px 40px rgba(28,22,19,0.12)', padding: '12px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <style dangerouslySetInnerHTML={{ __html: dpStyles }} />
          <DayPicker
            className="bw-rdp"
            mode="single"
            selected={value}
            onSelect={(d) => { onChange(d); setOpen(false) }}
            disabled={minDate ? { before: minDate } : undefined}
            startMonth={minDate ?? new Date()}
          />
        </div>
      )}
    </div>
  )
}

export function BookingWidget({ listing, locale }: BookingWidgetProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { openAuthModal } = useAuthModal()
  const isRTL = locale === 'ar'

  const [checkIn, setCheckIn] = useState<Date | undefined>()
  const [checkOut, setCheckOut] = useState<Date | undefined>()
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CARD')
  const [valuMonths, setValuMonths] = useState(6)

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0
  const validNights = nights >= listing.minimumNights && (!listing.maximumNights || nights <= listing.maximumNights)
  const validGuests = adults + children <= listing.maxGuests
  const canBook = checkIn && checkOut && nights > 0 && validNights && validGuests

  /* Compute simple price breakdown inline */
  const nightlySubtotal = listing.pricePerNight * nights
  const cleaningFee = listing.cleaningFee ?? 0
  const serviceFee = Math.round((nightlySubtotal + cleaningFee) * 0.10)
  const total = nightlySubtotal + cleaningFee + serviceFee

  const handleBook = () => {
    if (!canBook) return
    if (!user) {
      openAuthModal('login', () => {
        // After login, navigate to confirm page
        const params = new URLSearchParams({
          checkIn: format(checkIn!, 'yyyy-MM-dd'),
          checkOut: format(checkOut!, 'yyyy-MM-dd'),
          guests: String(adults + children),
          adults: String(adults),
          children: String(children),
          payment: paymentMethod,
          ...(paymentMethod === 'VALU_BNPL' ? { valuMonths: String(valuMonths) } : {}),
        })
        router.push(`/${locale}/bookings/confirm/${listing.id}?${params}`)
      })
      return
    }
    // Logged in → go straight to confirm page
    const params = new URLSearchParams({
      checkIn: format(checkIn!, 'yyyy-MM-dd'),
      checkOut: format(checkOut!, 'yyyy-MM-dd'),
      guests: String(adults + children),
      adults: String(adults),
      children: String(children),
      payment: paymentMethod,
      ...(paymentMethod === 'VALU_BNPL' ? { valuMonths: String(valuMonths) } : {}),
    })
    router.push(`/${locale}/bookings/confirm/${listing.id}?${params}`)
  }

  return (
    <div
      className="bg-white border border-[#EDE0CC] rounded-2xl p-5 space-y-4"
      style={{ boxShadow: '0 4px 24px rgba(28,22,19,0.08)', fontFamily: 'Outfit, sans-serif' }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Price header */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-[#1C1613]">
          {formatEGP(listing.pricePerNight, locale)}
        </span>
        <span className="text-[#7A6A5E] text-sm">{locale === 'ar' ? '/ ليلة' : '/ night'}</span>
      </div>

      {/* Dates — custom DayPicker popovers */}
      <div className="border border-[#EDE0CC] rounded-xl overflow-visible divide-y divide-[#EDE0CC]">
        <div className="grid grid-cols-2 divide-x divide-[#EDE0CC]">
          <DatePopover
            label={locale === 'ar' ? 'الوصول' : 'CHECK-IN'}
            value={checkIn}
            onChange={(d) => { setCheckIn(d); if (checkOut && d && d >= checkOut) setCheckOut(undefined) }}
            minDate={new Date()}
            locale={locale}
            align="start"
          />
          <DatePopover
            label={locale === 'ar' ? 'المغادرة' : 'CHECK-OUT'}
            value={checkOut}
            onChange={setCheckOut}
            minDate={checkIn ? new Date(checkIn.getTime() + 86400000) : new Date()}
            locale={locale}
            align="end"
          />
        </div>

        {/* Guests */}
        <div className="p-3">
          <div className="text-[9px] font-bold text-[#1C1613] uppercase tracking-widest mb-2">
            {locale === 'ar' ? 'الضيوف' : 'GUESTS'}
          </div>
          <div className="flex items-center gap-5 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#7A6A5E] text-xs">{locale === 'ar' ? 'بالغين' : 'Adults'}</span>
              <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-6 h-6 rounded-full border border-[#D0C8BE] flex items-center justify-center text-[#1C1613] hover:border-[#C4582A] text-sm transition-colors">−</button>
              <span className="w-4 text-center font-medium text-[#1C1613]">{adults}</span>
              <button onClick={() => setAdults(Math.min(listing.maxGuests - children, adults + 1))} className="w-6 h-6 rounded-full border border-[#D0C8BE] flex items-center justify-center text-[#1C1613] hover:border-[#C4582A] text-sm transition-colors">+</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#7A6A5E] text-xs">{locale === 'ar' ? 'أطفال' : 'Kids'}</span>
              <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-6 h-6 rounded-full border border-[#D0C8BE] flex items-center justify-center text-[#1C1613] hover:border-[#C4582A] text-sm transition-colors">−</button>
              <span className="w-4 text-center font-medium text-[#1C1613]">{children}</span>
              <button onClick={() => setChildren(Math.min(listing.maxGuests - adults, children + 1))} className="w-6 h-6 rounded-full border border-[#D0C8BE] flex items-center justify-center text-[#1C1613] hover:border-[#C4582A] text-sm transition-colors">+</button>
            </div>
          </div>
          {!validGuests && (
            <p className="text-xs text-[#C4582A] mt-1">
              {locale === 'ar' ? `الحد الأقصى ${listing.maxGuests} ضيوف` : `Max ${listing.maxGuests} guests`}
            </p>
          )}
        </div>
      </div>

      {nights > 0 && !validNights && (
        <p className="text-xs text-[#C4582A]">
          {locale === 'ar' ? `الحد الأدنى ${listing.minimumNights} ليالي` : `Minimum ${listing.minimumNights} nights`}
        </p>
      )}

      {/* Price breakdown — shown as soon as dates are selected */}
      {nights > 0 && (
        <div className="space-y-2 text-sm">
          <Separator className="bg-[#EDE0CC]" />
          <div className="flex justify-between text-[#7A6A5E]">
            <span>
              {formatEGP(listing.pricePerNight, locale)} × {nights}{' '}
              {locale === 'ar' ? 'ليالي' : nights === 1 ? 'night' : 'nights'}
            </span>
            <span>{formatEGP(nightlySubtotal, locale)}</span>
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
          <Separator className="bg-[#EDE0CC]" />
          <div className="flex justify-between font-bold text-[#1C1613]">
            <span>{locale === 'ar' ? 'المجموع' : 'Total'}</span>
            <span>{formatEGP(total, locale)}</span>
          </div>
        </div>
      )}

      {/* Payment method */}
      <div>
        <p className="text-[9px] font-bold text-[#1C1613] uppercase tracking-widest mb-2">
          {locale === 'ar' ? 'طريقة الدفع' : 'PAYMENT'}
        </p>
        <div className="space-y-2">
          {PAYMENT_METHODS.filter((m) => m.id !== 'VALU_BNPL' || listing.bnplEnabled).map((m) => (
            <label
              key={m.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                paymentMethod === m.id ? 'border-[#C4582A] bg-[#C4582A]/5' : 'border-[#EDE0CC] hover:border-[#D0C8BE]'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value={m.id}
                checked={paymentMethod === m.id}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="sr-only"
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#7A6A5E] flex-shrink-0">
                <path d={m.svgPath} />
              </svg>
              <span className="text-sm text-[#1C1613] flex-1">
                {locale === 'ar' ? m.labelAr : m.labelEn}
              </span>
              {paymentMethod === m.id && (
                <span className="w-4 h-4 rounded-full bg-[#C4582A] flex items-center justify-center flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-white" />
                </span>
              )}
            </label>
          ))}
        </div>
        {paymentMethod === 'VALU_BNPL' && nights > 0 && (
          <div className="mt-3">
            <ValUWidget
              totalAmount={listing.pricePerNight * nights + (listing.cleaningFee ?? 0)}
              locale={locale}
              selectedMonths={valuMonths}
              onSelect={setValuMonths}
            />
          </div>
        )}
      </div>

      {/* Book button */}
      <button
        onClick={handleBook}
        disabled={!canBook}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
        style={{
          background: !canBook ? 'rgba(196,88,42,0.45)' : '#C4582A',
          fontFamily: "'Josefin Sans', sans-serif",
          fontWeight: 100,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          cursor: !canBook ? 'not-allowed' : 'pointer',
          boxShadow: canBook ? '0 4px 16px rgba(196,88,42,0.3)' : 'none',
          transition: 'background 150ms ease, box-shadow 150ms ease, transform 100ms ease',
        }}
      >
        {listing.instantBook
          ? (locale === 'ar' ? 'احجز الآن' : 'Book Now')
          : (locale === 'ar' ? 'طلب حجز' : 'Request to Book')
        }
      </button>

      <p className="text-center text-xs text-[#8FA68B]">
        {locale === 'ar' ? '✓ إلغاء مجاني حتى 7 أيام قبل الوصول' : '✓ Free cancellation up to 7 days before check-in'}
      </p>
    </div>
  )
}
