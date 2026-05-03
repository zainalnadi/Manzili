import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reports = await prisma.listingReport.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      reporter: { select: { fullNameEn: true, email: true } },
      listing: { select: { id: true, titleEn: true, status: true } },
    },
  })

  return NextResponse.json({ reports })
}
