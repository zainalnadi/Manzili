'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

const PROPERTY_TYPES = ['APARTMENT', 'CHALET', 'VILLA', 'STUDIO', 'TOWNHOUSE', 'PENTHOUSE']
const TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  APARTMENT: { ar: 'شقة', en: 'Apartment' },
  CHALET: { ar: 'شاليه', en: 'Chalet' },
  VILLA: { ar: 'فيلا', en: 'Villa' },
  STUDIO: { ar: 'استوديو', en: 'Studio' },
  TOWNHOUSE: { ar: 'تاون هاوس', en: 'Townhouse' },
  PENTHOUSE: { ar: 'بنتهاوس', en: 'Penthouse' },
}

export function Filters({ locale, searchParams }: { locale: string; searchParams: Record<string, string | undefined> }) {
  const router = useRouter()
  const pathname = usePathname()
  const isRTL = locale === 'ar'

  const update = useCallback((key: string, value: string | null) => {
    const p = new URLSearchParams(Object.fromEntries(Object.entries(searchParams).filter(([, v]) => v != null)) as Record<string, string>)
    if (!value) p.delete(key); else p.set(key, value)
    p.delete('page')
    router.push(`${pathname}?${p.toString()}`)
  }, [pathname, router, searchParams])

  return (
    <div className="bg-white rounded-xl border border-[#EDE0CC] p-5 space-y-6 sticky top-24" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Outfit, sans-serif' }}>
      <h3 className="font-bold text-[#1C1613]">{locale === 'ar' ? 'تصفية النتائج' : 'Filters'}</h3>

      <div>
        <p className="text-xs font-semibold text-[#7A6A5E] mb-2 uppercase tracking-wide">{locale === 'ar' ? 'نوع العقار' : 'Property Type'}</p>
        <div className="space-y-1.5">
          {PROPERTY_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="type" checked={searchParams.type === t} onChange={() => update('type', searchParams.type === t ? null : t)} className="sr-only" />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${searchParams.type === t ? 'border-[#C4582A] bg-[#C4582A]' : 'border-[#D0C8BE] group-hover:border-[#C4582A]'}`}>
                {searchParams.type === t && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className="text-sm text-[#1C1613]">{locale === 'ar' ? TYPE_LABELS[t].ar : TYPE_LABELS[t].en}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-[#7A6A5E] mb-2 uppercase tracking-wide">{locale === 'ar' ? 'غرف النوم' : 'Bedrooms'}</p>
        <div className="flex gap-1.5 flex-wrap">
          {['1', '2', '3', '4', '5+'].map((n) => {
            const val = n === '5+' ? '5' : n
            const active = searchParams.bedrooms === val
            return (
              <button key={n} onClick={() => update('bedrooms', active ? null : val)} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${active ? 'bg-[#1C1613] text-white border-[#1C1613]' : 'border-[#EDE0CC] text-[#1C1613] hover:border-[#1C1613]'}`}>{n}</button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        {[
          { key: 'instant', ar: 'حجز فوري فقط', en: 'Instant Book Only', color: '#C4582A' },
          { key: 'bnpl', ar: 'يقبل التقسيط', en: 'BNPL Available', color: '#C9973A' },
        ].map(({ key, ar, en, color }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-[#1C1613]">{locale === 'ar' ? ar : en}</span>
            <button onClick={() => update(key, searchParams[key] === 'true' ? null : 'true')} className={`w-10 h-6 rounded-full relative transition-colors ${searchParams[key] === 'true' ? `bg-[${color}]` : 'bg-[#EDE0CC]'}`} style={{ backgroundColor: searchParams[key] === 'true' ? color : '#EDE0CC' }}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${searchParams[key] === 'true' ? (isRTL ? 'right-1' : 'left-5') : (isRTL ? 'right-5' : 'left-1')}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
