'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'

interface NotificationBellProps {
  locale: string
}

export function NotificationBell({ locale }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      // Support both { unreadCount: number } and { notifications: [...] } shapes
      if (typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount)
      } else if (Array.isArray(data.notifications)) {
        setUnreadCount(data.notifications.filter((n: any) => !n.read).length)
      } else if (Array.isArray(data)) {
        setUnreadCount(data.filter((n: any) => !n.read).length)
      }
    } catch {
      // Silently fail — bell still renders without count
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Link
      href={`/${locale}/notifications`}
      className="relative p-2 text-[#1C1613] hover:bg-[#F7F0E6] rounded-lg transition-colors"
      aria-label={locale === 'ar' ? 'الإشعارات' : 'Notifications'}
    >
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -end-0.5 min-w-[16px] h-4 bg-[#C4582A] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none"
          aria-label={`${unreadCount} unread`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
