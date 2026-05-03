'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, MapPin, Calendar, Users, Minus, Plus, X } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import 'react-day-picker/style.css'

interface SearchBarProps {
  locale: string
  initialWhere?: string
  initialCheckIn?: string
  initialCheckOut?: string
  initialGuests?: number
  compact?: boolean
}

const DESTINATIONS = [
  { key: 'north-coast', ar: 'الساحل الشمالي', en: 'North Coast' },
  { key: 'ain-sokhna',  ar: 'العين السخنة',   en: 'Ain Sokhna' },
  { key: 'cairo',       ar: 'القاهرة',         en: 'Cairo' },
  { key: 'hurghada',    ar: 'الغردقة',         en: 'Hurghada' },
  { key: 'el-gouna',    ar: 'الجونة',          en: 'El Gouna' },
  { key: 'dahab',       ar: 'دهب',             en: 'Dahab' },
  { key: 'sharm',       ar: 'شرم الشيخ',       en: 'Sharm El Sheikh' },
]

/* ── Custom DayPicker styles injected once ── */
const dpStyles = `
  .rdp-root {
    --rdp-accent-color: #C4582A;
    --rdp-accent-background-color: #F0D5C5;
    --rdp-day-height: 36px;
    --rdp-day-width: 36px;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
  }
  .rdp-root .rdp-selected .rdp-day_button {
    background: #C4582A;
    color: white;
    border-radius: 999px;
  }
  .rdp-root .rdp-today:not(.rdp-selected) .rdp-day_button {
    color: #C4582A;
    font-weight: 600;
  }
  .rdp-root .rdp-day_button:hover:not(:disabled) {
    background: #F0D5C5;
    border-radius: 999px;
  }
  .rdp-root .rdp-nav_button:hover {
    background: #F0D5C5;
  }
  .rdp-root .rdp-month_caption {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 100;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 11px;
    color: #1C1613;
  }
  .rdp-root .rdp-weekday {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 100;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 9px;
    color: #9A8878;
  }
`

function CalendarPopover({
  label,
  value,
  onChange,
  minDate,
  locale,
}: {
  label: string
  value: Date | undefined
  onChange: (d: Date | undefined) => void
  minDate?: Date
  locale: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: dpStyles }} />
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-5 py-3.5 hover:bg-[#F7F0E6]/60 rounded-full transition-colors focus-visible:outline-none w-full text-start"
      >
        <Calendar className="w-3.5 h-3.5 text-[#C4582A] flex-shrink-0" />
        <div>
          <div
            className="text-[10px] text-[#1C1613] mb-0.5"
            style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            {label}
          </div>
          <div className="text-sm text-[#1C1613]" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {value ? format(value, 'd MMM yyyy') : (
              <span className="text-[#C0B8B0]">{locale === 'ar' ? 'أضف تاريخ' : 'Add date'}</span>
            )}
          </div>
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(undefined) }}
            className="ms-auto text-[#9A8878] hover:text-[#1C1613] transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </button>
      {open && (
        <div
          className="absolute top-full mt-2 bg-white rounded-2xl z-50"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            border: '0.5px solid rgba(122,106,94,0.2)',
            boxShadow: '0 8px 40px rgba(28,22,19,0.12)',
            padding: '12px',
            minWidth: '280px',
          }}
        >
          <DayPicker
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

