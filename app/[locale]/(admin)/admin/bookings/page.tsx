import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatEGP } from '@/lib/utils/format'

export default async function AdminBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { locale } = await params
  const { status, q } = await searchParams
  const isRTL = locale === 'ar'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (dbUser?.role !== 'ADMIN') redirect(`/${locale}`)

  const statusFilter = status && status !== 'ALL' ? { status: status as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED' | 'COMPLETED' | 'CHECKED_IN' } : {}

  const bookings = await prisma.booking.findMany({
    where: {
      ...statusFilter,
      ...(q ? {
        OR: [
          { listing: { titleEn: { contains: q, mode: 'insensitive' } } },
          { listing: { titleAr: { contains: q, mode: 'insensitive' } } },
          { guest: { email: { contains: q, mode: 'insensitive' } } },
          { guest: { fullNameEn: { contains: q, mode: 'insensitive' } } },
        ],
      } : {}),
    },
    include: {
      listing: { select: { titleAr: true, titleEn: true, governorate: true } },
      guest: { select: { fullNameAr: true, fullNameEn: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const statusConfig: Record<string, { ar: string; en: string; color: string }> = {
    PENDING:    { ar: 'في الانتظار', en: 'Pending',    color: '#C9973A' },
    CONFIRMED:  { ar: 'مؤكد',       en: 'Confirmed',  color: '#8FA68B' },
    CHECKED_IN: { ar: 'في العقار',  en: 'Checked In', color: '#C4582A' },
    COMPLETED:  { ar: 'مكتمل',      en: 'Completed',  color: '#7A6A5E' },
    CANCELLED:  { ar: 'ملغي',       en: 'Cancelled',  color: '#9A8878' },
    REJECTED:   { ar: 'مرفوض',      en: 'Rejected',   color: '#9A8878' },
  }

  const statuses = ['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'REJECTED']
  const statusLabels: Record<string, { ar: string; en: string }> = {
    ALL: { ar: 'الكل', en: 'All' },
    ...Object.fromEntries(Object.entries(statusConfig).map(([k, v]: [string, { ar: string; en: string; color: string }]) => [k, { ar: v.ar, en: v.en }])),
  }

  const headingStyle = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200 }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' as const }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="mb-8">
        <h1 className="text-2xl text-[#1C1613]" style={headingStyle}>
          {locale === 'ar' ? 'إدارة الحجوزات' : 'Booking Management'}
        </h1>
        <p className="text-[#7A6A5E] text-sm mt-0.5">
          {locale === 'ar' ? `${bookings.length} حجز` : `${bookings.length} booking${bookings.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {statuses.map((s: typeof statuses[number]) => (
            <a
              key={s}
              href={`?status=${s}${q ? `&q=${q}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                (status ?? 'ALL') === s
                  ? 'bg-[#1C1613] text-white'
                  : 'bg-white border border-[#EDE0CC] text-[#7A6A5E] hover:border-[#C4582A]'
              }`}
            >
              {locale === 'ar' ? statusLabels[s].ar : statusLabels[s].en}
            </a>
          ))}
        </div>

        {/* Search */}
        <form method="GET" className="ms-auto">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
            className="px-3 py-1.5 bg-white border border-[#EDE0CC] rounded-lg text-sm text-[#1C1613] focus:outline-none focus:border-[#C4582A] w-48"
          />
          {status && <input type="hidden" name="status" value={status} />}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#EDE0CC] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F7F0E6] border-b border-[#EDE0CC]">
              <tr>
                <th className="text-start px-4 py-3 font-semibold text-[#7A6A5E] whitespace-nowrap">{locale === 'ar' ? 'الحجز' : 'Booking'}</th>
                <th className="text-start px-4 py-3 font-semibold text-[#7A6A5E] whitespace-nowrap">{locale === 'ar' ? 'العقار' : 'Listing'}</th>
                <th className="text-start px-4 py-3 font-semibold text-[#7A6A5E] whitespace-nowrap">{locale === 'ar' ? 'الضيف' : 'Guest'}</th>
                <th className="text-start px-4 py-3 font-semibold text-[#7A6A5E] whitespace-nowrap">{locale === 'ar' ? 'التواريخ' : 'Dates'}</th>
                <th className="text-start px-4 py-3 font-semibold text-[#7A6A5E] whitespace-nowrap">{locale === 'ar' ? 'المبلغ' : 'Amount'}</th>
                <th className="text-start px-4 py-3 font-semibold text-[#7A6A5E] whitespace-nowrap">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE0CC]">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#7A6A5E]">
                    {locale === 'ar' ? 'لا توجد حجوزات' : 'No bookings found'}
                  </td>
                </tr>
              ) : (
                bookings.map((b: typeof bookings[number]) => {
                  const sc = statusConfig[b.status] ?? statusConfig.PENDING
                  const guestName = (locale === 'ar' ? b.guest.fullNameAr : b.guest.fullNameEn) ?? b.guest.email
                  const listingTitle = (locale === 'ar' ? b.listing.titleAr : b.listing.titleEn) ?? '—'

                  return (
                    <tr key={b.id} className="hover:bg-[#F7F0E6] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-[#7A6A5E]">{b.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1C1613] text-sm truncate max-w-[160px]">{listingTitle}</p>
                        <p className="text-xs text-[#7A6A5E]">{b.listing.governorate}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1C1613] text-sm">{guestName}</p>
                        <p className="text-xs text-[#7A6A5E] font-mono" dir="ltr">{b.guest.email}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-[#7A6A5E]" dir="ltr">
                        {new Date(b.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                        {' — '}
                        {new Date(b.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                        <br />
                        {b.nights} {locale === 'ar' ? 'ليلة' : 'nights'}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#1C1613]">
                        {formatEGP(Number(b.totalGuestPays), locale)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${sc.color}18`, color: sc.color }}>
                          {locale === 'ar' ? sc.ar : sc.en}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {bookings.length === 100 && (
        <p className="text-center text-xs text-[#7A6A5E] mt-4">
          {locale === 'ar' ? 'يتم عرض أحدث 100 حجز' : 'Showing latest 100 bookings'}
        </p>
      )}
    </div>
  )
}
