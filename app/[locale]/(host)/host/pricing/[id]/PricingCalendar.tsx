'use client'

import { useState, useCallback } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isBefore } from 'date-fns'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { toast } from 'sonner'

interface PricingCalendarProps {
  locale: string
  listingId: string
  basePrice: number
  initialOverrides: Array<{ date: string; price: number }>
}

export function PricingCalendar({ locale, listingId, basePrice, initialOverrides }: PricingCalendarProps) {
  const isRTL = locale === 'ar'
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [overrides, setOverrides] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    initialOverrides.forEach((o) => { map[o.date] = o.price })
    return map
  })
  const [selected, setSelected] = useState<string[]>([])
  const [customPrice, setCustomPrice] = useState('')
  const [saving, setSaving] = useState(false)

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })
  const firstDayOffset = getDay(startOfMonth(currentMonth))

  const toggleDate = (dateStr: string) => {
    if (isBefore(new Date(dateStr), new Date())) return
    setSelected((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    )
  }

  const handleSave = useCallback(async () => {
    const price = parseFloat(customPrice)
    if (isNaN(price) || price <= 0) {
      toast.error(locale === 'ar' ? 'أدخل سعراً صحيحاً' : 'Enter a valid price')
      return
    }
    if (selected.length === 0) {
      toast.error(locale === 'ar' ? 'اختر يوماً واحداً على الأقل' : 'Select at least one date')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/host/pricing/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates: selected, price }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const newOverrides = { ...overrides }
      selected.forEach((d) => { newOverrides[d] = price })
      setOverrides(newOverrides)
      setSelected([])
      setCustomPrice('')
      toast.success(locale === 'ar' ? 'تم حفظ الأسعار' : 'Prices saved')
    } catch {
      toast.error(locale === 'ar' ? 'فشل الحفظ' : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [customPrice, selected, listingId, overrides, locale])

  const handleRemoveOverride = useCallback(async (dateStr: string) => {
    try {
      await fetch(`/api/host/pricing/${listingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates: [dateStr] }),
      })
      const newOverrides = { ...overrides }
      delete newOverrides[dateStr]
      setOverrides(newOverrides)
    } catch {
      toast.error('Failed to remove override')
    }
  }, [listingId, overrides])

  const weekDays = isRTL
    ? ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white border border-[#EDE0CC] rounded-2xl p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-[#F7F0E6] text-[#7A6A5E] transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-[#1C1613]"
              style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-[#F7F0E6] text-[#7A6A5E] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Week headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-[9px] text-[#9A8878] py-1"
                style={{ fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const isPast = isBefore(day, new Date())
              const hasOverride = overrides[dateStr] !== undefined
              const isSelected = selected.includes(dateStr)
              const isCurrentDay = isToday(day)

              return (
                <button
                  key={dateStr}
                  onClick={() => toggleDate(dateStr)}
                  disabled={isPast}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all ${
                    isPast ? 'opacity-30 cursor-not-allowed' :
                    isSelected ? 'bg-[#C4582A] text-white' :
                    hasOverride ? 'bg-[#FFF0E8] text-[#C4582A] border border-[#C4582A]/30' :
                    'hover:bg-[#F7F0E6] text-[#1C1613]'
                  } ${isCurrentDay && !isSelected ? 'ring-1 ring-[#C4582A]' : ''}`}
                >
                  <span className={`text-xs ${isSelected ? 'font-bold' : ''}`}>{format(day, 'd')}</span>
                  {hasOverride && !isSelected && (
                    <span className="text-[8px] font-semibold leading-none text-[#C4582A]">
                      {overrides[dateStr].toLocaleString()}
                    </span>
                  )}
                  {isSelected && (
                    <span className="text-[8px] leading-none text-white/80">
                      {overrides[dateStr] ? overrides[dateStr].toLocaleString() : basePrice.toLocaleString()}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <p className="text-xs text-[#9A8878] mt-3">
            {locale === 'ar' ? 'انقر لاختيار أيام، ثم أدخل السعر وأحفظ' : 'Click to select days, enter a price, then save'}
          </p>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Set price panel */}
          <div className="bg-white border border-[#EDE0CC] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#1C1613] mb-3">
              {locale === 'ar' ? `${selected.length} يوم محدد` : `${selected.length} day${selected.length !== 1 ? 's' : ''} selected`}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#7A6A5E] block mb-1">
                  {locale === 'ar' ? 'السعر الليلي (EGP)' : 'Nightly rate (EGP)'}
                </label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder={`${basePrice}`}
                  className="w-full border border-[#EDE0CC] rounded-xl px-3 py-2.5 text-sm text-[#1C1613] focus:outline-none focus:border-[#C4582A]"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || selected.length === 0 || !customPrice}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1C1613] hover:bg-[#C4582A] text-white text-sm rounded-xl transition-colors disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
                {saving ? (locale === 'ar' ? 'جارٍ...' : 'Saving...') : (locale === 'ar' ? 'حفظ' : 'Save')}
              </button>
            </div>
          </div>

          {/* Overrides list */}
          {Object.keys(overrides).length > 0 && (
            <div className="bg-white border border-[#EDE0CC] rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-[#7A6A5E] mb-3 uppercase tracking-wide">
                {locale === 'ar' ? 'الأسعار المخصصة' : 'Custom Prices'}
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {Object.entries(overrides)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dateStr, price]) => (
                    <div key={dateStr} className="flex items-center justify-between text-xs">
                      <span className="text-[#1C1613]">{dateStr}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#C4582A]">EGP {price.toLocaleString()}</span>
                        <button onClick={() => handleRemoveOverride(dateStr)} className="text-[#9A8878] hover:text-[#C4582A] text-[10px]">✕</button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="bg-[#F7F0E6] rounded-xl p-4 text-xs space-y-2">
            <p className="font-semibold text-[#1C1613]">{locale === 'ar' ? 'المفتاح' : 'Legend'}</p>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#FFF0E8] border border-[#C4582A]/30" />
              <span className="text-[#7A6A5E]">{locale === 'ar' ? 'سعر مخصص' : 'Custom price'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#C4582A]" />
              <span className="text-[#7A6A5E]">{locale === 'ar' ? 'محدد' : 'Selected'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded border border-[#C4582A] ring-1 ring-[#C4582A]" />
              <span className="text-[#7A6A5E]">{locale === 'ar' ? 'اليوم' : 'Today'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
