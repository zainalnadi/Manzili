import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: { select: { hostId: true } } },
  })

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.listing.hostId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (booking.status !== 'PENDING') return NextResponse.json({ error: 'Booking is not pending' }, { status: 400 })

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'CONFIRMED' },
  })

  await prisma.notification.create({
    data: {
      userId: booking.guestId,
      type: 'BOOKING_CONFIRMED',
      titleAr: 'تم تأكيد حجزك',
      titleEn: 'Your booking has been confirmed',
      bodyAr: 'وافق المضيف على حجزك. يمكنك الآن التحضير لرحلتك.',
      bodyEn: 'The host has confirmed your booking. You can now prepare for your trip.',
      data: { bookingId: id },
    },
  })

  const referer = req.headers.get('referer') ?? '/'
  return NextResponse.redirect(referer, { status: 303 })
}
