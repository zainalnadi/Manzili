import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ListingEditForm } from './ListingEditForm'

export default async function EditListingPage({
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
    include: { images: { orderBy: { order: 'asc' } } },
  })
  if (!listing) notFound()

  const initial = {
    titleAr: listing.titleAr,
    titleEn: listing.titleEn,
    descriptionAr: listing.descriptionAr,
    descriptionEn: listing.descriptionEn,
    governorate: listing.governorate,
    city: listing.city,
    compound: listing.compound ?? '',
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    maxGuests: listing.maxGuests,
    pricePerNight: Number(listing.pricePerNight),
    cleaningFee: Number(listing.cleaningFee ?? 0),
    minimumNights: listing.minimumNights,
    amenities: listing.amenities,
    instantBook: listing.instantBook,
    bnplEnabled: listing.bnplEnabled,
    imageUrls: listing.images.map((img) => img.url),
    houseRulesAr: listing.houseRulesAr ?? '',
    houseRulesEn: listing.houseRulesEn ?? '',
    checkInTime: listing.checkInTime ?? '15:00',
    checkOutTime: listing.checkOutTime ?? '11:00',
    petsAllowed: listing.petsAllowed,
    smokingAllowed: listing.smokingAllowed,
    partiesAllowed: listing.partiesAllowed,
    cancellationPolicy: listing.cancellationPolicy,
    isLicensed: listing.isLicensed,
    licenseNumber: listing.licenseNumber ?? '',
  }

  return <ListingEditForm locale={locale} listingId={id} initial={initial} />
}
