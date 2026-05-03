import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function relTime(date: Date, locale: string): string {
  const diff = Date.now() - date.getTime()
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (locale === 'ar') {
    if (m < 1) return 'الآن'
    if (m < 60) return `${m}د`
    if (h < 24) return `${h}س`
    if (d === 1) return 'أمس'
    if (d < 7) return `${d}أيام`
    return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
  }
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  if (h < 24) return `${h}h`
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d`
  return date.toLocaleDateString('en-EG', { day: 'numeric', month: 'short' })
}

export default async function HostMessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isRTL = locale === 'ar'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const [conversations, bookingMessages] = await Promise.all([
    // Direct pre-booking conversations where user is host
    prisma.conversation.findMany({
      where: { hostId: user.id },
      include: {
        listing: { select: { id: true, titleAr: true, titleEn: true, images: { where: { order: 0 }, take: 1, select: { url: true } } } },
        guest: { select: { id: true, fullNameAr: true, fullNameEn: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, senderId: true, createdAt: true, readAt: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    }),
    // Booking-based messages
    prisma.booking.findMany({
      where: { listing: { hostId: user.id } },
      include: {
        listing: { select: { id: true, titleAr: true, titleEn: true } },
        guest: { select: { id: true, fullNameAr: true, fullNameEn: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  // Unread counts
  const unreadDirect = await prisma.directMessage.groupBy({
    by: ['conversationId'],
    where: {
      conversation: { hostId: user.id },
      senderId: { not: user.id },
      readAt: null,
    },
    _count: { id: true },
  })
  const unreadDirectMap = new Map(unreadDirect.map((r) => [r.conversationId, r._count.id]))

  const unreadBooking = await prisma.message.groupBy({
    by: ['bookingId'],
    where: {
      booking: { listing: { hostId: user.id } },
      senderId: { not: user.id },
      isRead: false,
    },
    _count: { id: true },
  })
  const unreadBookingMap = new Map(unreadBooking.map((r) => [r.bookingId, r._count.id]))

  const josefin = isRTL
    ? 'font-["Tajawal"] font-light'
    : 'font-["Josefin_Sans"] font-[100] tracking-widest uppercase'

  const hasAny = conversations.length > 0 || bookingMessages.some((b) => b.messages.length > 0)

  return (
    <div
      className="max-w-3xl mx-auto px-4 sm:px-6 py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-[#1C1613] mb-1"
          style={{
            fontFamily: isRTL ? "'Tajawal', sans-serif" : "'Josefin Sans', sans-serif",
            fontWeight: isRTL ? 300 : 100,
            fontSize: '1.4rem',
            letterSpacing: isRTL ? 0 : '0.14em',
            textTransform: isRTL ? 'none' : 'uppercase',
          }}
        >
          {isRTL ? 'الرسائل' : 'MESSAGES'}
        </h1>
        <p className="text-sm text-[#7A6A5E]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
          {isRTL ? 'رسائل الضيوف بشأن عقاراتك' : "Guest messages about your listings"}
        </p>
      </div>

      {!hasAny ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F7F0E6] flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EDE0CC" strokeWidth="1" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p
            className="text-[#7A6A5E] mb-2"
            style={{
              fontFamily: isRTL ? "'Tajawal', sans-serif" : "'Josefin Sans', sans-serif",
              fontWeight: 100,
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {isRTL ? 'لا توجد رسائل' : 'NO MESSAGES YET'}
          </p>
          <p className="text-xs text-[#9A8878]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
            {isRTL ? 'ستظهر رسائل الضيوف هنا' : 'Messages from guests will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Section: Direct (pre-booking) messages ── */}
          {conversations.length > 0 && (
            <div>
              <p
                className="text-[#9A8878] mb-3"
                style={{
                  fontFamily: isRTL ? "'Tajawal', sans-serif" : "'Josefin Sans', sans-serif",
                  fontWeight: 100,
                  fontSize: 9,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                {isRTL ? 'استفسارات قبل الحجز' : 'PRE-BOOKING ENQUIRIES'}
              </p>

              <div className="bg-white border border-[#EDE0CC] rounded-2xl overflow-hidden divide-y divide-[rgba(122,106,94,0.15)]">
                {conversations.map((convo) => {
                  const guest = convo.guest
                  const guestName = (isRTL ? guest.fullNameAr : guest.fullNameEn) ?? guest.fullNameEn ?? 'Guest'
                  const listingTitle = isRTL ? convo.listing.titleAr : convo.listing.titleEn
                  const lastMsg = convo.messages[0]
                  const unread = unreadDirectMap.get(convo.id) ?? 0
                  const thumb = convo.listing.images[0]?.url

                  return (
                    <Link
                      key={convo.id}
                      href={`/${locale}/messages?c=${convo.id}`}
                      className="flex items-start gap-3.5 px-4 py-4 hover:bg-[#F7F0E6] transition-colors"
                    >
                      {/* Guest avatar */}
                      <div
                        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden relative"
                        style={{ background: '#F7F0E6', border: '1px solid #EDE0CC' }}
                      >
                        {guest.avatarUrl ? (
                          <Image src={guest.avatarUrl} alt={guestName} fill className="object-cover" />
                        ) : (
                          <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 14, color: '#7A6A5E' }}>
                            {guestName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-sm font-medium text-[#1C1613] truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {guestName}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {lastMsg && (
                              <span className="text-[11px] text-[#7A6A5E]">
                                {relTime(new Date(lastMsg.createdAt), locale)}
                              </span>
                            )}
                            {unread > 0 && (
                              <span className="min-w-[18px] h-[18px] rounded-full bg-[#C4582A] text-white text-[10px] font-bold flex items-center justify-center px-1">
                                {unread > 9 ? '9+' : unread}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-[#9A8878] mb-0.5 truncate" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                          {listingTitle}
                        </p>
                        {lastMsg && (
                          <p className="text-[13px] text-[#7A6A5E] truncate" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                            {lastMsg.body}
                          </p>
                        )}
                      </div>

                      {/* Listing thumb */}
                      {thumb && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative">
                          <Image src={thumb} alt="" fill className="object-cover" />
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Section: Booking-based messages ── */}
          {bookingMessages.filter((b) => b.messages.length > 0).length > 0 && (
            <div>
              <p
                className="text-[#9A8878] mb-3"
                style={{
                  fontFamily: isRTL ? "'Tajawal', sans-serif" : "'Josefin Sans', sans-serif",
                  fontWeight: 100,
                  fontSize: 9,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                {isRTL ? 'رسائل الحجوزات' : 'BOOKING MESSAGES'}
              </p>

              <div className="bg-white border border-[#EDE0CC] rounded-2xl overflow-hidden divide-y divide-[rgba(122,106,94,0.15)]">
                {bookingMessages
                  .filter((b) => b.messages.length > 0)
                  .map((booking) => {
                    const guest = booking.guest
                    const guestName = (isRTL ? guest.fullNameAr : guest.fullNameEn) ?? guest.fullNameEn ?? 'Guest'
                    const listingTitle = isRTL ? booking.listing.titleAr : booking.listing.titleEn
                    const lastMsg = booking.messages[0]
                    const unread = unreadBookingMap.get(booking.id) ?? 0

                    return (
                      <Link
                        key={booking.id}
                        href={`/${locale}/messages/${booking.id}`}
                        className="flex items-start gap-3.5 px-4 py-4 hover:bg-[#F7F0E6] transition-colors"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden relative"
                          style={{ background: '#F7F0E6', border: '1px solid #EDE0CC' }}
                        >
                          {guest.avatarUrl ? (
                            <Image src={guest.avatarUrl} alt={guestName} fill className="object-cover" />
                          ) : (
                            <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 14, color: '#7A6A5E' }}>
                              {guestName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-sm font-medium text-[#1C1613] truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                              {guestName}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[11px] text-[#7A6A5E]">
                                {relTime(new Date(lastMsg.createdAt), locale)}
                              </span>
                              {unread > 0 && (
                                <span className="min-w-[18px] h-[18px] rounded-full bg-[#C4582A] text-white text-[10px] font-bold flex items-center justify-center px-1">
                                  {unread > 9 ? '9+' : unread}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-[#9A8878] mb-0.5 truncate" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                            {listingTitle}
                          </p>
                          <p className="text-[13px] text-[#7A6A5E] truncate" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                            {lastMsg.body}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
