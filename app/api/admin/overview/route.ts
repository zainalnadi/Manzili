import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    totalUsers, newUsersThisMonth, newUsersLastMonth,
    totalListings, pendingListings, activeListings, activeListingsLastMonth,
    totalBookings, pendingBookings, confirmedBookingsThisMonth, confirmedBookingsLastMonth,
    pendingVerifications, openReports,
    monthRevenue, lastMonthRevenue,
    recentAudit, recentBookings,
    rawRevenueSeries,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.listing.count({ where: { status: 'ACTIVE', createdAt: { lte: endOfLastMonth } } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] }, createdAt: { gte: startOfMonth } } }),
    prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] }, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    prisma.user.count({ where: { nationalIdVerified: false, nationalId: { not: null } } }),
    prisma.listingReport.count({ where: { status: 'PENDING' } }),
    prisma.booking.aggregate({ where: { paymentStatus: 'CAPTURED', checkIn: { gte: startOfMonth } }, _sum: { totalGuestPays: true } }),
    prisma.booking.aggregate({ where: { paymentStatus: 'CAPTURED', checkIn: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { totalGuestPays: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 15 }),
    prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] } },
      orderBy: { createdAt: 'desc' }, take: 10,
      include: { listing: { select: { titleEn: true, titleAr: true } }, guest: { select: { fullNameEn: true, fullNameAr: true } } },
    }),
    // Revenue grouped by checkIn month for last 6 months
    prisma.$queryRaw<{ month_start: Date; total: number }[]>`
      SELECT DATE_TRUNC('month', "checkIn") as month_start, SUM("totalGuestPays")::float as total
      FROM "Booking"
      WHERE "paymentStatus" = 'CAPTURED' AND "checkIn" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "checkIn")
      ORDER BY month_start
    `,
  ])

  // Build 6-month bucket array (always 6 months even if data is sparse)
  const monthlyRevenueSeries = Array.from({ length: 6 }, (_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const label = monthDate.toLocaleDateString('en-GB', { month: 'short' })
    const match = rawRevenueSeries.find(r => {
      const d = new Date(r.month_start)
      return d.getFullYear() === monthDate.getFullYear() && d.getMonth() === monthDate.getMonth()
    })
    return { month: label, total: match ? Number(match.total) : 0 }
  })

  const thisRevenue = Number(monthRevenue._sum?.totalGuestPays ?? 0)
  const lastRevenue = Number(lastMonthRevenue._sum?.totalGuestPays ?? 0)

  return NextResponse.json({
    stats: {
      totalUsers, newUsersThisMonth, newUsersLastMonth,
      totalListings, pendingListings, activeListings, activeListingsLastMonth,
      totalBookings, pendingBookings, confirmedBookingsThisMonth, confirmedBookingsLastMonth,
      pendingVerifications, openReports,
      monthRevenue: thisRevenue, lastMonthRevenue: lastRevenue,
    },
    recentAudit,
    recentBookings: recentBookings.map(b => ({
      id: b.id, status: b.status, totalAmount: Number(b.totalGuestPays),
      createdAt: b.createdAt,
      listingTitle: b.listing.titleEn ?? b.listing.titleAr,
      guestName: b.guest.fullNameEn ?? b.guest.fullNameAr,
    })),
    monthlyRevenueSeries,
  })
}
