'use client'

export const dynamic = 'force-dynamic'

import { use, useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Send, MessageCircle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Participant {
  id: string
  fullNameAr: string | null
  fullNameEn: string | null
  avatarUrl: string | null
  nationalIdVerified?: boolean
}

interface DirectMessage {
  id: string
  conversationId: string
  senderId: string
  sender: Participant
  body: string
  readAt: string | null
  createdAt: string
}

interface ConversationItem {
  id: string
  listingId: string
  guestId: string
  hostId: string
  lastMessageAt: string
  createdAt: string
  unreadCount: number
  listing: {
    id: string
    titleAr: string
    titleEn: string
    pricePerNight: number
    images: { url: string }[]
  }
  guest: Participant
  host: Participant
  messages: {
    id: string
    body: string
    senderId: string
    createdAt: string
    readAt: string | null
  }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relTime(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (locale === 'ar') {
    if (m < 1) return 'الآن'
    if (m < 60) return `${m}د`
    if (h < 24) return `${h}س`
    if (d === 1) return 'أمس'
    if (d < 7) return `${d}أيام`
    return new Date(dateStr).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
  }
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  if (h < 24) return `${h}h`
  if (d === 1) return 'Yesterday'
  if (d < 7) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(dateStr).getDay()]
  return new Date(dateStr).toLocaleDateString('en-EG', { day: 'numeric', month: 'short' })
}

function dayLabel(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    weekday: 'short', day: 'numeric', month: 'long',
  }).toUpperCase()
}

