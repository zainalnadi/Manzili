import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  try {
    const count = await prisma.message.count({
      where: {
        isRead: false,
        senderId: { not: user.id },
        booking: {
          OR: [{ guestId: user.id }, { listing: { hostId: user.id } }],
        },
      },
    })
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
