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

  await prisma.listing.update({ where: { id }, data: { status: 'REJECTED' } })

  await prisma.notification.create({
    data: {
      userId: listing.hostId,
      type: 'LISTING_REJECTED',
      titleAr: 'لم تتم الموافقة على إعلانك',
      titleEn: 'Your listing was not approved',
      bodyAr: `لم تتم الموافقة على إعلانك "${listing.titleAr}". يرجى مراجعة الصور والوصف والتأكد من استيفاء جميع المتطلبات.`,
      bodyEn: `Your listing "${listing.titleEn}" was not approved. Please review your photos and description and ensure all requirements are met.`,
    },
  })

  const referer = req.headers.get('referer') ?? '/'
  return NextResponse.redirect(referer, { status: 303 })
}
