import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CalendarManager } from '@/components/host/CalendarManager'

export default async function HostCalendarPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { titleAr: true, titleEn: true, hostId: true },
  })

  if (!listing) redirect(`/${locale}/host/listings`)

  // Only the owner (or admins) may manage the calendar
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect(`/${locale}/auth/login`)
  if (listing.hostId !== user.id && dbUser.role !== 'ADMIN') {
    redirect(`/${locale}/host/listings`)
  }

  const [blockedDateRows, bookingRows] = await Promise.all([
    prisma.blockedDate.findMany({
      where: { listingId: id },
      orderBy: { date: 'asc' },
    }),
    prisma.booking.findMany({
      where: {
        listingId: id,
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
      },
      select: { checkIn: true, checkOut: true, id: true },
    }),
  ])

  const blockedDates = blockedDateRows.map((r) => r.date.toISOString())
  const bookingRanges = bookingRows.map((b) => ({
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
    id: b.id,
  }))

  const title = locale === 'ar' ? listing.titleAr : listing.titleEn

  return (
    <CalendarManager
      listingId={id}
      title={title}
      blockedDates={blockedDates}
      bookingRanges={bookingRanges}
      locale={locale}
    />
  )
}
