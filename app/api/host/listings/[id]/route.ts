import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateListingSchema = z.object({
  // Status-only update
  status: z.enum(['ACTIVE', 'PAUSED', 'DRAFT']).optional(),
  // Full edit fields
  titleAr: z.string().min(5).optional(),
  titleEn: z.string().min(5).optional(),
  descriptionAr: z.string().min(20).optional(),
  descriptionEn: z.string().min(20).optional(),
  governorate: z.string().optional(),
  city: z.string().optional(),
  compound: z.string().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(1).optional(),
  maxGuests: z.number().int().min(1).optional(),
  pricePerNight: z.number().min(100).optional(),
  cleaningFee: z.number().optional(),
  minimumNights: z.number().int().min(1).optional(),
  amenities: z.array(z.string()).optional(),
  instantBook: z.boolean().optional(),
  bnplEnabled: z.boolean().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  houseRulesAr: z.string().optional(),
  houseRulesEn: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  petsAllowed: z.boolean().optional(),
  smokingAllowed: z.boolean().optional(),
  partiesAllowed: z.boolean().optional(),
  cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']).optional(),
  isLicensed: z.boolean().optional(),
  licenseNumber: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, hostId: true },
  })
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.hostId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { imageUrls, ...rest } = UpdateListingSchema.parse(body)

    // If imageUrls provided, replace all images
    if (imageUrls !== undefined) {
      await prisma.listingImage.deleteMany({ where: { listingId: id } })
      if (imageUrls.length > 0) {
        await prisma.listingImage.createMany({
          data: imageUrls.map((url, order) => ({ listingId: id, url, order })),
        })
      }
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: rest,
    })

    return NextResponse.json({ listing: updated })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, hostId: true },
  })
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.hostId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Prevent deletion if there are active or confirmed bookings
  const activeBookingsCount = await prisma.booking.count({
    where: {
      listingId: id,
      status: { in: ['CONFIRMED', 'CHECKED_IN'] },
    },
  })

  if (activeBookingsCount > 0) {
    return NextResponse.json(
      { error: 'Cannot delete listing with active or confirmed bookings' },
      { status: 409 }
    )
  }

  await prisma.listing.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
