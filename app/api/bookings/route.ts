import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { calculateBookingPrice } from '@/lib/utils/pricing'
import { calculateNights } from '@/lib/utils/format'
import { initiatePayment } from '@/lib/paymob'
import { initiateValUPayment } from '@/lib/valu'

const CreateBookingSchema = z.object({
  listingId: z.string().uuid(),
  checkIn: z.string(),
  checkOut: z.string(),
  adultsCount: z.number().int().min(1),
  childrenCount: z.number().int().min(0).default(0),
  paymentMethod: z.enum(['CARD', 'FAWRY', 'VODAFONE_CASH', 'MEEZA', 'VALU_BNPL']),
  valuMonths: z.number().int().optional(),
  guestMessage: z.string().optional(),
  specialRequests: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = CreateBookingSchema.parse(body)

    const listing = await prisma.listing.findUnique({ where: { id: data.listingId } })
    if (!listing || listing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Listing not available' }, { status: 404 })
    }

    const checkIn = new Date(data.checkIn)
    const checkOut = new Date(data.checkOut)
    const nights = calculateNights(checkIn, checkOut)

    if (nights < listing.minimumNights) {
      return NextResponse.json({ error: `Minimum ${listing.minimumNights} nights required` }, { status: 400 })
    }

    if (data.adultsCount + data.childrenCount > listing.maxGuests) {
      return NextResponse.json({ error: `Maximum ${listing.maxGuests} guests allowed` }, { status: 400 })
    }

    // Check availability
    const conflicts = await prisma.booking.count({
      where: {
        listingId: data.listingId,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
      },
    })
    if (conflicts > 0) return NextResponse.json({ error: 'Dates not available' }, { status: 409 })

    // Server-side price calculation (never trust client)
    const breakdown = calculateBookingPrice({
      pricePerNight: Number(listing.pricePerNight),
      nights,
      cleaningFee: listing.cleaningFee ? Number(listing.cleaningFee) : 0,
      weeklyDiscount: listing.weeklyDiscount ?? 0,
      monthlyDiscount: listing.monthlyDiscount ?? 0,
    })

    // Create booking record
    const booking = await prisma.booking.create({
      data: {
        listingId: data.listingId,
        guestId: authUser.id,
        checkIn,
        checkOut,
        nights,
        adultsCount: data.adultsCount,
        childrenCount: data.childrenCount,
        nightlyTotal: breakdown.nightlySubtotal - breakdown.discountAmount,
        cleaningFee: breakdown.cleaningFee,
        serviceFeeGuest: breakdown.guestServiceFee,
        serviceFeeHost: breakdown.hostServiceFee,
        totalGuestPays: breakdown.totalGuestPays,
        totalHostReceives: breakdown.totalHostReceives,
        paymentMethod: data.paymentMethod,
        paymentStatus: 'PENDING',
        status: listing.instantBook ? 'CONFIRMED' : 'PENDING',
        guestMessage: data.guestMessage,
        specialRequests: data.specialRequests,
      },
    })

    // Initiate payment
    let paymentKey: string | undefined
    let paymobOrderId: string | undefined

    if (data.paymentMethod === 'VALU_BNPL') {
      const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } })
      const valuResult = await initiateValUPayment(
        breakdown.totalGuestPays,
        data.valuMonths ?? 6,
        dbUser?.phone ?? ''
      )
      await prisma.booking.update({ where: { id: booking.id }, data: { valuPlanId: valuResult.planId } })
      return NextResponse.json({ booking, valuPlans: valuResult.plans, mock: valuResult.mock })
    } else {
      const methodMap: Record<string, 'card' | 'fawry' | 'vodafone_cash' | 'meeza'> = {
        CARD: 'card', FAWRY: 'fawry', VODAFONE_CASH: 'vodafone_cash', MEEZA: 'meeza',
      }
      const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } })
      const nameParts = (dbUser?.fullNameEn ?? 'Guest User').split(' ')

      const paymobResult = await initiatePayment(
        { amountCents: Math.round(breakdown.totalGuestPays * 100) },
        {
          amountCents: Math.round(breakdown.totalGuestPays * 100),
          method: methodMap[data.paymentMethod] ?? 'card',
          billingData: {
            firstName: nameParts[0] ?? 'Guest',
            lastName: nameParts[1] ?? 'User',
            email: dbUser?.email ?? authUser.email ?? '',
            phone: dbUser?.phone ?? '+20000000000',
          },
        }
      )

      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymobOrderId: paymobResult.orderId },
      })

      paymentKey = paymobResult.paymentKey
      paymobOrderId = paymobResult.orderId

      return NextResponse.json({ booking, paymentKey, iframeUrl: paymobResult.iframeUrl, fawryCode: paymobResult.fawryCode, mock: paymobResult.mock })
    }
  } catch (err: any) {
    console.error('Booking error:', err)
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bookings = await prisma.booking.findMany({
    where: { guestId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: {
        select: { titleAr: true, titleEn: true, city: true, governorate: true, images: { take: 1 } },
      },
    },
  })

  return NextResponse.json({ bookings })
}
