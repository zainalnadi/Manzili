import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// ── PATCH /api/conversations/[id]/read — mark all messages as read ────────────

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const conversation = await prisma.conversation.findUnique({ where: { id } })
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isParticipant = conversation.guestId === user.id || conversation.hostId === user.id
  if (!isParticipant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.directMessage.updateMany({
    where: {
      conversationId: id,
      senderId: { not: user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
