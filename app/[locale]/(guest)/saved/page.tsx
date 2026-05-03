import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { SavedClient } from './SavedClient'
import { AuthGuard } from '@/components/shared/AuthGuard'

export default async function SavedListingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <AuthGuard locale={locale}>
        <div />
      </AuthGuard>
    )
  }

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: {
      listing: {
        include: { images: { take: 1, orderBy: { order: 'asc' } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const items = wishlistItems.map(({ listing }) => ({
    id: listing.id,
    titleAr: listing.titleAr,
    titleEn: listing.titleEn,
    governorate: listing.governorate,
    city: listing.city,
    compound: listing.compound,
    pricePerNight: Number(listing.pricePerNight),
    image: listing.images[0]?.url ?? null,
  }))

  return <SavedClient locale={locale} initialItems={items} />
}
