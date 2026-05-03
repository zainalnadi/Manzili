import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatEGP } from '@/lib/utils/format'
import { Star, Home, Calendar, TrendingUp, Plus, Pause, Play, Pencil } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { DashboardClient } from './DashboardClient'

export default async function HostDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isRTL = locale === 'ar'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || !['HOST', 'PROPERTY_MANAGER', 'ADMIN'].includes(dbUser.role)) {
    redirect(`/${locale}`)
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const [activeListings, pendingBookings, upcomingBookings, monthRevenue, avgRating, myListings] = await Promise.all([
    prisma.listing.count({ where: { hostId: user.id, status: 'ACTIVE' } }),
    prisma.booking.findMany({
      where: { listing: { hostId: user.id }, status: 'PENDING' },
      include: {
        listing: { select: { titleAr: true, titleEn: true } },
        guest: { select: { fullNameAr: true, fullNameEn: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    }),
    prisma.booking.findMany({
      where: { listing: { hostId: user.id }, status: { in: ['CONFIRMED', 'CHECKED_IN'] }, checkIn: { gte: now, lte: in14Days } },
      include: {
        listing: { select: { titleAr: true, titleEn: true } },
        guest: { select: { fullNameAr: true, fullNameEn: true } },
      },
      orderBy: { checkIn: 'asc' },
      take: 8,
    }),
    prisma.booking.aggregate({
      where: { listing: { hostId: user.id }, paymentStatus: 'CAPTURED', createdAt: { gte: startOfMonth } },
      _sum: { totalHostReceives: true },
    }),
    prisma.review.aggregate({
      where: { listing: { hostId: user.id } },
      _avg: { overallRating: true },
    }),
    prisma.listing.findMany({
      where: { hostId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        images: { take: 1, orderBy: { order: 'asc' } },
        _count: { select: { bookings: true } },
      },
    }),
  ])

  const hostName = locale === 'ar' ? dbUser.fullNameAr : dbUser.fullNameEn

  const stats = [
    { icon: <Home className="w-5 h-5" />, value: activeListings, labelAr: 'إعلانات نشطة', labelEn: 'Active Listings', color: '#C4582A' },
    { icon: <Calendar className="w-5 h-5" />, value: upcomingBookings.length, labelAr: 'حجوزات قادمة', labelEn: 'Upcoming (14d)', color: '#8FA68B' },
    { icon: <TrendingUp className="w-5 h-5" />, value: formatEGP(Number(monthRevenue._sum.totalHostReceives ?? 0), locale), labelAr: 'إيرادات الشهر', labelEn: "Month Revenue", color: '#C9973A' },
    { icon: <Star className="w-5 h-5" />, value: avgRating._avg.overallRating?.toFixed(1) ?? '—', labelAr: 'متوسط التقييم', labelEn: 'Avg Rating', color: '#C9973A' },
  ]

  const pendingForClient = pendingBookings.map((b) => ({
    id: b.id,
    nights: b.nights,
    totalHostReceives: Number(b.totalHostReceives),
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
    adultsCount: b.adultsCount,
    childrenCount: b.childrenCount,
    guestName: (locale === 'ar' ? b.guest.fullNameAr : b.guest.fullNameEn) ?? '',
    listingTitle: (locale === 'ar' ? b.listing.titleAr : b.listing.titleEn) ?? '',
  }))

  const statusColors: Record<string, string> = {
    ACTIVE: '#8FA68B',
    PAUSED: '#9A8878',
    DRAFT: '#C9973A',
    PENDING_REVIEW: '#C9973A',
    REJECTED: '#C4582A',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Outfit, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1613]">
            {locale === 'ar' ? `مرحباً، ${hostName}` : `Welcome, ${hostName}`}
          </h1>
          <p className="text-[#7A6A5E] text-sm mt-0.5">{locale === 'ar' ? 'لوحة تحكم المضيف' : 'Host Dashboard'}</p>
        </div>
        <Link href={`/${locale}/host/listings/new`} className="flex items-center gap-2 bg-[#1C1613] hover:bg-[#C4582A] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          {locale === 'ar' ? 'إضافة إعلان' : 'Add Listing'}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon, value, labelAr, labelEn, color }) => (
          <div key={labelEn} className="bg-white rounded-xl border border-[#EDE0CC] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-bold text-[#1C1613]">{value}</span>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
                {icon}
              </div>
            </div>
            <p className="text-sm text-[#7A6A5E]">{locale === 'ar' ? labelAr : labelEn}</p>
          </div>
        ))}
      </div>

      {/* Pending requests — client component with Accept/Decline */}
      <DashboardClient locale={locale} pendingBookings={pendingForClient} />

      {/* Upcoming check-ins */}
      <div className="bg-white rounded-xl border border-[#EDE0CC] p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#1C1613]">{locale === 'ar' ? 'الوصول القادم (14 يوم)' : 'Upcoming Check-ins (14 days)'}</h2>
          <Link href={`/${locale}/host/bookings`} className="text-sm text-[#C4582A] hover:underline">{locale === 'ar' ? 'عرض الكل' : 'View all'}</Link>
        </div>
        {upcomingBookings.length > 0 ? (
          <div className="space-y-3">
            {upcomingBookings.map((b) => {
              const guestName = locale === 'ar' ? b.guest.fullNameAr : b.guest.fullNameEn
              const listingTitle = locale === 'ar' ? b.listing.titleAr : b.listing.titleEn
              return (
                <div key={b.id} className="flex items-center gap-4 p-3 bg-[#F7F0E6] rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-[#C4582A] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {guestName?.[0]?.toUpperCase() ?? 'G'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1C1613] text-sm truncate">{guestName}</p>
                    <p className="text-xs text-[#7A6A5E] truncate">{listingTitle}</p>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <p className="text-xs font-medium text-[#1C1613]">
                      {new Date(b.checkIn).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-EG', { month: 'short', day: 'numeric' })}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'CONFIRMED' ? 'bg-[#8FA68B]/10 text-[#8FA68B]' : 'bg-[#C4582A]/10 text-[#C4582A]'}`}>
                      {b.status === 'CONFIRMED' ? (locale === 'ar' ? 'مؤكد' : 'Confirmed') : (locale === 'ar' ? 'جاري' : 'Active')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-[#7A6A5E] text-sm text-center py-8">{locale === 'ar' ? 'لا توجد حجوزات قادمة' : 'No upcoming check-ins'}</p>
        )}
      </div>

      {/* My Listings */}
      <div className="bg-white rounded-xl border border-[#EDE0CC] p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#1C1613]">{locale === 'ar' ? 'إعلاناتي' : 'My Listings'}</h2>
          <Link href={`/${locale}/host/listings`} className="text-sm text-[#C4582A] hover:underline">{locale === 'ar' ? 'عرض الكل' : 'View all'}</Link>
        </div>
        {myListings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#7A6A5E] text-sm mb-4">{locale === 'ar' ? 'لم تضف إعلانات بعد' : 'No listings yet'}</p>
            <Link href={`/${locale}/host/listings/new`}
              className="inline-block bg-[#C4582A] text-white px-5 py-2 rounded-xl text-sm hover:bg-[#A8471F] transition-colors">
              {locale === 'ar' ? '+ إضافة إعلان' : '+ Add Listing'}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myListings.map((l) => {
              const title = locale === 'ar' ? l.titleAr : l.titleEn
              const cover = l.images[0]?.url
              const statusColor = statusColors[l.status] ?? '#9A8878'
              const statusLabel = {
                ACTIVE:         { ar: 'نشط',           en: 'Active' },
                PAUSED:         { ar: 'متوقف',          en: 'Paused' },
                DRAFT:          { ar: 'مسودة',          en: 'Draft' },
                PENDING_REVIEW: { ar: 'قيد المراجعة',  en: 'Under Review' },
                REJECTED:       { ar: 'مرفوض',          en: 'Rejected' },
              }[l.status] ?? { ar: l.status, en: l.status }

              return (
                <div key={l.id} className="flex items-center gap-4 p-3 rounded-xl border border-[#EDE0CC] hover:bg-[#F7F0E6] transition-colors">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#F7F0E6]">
                    {cover && <Image src={cover} alt={title ?? ''} fill className="object-cover" sizes="56px" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1C1613] text-sm truncate">{title}</p>
                    <p className="text-xs text-[#7A6A5E]">{l.city}, {l.governorate}</p>
                    <p className="text-xs text-[#9A8878]">
                      {l._count.bookings} {locale === 'ar' ? 'حجز' : 'bookings'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                      {locale === 'ar' ? statusLabel.ar : statusLabel.en}
                    </span>
                    <Link href={`/${locale}/host/listings/${l.id}/edit`}
                      className="p-1.5 rounded-lg border border-[#EDE0CC] text-[#7A6A5E] hover:text-[#C4582A] hover:border-[#C4582A] transition-colors"
                      title={locale === 'ar' ? 'تعديل' : 'Edit'}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <Link href={`/${locale}/host/pricing/${l.id}`}
                      className="p-1.5 rounded-lg border border-[#EDE0CC] text-[#7A6A5E] hover:text-[#C4582A] hover:border-[#C4582A] transition-colors"
                      title={locale === 'ar' ? 'التسعير' : 'Pricing'}>
                      <Calendar className="w-3.5 h-3.5" />
                    </Link>
                    <ListingToggle listingId={l.id} currentStatus={l.status} locale={locale} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { href: `/${locale}/host/listings/new`, ar: '+ إضافة إعلان جديد', en: '+ Add New Listing', color: '#1C1613' },
          { href: `/${locale}/host/listings`, ar: 'إعلاناتي', en: 'My Listings', color: '#C4582A' },
          { href: `/${locale}/host/bookings`, ar: 'إدارة الحجوزات', en: 'Manage Bookings', color: '#C4582A' },
          { href: `/${locale}/host/messages`, ar: 'رسائل الضيوف', en: 'Guest Messages', color: '#7A6A5E' },
          { href: `/${locale}/host/payouts`, ar: 'سجل المدفوعات', en: 'Payout History', color: '#8FA68B' },
        ].map(({ href, ar, en, color }) => (
          <Link key={href} href={href} className="p-4 bg-white border border-[#EDE0CC] rounded-xl text-center font-medium text-sm hover:shadow-md transition-shadow" style={{ color }}>
            {locale === 'ar' ? ar : en}
          </Link>
        ))}
      </div>
    </div>
  )
}

// Inline server-renderable toggle placeholder — actual toggling via client component
function ListingToggle({ listingId, currentStatus, locale }: { listingId: string; currentStatus: string; locale: string }) {
  const isPaused = currentStatus === 'PAUSED'
  return (
    <form action={`/api/host/listings/${listingId}/toggle`} method="POST">
      <button type="submit"
        className="p-1.5 rounded-lg border border-[#EDE0CC] text-[#7A6A5E] hover:text-[#C4582A] hover:border-[#C4582A] transition-colors"
        title={isPaused ? (locale === 'ar' ? 'تفعيل' : 'Activate') : (locale === 'ar' ? 'إيقاف مؤقت' : 'Pause')}
        disabled={currentStatus === 'REJECTED' || currentStatus === 'DRAFT' || currentStatus === 'PENDING_REVIEW'}
      >
        {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
      </button>
    </form>
  )
}
