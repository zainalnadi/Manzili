import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      listings: { select: { id: true, titleEn: true, titleAr: true, status: true, createdAt: true }, take: 10 },
      guestBookings: { select: { id: true, status: true, totalGuestPays: true, createdAt: true }, take: 10 },
      warnings: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { status, role, banReason, nationalIdVerified } = body

  const updateData: Record<string, unknown> = {}
  if (status) {
    updateData.status = status
    if (status === 'BANNED') {
      updateData.bannedAt = new Date()
      updateData.banReason = banReason ?? 'Banned by admin'
    } else {
      updateData.bannedAt = null
      updateData.banReason = null
    }
  }
  if (role) updateData.role = role
  if (nationalIdVerified !== undefined) updateData.nationalIdVerified = nationalIdVerified

  const user = await prisma.user.update({ where: { id }, data: updateData })

  const action = nationalIdVerified !== undefined
    ? (nationalIdVerified ? 'APPROVE_ID_VERIFICATION' : 'REJECT_ID_VERIFICATION')
    : status ? `SET_USER_${status}` : `SET_USER_ROLE_${role}`

  await prisma.auditLog.create({
    data: {
      adminEmail: session.email,
      action,
      entity: 'user',
      entityId: id,
      detail: banReason ?? undefined,
    },
  })

  return NextResponse.json(user)
}
