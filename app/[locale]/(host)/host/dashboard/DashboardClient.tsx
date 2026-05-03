'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'

interface PendingBooking {
  id: string
  nights: number
  totalHostReceives: number
  checkIn: string
  checkOut: string
  adultsCount: number
  childrenCount: number
  guestName: string
  listingTitle: string
}

interface Props {
  locale: string
  pendingBookings: PendingBooking[]
}

function formatEGPSimple(amount: number) {
  return `EGP ${amount.toLocaleString()}`
}

export function DashboardClient({ locale, pendingBookings }: Props) {
  const router = useRouter()
  const isRTL = locale === 'ar'
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = pendingBookings.filter((b) => !dismissed.has(b.id))

  const handleAction = async (bookingId: string, action: 'confirm' | 'cancel') => {
    setLoadingId(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/${action}`, { method: 'POST' })
      if (!res.ok && res.status !== 303) throw new Error()
      setDismissed((prev) => new Set([...prev, bookingId]))
      toast.success(
        action === 'confirm'
          ? (locale === 'ar' ? 'تم قبول الحجز' : 'Booking accepted')
          : (locale === 'ar' ? 'تم رفض الحجز' : 'Booking declined')
      )
      router.refresh()
    } catch {
      toast.error(locale === 'ar' ? 'حدث خطأ' : 'Something went wrong')
    } finally {
      setLoadingId(null)
    }
  }

  if (visible.length === 0) return null

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="bg-white rounded-xl border border-[#EDE0CC] p-6 mb-6">
      <h2 className="font-bold text-[#1C1613] mb-5">
        {locale === 'ar' ? `طلبات الحجز المعلقة (${visible.length})` : `Pending Booking Requests (${visible.length})`}
      </h2>
      <div className="space-y-3">
        {visible.map((b) => {
          const busy = loadingId === b.id
          const checkInDate = new Date(b.checkIn).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' })
          const checkOutDate = new Date(b.checkOut).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' })
          const guests = b.adultsCount + b.childrenCount

          return (
            <div key={b.id} className="flex items-center gap-4 p-4 bg-[#FFF9F5] border border-[#EDE0CC] rounded-xl">
              <div className="w-10 h-10 rounded-full bg-[#C9973A] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {b.guestName[0]?.toUpperCase() ?? 'G'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#1C1613] text-sm">{b.guestName}</p>
                <p className="text-xs text-[#7A6A5E] truncate">{b.listingTitle}</p>
                <p className="text-xs text-[#9A8878] mt-0.5">
                  {checkInDate} → {checkOutDate}
                  {' · '}
                  {b.nights} {locale === 'ar' ? 'ليلة' : b.nights === 1 ? 'night' : 'nights'}
                  {' · '}
                  {guests} {locale === 'ar' ? 'ضيوف' : 'guests'}
                </p>
              </div>
              <div className="flex-shrink-0 text-end">
                <p className="text-sm font-bold text-[#1C1613] mb-2">{formatEGPSimple(b.totalHostReceives)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(b.id, 'cancel')}
                    disabled={busy}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[#EDE0CC] rounded-lg text-[#9A8878] hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40"
                  >
                    <X className="w-3 h-3" />
                    {locale === 'ar' ? 'رفض' : 'Decline'}
                  </button>
                  <button
                    onClick={() => handleAction(b.id, 'confirm')}
                    disabled={busy}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#1C1613] hover:bg-[#C4582A] text-white rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Check className="w-3 h-3" />
                    {locale === 'ar' ? 'قبول' : 'Accept'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
