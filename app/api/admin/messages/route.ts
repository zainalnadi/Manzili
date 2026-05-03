import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const conversations = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    include: {
      listing: { select: { titleEn: true, titleAr: true } },
      guest: { select: { id: true, fullNameEn: true, email: true } },
      host: { select: { id: true, fullNameEn: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { fullNameEn: true, email: true } } },
      },
    },
  })

  return NextResponse.json({ conversations })
}
