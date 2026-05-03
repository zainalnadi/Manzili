import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const where: Prisma.ListingWhereInput = { status: 'ACTIVE' }

  const q = searchParams.get('where')
  if (q) {
    where.OR = [
      { governorate: { contains: q.replace(/-/g, ' '), mode: 'insensitive' } },
      { city: { contains: q.replace(/-/g, ' '), mode: 'insensitive' } },
      { titleEn: { contains: q, mode: 'insensitive' } },
      { titleAr: { contains: q, mode: 'insensitive' } },
    ]
  }

  const type = searchParams.get('type')
  if (type) where.propertyType = type as any

  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  if (minPrice || maxPrice) {
    where.pricePerNight = {
      gte: minPrice ? Number(minPrice) : undefined,
      lte: maxPrice ? Number(maxPrice) : undefined,
    }
  }

  const bedrooms = searchParams.get('bedrooms')
  if (bedrooms) where.bedrooms = { gte: Number(bedrooms) }

  const guests = searchParams.get('guests')
  if (guests) where.maxGuests = { gte: Number(guests) }

  if (searchParams.get('instant') === 'true') where.instantBook = true
  if (searchParams.get('bnpl') === 'true') where.bnplEnabled = true

  const sort = searchParams.get('sort')
  let orderBy: Prisma.ListingOrderByWithRelationInput = { totalBookings: 'desc' }
  if (sort === 'price_low') orderBy = { pricePerNight: 'asc' }
  else if (sort === 'price_high') orderBy = { pricePerNight: 'desc' }
  else if (sort === 'rating') orderBy = { averageRating: 'desc' }
  else if (sort === 'newest') orderBy = { createdAt: 'desc' }

  const page = Number(searchParams.get('page') ?? 1)
  const pageSize = 12

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where, orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { take: 1, orderBy: { order: 'asc' } },
        host: { select: { nationalIdVerified: true } },
      },
    }),
    prisma.listing.count({ where }),
  ])

  return NextResponse.json({ listings, total, page, pageSize })
}

const CreateListingSchema = z.object({
  titleAr: z.string().min(5),
  titleEn: z.string().min(5),
  descriptionAr: z.string().min(20),
  descriptionEn: z.string().min(20),
  governorate: z.string(),
  city: z.string(),
  compound: z.string().optional(),
  propertyType: z.enum(['APARTMENT', 'CHALET', 'VILLA', 'STUDIO', 'TOWNHOUSE', 'PENTHOUSE']),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(1),
  maxGuests: z.number().int().min(1),
  pricePerNight: z.number().min(100),
  cleaningFee: z.number().optional(),
  minimumNights: z.number().int().min(1).default(1),
  amenities: z.array(z.string()).default([]),
  instantBook: z.boolean().default(false),
  bnplEnabled: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).default([]),
  houseRulesAr: z.string().optional(),
  houseRulesEn: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  petsAllowed: z.boolean().default(false),
  smokingAllowed: z.boolean().default(false),
  partiesAllowed: z.boolean().default(false),
  cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']).default('MODERATE'),
  isLicensed: z.boolean().default(false),
  licenseNumber: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || !['HOST', 'PROPERTY_MANAGER', 'ADMIN'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { imageUrls, ...rest } = CreateListingSchema.parse(body)

    const listing = await prisma.listing.create({
      data: {
        ...rest,
        hostId: user.id,
        status: 'PENDING_REVIEW',
        images: imageUrls.length > 0 ? {
          create: imageUrls.map((url, order) => ({ url, order })),
        } : undefined,
      },
      include: { images: true },
    })

    return NextResponse.json({ listing }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}
