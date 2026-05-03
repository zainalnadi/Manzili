import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const review = await prisma.review.findUnique({
    where: { id },
    include: { listing: { select: { hostId: true } } },
  })

  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (review.listing.hostId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { replyAr, replyEn } = body as { replyAr?: string; replyEn?: string }

  const updated = await prisma.review.update({
    where: { id },
    data: {
      hostReplyAr: replyAr ?? null,
      hostReplyEn: replyEn ?? null,
    },
  })

  return NextResponse.json({ review: updated })
}
