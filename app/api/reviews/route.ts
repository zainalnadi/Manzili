import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateReviewSchema = z.object({
  bookingId: z.string().uuid(),
  overallRating: z.number().int().min(1).max(5),
  cleanlinessRating: z.number().int().min(1).max(5),
  accuracyRating: z.number().int().min(1).max(5),
  locationRating: z.number().int().min(1).max(5),
  valueRating: z.number().int().min(1).max(5),
  commentAr: z.string().min(10).optional(),
  commentEn: z.string().min(10).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = CreateReviewSchema.parse(body)

    // Verify booking exists, belongs to current user as guest, and is COMPLETED
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { listing: { select: { id: true, hostId: true, titleAr: true, titleEn: true } } },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.guestId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 })
    }

    // Check no review already exists for this booking
    const existingReview = await prisma.review.findUnique({
      where: { bookingId: data.bookingId },
    })
    if (existingReview) {
      return NextResponse.json({ error: 'Review already submitted for this booking' }, { status: 409 })
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId: data.bookingId,
        listingId: booking.listingId,
        authorId: user.id,
        overallRating: data.overallRating,
        cleanlinessRating: data.cleanlinessRating,
        accuracyRating: data.accuracyRating,
        locationRating: data.locationRating,
        valueRating: data.valueRating,
        commentAr: data.commentAr,
        commentEn: data.commentEn,
        isVisible: true,
      },
    })

    // Recalculate listing averageRating from all visible reviews
    const ratingAggregate = await prisma.review.aggregate({
      where: { listingId: booking.listingId, isVisible: true },
      _avg: { overallRating: true },
      _count: { id: true },
    })

    await prisma.listing.update({
      where: { id: booking.listingId },
      data: {
        averageRating: ratingAggregate._avg.overallRating ?? 0,
      },
    })

    // Notify host of new review
    await prisma.notification.create({
      data: {
        userId: booking.listing.hostId,
        type: 'NEW_REVIEW',
        titleAr: 'تقييم جديد على إعلانك',
        titleEn: 'New review on your listing',
        bodyAr: `حصل إعلانك "${booking.listing.titleAr}" على تقييم جديد بـ ${data.overallRating} نجوم.`,
        bodyEn: `Your listing "${booking.listing.titleEn}" received a new ${data.overallRating}-star review.`,
        data: { reviewId: review.id, listingId: booking.listingId, bookingId: data.bookingId },
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
