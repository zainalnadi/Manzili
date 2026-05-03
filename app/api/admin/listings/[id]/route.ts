import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { ListingStatus } from '@prisma/client'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, fullNameEn: true, fullNameAr: true, email: true, avatarUrl: true } },
      images: { orderBy: { order: 'asc' } },
      reviews: { orderBy: { createdAt: 'desc' }, take: 5, include: { author: { select: { fullNameEn: true } } } },
      _count: { select: { bookings: true, reviews: true } },
    },
  })
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(listing)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { status, adminNote } = body

  const listing = await prisma.listing.update({
    where: { id },
    data: { status: status as ListingStatus },
  })

  await prisma.auditLog.create({
    data: {
      adminEmail: session.email,
      action: status === 'ACTIVE' ? 'APPROVE_LISTING' : status === 'REJECTED' ? 'REJECT_LISTING' : 'UPDATE_LISTING_STATUS',
      entity: 'listing',
      entityId: id,
      detail: adminNote ?? `Status → ${status}`,
    },
  })

  return NextResponse.json(listing)
}
