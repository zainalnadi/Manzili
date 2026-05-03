import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateReportSchema = z.object({
  listingId: z.string().uuid(),
  reason: z.enum([
    'INACCURATE_PHOTOS',
    'WRONG_LOCATION',
    'SCAM',
    'OFFENSIVE_CONTENT',
    'DUPLICATE',
    'OTHER',
  ]),
  details: z.string().max(1000).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = CreateReportSchema.parse(body)

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
      select: { id: true },
    })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // One report per user per listing — update if already reported
    const existing = await prisma.listingReport.findFirst({
      where: { listingId: data.listingId, reporterId: user.id },
    })

    let report
    if (existing) {
      report = await prisma.listingReport.update({
        where: { id: existing.id },
        data: { reason: data.reason, details: data.details, status: 'PENDING' },
      })
    } else {
      report = await prisma.listingReport.create({
        data: {
          listingId: data.listingId,
          reporterId: user.id,
          reason: data.reason,
          details: data.details,
          status: 'PENDING',
        },
      })
    }

    return NextResponse.json({ report }, { status: existing ? 200 : 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}
