'use client'

import Link from 'next/link'

interface CategoryPillsProps {
  locale: string
  activeType?: string
  currentParams: Record<string, string>
}

/* ── Minimal 1px-stroke SVG icons for each property type ── */
function IconAll() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="0.9"/>
      <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="0.9"/>
      <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="0.9"/>
      <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="0.9"/>
    </svg>
  )
}

function IconApartment() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="4" y="3" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="0.9"/>
      <path d="M7 8h2M7 11h2M11 8h2M11 11h2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M8 17v-3h4v3" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconChalet() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M2 9l8-6 8 6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="4" y="9" width="12" height="8" rx="0.5" stroke="currentColor" strokeWidth="0.9"/>
      <rect x="8" y="13" width="4" height="4" stroke="currentColor" strokeWidth="0.9"/>
      <path d="M4 9l3-3h6l3 3" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconVilla() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M1 10l9-7 9 7" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="2" y="10" width="16" height="7" rx="0.5" stroke="currentColor" strokeWidth="0.9"/>
      <rect x="5" y="13" width="3" height="4" stroke="currentColor" strokeWidth="0.9"/>
      <rect x="12" y="12" width="3" height="2" rx="0.5" stroke="currentColor" strokeWidth="0.9"/>
      <path d="M8 10V8M12 10V8" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
    </svg>
  )
}

function IconStudio() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="3" y="4" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="0.9"/>
      <path d="M3 9h14" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M7 9v7M13 9v7" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
      <circle cx="10" cy="6.5" r="1" stroke="currentColor" strokeWidth="0.8"/>
    </svg>
  )
}

function IconTownhouse() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2" y="8" width="7" height="9" rx="0.5" stroke="currentColor" strokeWidth="0.9"/>
      <rect x="11" y="8" width="7" height="9" rx="0.5" stroke="currentColor" strokeWidth="0.9"/>
      <path d="M2 8l3.5-5h7L16 8" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="4" y="12" width="3" height="5" stroke="currentColor" strokeWidth="0.8"/>
      <rect x="13" y="12" width="3" height="5" stroke="currentColor" strokeWidth="0.8"/>
    </svg>
  )
}

function IconPenthouse() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="4" y="5" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="0.9"/>
      <path d="M6 5V3M10 5V2M14 5V3" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M7 11h2M7 14h2M11 11h2M11 14h2" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
      <path d="M9 17v-3h2v3" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const CATEGORIES = [
  { key: '',            Icon: IconAll,        ar: 'الكل',       en: 'All' },
  { key: 'APARTMENT',  Icon: IconApartment,  ar: 'شقق',        en: 'Apartments' },
  { key: 'CHALET',     Icon: IconChalet,     ar: 'شاليهات',    en: 'Chalets' },
  { key: 'VILLA',      Icon: IconVilla,      ar: 'فيلات',      en: 'Villas' },
  { key: 'STUDIO',     Icon: IconStudio,     ar: 'استوديو',    en: 'Studios' },
  { key: 'TOWNHOUSE',  Icon: IconTownhouse,  ar: 'تاون هاوس',  en: 'Townhouses' },
  { key: 'PENTHOUSE',  Icon: IconPenthouse,  ar: 'بنتهاوس',    en: 'Penthouses' },
]

export function CategoryPills({ locale, activeType = '', currentParams }: CategoryPillsProps) {
  const isRTL = locale === 'ar'

  const buildUrl = (type: string) => {
    const params = new URLSearchParams()
    Object.entries({ ...currentParams, type }).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    return `/${locale}/listings?${params.toString()}`
  }

  return (
    <div
      className="overflow-x-auto scrollbar-hide"
      style={{ WebkitOverflowScrolling: 'touch' }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex gap-2 pb-1 px-0.5 min-w-max">
        {CATEGORIES.map((cat) => {
          const isActive = (activeType ?? '') === cat.key
          return (
            <Link
              key={cat.key}
              href={buildUrl(cat.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? 'bg-[#1C1613] border-[#1C1613] text-white shadow-sm'
                  : 'bg-white border-[#EDE0CC] text-[#7A6A5E] hover:border-[#C4582A] hover:text-[#C4582A]'
              }`}
            >
              <cat.Icon />
              <span
                className="text-[10px] leading-none"
                style={isRTL
                  ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 300 }
                  : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.1em', textTransform: 'uppercase' }
                }
              >
                {isRTL ? cat.ar : cat.en}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
