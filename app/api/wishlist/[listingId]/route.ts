import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ listingId: string }> }

// POST /api/wishlist/:listingId — add (for undo)
export async function POST(_req: NextRequest, { params }: Params) {
  const { listingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.wishlistItem.upsert({
    where: { userId_listingId: { userId: user.id, listingId } },
    create: { userId: user.id, listingId },
    update: {},
  })

  return NextResponse.json({ saved: true })
}

// DELETE /api/wishlist/:listingId — remove
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { listingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.wishlistItem.deleteMany({
    where: { userId: user.id, listingId },
  })

  return NextResponse.json({ saved: false })
}
