import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [blockedDates, bookings] = await Promise.all([
    prisma.blockedDate.findMany({ where: { listingId: id }, select: { date: true } }),
    prisma.booking.findMany({
      where: { listingId: id, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
      select: { checkIn: true, checkOut: true },
    }),
  ])

  // Expand booking date ranges into individual days
  const bookedDays: string[] = []
  for (const b of bookings) {
    const d = new Date(b.checkIn)
    while (d < b.checkOut) {
      bookedDays.push(d.toISOString().split('T')[0])
      d.setDate(d.getDate() + 1)
    }
  }

  const blocked = [
    ...blockedDates.map((d) => d.date.toISOString().split('T')[0]),
    ...bookedDays,
  ]

  return NextResponse.json({ blocked: [...new Set(blocked)] })
}
