import Image from 'next/image'
import { SearchBar } from '@/components/search/SearchBar'
import { ListingCard, type ListingCardData } from '@/components/listings/ListingCard'
import { ListingCardSkeleton } from '@/components/listings/ListingCardSkeleton'
import { HeroAnimated } from '@/components/shared/HeroAnimated'
import { ScrollReveal } from '@/components/shared/ScrollReveal'
import { WhyCard } from '@/components/shared/WhyCard'
import { prisma } from '@/lib/prisma'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

/* ── Destination quick pills ── */
const DESTINATIONS = [
  { key: 'north-coast',  ar: 'الساحل الشمالي', en: 'North Coast' },
  { key: 'ain-sokhna',   ar: 'العين السخنة',   en: 'Ain Sokhna' },
  { key: 'cairo',        ar: 'القاهرة',         en: 'Cairo' },
  { key: 'hurghada',     ar: 'الغردقة',         en: 'Hurghada' },
  { key: 'el-gouna',     ar: 'الجونة',          en: 'El Gouna' },
  { key: 'dahab',        ar: 'دهب',             en: 'Dahab' },
  { key: 'sharm',        ar: 'شرم الشيخ',       en: 'Sharm El Sheikh' },
]

/* SVG icons — 1px stroke, terra color */
function IconArabicFirst() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M12 32c0-7 5-12 12-12s12 5 12 12" stroke="#C4582A" strokeWidth="1" strokeLinecap="round"/>
      <path d="M17 22c2-3 4-5 7-5" stroke="#C4582A" strokeWidth="1" strokeLinecap="round"/>
      <path d="M26 16h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1l-2 2-2-2h-3a2 2 0 0 1-2-2v-4" stroke="#C4582A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30 20h3M30 23h2" stroke="#C4582A" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

function IconPayEGP() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="13" stroke="#C4582A" strokeWidth="1"/>
      <path d="M20 18h7a3 3 0 0 1 0 6h-7v6" stroke="#C4582A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 18v12" stroke="#C4582A" strokeWidth="1" strokeLinecap="round"/>
      <path d="M18 22h9" stroke="#C4582A" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

function IconBNPL() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="14" y="17" width="20" height="14" rx="2" stroke="#C4582A" strokeWidth="1"/>
      <path d="M14 21h20" stroke="#C4582A" strokeWidth="1"/>
      <path d="M19 26h4M28 26h1" stroke="#C4582A" strokeWidth="1" strokeLinecap="round"/>
      <path d="M24 13v4M24 31v4" stroke="#C4582A" strokeWidth="0.8" strokeLinecap="round"/>
      <path d="M30 14l-2 3M18 14l2 3" stroke="#C4582A" strokeWidth="0.8" strokeLinecap="round"/>
    </svg>
  )
}

function IconVerified() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M24 13l-11 4v10c0 6 5 11 11 13 6-2 11-7 11-13V17l-11-4z" stroke="#C4582A" strokeWidth="1" strokeLinejoin="round"/>
      <path d="M20 24l3 3 6-6" stroke="#C4582A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="12" stroke="#C4582A" strokeWidth="1"/>
      <path d="M24 18v6l4 4" stroke="#C4582A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="36" cy="13" r="4" stroke="#C4582A" strokeWidth="0.8"/>
      <path d="M34.5 13l1 1.5 2-2" stroke="#C4582A" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const WHY_ITEMS = [
  {
    Icon: IconArabicFirst,
    titleAr: 'عربي أولاً',
    titleEn: 'Arabic-First',
    descAr: 'واجهة مصممة للمصريين، بالعامية المصرية الأصيلة',
    descEn: 'Designed for Egyptians, in authentic Egyptian Arabic',
  },
  {
    Icon: IconPayEGP,
    titleAr: 'دفع بالجنيه المصري',
    titleEn: 'Pay in EGP',
    descAr: 'فيزا، فوري، فودافون كاش، ميزة — بدون رسوم تحويل',
    descEn: 'Visa, Fawry, Vodafone Cash, Meeza — no conversion fees',
  },
  {
    Icon: IconBNPL,
    titleAr: 'ادفع بالتقسيط',
    titleEn: 'Buy Now, Pay Later',
    descAr: 'قسّط إجازتك مع فاليو — 3 أو 6 أو 12 شهر',
    descEn: 'Split your holiday with ValU — 3, 6, or 12 months',
  },
  {
    Icon: IconVerified,
    titleAr: 'مضيفون موثقون',
    titleEn: 'Verified Hosts',
    descAr: 'كل المضيفين موثقون ببطاقة الهوية الوطنية لضمان الأمان',
    descEn: 'All hosts verified with National ID for your safety',
  },
  {
    Icon: IconClock,
    titleAr: 'احجز في دقائق',
    titleEn: 'Book in Minutes',
    descAr: 'لا داعي لإنشاء حساب للتصفح. احجز في أقل من 3 دقائق',
    descEn: 'No account needed to browse. Book in under 3 minutes.',
  },
]

