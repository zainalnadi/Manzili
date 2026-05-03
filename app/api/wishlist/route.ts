import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ToggleWishlistSchema = z.object({
  listingId: z.string().uuid(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    select: { listingId: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ listingIds: items.map((i) => i.listingId) })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { listingId } = ToggleWishlistSchema.parse(body)

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_listingId: { userId: user.id, listingId } },
    })

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { userId_listingId: { userId: user.id, listingId } },
      })
      return NextResponse.json({ wishlisted: false })
    } else {
      // Verify listing exists before adding
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { id: true },
      })
      if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

      await prisma.wishlistItem.create({
        data: { userId: user.id, listingId },
      })
      return NextResponse.json({ wishlisted: true }, { status: 201 })
    }
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 })
  }
}
