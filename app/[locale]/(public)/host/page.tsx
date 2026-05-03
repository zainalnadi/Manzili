'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

// ── Earnings Estimator Data ────────────────────────────────────────────────────

const PROPERTY_TYPES_EST = [
  { id: 'APARTMENT', en: 'Apartment', ar: 'شقة' },
  { id: 'CHALET', en: 'Chalet', ar: 'شاليه' },
  { id: 'VILLA', en: 'Villa', ar: 'فيلا' },
  { id: 'STUDIO', en: 'Studio', ar: 'استوديو' },
  { id: 'TOWNHOUSE', en: 'Townhouse', ar: 'تاون هاوس' },
  { id: 'PENTHOUSE', en: 'Penthouse', ar: 'بنتهاوس' },
]

const LOCATIONS = [
  'North Coast', 'Ain Sokhna', 'Cairo', 'Hurghada', 'El Gouna',
  'Dahab', 'Sharm El-Sheikh', 'Alexandria',
]

// EGP monthly earnings ranges per (type × location)
const EARNINGS: Record<string, Record<string, [number, number]>> = {
  APARTMENT: {
    'Cairo': [8000, 18000], 'Alexandria': [10000, 22000],
    'North Coast': [25000, 55000], 'Hurghada': [12000, 28000],
    'El Gouna': [14000, 32000], 'Ain Sokhna': [20000, 45000],
    'Dahab': [8000, 18000], 'Sharm El-Sheikh': [12000, 26000],
  },
  CHALET: {
    'Cairo': [6000, 14000], 'Alexandria': [18000, 40000],
    'North Coast': [35000, 80000], 'Hurghada': [15000, 35000],
    'El Gouna': [18000, 42000], 'Ain Sokhna': [28000, 65000],
    'Dahab': [10000, 24000], 'Sharm El-Sheikh': [15000, 35000],
  },
  VILLA: {
    'Cairo': [22000, 50000], 'Alexandria': [28000, 65000],
    'North Coast': [60000, 140000], 'Hurghada': [30000, 70000],
    'El Gouna': [40000, 90000], 'Ain Sokhna': [50000, 110000],
    'Dahab': [18000, 40000], 'Sharm El-Sheikh': [30000, 70000],
  },
  STUDIO: {
    'Cairo': [5000, 11000], 'Alexandria': [7000, 16000],
    'North Coast': [18000, 40000], 'Hurghada': [8000, 18000],
    'El Gouna': [10000, 22000], 'Ain Sokhna': [14000, 32000],
    'Dahab': [6000, 14000], 'Sharm El-Sheikh': [8000, 18000],
  },
  TOWNHOUSE: {
    'Cairo': [14000, 32000], 'Alexandria': [18000, 40000],
    'North Coast': [40000, 90000], 'Hurghada': [20000, 45000],
    'El Gouna': [24000, 55000], 'Ain Sokhna': [32000, 72000],
    'Dahab': [12000, 28000], 'Sharm El-Sheikh': [18000, 42000],
  },
  PENTHOUSE: {
    'Cairo': [28000, 65000], 'Alexandria': [35000, 80000],
    'North Coast': [75000, 170000], 'Hurghada': [38000, 88000],
    'El Gouna': [50000, 115000], 'Ain Sokhna': [60000, 140000],
    'Dahab': [22000, 50000], 'Sharm El-Sheikh': [38000, 88000],
  },
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C4582A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function PoundIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C4582A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 19H6" />
      <path d="M7 9a5 5 0 0 1 10 0c0 2.5-2 4-3 5H7" />
      <path d="M6 13h8" />
    </svg>
  )
}

function SlidersIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C4582A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  )
}

function HeadsetIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C4582A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function HostLandingPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'en'
  const router = useRouter()
  const isRTL = locale === 'ar'

  const [propType, setPropType] = useState('')
  const [location, setLocation] = useState('')

  const earnings = propType && location ? EARNINGS[propType]?.[location] : null

  const josefin: React.CSSProperties = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 300 }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' as const }

  const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif", fontWeight: 300 }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[92vh] flex items-center overflow-hidden"
        style={{ background: '#1C1613' }}
      >
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            opacity: 0.04,
          }}
        />
        {/* Terracotta radial glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 700,
            height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(196,88,42,0.18) 0%, transparent 70%)',
            top: '-20%',
            right: isRTL ? 'auto' : '-10%',
            left: isRTL ? '-10%' : 'auto',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 sm:px-10 py-20 w-full">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <p
              className="text-[#C4582A] text-[10px] mb-5 tracking-[0.22em] uppercase"
              style={josefin}
            >
              {isRTL ? 'للمضيفين' : 'For Hosts'}
            </p>

            {/* Headline */}
            <h1
              className="text-white mb-6 leading-[1.08]"
              style={{
                ...josefin,
                fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
                letterSpacing: isRTL ? undefined : '0.05em',
              }}
            >
              {isRTL
                ? 'حوّل عقارك إلى دخل ثابت'
                : 'Turn Your Property\nInto Income'}
            </h1>

            <p
              className="text-[#9A8878] mb-10 text-base leading-relaxed max-w-xl"
              style={outfit}
            >
              {isRTL
                ? 'أكثر من 6 مضيفين على منزلي يكسبون من شققهم وشاليهاتهم. ابدأ اليوم مجاناً.'
                : 'Over 6 hosts on Manzili already earning from their apartments and chalets. Start today — it\'s free.'}
            </p>

            {/* Earnings Estimator */}
            <div
              className="rounded-2xl p-6 mb-8"
              style={{
                background: 'rgba(247,240,230,0.05)',
                border: '1px solid rgba(196,88,42,0.25)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p
                className="text-[#C4582A] text-[9px] tracking-[0.2em] uppercase mb-4"
                style={josefin}
              >
                {isRTL ? 'احسب دخلك المتوقع' : 'Estimate Your Earnings'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[10px] text-[#7A6A5E] mb-1.5 tracking-widest uppercase" style={josefin}>
                    {isRTL ? 'نوع العقار' : 'Property Type'}
                  </label>
                  <select
                    value={propType}
                    onChange={(e) => setPropType(e.target.value)}
                    className="w-full bg-transparent text-white text-sm outline-none px-3 rounded-xl"
                    style={{
                      height: 44,
                      border: '1px solid rgba(196,88,42,0.3)',
                      background: 'rgba(28,22,19,0.6)',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    <option value="" style={{ background: '#1C1613' }}>
                      {isRTL ? 'اختر النوع' : 'Select type'}
                    </option>
                    {PROPERTY_TYPES_EST.map((t) => (
                      <option key={t.id} value={t.id} style={{ background: '#1C1613' }}>
                        {isRTL ? t.ar : t.en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#7A6A5E] mb-1.5 tracking-widest uppercase" style={josefin}>
                    {isRTL ? 'الموقع' : 'Location'}
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-transparent text-white text-sm outline-none px-3 rounded-xl"
                    style={{
                      height: 44,
                      border: '1px solid rgba(196,88,42,0.3)',
                      background: 'rgba(28,22,19,0.6)',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    <option value="" style={{ background: '#1C1613' }}>
                      {isRTL ? 'اختر الموقع' : 'Select location'}
                    </option>
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc} style={{ background: '#1C1613' }}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {earnings ? (
                <div
                  className="rounded-xl px-5 py-4 flex items-center justify-between"
                  style={{
                    background: 'rgba(196,88,42,0.12)',
                    border: '1px solid rgba(196,88,42,0.3)',
                    animation: 'fade-in 200ms ease-out both',
                  }}
                >
                  <span className="text-[#9A8878] text-sm" style={outfit}>
                    {isRTL ? 'الدخل الشهري المتوقع' : 'Estimated Monthly Earnings'}
                  </span>
                  <span
                    className="text-white"
                    style={{ ...josefin, fontSize: '1.05rem', letterSpacing: '0.06em' }}
                  >
                    EGP {earnings[0].toLocaleString()} – {earnings[1].toLocaleString()}
                  </span>
                </div>
              ) : (
                <div
                  className="rounded-xl px-5 py-4 text-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(196,88,42,0.2)' }}
                >
                  <span className="text-[#6A5C52] text-sm" style={outfit}>
                    {isRTL ? 'اختر النوع والموقع لحساب دخلك' : 'Select type and location to see your estimate'}
                  </span>
                </div>
              )}
            </div>

            <Link
              href={`/${locale}/host/create`}
              className="inline-flex items-center gap-3 text-white transition-all active:scale-[0.98]"
              style={{
                ...josefin,
                background: '#C4582A',
                borderRadius: 999,
                height: 54,
                paddingLeft: 36,
                paddingRight: 36,
                fontSize: 13,
                letterSpacing: '0.16em',
                boxShadow: '0 8px 30px rgba(196,88,42,0.35)',
              }}
            >
              {isRTL ? 'ابدأ مجاناً' : 'Get Started Free'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#FDFAF7]">
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <p className="text-[#C4582A] text-[9px] tracking-[0.22em] uppercase mb-3 text-center" style={josefin}>
            {isRTL ? 'كيف يعمل' : 'How It Works'}
          </p>
          <h2
            className="text-[#1C1613] text-center mb-16"
            style={{ ...josefin, fontSize: 'clamp(1.5rem, 4vw, 2.4rem)' }}
          >
            {isRTL ? 'ثلاث خطوات فقط' : 'Three Simple Steps'}
          </h2>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6">
            {/* Dashed connector (desktop only) */}
            <div
              className="hidden sm:block absolute top-8 pointer-events-none"
              style={{
                left: '16.66%',
                right: '16.66%',
                borderTop: '1.5px dashed rgba(196,88,42,0.25)',
                zIndex: 0,
              }}
            />

            {[
              {
                num: '01',
                titleEn: 'List',
                titleAr: 'أضف عقارك',
                descEn: 'Create your listing in under 15 minutes. Add photos, set your price, describe your space.',
                descAr: 'أنشئ إعلانك في أقل من 15 دقيقة. أضف الصور، حدد سعرك، اصف مكانك.',
              },
              {
                num: '02',
                titleEn: 'Guests Book',
                titleAr: 'يحجز الضيوف',
                descEn: 'Guests discover your listing and book directly. You approve or use Instant Book.',
                descAr: 'يكتشف الضيوف إعلانك ويحجزون مباشرة. أنت توافق أو تفعّل الحجز الفوري.',
              },
              {
                num: '03',
                titleEn: 'You Earn',
                titleAr: 'تكسب أنت',
                descEn: 'Receive your earnings directly. No hidden fees, no surprises.',
                descAr: 'استلم أرباحك مباشرة. بدون رسوم خفية أو مفاجآت.',
              },
            ].map((step, i) => (
              <div key={i} className="relative text-center flex flex-col items-center" style={{ zIndex: 1 }}>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                  style={{ background: '#F7F0E6', border: '1px solid rgba(196,88,42,0.2)' }}
                >
                  <span
                    className="text-[#C4582A]"
                    style={{ ...josefin, fontSize: '0.95rem', letterSpacing: '0.1em' }}
                  >
                    {step.num}
                  </span>
                </div>
                <h3
                  className="text-[#1C1613] mb-3"
                  style={{ ...josefin, fontSize: '1rem' }}
                >
                  {isRTL ? step.titleAr : step.titleEn}
                </h3>
                <p className="text-[#7A6A5E] text-sm leading-relaxed max-w-[220px]" style={outfit}>
                  {isRTL ? step.descAr : step.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Manzili ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <p className="text-[#C4582A] text-[9px] tracking-[0.22em] uppercase mb-3 text-center" style={josefin}>
            {isRTL ? 'لماذا منزلي' : 'Why Manzili'}
          </p>
          <h2
            className="text-[#1C1613] text-center mb-14"
            style={{ ...josefin, fontSize: 'clamp(1.5rem, 4vw, 2.4rem)' }}
          >
            {isRTL ? 'مصمم خصيصاً للسوق المصري' : 'Built for the Egyptian Market'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: <ShieldIcon />,
                titleEn: 'Verified Guests Only',
                titleAr: 'ضيوف موثقون فقط',
                descEn: 'Every guest is ID-verified before booking. Your property is protected.',
                descAr: 'كل ضيف يتم التحقق من هويته قبل الحجز. عقارك محمي.',
              },
              {
                icon: <PoundIcon />,
                titleEn: 'Earn in EGP',
                titleAr: 'اكسب بالجنيه المصري',
                descEn: 'Local payouts in Egyptian Pounds. No currency conversion, no delays.',
                descAr: 'مدفوعات محلية بالجنيه المصري. بدون تحويل عملة أو تأخير.',
              },
              {
                icon: <SlidersIcon />,
                titleEn: 'Full Control',
                titleAr: 'تحكم كامل',
                descEn: 'Set your own prices, availability, and rules. Your property, your terms.',
                descAr: 'حدد أسعارك وتوافرك وقواعدك بنفسك. عقارك، شروطك.',
              },
              {
                icon: <HeadsetIcon />,
                titleEn: '24/7 Host Support',
                titleAr: 'دعم المضيف 24/7',
                descEn: 'Dedicated support team available round the clock for hosts in Arabic and English.',
                descAr: 'فريق دعم متخصص متاح على مدار الساعة للمضيفين بالعربية والإنجليزية.',
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="p-7 transition-shadow"
                style={{
                  borderRadius: 14,
                  border: '1px solid #EDE0CC',
                  background: '#FDFAF7',
                }}
              >
                <div className="mb-4">{benefit.icon}</div>
                <h3
                  className="text-[#1C1613] mb-2"
                  style={{ ...josefin, fontSize: '0.9rem' }}
                >
                  {isRTL ? benefit.titleAr : benefit.titleEn}
                </h3>
                <p className="text-[#7A6A5E] text-sm leading-relaxed" style={outfit}>
                  {isRTL ? benefit.descAr : benefit.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Proof ─────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: '#1C1613' }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <p className="text-[#C4582A] text-[9px] tracking-[0.22em] uppercase mb-3 text-center" style={josefin}>
            {isRTL ? 'مضيفونا يتحدثون' : 'Our Hosts Speak'}
          </p>
          <h2
            className="text-white text-center mb-14"
            style={{ ...josefin, fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)' }}
          >
            {isRTL ? 'قصص نجاح حقيقية' : 'Real Success Stories'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                nameEn: 'Nour M.', nameAr: 'نور م.',
                locationEn: 'North Coast', locationAr: 'الساحل الشمالي',
                quoteEn: 'I listed my chalet in one afternoon and had my first booking within 48 hours. Manzili made it incredibly simple.',
                quoteAr: 'أضفت شاليهي في نصف يوم وجاءني أول حجز خلال 48 ساعة. منزلي جعل الأمر سهلاً بشكل لا يصدق.',
                earningsEn: 'EGP 42,000 / month',
                earningsAr: '٤٢,٠٠٠ ج.م / شهر',
              },
              {
                nameEn: 'Ahmed K.', nameAr: 'أحمد ك.',
                locationEn: 'Ain Sokhna', locationAr: 'العين السخنة',
                quoteEn: 'The host dashboard is clean and easy. I manage three units from my phone without any issues.',
                quoteAr: 'لوحة المضيف نظيفة وسهلة. أدير ثلاث وحدات من هاتفي بدون أي مشاكل.',
                earningsEn: 'EGP 87,000 / month',
                earningsAr: '٨٧,٠٠٠ ج.م / شهر',
              },
              {
                nameEn: 'Salma R.', nameAr: 'سلمى ر.',
                locationEn: 'Cairo', locationAr: 'القاهرة',
                quoteEn: 'I was nervous about hosting but the verified guest system gave me total peace of mind.',
                quoteAr: 'كنت قلقة من الاستضافة لكن نظام التحقق من الضيوف أعطاني راحة بال كاملة.',
                earningsEn: 'EGP 18,000 / month',
                earningsAr: '١٨,٠٠٠ ج.م / شهر',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="p-6 flex flex-col justify-between"
                style={{
                  borderRadius: 16,
                  background: 'rgba(247,240,230,0.05)',
                  border: '1px solid rgba(196,88,42,0.2)',
                }}
              >
                {/* Quote mark */}
                <div className="mb-4" style={{ color: 'rgba(196,88,42,0.35)', fontSize: '2.5rem', lineHeight: 1, fontFamily: 'Georgia, serif' }}>&ldquo;</div>
                <p className="text-[#B0A090] text-sm leading-relaxed mb-6 flex-1" style={outfit}>
                  {isRTL ? t.quoteAr : t.quoteEn}
                </p>
                <div>
                  <div
                    className="text-[#C4582A] text-[10px] tracking-widest uppercase mb-2"
                    style={josefin}
                  >
                    {isRTL ? t.earningsAr : t.earningsEn}
                  </div>
                  <div className="text-white text-sm font-medium" style={outfit}>
                    {isRTL ? t.nameAr : t.nameEn}
                  </div>
                  <div className="text-[#7A6A5E] text-xs" style={outfit}>
                    {isRTL ? t.locationAr : t.locationEn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────────── */}
      <section
        className="py-24 text-center"
        style={{ background: '#C4582A' }}
      >
        <div className="max-w-2xl mx-auto px-6 sm:px-10">
          <p
            className="text-white/60 text-[9px] tracking-[0.22em] uppercase mb-4"
            style={josefin}
          >
            {isRTL ? 'ابدأ اليوم' : 'Start Today'}
          </p>
          <h2
            className="text-white mb-5"
            style={{ ...josefin, fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}
          >
            {isRTL ? 'عقارك يستحق أكثر' : 'Your Property Deserves More'}
          </h2>
          <p className="text-white/70 mb-10 text-base leading-relaxed" style={outfit}>
            {isRTL
              ? 'سجّل عقارك الآن مجاناً وابدأ في استقبال الحجوزات.'
              : 'List your property for free and start receiving bookings.'}
          </p>
          <Link
            href={`/${locale}/host/create`}
            className="inline-flex items-center gap-3 text-[#C4582A] bg-white transition-all active:scale-[0.98]"
            style={{
              ...josefin,
              borderRadius: 999,
              height: 54,
              paddingLeft: 40,
              paddingRight: 40,
              fontSize: 13,
              letterSpacing: '0.16em',
              boxShadow: '0 8px 30px rgba(28,22,19,0.2)',
            }}
          >
            {isRTL ? 'ابدأ مجاناً الآن' : 'Get Started Free'}
          </Link>
        </div>
      </section>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
