import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { status, reason } = await req.json()
  const booking = await prisma.booking.update({ where: { id }, data: { status: status as BookingStatus, cancellationReason: reason, cancelledAt: new Date() } })
  await prisma.auditLog.create({ data: { adminEmail: session.email, action: 'CANCEL_BOOKING', entity: 'booking', entityId: id, detail: reason } })
  return NextResponse.json(booking)
}
