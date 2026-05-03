import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (dbUser?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  await prisma.listing.update({ where: { id }, data: { status: 'ACTIVE' } })

  await prisma.notification.create({
    data: {
      userId: listing.hostId,
      type: 'LISTING_APPROVED',
      titleAr: 'تمت الموافقة على إعلانك',
      titleEn: 'Your listing has been approved',
      bodyAr: `تمت مراجعة إعلانك "${listing.titleAr}" والموافقة عليه. أصبح مرئياً للضيوف الآن.`,
      bodyEn: `Your listing "${listing.titleEn}" has been reviewed and approved. It's now visible to guests.`,
    },
  })

  const referer = req.headers.get('referer') ?? '/'
  return NextResponse.redirect(referer, { status: 303 })
}
