import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [listings, bookings, verifications, reports] = await Promise.all([
    prisma.listing.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { nationalIdVerified: false, nationalId: { not: null } } }),
    prisma.listingReport.count({ where: { status: 'PENDING' } }),
  ])

  return NextResponse.json({ listings, bookings, verifications, reports })
}
