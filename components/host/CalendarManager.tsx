'use client'

import { useState, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react'

interface BookingRange {
  checkIn: string
  checkOut: string
  id: string
}

interface Props {
  listingId: string
  title: string
  blockedDates: string[]
  bookingRanges: BookingRange[]
  locale: string
}

type DayState = 'available' | 'blocked-host' | 'booked' | 'past'

function getDayState(
  date: Date,
  blockedSet: Set<string>,
  bookingRanges: BookingRange[],
): DayState {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date < today) return 'past'

  const iso = date.toISOString().slice(0, 10)
  if (blockedSet.has(iso)) return 'blocked-host'

  for (const range of bookingRanges) {
    const checkIn = new Date(range.checkIn)
    checkIn.setHours(0, 0, 0, 0)
    const checkOut = new Date(range.checkOut)
    checkOut.setHours(0, 0, 0, 0)
    if (date >= checkIn && date < checkOut) return 'booked'
  }

  return 'available'
}

function buildCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay() // 0=Sun
  const days: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

const MONTH_NAMES_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
]
const MONTH_NAMES_EN = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_LABELS_AR = ['أح','إث','ثل','أر','خم','جم','سب']
const DAY_LABELS_EN = ['Su','Mo','Tu','We','Th','Fr','Sa']

