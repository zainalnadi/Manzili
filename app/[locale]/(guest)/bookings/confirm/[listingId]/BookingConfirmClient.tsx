'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const PAYMENT_METHODS = [
  { id: 'CARD',          labelAr: 'بطاقة ائتمانية / خصم',  labelEn: 'Credit / Debit Card',
    icon: 'M3 7h18v10H3zM7 10h2M11 10h2' },
  { id: 'FAWRY',         labelAr: 'فوري',                   labelEn: 'Fawry',
    icon: 'M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9zm0 4v10M8 12h8' },
  { id: 'VODAFONE_CASH', labelAr: 'فودافون كاش',            labelEn: 'Vodafone Cash',
    icon: 'M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-5 16a1 1 0 1 1 0-2 1 1 0 0 1 0 2z' },
  { id: 'MEEZA',         labelAr: 'ميزة',                   labelEn: 'Meeza',
    icon: 'M3 7h18v10H3zM7 12h2M11 12h2' },
  { id: 'VALU_BNPL',    labelAr: 'فاليو — تقسيط',          labelEn: 'ValU — Installments',
    icon: 'M3 6h18v2H3zM3 16h18v2H3zM7 11h4v2H7z' },
]

const VALU_MONTHS = [3, 6, 12]

interface Props {
  locale: string
  listingId: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  instantBook: boolean
  bnplEnabled: boolean
  total: number
  initialPayment?: string
  initialValuMonths?: number
}

function formatEGP(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency', currency: 'EGP', maximumFractionDigits: 0,
  }).format(amount)
}

export function BookingConfirmClient({
  locale, listingId, checkIn, checkOut, adults, children,
  instantBook, bnplEnabled, total, initialPayment = 'CARD', initialValuMonths = 6,
}: Props) {
  const router = useRouter()
  const isRTL = locale === 'ar'
  const [paymentMethod, setPaymentMethod] = useState(initialPayment)
  const [valuMonths, setValuMonths] = useState(initialValuMonths)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const monthlyAmount = Math.ceil(total / valuMonths)

  const handleConfirm = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          adultsCount: adults,
          childrenCount: children,
          paymentMethod,
          valuMonths: paymentMethod === 'VALU_BNPL' ? valuMonths : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Booking failed')
      router.push(`/${locale}/bookings/confirmed/${data.booking.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Booking failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Outfit, sans-serif' }}>
      {/* Payment Method */}
      <div className="bg-white border border-[#EDE0CC] rounded-2xl p-5 space-y-3"
        style={{ boxShadow: '0 2px 12px rgba(28,22,19,0.06)' }}>
        <p className="text-[10px] font-bold text-[#7A6A5E] uppercase tracking-widest mb-1"
          style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
          {locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
        </p>
        {PAYMENT_METHODS.filter((m) => m.id !== 'VALU_BNPL' || bnplEnabled).map((m) => (
          <label
            key={m.id}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              paymentMethod === m.id
                ? 'border-[#C4582A] bg-[#C4582A]/5'
                : 'border-[#EDE0CC] hover:border-[#C0B0A0]'
            } ${m.id === 'VALU_BNPL' && paymentMethod !== 'VALU_BNPL' ? 'border-[#C9963A]/40' : ''}`}
            style={m.id === 'VALU_BNPL' ? { borderColor: paymentMethod === 'VALU_BNPL' ? '#C4582A' : '#C9963A', background: paymentMethod === 'VALU_BNPL' ? 'rgba(196,88,42,0.05)' : 'rgba(201,150,58,0.04)' } : {}}
          >
            <input
              type="radio"
              name="payment"
              value={m.id}
              checked={paymentMethod === m.id}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="sr-only"
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className="flex-shrink-0 text-[#7A6A5E]">
              <path d={m.icon} />
            </svg>
            <span className="text-sm text-[#1C1613] flex-1">
              {locale === 'ar' ? m.labelAr : m.labelEn}
            </span>
            {m.id === 'VALU_BNPL' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(201,150,58,0.12)', color: '#C9963A', fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '0.06em' }}>
                BNPL
              </span>
            )}
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              paymentMethod === m.id ? 'border-[#C4582A]' : 'border-[#D0C8BE]'
            }`}>
              {paymentMethod === m.id && <div className="w-2 h-2 rounded-full bg-[#C4582A]" />}
            </div>
          </label>
        ))}

        {/* ValU months selector */}
        {paymentMethod === 'VALU_BNPL' && (
          <div className="pt-2 border-t border-[#EDE0CC] space-y-2">
            <p className="text-xs text-[#7A6A5E]">
              {locale === 'ar' ? 'عدد أشهر التقسيط' : 'Instalment plan'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {VALU_MONTHS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setValuMonths(m)}
                  className="rounded-xl py-2.5 text-sm transition-all"
                  style={{
                    border: valuMonths === m ? '1.5px solid #C9963A' : '1.5px solid rgba(201,150,58,0.3)',
                    background: valuMonths === m ? 'rgba(201,150,58,0.1)' : 'transparent',
                    color: '#1C1613',
                  }}
                >
                  <span className="block font-semibold" style={{ color: '#C9963A' }}>
                    {formatEGP(monthlyAmount, locale)}
                  </span>
                  <span className="text-[10px] text-[#7A6A5E]">
                    {locale === 'ar' ? `× ${m} أشهر` : `× ${m} months`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-[#C4582A] bg-[#C4582A]/8 px-4 py-2.5 rounded-xl">{error}</p>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full text-white transition-all active:scale-[0.98]"
        style={{
          height: 56,
          borderRadius: 999,
          background: loading ? 'rgba(196,88,42,0.45)' : '#C4582A',
          fontFamily: "'Josefin Sans', sans-serif",
          fontWeight: 100,
          fontSize: 13,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          boxShadow: !loading ? '0 4px 20px rgba(196,88,42,0.28)' : 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 150ms ease, box-shadow 150ms ease, transform 100ms ease',
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" strokeDasharray="60" strokeDashoffset="20" />
            </svg>
            {locale === 'ar' ? 'جاري التأكيد...' : 'Confirming...'}
          </span>
        ) : instantBook
          ? (locale === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking')
          : (locale === 'ar' ? 'إرسال طلب الحجز' : 'Send Booking Request')
        }
      </button>

      {/* Security note */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-[#9A8878]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        {locale === 'ar'
          ? 'مدفوعاتك محمية. بالتأكيد توافق على شروط الخدمة.'
          : 'Your payment is secure. By confirming you agree to our Terms of Service.'}
      </div>
    </div>
  )
}
