import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/format'
import { BookingWidget } from '@/components/booking/BookingWidget'
import { PhotoGallery } from '@/components/listings/PhotoGallery'
import { ReviewsList } from '@/components/listings/ReviewsList'
import { ListingMap } from '@/components/listings/ListingMap'
import { WishlistButton } from '@/components/listings/WishlistButton'
import { ShareButton } from '@/components/listings/ShareButton'
import { ReportButton } from '@/components/listings/ReportButton'
import { MessageHostSection } from '@/components/listings/MessageHostSection'
import {
  Star, CheckCircle, Wifi, Waves, Wind, Car, ChefHat, Eye, Flame, Zap, Shield, Dumbbell, Baby,
  PawPrint, CigaretteOff, PartyPopper, Clock, CheckCircle2, XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-5 h-5" />, pool: <Waves className="w-5 h-5" />, ac: <Wind className="w-5 h-5" />,
  parking: <Car className="w-5 h-5" />, kitchen: <ChefHat className="w-5 h-5" />, sea_view: <Eye className="w-5 h-5" />,
  bbq: <Flame className="w-5 h-5" />, generator: <Zap className="w-5 h-5" />, security: <Shield className="w-5 h-5" />,
  gym: <Dumbbell className="w-5 h-5" />, kids_play: <Baby className="w-5 h-5" />,
}

const AMENITY_LABELS: Record<string, { ar: string; en: string }> = {
  wifi: { ar: 'واي فاي', en: 'WiFi' }, pool: { ar: 'حمام سباحة', en: 'Swimming Pool' },
  ac: { ar: 'تكييف', en: 'Air Conditioning' }, parking: { ar: 'موقف سيارات', en: 'Parking' },
  kitchen: { ar: 'مطبخ', en: 'Kitchen' }, washer: { ar: 'غسالة', en: 'Washer' },
  sea_view: { ar: 'إطلالة بحرية', en: 'Sea View' }, beach_access: { ar: 'وصول للشاطئ', en: 'Beach Access' },
  bbq: { ar: 'شواء', en: 'BBQ' }, generator: { ar: 'مولد كهرباء', en: 'Generator' },
  security: { ar: 'حراسة أمنية', en: 'Security' }, gym: { ar: 'صالة رياضية', en: 'Gym' },
  kids_play: { ar: 'منطقة ألعاب', en: 'Kids Play Area' }, elevator: { ar: 'مصعد', en: 'Elevator' },
  balcony: { ar: 'شرفة', en: 'Balcony' }, tv: { ar: 'تليفزيون', en: 'TV' },
}

const CANCELLATION_CONFIG = {
  FLEXIBLE: {
    label: { ar: 'مرن - استرداد كامل قبل 24 ساعة', en: 'Flexible – full refund if cancelled 24h before check-in' },
    color: 'text-[#8FA68B]',
    bg: 'bg-[#8FA68B]/5',
    border: 'border-[#8FA68B]/20',
    dot: 'bg-[#8FA68B]',
  },
  MODERATE: {
    label: { ar: 'معتدل - استرداد 50% قبل 5 أيام', en: 'Moderate – 50% refund if cancelled 5+ days before' },
    color: 'text-[#C9973A]',
    bg: 'bg-[#C9973A]/5',
    border: 'border-[#C9973A]/20',
    dot: 'bg-[#C9973A]',
  },
  STRICT: {
    label: { ar: 'صارم - بدون استرداد', en: 'Strict – no refund after booking' },
    color: 'text-[#C4582A]',
    bg: 'bg-[#C4582A]/5',
    border: 'border-[#C4582A]/20',
    dot: 'bg-[#C4582A]',
  },
} as const

