import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ReviewForm } from '@/components/listings/ReviewForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function LeaveReviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const isRTL = locale === 'ar'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: {
        select: { titleAr: true, titleEn: true },
      },
      review: true,
    },
  })

  if (!booking || booking.guestId !== user.id) notFound()

  // Already reviewed or not completed → redirect
  if (booking.review || booking.status !== 'COMPLETED') {
    redirect(`/${locale}/bookings/${id}`)
  }

  const title =
    locale === 'ar' ? booking.listing.titleAr : booking.listing.titleEn

  return (
    <div
      className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      <Link
        href={`/${locale}/bookings/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#C4582A] hover:underline mb-6"
      >
        {isRTL ? (
          <ArrowLeft className="w-4 h-4 rotate-180" />
        ) : (
          <ArrowLeft className="w-4 h-4" />
        )}
        {locale === 'ar' ? 'رجوع' : 'Back'}
      </Link>

      <h1 className="text-xl font-bold text-[#1C1613] mb-1">
        {locale === 'ar' ? 'اكتب تقييمك' : 'Leave a Review'}
      </h1>
      <p className="text-sm text-[#7A6A5E] mb-6">{title}</p>

      <ReviewForm bookingId={id} locale={locale} />
    </div>
  )
}
