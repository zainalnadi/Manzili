import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookHMAC } from '@/lib/paymob'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { obj: transaction, type } = body

    // Log all webhook events first
    await prisma.webhookLog.create({
      data: {
        source: 'paymob',
        eventType: type ?? 'TRANSACTION',
        payload: body,
      },
    })

    if (type !== 'TRANSACTION') {
      return NextResponse.json({ received: true })
    }

    // Verify HMAC signature
    const hmac = new URL(request.url).searchParams.get('hmac') ?? ''
    if (!verifyWebhookHMAC(transaction, hmac)) {
      console.error('Paymob HMAC verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const orderId = String(transaction.order?.id)
    if (!orderId) return NextResponse.json({ received: true })

    // Find booking by paymob order id
    const booking = await prisma.booking.findFirst({
      where: { paymobOrderId: orderId },
    })

    if (!booking) {
      return NextResponse.json({ received: true })
    }

    // Idempotency check
    if (booking.paymentStatus === 'CAPTURED' || booking.paymentStatus === 'REFUNDED') {
      return NextResponse.json({ received: true })
    }

    if (transaction.success === true && !transaction.error_occured) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: 'CAPTURED',
          paidAt: new Date(),
          status: 'CONFIRMED',
        },
      })

      // Create notification for host
      const listing = await prisma.listing.findUnique({ where: { id: booking.listingId } })
      if (listing) {
        await prisma.notification.create({
          data: {
            userId: listing.hostId,
            type: 'BOOKING_REQUEST',
            titleAr: 'حجز جديد مدفوع',
            titleEn: 'New Paid Booking',
            bodyAr: `تم تأكيد حجز جديد في ${listing.titleAr}`,
            bodyEn: `New booking confirmed for ${listing.titleEn}`,
            data: { bookingId: booking.id },
          },
        })
      }
    } else {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: 'FAILED' },
      })
    }

    // Mark webhook as processed
    await prisma.webhookLog.updateMany({
      where: { source: 'paymob', payload: { path: ['obj', 'order', 'id'], equals: orderId } },
      data: { processed: true },
    })

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Paymob webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
