import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Star, ShieldCheck } from 'lucide-react'
import Image from 'next/image'

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>
}) {
  const { locale, userId } = await params
  const isRTL = locale === 'ar'

  const profileUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullNameAr: true,
      fullNameEn: true,
      avatarUrl: true,
      nationalIdVerified: true,
      role: true,
      createdAt: true,
      listings: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          titleAr: true,
          titleEn: true,
          city: true,
          governorate: true,
          averageRating: true,
          images: { take: 1, orderBy: { order: 'asc' } },
          _count: { select: { reviews: true } },
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
      },
      reviews: {
        where: { isVisible: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          overallRating: true,
          commentAr: true,
          commentEn: true,
          createdAt: true,
          author: { select: { fullNameAr: true, fullNameEn: true, avatarUrl: true } },
        },
      },
      _count: { select: { reviews: true, listings: true } },
    },
  })

  if (!profileUser) notFound()

  const name = locale === 'ar' ? profileUser.fullNameAr : profileUser.fullNameEn
  const initial = (name ?? '?')[0]?.toUpperCase() ?? '?'
  const isHost = ['HOST', 'PROPERTY_MANAGER', 'ADMIN'].includes(profileUser.role)

  const joinYear = new Date(profileUser.createdAt).getFullYear()

  const avgRating = profileUser.reviews.length > 0
    ? (profileUser.reviews.reduce((sum, r) => sum + r.overallRating, 0) / profileUser.reviews.length).toFixed(1)
    : null

  const headingStyle = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200 }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' as const }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left — profile card */}
        <div>
          <div className="bg-white border border-[#EDE0CC] rounded-2xl p-6 text-center sticky top-24">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-[#C4582A] flex items-center justify-center">
              {profileUser.avatarUrl
                ? <Image src={profileUser.avatarUrl} alt={name ?? ''} width={96} height={96} className="object-cover" />
                : <span className="text-white text-3xl font-bold">{initial}</span>
              }
            </div>
            <h1 className="text-xl text-[#1C1613] mb-1" style={headingStyle}>{name ?? '—'}</h1>

            {isHost && (
              <p className="text-xs text-[#C4582A] font-medium mb-3">
                {locale === 'ar' ? 'مضيف' : 'Host'}
              </p>
            )}

            <div className="flex items-center justify-center gap-4 text-sm text-[#7A6A5E] mb-4">
              {avgRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[#C9973A] text-[#C9973A]" />
                  <span className="font-bold text-[#1C1613]">{avgRating}</span>
                </div>
              )}
              <div>
                <span className="font-bold text-[#1C1613]">{profileUser._count.reviews}</span>
                <span className="ms-1">{locale === 'ar' ? 'تقييم' : 'reviews'}</span>
              </div>
              {isHost && (
                <div>
                  <span className="font-bold text-[#1C1613]">{profileUser._count.listings}</span>
                  <span className="ms-1">{locale === 'ar' ? 'عقار' : 'listings'}</span>
                </div>
              )}
            </div>

            <div className="border-t border-[#EDE0CC] pt-4 space-y-2 text-xs text-[#7A6A5E]">
              {profileUser.nationalIdVerified && (
                <div className="flex items-center justify-center gap-1.5 text-[#8FA68B]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{locale === 'ar' ? 'هوية موثقة' : 'ID Verified'}</span>
                </div>
              )}
              <p>
                {locale === 'ar' ? `عضو منذ ${joinYear}` : `Member since ${joinYear}`}
              </p>
            </div>
          </div>
        </div>

        {/* Right — listings + reviews */}
        <div className="md:col-span-2 space-y-8">
          {/* Listings */}
          {isHost && profileUser.listings.length > 0 && (
            <div>
              <h2 className="text-sm text-[#7A6A5E] mb-4" style={{ ...headingStyle, fontSize: '0.7rem' }}>
                {locale === 'ar' ? 'عقاراته' : "Listings"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profileUser.listings.map((l) => {
                  const title = locale === 'ar' ? l.titleAr : l.titleEn
                  const cover = l.images[0]?.url
                  return (
                    <a key={l.id} href={`/${locale}/listings/${l.id}`}
                      className="bg-white border border-[#EDE0CC] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="relative w-full h-36 bg-[#F7F0E6]">
                        {cover && <Image src={cover} alt={title ?? ''} fill className="object-cover" sizes="300px" />}
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-[#1C1613] text-sm truncate">{title}</p>
                        <p className="text-xs text-[#7A6A5E]">{l.city}, {l.governorate}</p>
                        {l.averageRating && l.averageRating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-[#C9973A] text-[#C9973A]" />
                            <span className="text-xs font-medium">{Number(l.averageRating).toFixed(1)}</span>
                            <span className="text-xs text-[#9A8878]">· {l._count.reviews}</span>
                          </div>
                        )}
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Reviews received */}
          {profileUser.reviews.length > 0 && (
            <div>
              <h2 className="text-sm text-[#7A6A5E] mb-4" style={{ ...headingStyle, fontSize: '0.7rem' }}>
                {locale === 'ar' ? 'التقييمات' : 'Reviews'}
              </h2>
              <div className="space-y-4">
                {profileUser.reviews.map((r) => {
                  const authorName = locale === 'ar' ? r.author.fullNameAr : r.author.fullNameEn
                  const comment = locale === 'ar' ? r.commentAr : r.commentEn
                  return (
                    <div key={r.id} className="bg-white border border-[#EDE0CC] rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#F7F0E6] flex items-center justify-center text-sm font-bold text-[#C4582A]">
                          {(authorName ?? 'G')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1C1613]">{authorName ?? 'Guest'}</p>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < r.overallRating ? 'fill-[#C9973A] text-[#C9973A]' : 'text-[#EDE0CC]'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {comment && <p className="text-sm text-[#7A6A5E] leading-relaxed">{comment}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!isHost && profileUser.reviews.length === 0 && (
            <div className="bg-[#F7F0E6] rounded-xl p-8 text-center">
              <p className="text-[#7A6A5E]">{locale === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
