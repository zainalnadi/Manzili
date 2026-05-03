import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getAuthorizedListing(userId: string, listingId: string) {
  return prisma.listing.findUnique({
    where: { id: listingId, hostId: userId },
    select: { id: true },
  })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: listingId } = await params
  const listing = await getAuthorizedListing(user.id, listingId)
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { dates, price } = body as { dates: string[]; price: number }

  if (!Array.isArray(dates) || dates.length === 0 || typeof price !== 'number' || price <= 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  await Promise.all(
    dates.map((dateStr) =>
      prisma.pricingOverride.upsert({
        where: { listingId_date: { listingId, date: new Date(dateStr) } },
        create: { listingId, date: new Date(dateStr), price },
        update: { price },
      })
    )
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: listingId } = await params
  const listing = await getAuthorizedListing(user.id, listingId)
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { dates } = body as { dates: string[] }

  if (!Array.isArray(dates) || dates.length === 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  await prisma.pricingOverride.deleteMany({
    where: {
      listingId,
      date: { in: dates.map((d) => new Date(d)) },
    },
  })

  return NextResponse.json({ ok: true })
}
