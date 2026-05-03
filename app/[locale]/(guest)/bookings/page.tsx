import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { BookingsClient } from './BookingsClient'
import { AuthGuard } from '@/components/shared/AuthGuard'

export default async function GuestBookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <AuthGuard locale={locale}>
        <div />
      </AuthGuard>
    )
  }

  const bookings = await prisma.booking.findMany({
    where: { guestId: user.id },
    include: {
      listing: {
        select: {
          titleAr: true,
          titleEn: true,
          governorate: true,
          city: true,
          images: { take: 1, orderBy: { order: 'asc' } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const serialized = bookings.map((b: typeof bookings[number]) => ({
    id: b.id,
    status: b.status,
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
    nights: b.nights,
    adultsCount: b.adultsCount,
    childrenCount: b.childrenCount,
    totalGuestPays: Number(b.totalGuestPays),
    listing: {
      titleAr: b.listing.titleAr,
      titleEn: b.listing.titleEn,
      governorate: b.listing.governorate,
      city: b.listing.city,
      image: b.listing.images[0]?.url ?? null,
    },
  }))

  return <BookingsClient locale={locale} bookings={serialized} />
}