export function CalendarManager({
  listingId,
  title,
  blockedDates: initialBlockedDates,
  bookingRanges,
  locale,
}: Props) {
  const isRTL = locale === 'ar'
  const dayLabels = isRTL ? DAY_LABELS_AR : DAY_LABELS_EN
  const monthNames = isRTL ? MONTH_NAMES_AR : MONTH_NAMES_EN

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Which month offset we're viewing (0 = today's month)
  const [monthOffset, setMonthOffset] = useState(0)
  const [blockedDates, setBlockedDates] = useState<Set<string>>(
    () => new Set(initialBlockedDates.map((d) => d.slice(0, 10))),
  )
  const [isPending, startTransition] = useTransition()
  const [loadingDate, setLoadingDate] = useState<string | null>(null)
  const [confirmDate, setConfirmDate] = useState<{ iso: string; action: 'block' | 'unblock' } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Build two months to display
  const months = [0, 1].map((offset) => {
    const refDate = new Date(today.getFullYear(), today.getMonth() + monthOffset + offset, 1)
    return { year: refDate.getFullYear(), month: refDate.getMonth() }
  })

  const handleDayClick = useCallback(
    (date: Date, state: DayState) => {
      if (state === 'past' || state === 'booked') return
      const iso = date.toISOString().slice(0, 10)
      setConfirmDate({ iso, action: state === 'blocked-host' ? 'unblock' : 'block' })
    },
    [],
  )

  const handleConfirm = async () => {
    if (!confirmDate) return
    const { iso, action } = confirmDate
    setConfirmDate(null)
    setLoadingDate(iso)
    setError(null)

    try {
      const res = await fetch(`/api/host/calendar/${listingId}`, {
        method: action === 'block' ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: iso }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Request failed')
      }
      startTransition(() => {
        setBlockedDates((prev) => {
          const next = new Set(prev)
          if (action === 'block') next.add(iso)
          else next.delete(iso)
          return next
        })
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingDate(null)
    }
  }

  return (
    <div
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Back link + title */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${locale}/host/listings`}
          className="text-[#7A6A5E] hover:text-[#1C1613] transition-colors"
          aria-label={isRTL ? 'رجوع' : 'Back'}
        >
          <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#1C1613]">
            {locale === 'ar' ? 'تقويم الإتاحة' : 'Availability Calendar'}
          </h1>
          <p className="text-sm text-[#7A6A5E] truncate">{title}</p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-[#FDECEA] border border-[#C4582A]/20 rounded-xl text-[#C4582A] text-sm">
          {error}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className="bg-white rounded-2xl border border-[#EDE0CC] p-6 w-full max-w-sm shadow-xl"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            <p className="text-[#1C1613] font-bold text-base mb-2">
              {confirmDate.action === 'block'
                ? (locale === 'ar' ? 'حجب هذا اليوم؟' : 'Block this date?')
                : (locale === 'ar' ? 'إلغاء الحجب؟' : 'Unblock this date?')}
            </p>
            <p className="text-[#7A6A5E] text-sm mb-5">
              {new Date(confirmDate.iso).toLocaleDateString(
                locale === 'ar' ? 'ar-EG' : 'en-EG',
                { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDate(null)}
                className="px-4 py-2 text-sm font-medium text-[#7A6A5E] bg-[#F7F0E6] hover:bg-[#EDE0CC] rounded-lg transition-colors"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
                  confirmDate.action === 'block'
                    ? 'bg-[#C4582A] hover:bg-[#a8382300]'
                    : 'bg-[#8FA68B] hover:bg-[#6E9B6A]'
                }`}
                style={
                  confirmDate.action === 'block'
                    ? { backgroundColor: '#C4582A' }
                    : { backgroundColor: '#8FA68B' }
                }
              >
                {confirmDate.action === 'block'
                  ? (locale === 'ar' ? 'حجب' : 'Block')
                  : (locale === 'ar' ? 'إلغاء الحجب' : 'Unblock')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setMonthOffset((p) => p - 1)}
          disabled={monthOffset <= 0}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#EDE0CC] hover:bg-[#F7F0E6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <span className="text-sm font-medium text-[#7A6A5E]">
          {monthNames[months[0].month]} {months[0].year}
          {' — '}
          {monthNames[months[1].month]} {months[1].year}
        </span>
        <button
          onClick={() => setMonthOffset((p) => p + 1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#EDE0CC] hover:bg-[#F7F0E6] transition-colors"
        >
          {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Two-month grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {months.map(({ year, month }) => {
          const days = buildCalendarDays(year, month)
          return (
            <div key={`${year}-${month}`} className="bg-white border border-[#EDE0CC] rounded-2xl p-4">
              <h2 className="text-center font-bold text-[#1C1613] mb-4">
                {monthNames[month]} {year}
              </h2>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {dayLabels.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-[#7A6A5E] py-1">
                    {d}
                  </div>
                ))}
              </div>
              {/* Days */}
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((date, idx) => {
                  if (!date) {
                    return <div key={`empty-${idx}`} />
                  }
                  const iso = date.toISOString().slice(0, 10)
                  const state = getDayState(date, blockedDates, bookingRanges)
                  const isLoading = loadingDate === iso

                  let cellClass =
                    'relative w-full aspect-square flex items-center justify-center text-xs rounded-lg transition-colors select-none '
                  let textClass = 'font-medium '

                  if (state === 'past') {
                    cellClass += 'opacity-30 cursor-default '
                    textClass += 'text-[#7A6A5E]'
                  } else if (state === 'booked') {
                    cellClass += 'bg-[#C4582A]/15 cursor-not-allowed '
                    textClass += 'text-[#C4582A]'
                  } else if (state === 'blocked-host') {
                    cellClass += 'bg-[#C4582A]/15 cursor-pointer hover:bg-[#C4582A]/25 '
                    textClass += 'text-[#C4582A]'
                  } else {
                    cellClass += 'bg-white hover:bg-[#F7F0E6] cursor-pointer border border-[#EDE0CC] hover:border-[#D0C8BE] '
                    textClass += 'text-[#1C1613]'
                  }

                  return (
                    <button
                      key={iso}
                      type="button"
                      className={cellClass}
                      onClick={() => handleDayClick(date, state)}
                      disabled={state === 'past' || state === 'booked' || isLoading}
                      title={
                        state === 'booked'
                          ? (locale === 'ar' ? 'محجوز' : 'Booked')
                          : state === 'blocked-host'
                          ? (locale === 'ar' ? 'محجوب - اضغط لإلغاء الحجب' : 'Blocked – click to unblock')
                          : state === 'past'
                          ? (locale === 'ar' ? 'تاريخ مضى' : 'Past date')
                          : (locale === 'ar' ? 'اضغط لحجب' : 'Click to block')
                      }
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin text-[#7A6A5E]" />
                      ) : (
                        <span className={textClass}>{date.getDate()}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs">
        {[
          { color: 'bg-white border border-[#EDE0CC]', textColor: 'text-[#1C1613]', labelAr: 'متاح', labelEn: 'Available' },
          { color: 'bg-[#C4582A]/15', textColor: 'text-[#C4582A]', labelAr: 'محجوب من المضيف', labelEn: 'Blocked by host' },
          { color: 'bg-[#C4582A]/15', textColor: 'text-[#C4582A]', labelAr: 'محجوز', labelEn: 'Booked' },
          { color: 'opacity-30 bg-[#F7F0E6]', textColor: 'text-[#7A6A5E]', labelAr: 'تاريخ مضى', labelEn: 'Past' },
        ].map(({ color, textColor, labelAr, labelEn }) => (
          <div key={labelEn} className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-md ${color}`} />
            <span className={`${textColor} font-medium`}>{locale === 'ar' ? labelAr : labelEn}</span>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <p className="text-center text-xs text-[#7A6A5E] mt-4">
        {locale === 'ar'
          ? 'اضغط على يوم متاح لحجبه، أو على يوم محجوب لإلغاء حجبه'
          : 'Click an available day to block it, or a blocked day to unblock it'}
      </p>
    </div>
  )
}
