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

  const isGuest = booking.guestId === user.id
  const isHost = booking.listing.hostId === user.id
  if (!isGuest && !isHost) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    return NextResponse.json({ error: 'Cannot cancel this booking' }, { status: 400 })
  }

  await prisma.booking.update({
    where: { id },
    data: {
      status: isHost ? 'REJECTED' : 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: user.id,
    },
  })

  // Notify the other party
  const notifyUserId = isHost ? booking.guestId : booking.listing.hostId
  await prisma.notification.create({
    data: {
      userId: notifyUserId,
      type: 'BOOKING_CANCELLED',
      titleAr: 'تم إلغاء الحجز',
      titleEn: 'Booking Cancelled',
      bodyAr: isHost ? 'رفض المضيف طلب حجزك.' : 'ألغى الضيف الحجز.',
      bodyEn: isHost ? 'The host declined your booking request.' : 'The guest cancelled the booking.',
      data: { bookingId: id },
    },
  })

  const referer = req.headers.get('referer') ?? '/'
  return NextResponse.redirect(referer, { status: 303 })
}
