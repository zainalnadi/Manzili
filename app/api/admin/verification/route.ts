import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Users who have submitted a national ID but aren't yet verified
  const users = await prisma.user.findMany({
    where: {
      nationalIdVerified: false,
      nationalId: { not: null },
    },
    select: {
      id: true,
      fullNameEn: true,
      fullNameAr: true,
      email: true,
      nationalId: true,
      nationalIdImageUrl: true,
      nationalIdVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  return NextResponse.json({ users })
}
