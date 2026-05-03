import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()

  const report = await prisma.listingReport.update({
    where: { id },
    data: { status, resolvedBy: session.email },
  })

  await prisma.auditLog.create({
    data: { adminEmail: session.email, action: `REPORT_${status}`, entity: 'report', entityId: id },
  })

  return NextResponse.json(report)
}
