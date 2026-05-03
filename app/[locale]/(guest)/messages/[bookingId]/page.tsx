'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Sender {
  id: string
  fullNameAr: string | null
  fullNameEn: string | null
  avatarUrl: string | null
}

interface Message {
  id: string
  bookingId: string
  senderId: string
  sender: Sender
  body: string
  isRead: boolean
  createdAt: string
}

interface BookingMeta {
  id: string
  listingTitleAr: string
  listingTitleEn: string
  listingId: string
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDay(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function getAvatar(sender: Sender, locale: string): string {
  return (locale === 'ar' ? sender.fullNameAr : sender.fullNameEn) ?? sender.fullNameAr ?? sender.fullNameEn ?? '?'
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string; bookingId: string }>
}) {
  const { locale, bookingId } = use(params)
  const isRTL = locale === 'ar'

  const [messages, setMessages] = useState<Message[]>([])
  const [booking, setBooking] = useState<BookingMeta | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Fetch current user id ──────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.id) setCurrentUserId(data.id)
      })
      .catch(() => {})
  }, [])

  // ── Fetch messages ─────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?bookingId=${bookingId}`)
      if (!res.ok) throw new Error('fetch_failed')
      const data = await res.json()
      setMessages(data.messages ?? [])
      if (data.booking) setBooking(data.booking)
    } catch {
      setError(locale === 'ar' ? 'تعذر تحميل الرسائل' : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [bookingId, locale])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // ── Polling every 5s ───────────────────────────────────────────────────────
  useEffect(() => {
    pollingRef.current = setInterval(fetchMessages, 5000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [fetchMessages])

  // ── Auto-scroll to bottom ──────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = body.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, body: trimmed }),
      })
      if (!res.ok) throw new Error('send_failed')
      setBody('')
      await fetchMessages()
      inputRef.current?.focus()
    } catch {
      setError(locale === 'ar' ? 'تعذر إرسال الرسالة' : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const listingTitle = booking
    ? (locale === 'ar' ? booking.listingTitleAr : booking.listingTitleEn)
    : ''

  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  return (
    <div
      className="flex flex-col h-[calc(100dvh-64px)] max-w-3xl mx-auto"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#EDE0CC] bg-white flex-shrink-0">
        <Link
          href={`/${locale}/messages`}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F7F0E6] transition-colors"
        >
          <BackIcon className="w-5 h-5 text-[#1C1613]" />
        </Link>

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="h-4 w-40 bg-[#EDE0CC] rounded animate-pulse" />
          ) : (
            <>
              <p className="font-semibold text-[#1C1613] text-sm truncate">{listingTitle}</p>
              <p className="text-xs text-[#7A6A5E]">
                {locale === 'ar' ? 'المحادثة' : 'Conversation'}
              </p>
            </>
          )}
        </div>

        {booking && (
          <Link
            href={`/${locale}/bookings/${bookingId}`}
            className="text-xs text-[#C4582A] hover:underline flex-shrink-0"
          >
            {locale === 'ar' ? 'تفاصيل الحجز' : 'Booking details'}
          </Link>
        )}
      </div>

      {/* ── Messages area ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-[#F7F0E6]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-[#C4582A] animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#C4582A] text-sm">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <p className="text-[#7A6A5E] text-sm">
              {locale === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'}
            </p>
            <p className="text-xs text-[#7A6A5E]">
              {locale === 'ar'
                ? 'ابدأ المحادثة مع المضيف'
                : 'Start the conversation with the host'}
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isMine = msg.senderId === currentUserId
              const prevMsg = messages[idx - 1]
              const showDayDivider = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt)
              const showSender =
                !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId || showDayDivider)

              const senderName = locale === 'ar'
                ? msg.sender.fullNameAr ?? msg.sender.fullNameEn ?? '—'
                : msg.sender.fullNameEn ?? msg.sender.fullNameAr ?? '—'

              const avatarInitial = getAvatar(msg.sender, locale).charAt(0).toUpperCase()

              return (
                <div key={msg.id}>
                  {/* Day divider */}
                  {showDayDivider && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-[#EDE0CC]" />
                      <span className="text-xs text-[#7A6A5E] whitespace-nowrap">
                        {formatDay(msg.createdAt, locale)}
                      </span>
                      <div className="flex-1 h-px bg-[#EDE0CC]" />
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={`flex items-end gap-2 mb-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar (other party only) */}
                    {!isMine ? (
                      <div className="w-7 h-7 rounded-full bg-[#C4582A]/20 flex items-center justify-center flex-shrink-0 mb-0.5">
                        {msg.sender.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={msg.sender.avatarUrl}
                            alt={senderName}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-[#C4582A]">{avatarInitial}</span>
                        )}
                      </div>
                    ) : (
                      <div className="w-7 flex-shrink-0" />
                    )}

                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
                      {/* Sender name */}
                      {showSender && (
                        <span className="text-xs text-[#7A6A5E] mb-1 px-1">{senderName}</span>
                      )}

                      {/* Bubble */}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                          isMine
                            ? 'bg-[#C4582A] text-white rounded-br-sm'
                            : 'bg-white text-[#1C1613] border border-[#EDE0CC] rounded-bl-sm'
                        }`}
                      >
                        {msg.body}
                      </div>

                      {/* Time */}
                      <span className="text-[10px] text-[#7A6A5E] mt-1 px-1">
                        {formatTime(msg.createdAt, locale)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* ── Input area ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-[#EDE0CC] bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={locale === 'ar' ? 'اكتب رسالة…' : 'Type a message…'}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-[#EDE0CC] bg-[#F7F0E6] px-4 py-2.5 text-sm text-[#1C1613] placeholder:text-[#7A6A5E] focus:outline-none focus:border-[#C4582A] focus:ring-1 focus:ring-[#C4582A] max-h-32 overflow-y-auto"
            style={{ fontFamily: 'Outfit, sans-serif' }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`
            }}
          />
          <button
            onClick={handleSend}
            disabled={!body.trim() || sending}
            className="w-10 h-10 rounded-xl bg-[#C4582A] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#155a82] transition-colors"
            aria-label={locale === 'ar' ? 'إرسال' : 'Send'}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            )}
          </button>
        </div>
        <p className="text-[10px] text-[#7A6A5E] mt-1.5 text-center">
          {locale === 'ar' ? 'Enter للإرسال · Shift+Enter لسطر جديد' : 'Enter to send · Shift+Enter for new line'}
        </p>
      </div>
    </div>
  )
}
