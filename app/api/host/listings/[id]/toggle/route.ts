import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const listing = await prisma.listing.findUnique({
    where: { id, hostId: user.id },
    select: { id: true, status: true },
  })
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['ACTIVE', 'PAUSED'].includes(listing.status)) {
    return NextResponse.json({ error: 'Cannot toggle this listing' }, { status: 400 })
  }

  const newStatus = listing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
  await prisma.listing.update({ where: { id }, data: { status: newStatus as 'ACTIVE' | 'PAUSED' } })

  return NextResponse.json({ status: newStatus })
}
