'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X } from 'lucide-react'

const POLICY_INFO = {
  FLEXIBLE: {
    ar: 'استرداد كامل إذا كان الإلغاء قبل 24 ساعة من الوصول. لا يوجد استرداد بعد ذلك.',
    en: 'Full refund if cancelled 24+ hours before check-in. No refund after that.',
  },
  MODERATE: {
    ar: 'استرداد كامل إذا كان الإلغاء قبل 5 أيام. استرداد 50% بعد ذلك.',
    en: 'Full refund if cancelled 5+ days before. 50% refund after that.',
  },
  STRICT: {
    ar: 'استرداد 50% إذا كان الإلغاء قبل 7 أيام. لا يوجد استرداد بعد ذلك.',
    en: '50% refund if cancelled 7+ days before check-in. No refund after that.',
  },
}

interface TripsClientProps {
  bookingId: string
  locale: string
  policy: string
  checkIn: string
}

export function TripsClient({ bookingId, locale, policy, checkIn }: TripsClientProps) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const isRTL = locale === 'ar'

  const policyText = POLICY_INFO[policy as keyof typeof POLICY_INFO]
  const daysUntilCheckIn = Math.ceil((new Date(checkIn).getTime() - Date.now()) / 86_400_000)

  const handleCancel = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to cancel')
      }
      toast.success(locale === 'ar' ? 'تم إلغاء الحجز' : 'Booking cancelled')
      setShowModal(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-xs text-[#C4582A] border border-[#C4582A]/30 px-3 py-1.5 rounded-lg hover:bg-[#C4582A]/5 transition-colors"
      >
        {locale === 'ar' ? 'إلغاء الحجز' : 'Cancel booking'}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(28,22,19,0.5)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            style={{ boxShadow: '0 20px 60px rgba(28,22,19,0.2)' }}
            dir={isRTL ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#1C1613] font-semibold">
                {locale === 'ar' ? 'إلغاء الحجز' : 'Cancel Booking'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-[#7A6A5E] hover:text-[#1C1613]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FFF8F0] border border-[#C4582A]/20 rounded-xl p-4 mb-5">
              <p className="text-sm font-semibold text-[#C4582A] mb-1">
                {locale === 'ar' ? 'سياسة الإلغاء' : 'Cancellation Policy'}
              </p>
              <p className="text-sm text-[#7A6A5E]">
                {policyText ? (locale === 'ar' ? policyText.ar : policyText.en) : ''}
              </p>
              <p className="text-xs text-[#9A8878] mt-2">
                {locale === 'ar'
                  ? `${daysUntilCheckIn} يوم حتى موعد الوصول`
                  : `${daysUntilCheckIn} day${daysUntilCheckIn !== 1 ? 's' : ''} until check-in`}
              </p>
            </div>

            <p className="text-sm text-[#1C1613] mb-5">
              {locale === 'ar'
                ? 'هل أنت متأكد أنك تريد إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to cancel this booking? This action cannot be undone.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-[#EDE0CC] rounded-xl text-[#7A6A5E] text-sm hover:bg-[#F7F0E6] transition-colors"
              >
                {locale === 'ar' ? 'تراجع' : 'Keep booking'}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-2.5 bg-[#C4582A] hover:bg-[#A8471F] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading
                  ? (locale === 'ar' ? 'جارٍ...' : 'Cancelling...')
                  : (locale === 'ar' ? 'تأكيد الإلغاء' : 'Confirm cancellation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
