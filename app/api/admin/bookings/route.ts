import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get('status') ?? undefined
  const q = searchParams.get('q') ?? undefined
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  const status = statusParam as BookingStatus | undefined

  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: 'insensitive' as const } },
            { guest: { email: { contains: q, mode: 'insensitive' as const } } },
            { listing: { titleEn: { contains: q, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        listing: { select: { id: true, titleEn: true, titleAr: true } },
        guest: { select: { id: true, fullNameEn: true, fullNameAr: true, email: true } },
      },
    }),
    prisma.booking.count({ where }),
  ])

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      id: b.id,
      status: b.status,
      paymentStatus: b.paymentStatus,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      nights: b.nights,
      totalAmount: Number(b.totalGuestPays),
      totalHostReceives: Number(b.totalHostReceives),
      createdAt: b.createdAt,
      listing: b.listing,
      guest: b.guest,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}
