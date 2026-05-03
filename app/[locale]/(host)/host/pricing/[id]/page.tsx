import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PricingCalendar } from './PricingCalendar'

export default async function HostPricingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const listing = await prisma.listing.findUnique({
    where: { id, hostId: user.id },
    select: {
      id: true, titleAr: true, titleEn: true,
      pricePerNight: true,
      pricingOverrides: {
        where: {
          date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        orderBy: { date: 'asc' },
      },
    },
  })
  if (!listing) notFound()

  const overrides = listing.pricingOverrides.map((o) => ({
    date: o.date.toISOString().slice(0, 10),
    price: Number(o.price),
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-xl text-[#1C1613] mb-2"
        style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {locale === 'ar' ? 'تسعير اليومي' : 'Daily Pricing'}
      </h1>
      <p className="text-sm text-[#7A6A5E] mb-6">
        {locale === 'ar' ? listing.titleAr : listing.titleEn}
      </p>
      <PricingCalendar
        locale={locale}
        listingId={id}
        basePrice={Number(listing.pricePerNight)}
        initialOverrides={overrides}
      />
    </div>
  )
}