async function getTrendingListings() {
  try {
    return await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      take: 6,
      orderBy: [{ totalBookings: 'desc' }, { createdAt: 'desc' }],
      include: {
        images: { take: 1, orderBy: { isCover: 'desc' } },
        host: { select: { nationalIdVerified: true } },
      },
    })
  } catch {
    return []
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isRTL = locale === 'ar'
  const trending = await getTrendingListings()

  const cardHeadingStyle: React.CSSProperties = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 300, fontSize: '0.9rem' }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.8rem' }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ════════════════════════════════════
          HERO
      ════════════════════════════════════ */}
      <section className="relative min-h-[660px] md:min-h-[720px] flex flex-col items-center justify-center px-4 py-20 overflow-hidden">

        {/* Background image */}
        <Image
          src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&q=75"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />

        {/* Charcoal overlay 55% */}
        <div className="absolute inset-0 bg-[#1C1613]/55" />

        {/* Noise texture */}
        <div className="absolute inset-0 noise-overlay opacity-[0.04] pointer-events-none" aria-hidden />

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto w-full">

          {/* Eyebrow */}
          <div
            className="inline-block text-[#C4582A] text-[10px] mb-6 tracking-[0.3em] uppercase"
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 100,
              animation: 'word-in 500ms cubic-bezier(0.22,1,0.36,1) both',
            }}
          >
            {locale === 'ar' ? 'إيجارات قصيرة المدى في مصر' : 'Egyptian Short-Term Rentals'}
          </div>

          {/* Headline — staggered words */}
          <HeroAnimated
            text={locale === 'ar' ? 'اكتشف إجازتك المثالية في مصر' : 'Discover Your Perfect Egyptian Escape'}
            isRTL={isRTL}
            className="text-white mb-6 block"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)' } as React.CSSProperties}
          />

          {/* Subtitle */}
          <p
            className="text-white/70 mb-10 max-w-[580px] mx-auto"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 300,
              fontSize: '17px',
              lineHeight: 1.65,
              animation: 'word-in 500ms cubic-bezier(0.22,1,0.36,1) 360ms both',
            }}
          >
            {locale === 'ar'
              ? 'شاليهات الساحل الشمالي، فيلات العين السخنة، شقق القاهرة — كل ذلك بالجنيه المصري'
              : <>North Coast chalets, Ain Sokhna villas, Cairo apartments&nbsp;—&nbsp;<span className="whitespace-nowrap">all in EGP</span></>}
          </p>

          {/* Search bar */}
          <div
            className="max-w-3xl mx-auto"
            style={{ animation: 'word-in 500ms cubic-bezier(0.22,1,0.36,1) 420ms both' }}
          >
            <SearchBar locale={locale} />
          </div>

          {/* Destination pills */}
          <div
            className="flex flex-wrap justify-center gap-2 mt-7 overflow-x-auto"
            style={{
              scrollbarWidth: 'none',
              animation: 'word-in 500ms cubic-bezier(0.22,1,0.36,1) 480ms both',
            }}
          >
            {DESTINATIONS.map((dest) => (
              <Link
                key={dest.key}
                href={`/${locale}/listings?where=${dest.key}`}
                className="destination-pill flex items-center gap-2 px-3.5 py-1.5 rounded-full text-white/85 text-sm whitespace-nowrap transition-all duration-200"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 300,
                  background: 'rgba(255,255,255,0.1)',
                  border: '0.5px solid rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                {isRTL ? dest.ar : dest.en}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          STATS — Brand trust pillars
      ════════════════════════════════════ */}
      <div className="bg-[#1C1613]" dir="ltr">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            {[
              {
                label:  locale === 'ar' ? 'تسعير بالجنيه فقط'     : 'EGP PRICING ONLY',
                desc:   locale === 'ar' ? 'بدون رسوم خفية أو تحويل عملة' : 'No hidden fees. No conversion.',
              },
              {
                label:  locale === 'ar' ? 'تقسيط فاليو'            : 'VALU BNPL',
                desc:   locale === 'ar' ? 'قسّط على 3، 6، أو 12 شهر'     : 'Split into 3, 6, or 12 months.',
              },
              {
                label:  locale === 'ar' ? 'عربي أولاً'              : 'ARABIC-FIRST',
                desc:   locale === 'ar' ? 'مبني للمصريين، بالعربي'        : 'Built for Egyptians, in Arabic.',
              },
            ].map(({ label, desc }) => (
              <div key={label} className="text-center px-8 py-6">
                <div
                  className="text-[#F7F0E6] text-xs mb-1.5"
                  style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.22em', textTransform: 'uppercase' }}
                >
                  {label}
                </div>
                <div
                  className="text-white/40 text-xs leading-relaxed"
                  style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
                >
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          TRENDING LISTINGS
      ════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ScrollReveal>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2
                className="text-[#1C1613] mb-3"
                style={{
                  fontFamily: isRTL ? "'Tajawal', sans-serif" : "'Josefin Sans', sans-serif",
                  fontWeight: isRTL ? 200 : 100,
                  letterSpacing: isRTL ? '0' : '0.22em',
                  textTransform: isRTL ? 'none' : 'uppercase',
                  fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)',
                }}
              >
                {isRTL ? 'الأماكن الأكثر طلباً' : 'Trending Now'}
              </h2>
              {/* Short terra accent underline */}
              <div style={{ width: 32, height: 2, background: '#C4582A' }} />
            </div>
            <Link
              href={`/${locale}/listings`}
              className="flex items-center gap-1.5 text-[#C4582A] text-sm hover:text-[#A8471F] transition-colors"
              style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 400 }}
            >
              {isRTL ? 'عرض الكل' : 'See all'}
              <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 card-grid">
          {trending.length > 0
            ? trending.map((listing) => {
                const cardData: ListingCardData = {
                  id: listing.id,
                  titleAr: listing.titleAr,
                  titleEn: listing.titleEn,
                  governorate: listing.governorate,
                  city: listing.city,
                  compound: listing.compound,
                  pricePerNight: Number(listing.pricePerNight),
                  averageRating: listing.averageRating,
                  totalBookings: listing.totalBookings,
                  images: listing.images.map((img) => ({ url: img.url, isCover: img.isCover })),
                  bnplEnabled: listing.bnplEnabled,
                  instantBook: listing.instantBook,
                  host: listing.host ? { nationalIdVerified: listing.host.nationalIdVerified } : null,
                  propertyType: listing.propertyType,
                }
                return <ListingCard key={listing.id} listing={cardData} locale={locale} />
              })
            : [...Array(6)].map((_, i) => <ListingCardSkeleton key={i} />)
          }
        </div>
      </section>

      {/* ════════════════════════════════════
          WHY MANZILI
      ════════════════════════════════════ */}
      <section style={{ background: '#EDE0CC', padding: '80px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2
                className="text-[#1C1613] mb-4"
                style={{
                  fontFamily: isRTL ? "'Tajawal', sans-serif" : "'Josefin Sans', sans-serif",
                  fontWeight: isRTL ? 200 : 100,
                  letterSpacing: isRTL ? '0' : '0.22em',
                  textTransform: isRTL ? 'none' : 'uppercase',
                  fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)',
                }}
              >
                {isRTL ? 'لماذا منزلي؟' : 'Why Manzili?'}
              </h2>
              <p
                className="text-[#7A6A5E] text-sm max-w-sm mx-auto"
                style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300, lineHeight: 1.7 }}
              >
                {isRTL
                  ? 'منصة مصرية 100٪ — مصممة لك، بلغتك، وبعملتك'
                  : '100% Egyptian platform — built for you, in your language, in your currency'}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {WHY_ITEMS.map(({ Icon, titleAr, titleEn, descAr, descEn }, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <WhyCard>
                  <div className="flex justify-center mb-5">
                    <Icon />
                  </div>
                  <h3 className="text-[#1C1613] mb-3" style={cardHeadingStyle}>
                    {isRTL ? titleAr : titleEn}
                  </h3>
                  <p
                    className="text-[#7A6A5E] leading-relaxed"
                    style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300, fontSize: '12.5px' }}
                  >
                    {isRTL ? descAr : descEn}
                  </p>
                </WhyCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          HOST CTA — single, above footer
      ════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ScrollReveal>
          <div
            className="rounded-2xl overflow-hidden relative px-8 md:px-16 py-14 md:py-16"
            style={{ background: '#1C1613' }}
          >
            {/* Noise grain overlay */}
            <div className="absolute inset-0 noise-overlay opacity-[0.06] pointer-events-none" aria-hidden />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-start">
              <div className={isRTL ? 'text-center md:text-right' : 'text-center md:text-left'}>
                <h2
                  className="text-white mb-3"
                  style={{
                    fontFamily: isRTL ? "'Tajawal', sans-serif" : "'Josefin Sans', sans-serif",
                    fontWeight: isRTL ? 200 : 100,
                    letterSpacing: isRTL ? '0' : '0.22em',
                    textTransform: isRTL ? 'none' : 'uppercase',
                    fontSize: 'clamp(1.4rem, 3vw, 2.8rem)',
                    lineHeight: 1.1,
                  }}
                >
                  {isRTL
                    ? 'عندك عقار؟\nحوله لمصدر دخل'
                    : <>Have a property?<br />Turn it into income</>
                  }
                </h2>
                <p
                  className="text-white/60"
                  style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300, fontSize: '15px' }}
                >
                  {isRTL
                    ? 'انضم لآلاف المضيفين المصريين واكسب من شقتك أو شاليهك'
                    : 'Join thousands of Egyptian hosts and earn from your apartment or chalet'}
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 flex-shrink-0">
                <Link
                  href={`/${locale}/auth/register`}
                  className="btn-brand-outline px-8 py-3 text-white text-[11px] whitespace-nowrap"
                  style={{
                    fontFamily: isRTL ? "'Tajawal', sans-serif" : "'Josefin Sans', sans-serif",
                    fontWeight: isRTL ? 300 : 100,
                    letterSpacing: isRTL ? '0' : '0.14em',
                    textTransform: isRTL ? 'none' : 'uppercase',
                  }}
                >
                  {isRTL ? 'أصبح مضيفاً الآن' : 'Become a Host'}
                </Link>
                <span
                  className="text-[11px]"
                  style={{ color: '#7A6A5E', fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
                >
                  {isRTL ? 'انضم لأكثر من 6 مضيفين يكسبون على منزلي' : 'Join 6+ hosts already earning on Manzili'}
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

    </div>
  )
}
