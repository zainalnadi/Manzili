import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  try {
    const count = await prisma.directMessage.count({
      where: {
        senderId: { not: user.id },
        readAt: null,
        conversation: {
          OR: [{ guestId: user.id }, { hostId: user.id }],
        },
      },
    })
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
