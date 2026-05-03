import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = new URL(request.url).searchParams.get('status')

  const bookings = await prisma.booking.findMany({
    where: {
      listing: { hostId: user.id },
      ...(status ? { status: status as any } : {}),
    },
    include: {
      listing: { select: { titleAr: true, titleEn: true, images: { take: 1 } } },
      guest: { select: { fullNameAr: true, fullNameEn: true, avatarUrl: true, email: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ bookings })
}
