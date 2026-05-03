import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SendSchema = z.object({
  body: z.string().min(1).max(500),
})

// ── POST /api/conversations/[id]/messages — send a reply ─────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const json = await request.json()
    const data = SendSchema.parse(json)

    // Verify user is a participant
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        listing: { select: { titleEn: true, titleAr: true } },
        guest: { select: { fullNameAr: true, fullNameEn: true } },
        host: { select: { fullNameAr: true, fullNameEn: true } },
      },
    })
    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isGuest = conversation.guestId === user.id
    const isHost = conversation.hostId === user.id
    if (!isGuest && !isHost) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Rate limit: max 5 messages per hour
    const oneHourAgo = new Date(Date.now() - 3_600_000)
    const recentCount = await prisma.directMessage.count({
      where: { senderId: user.id, createdAt: { gte: oneHourAgo } },
    })
    if (recentCount >= 5) {
      return NextResponse.json(
        { error: "You've sent a lot of messages recently. Please wait before sending more." },
        { status: 429 }
      )
    }

    // Create message
    const message = await prisma.directMessage.create({
      data: { conversationId: id, senderId: user.id, body: data.body },
      include: {
        sender: { select: { id: true, fullNameAr: true, fullNameEn: true, avatarUrl: true } },
      },
    })

    // Update lastMessageAt
    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    })

    // Notify the other party
    const recipientId = isGuest ? conversation.hostId : conversation.guestId
    const senderNameEn = isGuest
      ? (conversation.guest.fullNameEn ?? conversation.guest.fullNameAr ?? 'Guest')
      : (conversation.host.fullNameEn ?? conversation.host.fullNameAr ?? 'Host')
    const senderNameAr = isGuest
      ? (conversation.guest.fullNameAr ?? conversation.guest.fullNameEn ?? 'ضيف')
      : (conversation.host.fullNameAr ?? conversation.host.fullNameEn ?? 'مضيف')

    const listingTitleEn = conversation.listing.titleEn ?? ''
    const listingTitleAr = conversation.listing.titleAr ?? ''

    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'MESSAGE_RECEIVED',
        titleAr: 'رسالة جديدة',
        titleEn: 'New message',
        bodyAr: `${senderNameAr} رد على رسالتك بشأن ${listingTitleAr}`,
        bodyEn: `${senderNameEn} replied to your message about ${listingTitleEn}`,
        data: {
          conversationId: id,
          listingId: conversation.listingId,
          messagePreview: data.body.slice(0, 80),
        },
      },
    })

    // TODO: send reply notification via Resend when RESEND_API_KEY is set
    // Subject: `${senderNameEn} replied to your message about ${listingTitleEn}`
    // CTA: `/en/messages?c=${id}`

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    }
    console.error('[conversations messages POST]', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
