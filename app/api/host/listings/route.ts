import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const listings = await prisma.listing.findMany({
    where: { hostId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      images: {
        take: 1,
        orderBy: { order: 'asc' },
      },
      _count: {
        select: { bookings: true },
      },
    },
  })

  return NextResponse.json({ listings })
}
