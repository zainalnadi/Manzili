import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const csv = searchParams.get('csv') === 'true'
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const [totalRevenue, platformFee, payoutsPaid, rawMonthlySeries, recentBookings] = await Promise.all([
    prisma.booking.aggregate({ where: { paymentStatus: 'CAPTURED' }, _sum: { totalGuestPays: true } }),
    prisma.booking.aggregate({ where: { paymentStatus: 'CAPTURED' }, _sum: { serviceFeeGuest: true } }),
    prisma.booking.aggregate({ where: { paymentStatus: 'CAPTURED' }, _sum: { totalHostReceives: true } }),
    prisma.$queryRaw<{ month_start: Date; revenue: number; fees: number }[]>`
      SELECT
        DATE_TRUNC('month', "checkIn") as month_start,
        SUM("totalGuestPays")::float as revenue,
        SUM("serviceFeeGuest")::float as fees
      FROM "Booking"
      WHERE "paymentStatus" = 'CAPTURED' AND "checkIn" >= ${twelveMonthsAgo}
      GROUP BY DATE_TRUNC('month', "checkIn")
      ORDER BY month_start
    `,
    prisma.booking.findMany({
      where: { paymentStatus: 'CAPTURED' },
      orderBy: { createdAt: 'desc' },
      take: csv ? 500 : 20,
      include: { listing: { select: { titleEn: true } }, guest: { select: { fullNameEn: true, email: true } } },
    }),
  ])

  // Build 12-month buckets
  const monthlySeries = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    const label = monthDate.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    const match = rawMonthlySeries.find(r => {
      const d = new Date(r.month_start)
      return d.getFullYear() === monthDate.getFullYear() && d.getMonth() === monthDate.getMonth()
    })
    return { month: label, revenue: match ? Number(match.revenue) : 0, fees: match ? Number(match.fees) : 0 }
  })

  if (csv) {
    const header = 'bookingId,guest,listing,amount,platformFee,hostReceives,date\n'
    const rows = recentBookings.map(b =>
      [b.id, b.guest.fullNameEn ?? b.guest.email, b.listing.titleEn ?? '', Number(b.totalGuestPays), Number(b.serviceFeeGuest), Number(b.totalHostReceives), b.createdAt.toISOString()].join(',')
    )
    return new NextResponse(header + rows.join('\n'), {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="financials.csv"' },
    })
  }

  return NextResponse.json({
    summary: {
      totalRevenue: Number(totalRevenue._sum?.totalGuestPays ?? 0),
      platformFee: Number(platformFee._sum?.serviceFeeGuest ?? 0),
      payoutsPaid: Number(payoutsPaid._sum?.totalHostReceives ?? 0),
    },
    monthlySeries,
    recentBookings: recentBookings.map(b => ({
      id: b.id, guest: b.guest.fullNameEn ?? b.guest.email, listing: b.listing.titleEn,
      amount: Number(b.totalGuestPays), platformFee: Number(b.serviceFeeGuest), hostReceives: Number(b.totalHostReceives), date: b.createdAt,
    })),
  })
}
