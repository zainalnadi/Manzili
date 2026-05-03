import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const MarkReadSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ id: z.string().uuid() }),
])

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const payload = MarkReadSchema.parse(body)

    if ('all' in payload && payload.all) {
      const { count } = await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ updated: count })
    } else {
      // Mark single notification as read — verify it belongs to this user
      const notification = await prisma.notification.findUnique({
        where: { id: (payload as { id: string }).id },
        select: { userId: true },
      })
      if (!notification) return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      if (notification.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

      const updated = await prisma.notification.update({
        where: { id: (payload as { id: string }).id },
        data: { isRead: true },
      })
      return NextResponse.json({ notification: updated })
    }
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
