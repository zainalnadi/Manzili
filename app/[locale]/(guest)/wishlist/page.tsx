import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatEGP } from '@/lib/utils/format'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin } from 'lucide-react'

export default async function WishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isRTL = locale === 'ar'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: {
      listing: {
        include: {
          images: { take: 1, orderBy: { order: 'asc' } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1C1613]">
          {locale === 'ar' ? 'قائمة الأمنيات' : 'Wishlist'}
        </h1>
        {wishlistItems.length > 0 && (
          <p className="text-[#7A6A5E] mt-1 text-sm">
            {locale === 'ar'
              ? `${wishlistItems.length} ${wishlistItems.length === 1 ? 'عقار' : 'عقارات'}`
              : `${wishlistItems.length} ${wishlistItems.length === 1 ? 'property' : 'properties'}`}
          </p>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-[#F7F0E6] flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-[#EDE0CC]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1C1613] mb-2">
            {locale === 'ar' ? 'قائمة الأمنيات فارغة' : 'Your wishlist is empty'}
          </h2>
          <p className="text-[#7A6A5E] mb-6 max-w-sm">
            {locale === 'ar'
              ? 'احفظ العقارات التي تعجبك لترجع إليها لاحقاً'
              : 'Save properties you love to revisit them later'}
          </p>
          <Link
            href={`/${locale}/listings`}
            className="inline-block bg-[#C4582A] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#155a82] transition-colors"
          >
            {locale === 'ar' ? 'استكشف العقارات' : 'Explore Listings'}
          </Link>
        </div>
      ) : (
        /* Grid of listing cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {wishlistItems.map(({ listing }) => {
            const title = locale === 'ar' ? listing.titleAr : listing.titleEn
            const location = listing.compound
              ? `${listing.compound}, ${listing.city}`
              : `${listing.city}, ${listing.governorate}`
            const coverImage = listing.images[0]?.url ?? null

            return (
              <Link
                key={listing.id}
                href={`/${locale}/listings/${listing.id}`}
                className="group block bg-white border border-[#EDE0CC] rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-[#F7F0E6] overflow-hidden">
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl">🏠</span>
                    </div>
                  )}
                  {/* Saved indicator */}
                  <div className="absolute top-2 end-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                    <Heart className="w-4 h-4 fill-[#C4582A] text-[#C4582A]" />
                  </div>
                </div>

                {/* Card body */}
                <div className="p-3">
                  <div className="flex items-start gap-1 mb-1 text-[#7A6A5E]">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <p className="text-xs truncate">{location}</p>
                  </div>
                  <h3
                    className="text-[#1C1613] font-semibold text-sm leading-snug mb-2 line-clamp-2"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {title}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#1C1613] font-bold text-base">
                      {formatEGP(Number(listing.pricePerNight), locale)}
                    </span>
                    <span className="text-[#7A6A5E] text-xs">
                      {locale === 'ar' ? '/ ليلة' : '/ night'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
