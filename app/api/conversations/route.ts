import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const StartConversationSchema = z.object({
  listingId: z.string().uuid(),
  body: z.string().min(1).max(500),
})

// ── GET /api/conversations — all conversations for the current user ────────────

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ guestId: user.id }, { hostId: user.id }],
    },
    include: {
      listing: {
        select: {
          id: true,
          titleAr: true,
          titleEn: true,
          images: { where: { order: 0 }, take: 1, select: { url: true } },
          pricePerNight: true,
        },
      },
      guest: {
        select: { id: true, fullNameAr: true, fullNameEn: true, avatarUrl: true },
      },
      host: {
        select: { id: true, fullNameAr: true, fullNameEn: true, avatarUrl: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, body: true, senderId: true, createdAt: true, readAt: true },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  })

  // Attach unread count per conversation
  const unreadCounts = await prisma.directMessage.groupBy({
    by: ['conversationId'],
    where: {
      conversation: {
        OR: [{ guestId: user.id }, { hostId: user.id }],
      },
      senderId: { not: user.id },
      readAt: null,
    },
    _count: { id: true },
  })

  const unreadMap = new Map(unreadCounts.map((r) => [r.conversationId, r._count.id]))

  const result = conversations.map((c) => ({
    ...c,
    unreadCount: unreadMap.get(c.id) ?? 0,
  }))

  return NextResponse.json({ conversations: result })
}

// ── POST /api/conversations — start or find a conversation ────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = StartConversationSchema.parse(body)

    // Fetch listing to get host info
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId, status: 'ACTIVE' },
      select: { id: true, hostId: true, titleEn: true, titleAr: true },
    })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.hostId === user.id) {
      return NextResponse.json({ error: 'You cannot message your own listing' }, { status: 400 })
    }

    // Rate limit: max 5 messages per hour per user
    const oneHourAgo = new Date(Date.now() - 3_600_000)
    const recentCount = await prisma.directMessage.count({
      where: {
        senderId: user.id,
        createdAt: { gte: oneHourAgo },
      },
    })
    if (recentCount >= 5) {
      return NextResponse.json(
        { error: "You've sent a lot of messages recently. Please wait before sending more." },
        { status: 429 }
      )
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: { listingId_guestId: { listingId: data.listingId, guestId: user.id } },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          listingId: data.listingId,
          guestId: user.id,
          hostId: listing.hostId,
        },
      })
    }

    // Create the message
    const message = await prisma.directMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        body: data.body,
      },
      include: {
        sender: { select: { id: true, fullNameAr: true, fullNameEn: true, avatarUrl: true } },
      },
    })

    // Update lastMessageAt
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    })

    // Create notification for host
    const senderName = await prisma.user.findUnique({
      where: { id: user.id },
      select: { fullNameAr: true, fullNameEn: true },
    })
    const guestNameEn = senderName?.fullNameEn ?? senderName?.fullNameAr ?? 'A guest'
    const guestNameAr = senderName?.fullNameAr ?? senderName?.fullNameEn ?? 'ضيف'

    await prisma.notification.create({
      data: {
        userId: listing.hostId,
        type: 'MESSAGE_RECEIVED',
        titleAr: 'رسالة جديدة من ضيف',
        titleEn: 'New message from a guest',
        bodyAr: `${guestNameAr} يسألك عن ${listing.titleAr ?? listing.titleEn}`,
        bodyEn: `${guestNameEn} asked about ${listing.titleEn ?? listing.titleAr}`,
        data: {
          conversationId: conversation.id,
          listingId: data.listingId,
          messagePreview: data.body.slice(0, 80),
        },
      },
    })

    // TODO: send host notification via Resend when RESEND_API_KEY is set
    // Subject: `${guestNameEn} sent you a message about ${listing.titleEn}`
    // CTA: `/en/messages?c=${conversation.id}`

    return NextResponse.json({ conversation, message }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    }
    console.error('[conversations POST]', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
