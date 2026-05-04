import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import {
  Bell,
  Calendar,
  CheckCircle,
  XCircle,
  CreditCard,
  Star,
  MessageCircle,
  DollarSign,
} from 'lucide-react'

// ─── Icon map ──────────────────────────────────────────────────────────────────

type NotificationType =
  | 'BOOKING_REQUEST'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_RECEIVED'
  | 'NEW_REVIEW'
  | 'MESSAGE_RECEIVED'
  | 'LISTING_APPROVED'
  | 'LISTING_REJECTED'
  | 'PAYOUT_PROCESSED'
  | 'SPECIAL_OFFER'
  | 'ACCOUNT_WARNING'

interface NotificationIconProps {
  type: NotificationType
}

function NotificationIcon({ type }: NotificationIconProps) {
  const iconClass = 'w-5 h-5'
  switch (type) {
    case 'BOOKING_REQUEST':
      return <Calendar className={`${iconClass} text-[#C9973A]`} />
    case 'BOOKING_CONFIRMED':
      return <CheckCircle className={`${iconClass} text-[#8FA68B]`} />
    case 'BOOKING_CANCELLED':
      return <XCircle className={`${iconClass} text-[#C4582A]`} />
    case 'PAYMENT_RECEIVED':
      return <CreditCard className={`${iconClass} text-[#C4582A]`} />
    case 'NEW_REVIEW':
      return <Star className={`${iconClass} text-[#C9973A]`} />
    case 'MESSAGE_RECEIVED':
      return <MessageCircle className={`${iconClass} text-[#C4582A]`} />
    case 'LISTING_APPROVED':
      return <CheckCircle className={`${iconClass} text-[#8FA68B]`} />
    case 'LISTING_REJECTED':
      return <XCircle className={`${iconClass} text-[#C4582A]`} />
    case 'PAYOUT_PROCESSED':
      return <DollarSign className={`${iconClass} text-[#8FA68B]`} />
    default:
      return <Bell className={`${iconClass} text-[#7A6A5E]`} />
  }
}

function iconBg(type: NotificationType): string {
  switch (type) {
    case 'BOOKING_REQUEST':
    case 'NEW_REVIEW':
      return 'bg-[#C9973A]/10'
    case 'BOOKING_CONFIRMED':
    case 'LISTING_APPROVED':
    case 'PAYOUT_PROCESSED':
      return 'bg-[#8FA68B]/10'
    case 'BOOKING_CANCELLED':
    case 'LISTING_REJECTED':
      return 'bg-[#C4582A]/10'
    case 'PAYMENT_RECEIVED':
    case 'MESSAGE_RECEIVED':
      return 'bg-[#C4582A]/10'
    default:
      return 'bg-[#F7F0E6]'
  }
}

// ─── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(date: Date, locale: string): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (locale === 'ar') {
    if (minutes < 1) return 'الآن'
    if (minutes < 60) return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`
    if (hours < 24) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`
    if (days === 1) return 'أمس'
    if (days < 7) return `منذ ${days} أيام`
    return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
  } else {
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-EG', { day: 'numeric', month: 'short' })
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isRTL = locale === 'ar'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  // Fetch all notifications
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  // Mark all unread as read (fire and forget — no need to await in rendering)
  if (notifications.some((n: typeof notifications[number]) => !n.isRead)) {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    })
  }

  const unread = notifications.filter((n: typeof notifications[number]) => !n.isRead)
  const read = notifications.filter((n: typeof notifications[number]) => n.isRead)

  return (
    <div
      className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1C1613]">
          {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
        </h1>
        {unread.length > 0 && (
          <p className="text-sm text-[#7A6A5E] mt-1">
            {locale === 'ar'
              ? `${unread.length} ${unread.length === 1 ? 'إشعار جديد' : 'إشعارات جديدة'}`
              : `${unread.length} new ${unread.length === 1 ? 'notification' : 'notifications'}`}
          </p>
        )}
      </div>

      {notifications.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-[#F7F0E6] flex items-center justify-center mb-6">
            <Bell className="w-10 h-10 text-[#EDE0CC]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1C1613] mb-2">
            {locale === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
          </h2>
          <p className="text-[#7A6A5E] max-w-sm text-sm">
            {locale === 'ar'
              ? 'ستظهر هنا إشعاراتك حول حجوزاتك ورسائلك وأكثر'
              : "Your notifications about bookings, messages, and more will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unread section */}
          {unread.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-[#7A6A5E] uppercase tracking-wide mb-3">
                {locale === 'ar' ? 'جديد' : 'New'}
              </h2>
              <div className="space-y-2">
                {unread.map((notif: typeof notifications[number]) => (
                  <NotificationRow
                    key={notif.id}
                    notif={notif as NotifItem}
                    locale={locale}
                    isUnread
                  />
                ))}
              </div>
            </section>
          )}

          {/* Read section */}
          {read.length > 0 && (
            <section>
              {unread.length > 0 && (
                <h2 className="text-xs font-semibold text-[#7A6A5E] uppercase tracking-wide mb-3">
                  {locale === 'ar' ? 'السابقة' : 'Earlier'}
                </h2>
              )}
              <div className="space-y-2">
                {read.map((notif: typeof notifications[number]) => (
                  <NotificationRow
                    key={notif.id}
                    notif={notif as NotifItem}
                    locale={locale}
                    isUnread={false}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Row component ─────────────────────────────────────────────────────────────

interface NotifItem {
  id: string
  type: NotificationType
  titleAr: string
  titleEn: string
  bodyAr: string
  bodyEn: string
  isRead: boolean
  createdAt: Date
}

function NotificationRow({
  notif,
  locale,
  isUnread,
}: {
  notif: NotifItem
  locale: string
  isUnread: boolean
}) {
  const title = locale === 'ar' ? notif.titleAr : notif.titleEn
  const body = locale === 'ar' ? notif.bodyAr : notif.bodyEn

  return (
    <div
      className={`flex items-start gap-3.5 p-4 rounded-xl border transition-colors ${
        isUnread
          ? 'bg-[#EBF4FA] border-[#C4582A]/20'
          : 'bg-white border-[#EDE0CC] hover:bg-[#F7F0E6]'
      }`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${iconBg(
          notif.type
        )}`}
      >
        <NotificationIcon type={notif.type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold ${isUnread ? 'text-[#1C1613]' : 'text-[#1C1613]'}`}>
            {title}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[11px] text-[#7A6A5E] whitespace-nowrap">
              {relativeTime(new Date(notif.createdAt), locale)}
            </span>
            {isUnread && (
              <span className="w-2 h-2 rounded-full bg-[#C4582A] flex-shrink-0" />
            )}
          </div>
        </div>
        <p className="text-sm text-[#7A6A5E] mt-0.5 leading-relaxed">{body}</p>
      </div>
    </div>
  )
}
