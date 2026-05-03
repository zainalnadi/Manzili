import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatEGP, formatDate } from '@/lib/utils/format'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function HostBookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isRTL = locale === 'ar'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const bookings = await prisma.booking.findMany({
    where: { listing: { hostId: user.id } },
    include: {
      listing: { select: { titleAr: true, titleEn: true } },
      guest: { select: { fullNameAr: true, fullNameEn: true, avatarUrl: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const statusGroups = {
    PENDING: bookings.filter((b) => b.status === 'PENDING'),
    CONFIRMED: bookings.filter((b) => b.status === 'CONFIRMED'),
    COMPLETED: bookings.filter((b) => b.status === 'COMPLETED'),
    CANCELLED: bookings.filter((b) => ['CANCELLED', 'REJECTED'].includes(b.status)),
  }

  const statusColors: Record<string, string> = {
    PENDING: '#C9973A', CONFIRMED: '#8FA68B', CHECKED_IN: '#C4582A', COMPLETED: '#7A6A5E', CANCELLED: '#C4582A', REJECTED: '#C4582A',
  }

  const statusLabels: Record<string, { ar: string; en: string }> = {
    PENDING: { ar: 'في الانتظار', en: 'Pending' }, CONFIRMED: { ar: 'مؤكد', en: 'Confirmed' },
    CHECKED_IN: { ar: 'في العقار', en: 'Checked In' }, COMPLETED: { ar: 'مكتمل', en: 'Completed' },
    CANCELLED: { ar: 'ملغي', en: 'Cancelled' }, REJECTED: { ar: 'مرفوض', en: 'Rejected' },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Outfit, sans-serif' }}>
      <h1 className="text-2xl font-bold text-[#1C1613] mb-6">{locale === 'ar' ? 'الحجوزات' : 'Bookings'}</h1>

      {/* Pending bookings — needs action */}
      {statusGroups.PENDING.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-[#C9973A] uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {locale === 'ar' ? `في الانتظار (${statusGroups.PENDING.length})` : `Pending Action (${statusGroups.PENDING.length})`}
          </h2>
          <div className="space-y-3">
            {statusGroups.PENDING.map((b) => <BookingRow key={b.id} booking={b} locale={locale} showActions />)}
          </div>
        </div>
      )}

      {/* All others */}
      {bookings.filter((b) => b.status !== 'PENDING').length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#7A6A5E] uppercase tracking-wide mb-3">{locale === 'ar' ? 'كل الحجوزات' : 'All Bookings'}</h2>
          <div className="space-y-3">
            {bookings.filter((b) => b.status !== 'PENDING').map((b) => <BookingRow key={b.id} booking={b} locale={locale} />)}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="text-center py-16 text-[#7A6A5E]">
          <p>{locale === 'ar' ? 'لا توجد حجوزات بعد' : 'No bookings yet'}</p>
        </div>
      )}
    </div>
  )
}

function BookingRow({ booking: b, locale, showActions }: { booking: any; locale: string; showActions?: boolean }) {
  const isRTL = locale === 'ar'
  const guestName = locale === 'ar' ? b.guest.fullNameAr : b.guest.fullNameEn
  const listingTitle = locale === 'ar' ? b.listing.titleAr : b.listing.titleEn

  return (
    <div className="bg-white border border-[#EDE0CC] rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-[#C4582A] flex items-center justify-center text-white font-bold flex-shrink-0">{guestName?.[0]?.toUpperCase() ?? 'G'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-[#1C1613] text-sm">{guestName}</p>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${b.status === 'CONFIRMED' ? '#8FA68B' : b.status === 'PENDING' ? '#C9973A' : b.status === 'CANCELLED' ? '#C4582A' : '#7A6A5E'}15`, color: b.status === 'CONFIRMED' ? '#8FA68B' : b.status === 'PENDING' ? '#C9973A' : b.status === 'CANCELLED' ? '#C4582A' : '#7A6A5E' }}>
            {locale === 'ar' ? ({ PENDING: 'في الانتظار', CONFIRMED: 'مؤكد', CHECKED_IN: 'في العقار', COMPLETED: 'مكتمل', CANCELLED: 'ملغي', REJECTED: 'مرفوض' } as Record<string, string>)[b.status] ?? b.status : b.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-xs text-[#7A6A5E] truncate">{listingTitle} · {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</p>
      </div>
      <div className="text-end flex-shrink-0">
        <p className="font-bold text-[#1C1613]">{formatEGP(Number(b.totalGuestPays), locale)}</p>
        {showActions && (
          <div className="flex gap-2 mt-2">
            <form action={`/api/bookings/${b.id}/confirm`} method="POST">
              <button type="submit" className="flex items-center gap-1 text-xs bg-[#8FA68B] text-white px-2.5 py-1 rounded-lg hover:bg-[#6E9B6A]">
                <CheckCircle className="w-3 h-3" />
                {locale === 'ar' ? 'قبول' : 'Accept'}
              </button>
            </form>
            <form action={`/api/bookings/${b.id}/cancel`} method="POST">
              <button type="submit" className="flex items-center gap-1 text-xs bg-[#C4582A]/10 text-[#C4582A] px-2.5 py-1 rounded-lg hover:bg-[#C4582A]/20">
                <XCircle className="w-3 h-3" />
                {locale === 'ar' ? 'رفض' : 'Decline'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
