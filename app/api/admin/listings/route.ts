import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { ListingStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get('status') ?? undefined
  const q = searchParams.get('q') ?? undefined
  const countOnly = searchParams.get('count') === 'true'
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  const status = statusParam as ListingStatus | undefined

  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { titleEn: { contains: q, mode: 'insensitive' as const } },
            { titleAr: { contains: q, mode: 'insensitive' as const } },
            { city: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  if (countOnly) {
    const count = await prisma.listing.count({ where })
    return NextResponse.json({ count })
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        host: { select: { id: true, fullNameEn: true, fullNameAr: true, email: true } },
        images: { take: 1, orderBy: { order: 'asc' } },
        _count: { select: { bookings: true, reviews: true } },
      },
    }),
    prisma.listing.count({ where }),
  ])

  return NextResponse.json({
    listings: listings.map((l) => ({
      id: l.id,
      titleEn: l.titleEn,
      titleAr: l.titleAr,
      status: l.status,
      city: l.city,
      governorate: l.governorate,
      propertyType: l.propertyType,
      pricePerNight: Number(l.pricePerNight),
      createdAt: l.createdAt,
      cover: l.images[0]?.url ?? null,
      host: l.host,
      bookingCount: l._count.bookings,
      reviewCount: l._count.reviews,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}