export default async function ListingDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  const isRTL = locale === 'ar'

  // Get current user — null is fine (not logged in)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [listing, wishlistItem] = await Promise.all([
    prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        host: {
          select: {
            id: true,
            fullNameAr: true,
            fullNameEn: true,
            avatarUrl: true,
            nationalIdVerified: true,
            createdAt: true,
          },
        },
        reviews: {
          where: { isVisible: true },
          include: { author: { select: { fullNameAr: true, fullNameEn: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
        _count: { select: { reviews: true } },
      },
    }).catch(() => null),
    user?.id
      ? prisma.wishlistItem.findFirst({ where: { userId: user.id, listingId: id } }).catch(() => null)
      : Promise.resolve(null),
  ])

  if (!listing || listing.status !== 'ACTIVE') notFound()

  const title = locale === 'ar' ? listing.titleAr : listing.titleEn
  const description = locale === 'ar' ? listing.descriptionAr : listing.descriptionEn
  const hostName = (locale === 'ar' ? listing.host.fullNameAr : listing.host.fullNameEn) ?? 'Host'
  const isWishlisted = !!wishlistItem

  const houseRulesText = locale === 'ar' ? listing.houseRulesAr : listing.houseRulesEn
  const hasHouseRules = !!(houseRulesText || listing.checkInTime || listing.checkOutTime)

  const policy = listing.cancellationPolicy as keyof typeof CANCELLATION_CONFIG
  const cancellation = CANCELLATION_CONFIG[policy] ?? CANCELLATION_CONFIG.MODERATE

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Breadcrumb */}
      <nav className="text-sm text-[#7A6A5E] mb-4 flex flex-wrap items-center gap-1.5">
        <Link href={`/${locale}`} className="hover:text-[#C4582A]">
          {locale === 'ar' ? 'الرئيسية' : 'Home'}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/listings?where=${listing.governorate}`} className="hover:text-[#C4582A]">
          {listing.governorate}
        </Link>
        {listing.compound && (
          <>
            <span>/</span>
            <span>{listing.compound}</span>
          </>
        )}
      </nav>

      {/* Title row + action buttons */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <h1 className="text-2xl md:text-3xl text-[#1C1613] flex-1 min-w-0" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>{title}</h1>
        <div className="flex items-center gap-2 flex-shrink-0 pt-1">
          <WishlistButton listingId={listing.id} initialWishlisted={isWishlisted} locale={locale} />
          <ShareButton title={title ?? ''} locale={locale} />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
        {listing.averageRating && (
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-[#C9973A] text-[#C9973A]" />
            <strong className="text-[#1C1613]">{listing.averageRating.toFixed(1)}</strong>
            <span className="text-[#7A6A5E]">({listing._count.reviews})</span>
          </span>
        )}
        <span className="text-[#7A6A5E]">
          {[listing.compound, listing.city, listing.governorate].filter(Boolean).join(', ')}
        </span>
        {listing.instantBook && (
          <Badge className="bg-[#C4582A]/10 text-[#C4582A] border-0 text-xs">
            {locale === 'ar' ? 'حجز فوري' : 'Instant Book'}
          </Badge>
        )}
        {listing.bnplEnabled && (
          <Badge className="bg-[#C9973A]/10 text-[#C9973A] border-0 text-xs">
            {locale === 'ar' ? 'تقسيط متاح' : 'BNPL Available'}
          </Badge>
        )}
      </div>

      {/* Photo gallery */}
      <PhotoGallery images={listing.images} title={title} />

      {/* Content + Booking Widget */}
      <div className="mt-8 flex flex-col lg:flex-row gap-10">
        <div className="flex-1 min-w-0 space-y-8">

          {/* Host */}
          <div className="flex items-center gap-4 pb-8 border-b border-[#EDE0CC]">
            <div className="w-14 h-14 rounded-full bg-[#EDE0CC] overflow-hidden flex-shrink-0 relative">
              {listing.host.avatarUrl
                ? <Image src={listing.host.avatarUrl} alt={hostName} fill className="object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[#1C1613]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                  {locale === 'ar' ? 'مضيفك: ' : 'Hosted by: '}{hostName}
                </h3>
                {listing.host.nationalIdVerified && <CheckCircle className="w-4 h-4 text-[#8FA68B]" />}
              </div>
              <p className="text-sm text-[#7A6A5E]">
                {locale === 'ar' ? 'عضو منذ ' : 'Member since '}
                {formatDate(listing.host.createdAt, locale)}
              </p>
            </div>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8 border-b border-[#EDE0CC]">
            {[
              { val: listing.bedrooms, ar: 'غرف نوم', en: 'Bedrooms' },
              { val: listing.bathrooms, ar: 'حمامات', en: 'Bathrooms' },
              { val: listing.maxGuests, ar: 'ضيوف', en: 'Guests max' },
              ...(listing.areaSqm ? [{ val: `${listing.areaSqm}m²`, ar: 'مساحة', en: 'Area' }] : []),
            ].map(({ val, ar, en }) => (
              <div key={en} className="text-center p-4 bg-[#F7F0E6] rounded-xl">
                <div className="text-xl font-bold text-[#C4582A]">{val}</div>
                <div className="text-xs text-[#7A6A5E] mt-1">{locale === 'ar' ? ar : en}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="pb-8 border-b border-[#EDE0CC]">
            <h2 className="text-lg text-[#1C1613] mb-3" style={isRTL
              ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200, fontSize: '1.05rem' }
              : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.85rem' }
            }>
              {locale === 'ar' ? 'عن المكان' : 'About this place'}
            </h2>
            <p className="text-[#1C1613] leading-relaxed whitespace-pre-line">{description}</p>
          </div>

          {/* Amenities */}
          {listing.amenities.length > 0 && (
            <div className="pb-8 border-b border-[#EDE0CC]">
              <h2 className="text-lg text-[#1C1613] mb-4" style={isRTL
                ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200, fontSize: '1.05rem' }
                : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.85rem' }
              }>
                {locale === 'ar' ? 'المميزات' : 'Amenities'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {listing.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-[#1C1613]">
                    <span className="text-[#C4582A] flex-shrink-0">{AMENITY_ICONS[a] ?? '✓'}</span>
                    <span className="text-sm">
                      {AMENITY_LABELS[a]
                        ? (locale === 'ar' ? AMENITY_LABELS[a].ar : AMENITY_LABELS[a].en)
                        : a}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* House Rules */}
          {hasHouseRules && (
            <div className="pb-8 border-b border-[#EDE0CC]">
              <h2 className="text-lg text-[#1C1613] mb-4" style={isRTL
                ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200, fontSize: '1.05rem' }
                : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.85rem' }
              }>
                {locale === 'ar' ? 'قواعد المنزل' : 'House Rules'}
              </h2>

              {/* Check-in / Check-out times */}
              {(listing.checkInTime || listing.checkOutTime) && (
                <div className="flex flex-wrap gap-5 mb-5">
                  {listing.checkInTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-[#C4582A] flex-shrink-0" />
                      <span className="text-[#7A6A5E]">
                        {locale === 'ar' ? 'تسجيل الوصول:' : 'Check-in:'}
                      </span>
                      <span className="font-semibold text-[#1C1613]">{listing.checkInTime}</span>
                    </div>
                  )}
                  {listing.checkOutTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-[#C4582A] flex-shrink-0" />
                      <span className="text-[#7A6A5E]">
                        {locale === 'ar' ? 'تسجيل المغادرة:' : 'Check-out:'}
                      </span>
                      <span className="font-semibold text-[#1C1613]">{listing.checkOutTime}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Pets / Smoking / Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {(
                  [
                    {
                      allowed: listing.petsAllowed,
                      icon: <PawPrint className="w-5 h-5" />,
                      ar: 'الحيوانات الأليفة',
                      en: 'Pets',
                    },
                    {
                      allowed: listing.smokingAllowed,
                      icon: <CigaretteOff className="w-5 h-5" />,
                      ar: 'التدخين',
                      en: 'Smoking',
                    },
                    {
                      allowed: listing.partiesAllowed,
                      icon: <PartyPopper className="w-5 h-5" />,
                      ar: 'الحفلات',
                      en: 'Parties',
                    },
                  ] as const
                ).map(({ allowed, icon, ar, en }) => (
                  <div
                    key={en}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      allowed
                        ? 'border-[#8FA68B]/25 bg-[#8FA68B]/5'
                        : 'border-[#EDE0CC] bg-[#F7F0E6]'
                    }`}
                  >
                    <span className={allowed ? 'text-[#8FA68B]' : 'text-[#7A6A5E]'}>{icon}</span>
                    <span className="text-sm text-[#1C1613] flex-1">
                      {locale === 'ar' ? ar : en}
                    </span>
                    {allowed
                      ? <CheckCircle2 className="w-4 h-4 text-[#8FA68B] flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-[#C4582A] flex-shrink-0" />
                    }
                  </div>
                ))}
              </div>

              {/* Rules text */}
              {houseRulesText && (
                <p className="text-sm text-[#1C1613] leading-relaxed whitespace-pre-line bg-[#F7F0E6] rounded-xl p-4 border border-[#EDE0CC]">
                  {houseRulesText}
                </p>
              )}
            </div>
          )}

          {/* Cancellation Policy */}
          <div className="pb-8 border-b border-[#EDE0CC]">
            <h2 className="text-lg text-[#1C1613] mb-4" style={isRTL
              ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200, fontSize: '1.05rem' }
              : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.85rem' }
            }>
              {locale === 'ar' ? 'سياسة الإلغاء' : 'Cancellation Policy'}
            </h2>
            <div
              className={`inline-flex items-center gap-3 px-4 py-3 rounded-xl border ${cancellation.bg} ${cancellation.border}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cancellation.dot}`} />
              <span className={`text-sm font-semibold ${cancellation.color}`}>
                {locale === 'ar' ? cancellation.label.ar : cancellation.label.en}
              </span>
            </div>
          </div>

          {/* Map */}
          {listing.latitude && listing.longitude && (
            <div className="pb-8 border-b border-[#EDE0CC]">
              <h2 className="text-lg text-[#1C1613] mb-4" style={isRTL
                ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200, fontSize: '1.05rem' }
                : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.85rem' }
              }>
                {locale === 'ar' ? 'الموقع' : 'Location'}
              </h2>
              <ListingMap lat={listing.latitude} lng={listing.longitude} title={title} />
              <p className="text-xs text-[#7A6A5E] mt-2">
                {locale === 'ar' ? 'موقع تقريبي' : 'Approximate location shown'}
              </p>
            </div>
          )}

          {/* Message the host */}
          {listing.host.id !== user?.id && (
            <MessageHostSection
              listing={{ id: listing.id, hostId: listing.host.id }}
              host={{
                id: listing.host.id,
                fullNameEn: listing.host.fullNameEn,
                fullNameAr: listing.host.fullNameAr,
                avatarUrl: listing.host.avatarUrl,
                nationalIdVerified: listing.host.nationalIdVerified,
                createdAt: listing.host.createdAt.toISOString(),
              }}
              locale={locale}
              currentUserId={user?.id ?? null}
            />
          )}

          {/* Reviews */}
          <ReviewsList
            reviews={listing.reviews}
            totalCount={listing._count.reviews}
            averageRating={listing.averageRating}
            locale={locale}
          />

          {/* Report button */}
          <div className="pt-2 pb-4">
            <ReportButton listingId={listing.id} locale={locale} />
          </div>
        </div>

        {/* Booking widget sidebar */}
        <div className="lg:w-[380px] flex-shrink-0">
          <div className="sticky top-24">
            <BookingWidget
              listing={{
                id: listing.id,
                pricePerNight: Number(listing.pricePerNight),
                cleaningFee: listing.cleaningFee ? Number(listing.cleaningFee) : 0,
                weeklyDiscount: listing.weeklyDiscount ?? 0,
                monthlyDiscount: listing.monthlyDiscount ?? 0,
                minimumNights: listing.minimumNights,
                maximumNights: listing.maximumNights ?? undefined,
                maxGuests: listing.maxGuests,
                instantBook: listing.instantBook,
                bnplEnabled: listing.bnplEnabled,
              }}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
