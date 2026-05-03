import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

async function getAuthorizedListing(req: NextRequest, id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 as const }

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, hostId: true },
  })
  if (!listing) return { error: 'Listing not found', status: 404 as const }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) return { error: 'User not found', status: 404 as const }
  if (listing.hostId !== user.id && dbUser.role !== 'ADMIN') {
    return { error: 'Forbidden', status: 403 as const }
  }

  return { listing, userId: user.id }
}

/** POST /api/host/calendar/[id]  — block a date */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const result = await getAuthorizedListing(req, id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const body = await req.json().catch(() => ({}))
  const { date } = body as { date?: string }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Expected YYYY-MM-DD.' }, { status: 400 })
  }

  const dateObj = new Date(`${date}T00:00:00.000Z`)
  if (isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  const existing = await prisma.blockedDate.findFirst({
    where: { listingId: id, date: dateObj },
  })
  if (!existing) {
    await prisma.blockedDate.create({ data: { listingId: id, date: dateObj } })
  }

  return NextResponse.json({ success: true })
}

/** DELETE /api/host/calendar/[id]  — unblock a date */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const result = await getAuthorizedListing(req, id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const body = await req.json().catch(() => ({}))
  const { date } = body as { date?: string }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Expected YYYY-MM-DD.' }, { status: 400 })
  }

  const dateObj = new Date(`${date}T00:00:00.000Z`)
  if (isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  await prisma.blockedDate.deleteMany({
    where: { listingId: id, date: dateObj },
  })

  return NextResponse.json({ success: true })
}
