import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ users: [], listings: [], bookings: [] })

  const [users, listings, bookings] = await Promise.all([
    prisma.user.findMany({
      where: { OR: [{ email: { contains: q, mode: 'insensitive' } }, { fullNameEn: { contains: q, mode: 'insensitive' } }, { fullNameAr: { contains: q, mode: 'insensitive' } }] },
      select: { id: true, fullNameEn: true, fullNameAr: true, email: true, role: true, status: true },
      take: 5,
    }),
    prisma.listing.findMany({
      where: { OR: [{ titleEn: { contains: q, mode: 'insensitive' } }, { titleAr: { contains: q, mode: 'insensitive' } }, { city: { contains: q, mode: 'insensitive' } }] },
      select: { id: true, titleEn: true, titleAr: true, status: true, host: { select: { fullNameEn: true } } },
      take: 5,
    }),
    prisma.booking.findMany({
      where: { OR: [{ id: { contains: q, mode: 'insensitive' } }, { guest: { fullNameEn: { contains: q, mode: 'insensitive' } } }, { listing: { titleEn: { contains: q, mode: 'insensitive' } } }] },
      select: { id: true, status: true, totalGuestPays: true, guest: { select: { fullNameEn: true } }, listing: { select: { titleEn: true } } },
      take: 5,
    }),
  ])

  return NextResponse.json({
    users,
    listings,
    bookings: bookings.map(b => ({ ...b, totalGuestPays: Number(b.totalGuestPays) })),
  })
}
