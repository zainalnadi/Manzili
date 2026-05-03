import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatEGP } from '@/lib/utils/format'
import Link from 'next/link'
import { CheckCircle, XCircle } from 'lucide-react'

export default async function AdminDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isRTL = locale === 'ar'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (dbUser?.role !== 'ADMIN') redirect(`/${locale}`)

  const [totalListings, totalUsers, totalBookings, gmv, pendingListings, recentBookings] = await Promise.all([
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count(),
    prisma.booking.count(),
    prisma.booking.aggregate({ where: { paymentStatus: 'CAPTURED' }, _sum: { totalGuestPays: true } }),
    prisma.listing.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: { host: { select: { fullNameAr: true, fullNameEn: true, nationalIdVerified: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.booking.findMany({
      where: { paymentStatus: 'CAPTURED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, totalGuestPays: true, paymentMethod: true, createdAt: true },
    }),
  ])

  const stats = [
    { label: locale === 'ar' ? 'إعلانات نشطة' : 'Active Listings', value: totalListings, color: '#C4582A' },
    { label: locale === 'ar' ? 'المستخدمون' : 'Total Users', value: totalUsers, color: '#8FA68B' },
    { label: locale === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings', value: totalBookings, color: '#1C1613' },
    { label: locale === 'ar' ? 'إجمالي الإيرادات' : 'Total GMV', value: formatEGP(Number(gmv._sum.totalGuestPays ?? 0), locale), color: '#C9973A' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-[#1C1613]"
          style={isRTL
            ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200, fontSize: '1.5rem' }
            : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '1.3rem' }
          }
        >{locale === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}</h1>
        <div className="flex gap-3">
          <Link href={`/${locale}/admin/bookings`} className="text-sm bg-white border border-[#EDE0CC] text-[#7A6A5E] px-4 py-2 rounded-lg hover:border-[#C4582A] hover:text-[#C4582A] transition-colors">
            {locale === 'ar' ? 'الحجوزات' : 'Bookings'}
          </Link>
          <Link href={`/${locale}/admin/users`} className="text-sm bg-[#C4582A] text-white px-4 py-2 rounded-lg hover:bg-[#A8471F] transition-colors">
            {locale === 'ar' ? 'إدارة المستخدمين' : 'Manage Users'}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-[#EDE0CC] rounded-xl p-5">
            <div className="text-2xl font-bold mb-1" style={{ color }}>{value}</div>
            <p className="text-sm text-[#7A6A5E]">{label}</p>
          </div>
        ))}
      </div>

      {/* Pending listings approval */}
      <div className="bg-white border border-[#EDE0CC] rounded-xl p-6 mb-6">
        <h2
          className="text-[#1C1613] mb-4"
          style={isRTL
            ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200, fontSize: '1rem' }
            : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.8rem' }
          }
        >
          {locale === 'ar' ? `الإعلانات في انتظار المراجعة (${pendingListings.length})` : `Listings Pending Review (${pendingListings.length})`}
        </h2>
        {pendingListings.length > 0 ? (
          <div className="space-y-3">
            {pendingListings.map((l) => {
              const hostName = locale === 'ar' ? l.host.fullNameAr : l.host.fullNameEn
              const title = locale === 'ar' ? l.titleAr : l.titleEn
              return (
                <div key={l.id} className="flex items-center gap-4 p-3 bg-[#F7F0E6] rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1C1613] text-sm truncate">{title}</p>
                    <p className="text-xs text-[#7A6A5E]">{hostName} · {l.governorate}, {l.city}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <form action={`/api/admin/listings/${l.id}/approve`} method="POST">
                      <button className="flex items-center gap-1 text-xs bg-[#8FA68B] text-white px-3 py-1.5 rounded-lg">
                        <CheckCircle className="w-3 h-3" />
                        {locale === 'ar' ? 'موافقة' : 'Approve'}
                      </button>
                    </form>
                    <form action={`/api/admin/listings/${l.id}/reject`} method="POST">
                      <button className="flex items-center gap-1 text-xs bg-[#C4582A]/10 text-[#C4582A] px-3 py-1.5 rounded-lg">
                        <XCircle className="w-3 h-3" />
                        {locale === 'ar' ? 'رفض' : 'Reject'}
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-[#7A6A5E] text-sm">{locale === 'ar' ? 'لا توجد إعلانات في الانتظار' : 'No pending listings'}</p>
        )}
      </div>

      {/* Recent bookings */}
      <div className="bg-white border border-[#EDE0CC] rounded-xl p-6">
        <h2
          className="text-[#1C1613] mb-4"
          style={isRTL
            ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200, fontSize: '1rem' }
            : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.8rem' }
          }
        >{locale === 'ar' ? 'أحدث الحجوزات' : 'Recent Bookings'}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EDE0CC] text-[#7A6A5E]">
                <th className="text-start pb-2 font-medium">{locale === 'ar' ? 'رقم الحجز' : 'Booking ID'}</th>
                <th className="text-start pb-2 font-medium">{locale === 'ar' ? 'المبلغ' : 'Amount'}</th>
                <th className="text-start pb-2 font-medium">{locale === 'ar' ? 'طريقة الدفع' : 'Payment'}</th>
                <th className="text-start pb-2 font-medium">{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE0CC]">
              {recentBookings.map((b) => (
                <tr key={b.id}>
                  <td className="py-2 font-mono text-xs text-[#7A6A5E]">{b.id.slice(0, 8)}...</td>
                  <td className="py-2 font-medium text-[#1C1613]">{formatEGP(Number(b.totalGuestPays), locale)}</td>
                  <td className="py-2 text-[#1C1613]">{b.paymentMethod}</td>
                  <td className="py-2 text-[#7A6A5E]">{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