export function SearchBar({
  locale,
  initialWhere = '',
  initialCheckIn,
  initialCheckOut,
  initialGuests = 2,
  compact = false,
}: SearchBarProps) {
  const t = useTranslations('home')
  const router = useRouter()
  const isRTL = locale === 'ar'

  const [where, setWhere] = useState(initialWhere)
  const [showDestinations, setShowDestinations] = useState(false)
  const [checkIn, setCheckIn] = useState<Date | undefined>(
    initialCheckIn ? new Date(initialCheckIn) : undefined
  )
  const [checkOut, setCheckOut] = useState<Date | undefined>(
    initialCheckOut ? new Date(initialCheckOut) : undefined
  )
  const [guests, setGuests] = useState(initialGuests)
  const [focused, setFocused] = useState(false)

  const destRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (destRef.current && !destRef.current.contains(e.target as Node)) setShowDestinations(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (where) params.set('where', where)
    if (checkIn) params.set('checkin', format(checkIn, 'yyyy-MM-dd'))
    if (checkOut) params.set('checkout', format(checkOut, 'yyyy-MM-dd'))
    params.set('guests', String(guests))
    router.push(`/${locale}/listings?${params.toString()}`)
  }

  if (compact) {
    return (
      <button
        onClick={() => router.push(`/${locale}/listings`)}
        className="flex items-center gap-2 px-4 py-2.5 border border-[#EDE0CC] rounded-full bg-white hover:shadow-md transition-all text-sm text-[#7A6A5E]"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <Search className="w-4 h-4 text-[#C4582A]" />
        <span>{t('search_placeholder')}</span>
      </button>
    )
  }

  const pillStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '999px',
    fontFamily: "'Outfit', sans-serif",
    boxShadow: focused
      ? '0 8px 40px rgba(28,22,19,0.15), 0 0 0 2px rgba(196,88,42,0.2)'
      : '0 8px 40px rgba(28,22,19,0.12)',
    border: '0.5px solid rgba(237,224,204,0.8)',
    transition: 'box-shadow 200ms ease',
    overflow: 'hidden',
  }

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {/* ── Desktop: horizontal pill ── */}
      <div className="hidden md:flex items-center" style={pillStyle}>

        {/* WHERE */}
        <div className="relative flex-1 min-w-0" ref={destRef}>
          <div className="flex items-center gap-2.5 px-5 py-3.5 hover:bg-[#F7F0E6]/60 rounded-full transition-colors">
            <MapPin className="w-3.5 h-3.5 text-[#C4582A] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <label
                className="block mb-0.5"
                style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1C1613' }}
              >
                {locale === 'ar' ? 'الوجهة' : 'Where'}
              </label>
              <input
                type="text"
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                onFocus={() => setShowDestinations(true)}
                placeholder={t('search_placeholder')}
                className="w-full text-sm text-[#1C1613] placeholder:text-[#C0B8B0] outline-none bg-transparent"
              />
            </div>
          </div>
          {/* Suggestions dropdown */}
          {showDestinations && (
            <div
              className="absolute top-full mt-2 bg-white rounded-2xl py-2 z-50 w-56"
              style={{ border: '0.5px solid rgba(122,106,94,0.2)', boxShadow: '0 8px 32px rgba(28,22,19,0.12)' }}
            >
              {DESTINATIONS.filter((d) =>
                !where || (isRTL ? d.ar : d.en).toLowerCase().includes(where.toLowerCase())
              ).map((d) => (
                <button
                  key={d.key}
                  type="button"
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#1C1613] hover:bg-[#F7F0E6] transition-colors text-start"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                  onClick={() => { setWhere(isRTL ? d.ar : d.en); setShowDestinations(false) }}
                >
                  <MapPin className="w-3.5 h-3.5 text-[#C4582A]" />
                  {isRTL ? d.ar : d.en}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-[#EDE0CC] flex-shrink-0" />

        {/* CHECK-IN */}
        <CalendarPopover
          label={locale === 'ar' ? 'تسجيل الدخول' : 'Check-in'}
          value={checkIn}
          onChange={setCheckIn}
          minDate={new Date()}
          locale={locale}
        />

        <div className="w-px h-8 bg-[#EDE0CC] flex-shrink-0" />

        {/* CHECK-OUT */}
        <CalendarPopover
          label={locale === 'ar' ? 'تسجيل الخروج' : 'Check-out'}
          value={checkOut}
          onChange={setCheckOut}
          minDate={checkIn ?? new Date()}
          locale={locale}
        />

        <div className="w-px h-8 bg-[#EDE0CC] flex-shrink-0" />

        {/* GUESTS — stepper */}
        <div className="flex items-center gap-0">
          <div className="px-5 py-3.5">
            <div
              className="mb-0.5 text-[10px] text-[#1C1613]"
              style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.12em', textTransform: 'uppercase' }}
            >
              {locale === 'ar' ? 'الضيوف' : 'Guests'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGuests(Math.max(1, guests - 1))}
                disabled={guests <= 1}
                className="w-6 h-6 rounded-full border border-[#EDE0CC] flex items-center justify-center text-[#7A6A5E] hover:border-[#C4582A] hover:text-[#C4582A] disabled:opacity-30 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm text-[#1C1613] w-4 text-center" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {guests}
              </span>
              <button
                type="button"
                onClick={() => setGuests(Math.min(20, guests + 1))}
                disabled={guests >= 20}
                className="w-6 h-6 rounded-full border border-[#EDE0CC] flex items-center justify-center text-[#7A6A5E] hover:border-[#C4582A] hover:text-[#C4582A] disabled:opacity-30 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Search button — flush right */}
          <button
            onClick={handleSearch}
            className="m-1.5 w-12 h-12 rounded-full bg-[#C4582A] hover:bg-[#A8471F] text-white flex items-center justify-center flex-shrink-0 transition-colors active:scale-95"
            style={{ boxShadow: '0 4px 16px rgba(196,88,42,0.3)' }}
            aria-label={t('search_button')}
          >
            <Search style={{ width: '1.1rem', height: '1.1rem' }} />
          </button>
        </div>
      </div>

      {/* ── Mobile: stacked ── */}
      <div
        className="md:hidden rounded-2xl overflow-hidden"
        style={{ background: 'white', border: '0.5px solid rgba(237,224,204,0.8)', boxShadow: '0 4px 20px rgba(28,22,19,0.1)' }}
      >
        {/* Destination */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[#EDE0CC]">
          <MapPin className="w-4 h-4 text-[#C4582A] flex-shrink-0" />
          <input
            type="text"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder={t('search_placeholder')}
            className="flex-1 text-sm text-[#1C1613] placeholder:text-[#C0B8B0] outline-none bg-transparent"
          />
        </div>

        {/* Dates — mobile uses same CalendarPopover component */}
        <div className="grid grid-cols-2 divide-x divide-[#EDE0CC] border-b border-[#EDE0CC]">
          <CalendarPopover
            label={locale === 'ar' ? 'الوصول' : 'Check-in'}
            value={checkIn}
            onChange={setCheckIn}
            minDate={new Date()}
            locale={locale}
          />
          <CalendarPopover
            label={locale === 'ar' ? 'المغادرة' : 'Check-out'}
            value={checkOut}
            onChange={setCheckOut}
            minDate={checkIn ?? new Date()}
            locale={locale}
          />
        </div>

        {/* Guests + Search */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Users className="w-4 h-4 text-[#C4582A] flex-shrink-0" />
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))}
              className="w-6 h-6 rounded-full border border-[#EDE0CC] flex items-center justify-center text-[#7A6A5E] hover:border-[#C4582A] disabled:opacity-30"
              disabled={guests <= 1}>
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-sm text-[#1C1613] w-4 text-center">{guests}</span>
            <button type="button" onClick={() => setGuests(Math.min(20, guests + 1))}
              className="w-6 h-6 rounded-full border border-[#EDE0CC] flex items-center justify-center text-[#7A6A5E] hover:border-[#C4582A] disabled:opacity-30"
              disabled={guests >= 20}>
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={handleSearch}
            className="ms-auto flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#C4582A] hover:bg-[#A8471F] text-white text-[11px] transition-colors active:scale-95"
            style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            <Search className="w-3.5 h-3.5" />
            {t('search_button')}
          </button>
        </div>
      </div>
    </div>
  )
}
