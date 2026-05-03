import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatEGP, formatDate } from '@/lib/utils/format'

export default async function PayoutsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isRTL = locale === 'ar'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const completedBookings = await prisma.booking.findMany({
    where: { listing: { hostId: user.id }, paymentStatus: 'CAPTURED' },
    orderBy: { paidAt: 'desc' },
    include: { listing: { select: { titleAr: true, titleEn: true } } },
    take: 30,
  })

  const totalEarned = completedBookings.reduce((s, b) => s + Number(b.totalHostReceives), 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Outfit, sans-serif' }}>
      <h1 className="text-2xl font-bold text-[#1C1613] mb-2">{locale === 'ar' ? 'المدفوعات' : 'Payouts'}</h1>
      <p className="text-[#7A6A5E] text-sm mb-8">{locale === 'ar' ? 'يتم صرف الأرباح خلال 24 ساعة من تسجيل دخول الضيف' : 'Payouts are released 24 hours after guest check-in'}</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-[#EDE0CC] rounded-xl p-5">
          <p className="text-sm text-[#7A6A5E] mb-1">{locale === 'ar' ? 'إجمالي الأرباح' : 'Total Earned'}</p>
          <p className="text-2xl font-bold text-[#1C1613]">{formatEGP(totalEarned, locale)}</p>
        </div>
        <div className="bg-white border border-[#EDE0CC] rounded-xl p-5">
          <p className="text-sm text-[#7A6A5E] mb-1">{locale === 'ar' ? 'عدد الحجوزات المدفوعة' : 'Paid Bookings'}</p>
          <p className="text-2xl font-bold text-[#1C1613]">{completedBookings.length}</p>
        </div>
      </div>

      <div className="bg-white border border-[#EDE0CC] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#EDE0CC]">
          <h2 className="font-bold text-[#1C1613]">{locale === 'ar' ? 'سجل الإيرادات' : 'Earnings History'}</h2>
        </div>
        {completedBookings.length > 0 ? (
          <div className="divide-y divide-[#EDE0CC]">
            {completedBookings.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-[#1C1613] text-sm truncate">{locale === 'ar' ? b.listing.titleAr : b.listing.titleEn}</p>
                  <p className="text-xs text-[#7A6A5E]">{b.paidAt ? formatDate(b.paidAt, locale) : '—'}</p>
                </div>
                <div className="text-end flex-shrink-0">
                  <p className="font-bold text-[#8FA68B]">+{formatEGP(Number(b.totalHostReceives), locale)}</p>
                  <p className="text-xs text-[#7A6A5E]">{locale === 'ar' ? 'بعد رسوم الخدمة' : 'After service fee'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-12 text-[#7A6A5E]">{locale === 'ar' ? 'لا توجد مدفوعات بعد' : 'No payouts yet'}</p>
        )}
      </div>
    </div>
  )
}
