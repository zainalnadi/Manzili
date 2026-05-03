import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const roleParam = searchParams.get('role') ?? undefined
  const q = searchParams.get('q') ?? undefined
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  const role = roleParam as UserRole | undefined

  const where = {
    ...(role ? { role } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' as const } },
            { fullNameEn: { contains: q, mode: 'insensitive' as const } },
            { fullNameAr: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        fullNameEn: true,
        fullNameAr: true,
        role: true,
        createdAt: true,
        avatarUrl: true,
        nationalIdVerified: true,
        status: true,
        bannedAt: true,
        banReason: true,
        _count: { select: { listings: true, guestBookings: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      _count: { listings: u._count.listings, bookings: u._count.guestBookings },
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}
