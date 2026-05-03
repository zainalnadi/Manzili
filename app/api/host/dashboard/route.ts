import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const [activeListings, upcomingBookings, monthRevenue, avgRating] = await Promise.all([
    prisma.listing.count({ where: { hostId: user.id, status: 'ACTIVE' } }),
    prisma.booking.findMany({
      where: { listing: { hostId: user.id }, status: { in: ['CONFIRMED', 'CHECKED_IN'] }, checkIn: { gte: now, lte: in14Days } },
      include: { listing: { select: { titleAr: true, titleEn: true } }, guest: { select: { fullNameAr: true, fullNameEn: true, avatarUrl: true } } },
      orderBy: { checkIn: 'asc' },
      take: 10,
    }),
    prisma.booking.aggregate({
      where: { listing: { hostId: user.id }, paymentStatus: 'CAPTURED', createdAt: { gte: startOfMonth } },
      _sum: { totalHostReceives: true },
    }),
    prisma.review.aggregate({
      where: { listing: { hostId: user.id } },
      _avg: { overallRating: true },
    }),
  ])

  return NextResponse.json({
    activeListings,
    upcomingBookings,
    monthlyRevenue: Number(monthRevenue._sum.totalHostReceives ?? 0),
    averageRating: avgRating._avg.overallRating ?? null,
  })
}
