import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SendMessageSchema = z.object({
  bookingId: z.string().uuid(),
  body: z.string().min(1).max(2000),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bookingId = request.nextUrl.searchParams.get('bookingId')
  if (!bookingId) return NextResponse.json({ error: 'bookingId query param is required' }, { status: 400 })

  // Verify user is guest or host of this booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { select: { hostId: true } } },
  })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const isGuest = booking.guestId === user.id
  const isHost = booking.listing.hostId === user.id
  if (!isGuest && !isHost) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const messages = await prisma.message.findMany({
    where: { bookingId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: {
        select: {
          id: true,
          fullNameAr: true,
          fullNameEn: true,
          avatarUrl: true,
        },
      },
    },
  })

  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = SendMessageSchema.parse(body)

    // Verify user is guest or host of this booking
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { listing: { select: { hostId: true } } },
    })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const isGuest = booking.guestId === user.id
    const isHost = booking.listing.hostId === user.id
    if (!isGuest && !isHost) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Determine the other party id (messages they sent should be marked as read)
    const otherPartyId = isGuest ? booking.listing.hostId : booking.guestId

    // Mark existing unread messages from the other party as read
    await prisma.message.updateMany({
      where: {
        bookingId: data.bookingId,
        senderId: otherPartyId,
        isRead: false,
      },
      data: { isRead: true },
    })

    // Create new message
    const message = await prisma.message.create({
      data: {
        bookingId: data.bookingId,
        senderId: user.id,
        body: data.body,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullNameAr: true,
            fullNameEn: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Notify the recipient
    await prisma.notification.create({
      data: {
        userId: otherPartyId,
        type: 'MESSAGE_RECEIVED',
        titleAr: 'رسالة جديدة',
        titleEn: 'New message',
        bodyAr: `لديك رسالة جديدة بشأن حجزك.`,
        bodyEn: `You have a new message regarding your booking.`,
        data: { bookingId: data.bookingId, messageId: message.id },
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
