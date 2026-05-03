import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (dbUser?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [totalListings, totalUsers, totalBookings, gmv, pendingListings, recentBookings] = await Promise.all([
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count(),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.booking.aggregate({ where: { paymentStatus: 'CAPTURED' }, _sum: { totalGuestPays: true } }),
    prisma.listing.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.booking.findMany({
      where: { paymentStatus: 'CAPTURED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, totalGuestPays: true, createdAt: true, paymentMethod: true },
    }),
  ])

  return NextResponse.json({
    totalListings,
    totalUsers,
    totalBookings,
    totalGMV: Number(gmv._sum.totalGuestPays ?? 0),
    pendingListings,
    recentBookings,
  })
}