function timeLabel(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    hour: '2-digit', minute: '2-digit',
  })
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function Avatar({ user, size = 40, locale }: { user: Participant; size?: number; locale: string }) {
  const name = (locale === 'ar' ? user.fullNameAr : user.fullNameEn) ?? user.fullNameEn ?? '?'
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
      style={{ width: size, height: size, background: '#F7F0E6', border: '1px solid #EDE0CC', position: 'relative' }}
    >
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt={name} fill className="object-cover" />
      ) : (
        <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: size * 0.4, color: '#7A6A5E' }}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const isRTL = locale === 'ar'
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeId = searchParams.get('c') ?? null  // active conversation id

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>(activeId ? 'thread' : 'list')

  // Thread state
  const [threadMessages, setThreadMessages] = useState<DirectMessage[]>([])
  const [activeConvo, setActiveConvo] = useState<ConversationItem | null>(null)
  const [threadLoading, setThreadLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const josefin: React.CSSProperties = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 300 }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' as const }

  // ── Fetch current user ───────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.id) setCurrentUserId(d.id) })
      .catch(() => {})
  }, [])

  // ── Fetch conversations ──────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations')
      if (!res.ok) return
      const data = await res.json()
      setConversations(data.conversations ?? [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  // ── Fetch thread messages ────────────────────────────────────────────────

  const fetchThread = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setThreadMessages(data.conversation?.messages ?? [])
      setActiveConvo(data.conversation ?? null)
      // Mark as read
      fetch(`/api/conversations/${id}/read`, { method: 'PATCH' }).catch(() => {})
    } catch {}
  }, [])

  // Load thread whenever activeId changes
  useEffect(() => {
    if (!activeId) { setThreadMessages([]); setActiveConvo(null); return }
    setThreadLoading(true)
    fetchThread(activeId).finally(() => setThreadLoading(false))
  }, [activeId, fetchThread])

  // Poll thread every 5s
  useEffect(() => {
    if (!activeId) return
    pollingRef.current = setInterval(() => fetchThread(activeId), 5000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [activeId, fetchThread])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadMessages])

  // ── Select conversation ──────────────────────────────────────────────────

  const selectConversation = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('c', id)
    router.push(`?${params.toString()}`, { scroll: false })
    setMobileView('thread')
    setReply('')
    setReplyError(null)
  }

  const backToList = () => {
    setMobileView('list')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('c')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // ── Send reply ───────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!reply.trim() || !activeId || sending) return
    setSending(true)
    setReplyError(null)
    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setReply('')
      await fetchThread(activeId)
      await fetchConversations()
    } catch (err: unknown) {
      setReplyError(err instanceof Error ? err.message : 'Failed to send')
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

  // ── Redirect to login if no user ────────────────────────────────────────

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.id) router.push(`/${locale}/auth/login`)
      }).catch(() => {})
  }, [locale, router])

  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="h-[calc(100vh-64px)] flex flex-col"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Page heading — desktop */}
      <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-[#EDE0CC] bg-white flex-shrink-0">
        <h1 style={{ ...josefin, fontSize: '1.3rem', color: '#1C1613' }}>
          {isRTL ? 'الرسائل' : 'MESSAGES'}
        </h1>
        {conversations.reduce((s, c) => s + c.unreadCount, 0) > 0 && (
          <span className="text-xs" style={{ color: '#7A6A5E', fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
            {conversations.reduce((s, c) => s + c.unreadCount, 0)} {isRTL ? 'غير مقروءة' : 'unread'}
          </span>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Conversation list ── */}
        <div
          className={`
            ${activeId ? 'hidden md:flex' : 'flex'}
            ${mobileView === 'thread' ? 'hidden md:flex' : 'flex'}
            flex-col w-full md:w-[340px] border-e border-[#EDE0CC] bg-white flex-shrink-0 overflow-y-auto
          `}
        >
          {/* Mobile heading */}
          <div className="md:hidden flex items-center px-4 py-3 border-b border-[#EDE0CC]">
            <h1 style={{ ...josefin, fontSize: '1rem', color: '#1C1613' }}>
              {isRTL ? 'الرسائل' : 'MESSAGES'}
            </h1>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-[#EDE0CC] border-t-[#C4582A] animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F7F0E6] flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8" style={{ color: '#EDE0CC' }} />
              </div>
              <p style={{ ...josefin, fontSize: '0.75rem', color: '#7A6A5E', marginBottom: 8 }}>
                {isRTL ? 'لا توجد رسائل' : 'NO MESSAGES YET'}
              </p>
              <p className="text-xs text-[#9A8878]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                {isRTL ? 'ستظهر محادثاتك مع المضيفين هنا' : 'Your conversations with hosts will appear here'}
              </p>
            </div>
          ) : (
            conversations.map((convo, idx) => {
              const isActive = activeId === convo.id
              const isGuest = currentUserId === convo.guestId
              const otherParty = isGuest ? convo.host : convo.guest
              const lastMsg = convo.messages[0]
              const hasUnread = convo.unreadCount > 0
              const listingTitle = isRTL ? convo.listing.titleAr : convo.listing.titleEn
              const otherName = (isRTL ? otherParty.fullNameAr : otherParty.fullNameEn) ?? otherParty.fullNameEn ?? 'Host'

              return (
                <button
                  key={convo.id}
                  onClick={() => selectConversation(convo.id)}
                  className="flex items-start gap-3 px-4 py-3.5 text-start w-full transition-colors"
                  style={{
                    background: isActive ? '#F7F0E6' : 'white',
                    borderBottom: idx < conversations.length - 1 ? '0.5px solid rgba(122,106,94,0.15)' : 'none',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#FAF4ED' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? '#F7F0E6' : 'white' }}
                >
                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-3.5">
                    {hasUnread ? (
                      <div className="w-2 h-2 rounded-full" style={{ background: '#C4582A' }} />
                    ) : (
                      <div className="w-2 h-2" />
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar user={otherParty} size={40} locale={locale} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className="text-sm truncate"
                        style={{ fontFamily: 'Outfit, sans-serif', fontWeight: hasUnread ? 600 : 500, color: '#1C1613' }}
                      >
                        {otherName}
                      </span>
                      {lastMsg && (
                        <span className="text-[11px] flex-shrink-0" style={{ color: '#7A6A5E', fontFamily: 'Outfit, sans-serif' }}>
                          {relTime(lastMsg.createdAt, locale)}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs truncate mb-0.5"
                      style={{ color: '#9A8878', fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}
                    >
                      {listingTitle}
                    </p>
                    {lastMsg && (
                      <p
                        className="text-[13px] truncate"
                        style={{
                          color: hasUnread ? '#1C1613' : '#7A6A5E',
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: hasUnread ? 500 : 300,
                        }}
                      >
                        {lastMsg.body}
                      </p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* ── RIGHT: Thread ── */}
        <div
          className={`
            ${mobileView === 'list' && !activeId ? 'hidden md:flex' : 'flex'}
            flex-1 flex-col bg-[#FDFAF7] overflow-hidden
          `}
        >
          {!activeId ? (
            /* No conversation selected — desktop placeholder */
            <div className="flex-1 hidden md:flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 rounded-full bg-[#F7F0E6] flex items-center justify-center mb-5">
                <MessageCircle className="w-10 h-10" style={{ color: '#EDE0CC' }} />
              </div>
              <p style={{ ...josefin, fontSize: '0.8rem', color: '#7A6A5E' }}>
                {isRTL ? 'اختر محادثة للعرض' : 'SELECT A CONVERSATION'}
              </p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3.5 bg-white border-b border-[#EDE0CC]">
                {/* Mobile back */}
                <button
                  onClick={backToList}
                  className="md:hidden p-1.5 rounded-lg hover:bg-[#F7F0E6] transition-colors flex-shrink-0"
                  aria-label="Back"
                >
                  <BackIcon className="w-5 h-5 text-[#1C1613]" />
                </button>

                {activeConvo && (() => {
                  const isGuest = currentUserId === activeConvo.guestId
                  const other = isGuest ? activeConvo.host : activeConvo.guest
                  const listingTitle = isRTL ? activeConvo.listing.titleAr : activeConvo.listing.titleEn
                  const otherName = (isRTL ? other.fullNameAr : other.fullNameEn) ?? other.fullNameEn ?? ''
                  return (
                    <>
                      <Avatar user={other} size={36} locale={locale} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C1613] truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {otherName}
                        </p>
                        <p className="text-xs truncate" style={{ color: '#9A8878', fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                          {listingTitle}
                        </p>
                      </div>
                      <Link
                        href={`/${locale}/listings/${activeConvo.listingId}`}
                        className="flex-shrink-0 text-[11px]"
                        style={{ ...josefin, color: '#C4582A', fontSize: 11 }}
                      >
                        {isRTL ? 'عرض الإعلان ←' : 'VIEW LISTING →'}
                      </Link>
                    </>
                  )
                })()}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
                {threadLoading && threadMessages.length === 0 ? (
                  <div className="flex justify-center pt-10">
                    <div className="w-6 h-6 rounded-full border-2 border-[#EDE0CC] border-t-[#C4582A] animate-spin" />
                  </div>
                ) : (
                  <>
                    {threadMessages.map((msg, idx) => {
                      const isOwn = msg.senderId === currentUserId
                      const prevMsg = threadMessages[idx - 1]
                      const showDayDivider = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt)
                      const showBookingPrompt = activeConvo && idx === 1 && !isOwn

                      return (
                        <div key={msg.id}>
                          {/* Day divider */}
                          {showDayDivider && (
                            <div className="flex items-center gap-3 my-5">
                              <div className="flex-1 h-px" style={{ background: 'rgba(122,106,94,0.15)' }} />
                              <span style={{ ...josefin, fontSize: 9, color: '#9A8878' }}>
                                {dayLabel(msg.createdAt, locale)}
                              </span>
                              <div className="flex-1 h-px" style={{ background: 'rgba(122,106,94,0.15)' }} />
                            </div>
                          )}

                          {/* Booking prompt card — contextual nudge after first host reply */}
                          {showBookingPrompt && activeConvo && (
                            <div
                              className="mx-auto mb-3 flex items-center gap-3 px-4 py-3"
                              style={{
                                maxWidth: 340,
                                background: '#F7F0E6',
                                border: '1px solid #EDE0CC',
                                borderRadius: 12,
                              }}
                            >
                              {activeConvo.listing.images[0] && (
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                                  <Image
                                    src={activeConvo.listing.images[0].url}
                                    alt=""
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[#1C1613] truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                  {isRTL ? activeConvo.listing.titleAr : activeConvo.listing.titleEn}
                                </p>
                                <p className="text-xs text-[#7A6A5E]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                                  EGP {Number(activeConvo.listing.pricePerNight).toLocaleString()} / {isRTL ? 'ليلة' : 'night'}
                                </p>
                              </div>
                              <Link
                                href={`/${locale}/listings/${activeConvo.listingId}`}
                                className="flex-shrink-0 text-[11px] px-3 py-1.5 transition-colors"
                                style={{
                                  ...josefin,
                                  fontSize: 10,
                                  color: '#C4582A',
                                  border: '1px solid rgba(196,88,42,0.3)',
                                  borderRadius: 999,
                                }}
                              >
                                {isRTL ? 'تحقق من التوفر' : 'CHECK AVAILABILITY'}
                              </Link>
                            </div>
                          )}

                          {/* Message bubble */}
                          <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
                            <div
                              className="max-w-[72%] px-4 py-2.5"
                              style={{
                                background: isOwn ? '#C4582A' : '#EDE0CC',
                                color: isOwn ? 'white' : '#1C1613',
                                borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 300,
                                fontSize: 14,
                                lineHeight: 1.6,
                              }}
                            >
                              {msg.body}
                            </div>
                          </div>
                          {/* Timestamp */}
                          <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
                            <span className="text-[10px]" style={{ color: '#9A8878', fontFamily: 'Outfit, sans-serif' }}>
                              {timeLabel(msg.createdAt, locale)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Reply input */}
              <div
                className="flex-shrink-0 bg-white px-4 py-3 flex items-end gap-3"
                style={{
                  borderTop: '1px solid #EDE0CC',
                  paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={reply}
                  onChange={(e) => setReply(e.target.value.slice(0, 500))}
                  onKeyDown={handleKeyDown}
                  placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
                  rows={1}
                  className="flex-1 resize-none outline-none text-sm text-[#1C1613] placeholder:text-[#C0B8B0] bg-transparent"
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 300,
                    minHeight: 40,
                    maxHeight: 120,
                    lineHeight: 1.5,
                  }}
                  onInput={(e) => {
                    const t = e.currentTarget
                    t.style.height = 'auto'
                    t.style.height = `${Math.min(t.scrollHeight, 120)}px`
                  }}
                />
                {replyError && (
                  <p className="text-xs text-[#C4582A] mb-1 self-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {replyError}
                  </p>
                )}
                <button
                  onClick={handleSend}
                  disabled={!reply.trim() || sending}
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{
                    background: reply.trim() ? '#C4582A' : '#EDE0CC',
                    transition: 'background 150ms ease',
                  }}
                >
                  {sending ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" style={{ color: reply.trim() ? 'white' : '#9A8878', transform: isRTL ? 'scaleX(-1)' : undefined }} />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
