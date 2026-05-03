import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// ── GET /api/conversations/[id] — fetch messages in a conversation ─────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      listing: {
        select: {
          id: true,
          titleAr: true,
          titleEn: true,
          pricePerNight: true,
          images: { where: { order: 0 }, take: 1, select: { url: true } },
        },
      },
      guest: {
        select: { id: true, fullNameAr: true, fullNameEn: true, avatarUrl: true },
      },
      host: {
        select: { id: true, fullNameAr: true, fullNameEn: true, avatarUrl: true, nationalIdVerified: true },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: { id: true, fullNameAr: true, fullNameEn: true, avatarUrl: true },
          },
        },
      },
    },
  })

  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isParticipant = conversation.guestId === user.id || conversation.hostId === user.id
  if (!isParticipant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json({ conversation })
}
