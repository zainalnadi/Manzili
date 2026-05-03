'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useAuthModal } from '@/components/shared/AuthModal'

// ── Types ─────────────────────────────────────────────────────────────────────

interface HostData {
  id: string
  fullNameEn: string | null
  fullNameAr: string | null
  avatarUrl: string | null
  nationalIdVerified: boolean
  createdAt: string
}

interface Props {
  listing: {
    id: string
    hostId: string
  }
  host: HostData
  locale: string
  currentUserId: string | null
}

// ── Suggested chips ───────────────────────────────────────────────────────────

const CHIPS_EN = [
  'Is the property available for my dates?',
  'Is early check-in possible?',
  'Is the listing suitable for children?',
  'Is parking available?',
  'Are pets allowed?',
]

const CHIPS_AR = [
  'هل العقار متاح في تواريخي؟',
  'هل يمكن الوصول المبكر؟',
  'هل العقار مناسب للأطفال؟',
  'هل يتوفر موقف سيارات؟',
  'هل الحيوانات الأليفة مسموحة؟',
]

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function VerifiedShield() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8FA68B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function CheckSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ── Host month/year ───────────────────────────────────────────────────────────

function hostSince(dateStr: string, locale: string): string {
  const d = new Date(dateStr)
  if (locale === 'ar') {
    return d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })
  }
  return d.toLocaleDateString('en-EG', { month: 'long', year: 'numeric' }).toUpperCase()
}

// ── Main component ────────────────────────────────────────────────────────────

export function MessageHostSection({ listing, host, locale, currentUserId }: Props) {
  const isRTL = locale === 'ar'
  const { openAuthModal } = useAuthModal()

  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedChips, setSelectedChips] = useState<Set<number>>(new Set())
  const [isAuthed, setIsAuthed] = useState(!!currentUserId)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const chips = isRTL ? CHIPS_AR : CHIPS_EN
  const charCount = message.length
  const hostName = (isRTL ? host.fullNameAr : host.fullNameEn) ?? host.fullNameEn ?? host.fullNameAr ?? 'Host'

  const josefin: React.CSSProperties = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 300 }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' as const }

  const handleChipClick = (idx: number) => {
    const text = chips[idx]
    setSelectedChips((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
        setMessage((m) => m.replace(text, '').replace(/\n\n+/, '\n').trim())
      } else {
        next.add(idx)
        setMessage((m) => m ? `${m}\n${text}` : text)
      }
      return next
    })
    textareaRef.current?.focus()
  }

  const handleSend = async () => {
    if (!message.trim() || sending || sent) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id, body: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send')

      setSent(true)
      setTimeout(() => {
        setSent(false)
        setMessage('')
        setSelectedChips(new Set())
      }, 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleLoginClick = () => {
    openAuthModal('login', () => setIsAuthed(true))
  }

  const formDisabled = !isAuthed

  return (
    <div
      className="pb-8 border-b border-[#EDE0CC]"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      <div className="flex flex-col md:flex-row gap-8">

        {/* ── Left: host profile card ── */}
        <div className="md:w-56 flex-shrink-0">
          {/* Avatar */}
          <div
            className="w-[72px] h-[72px] rounded-full overflow-hidden flex-shrink-0 relative flex items-center justify-center mb-4"
            style={{ border: '1px solid #EDE0CC', background: '#F7F0E6' }}
          >
            {host.avatarUrl ? (
              <Image src={host.avatarUrl} alt={hostName} fill className="object-cover" />
            ) : (
              <span
                className="text-2xl text-[#7A6A5E]"
                style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100 }}
              >
                {hostName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name */}
          <p className="text-[#1C1613] mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 16 }}>
            {hostName}
          </p>

          {/* HOST label */}
          <p
            className="text-[#7A6A5E] mb-2"
            style={{ ...josefin, fontSize: 9, letterSpacing: '0.2em' }}
          >
            {isRTL ? 'مضيف' : 'HOST'}
          </p>

          {/* Verified badge */}
          {host.nationalIdVerified && (
            <div className="flex items-center gap-1.5 mb-2">
              <VerifiedShield />
              <span
                className="text-[#8FA68B]"
                style={{ ...josefin, fontSize: 10, letterSpacing: '0.12em' }}
              >
                {isRTL ? 'مضيف موثق' : 'VERIFIED HOST'}
              </span>
            </div>
          )}

          {/* Response info */}
          <p className="text-[#7A6A5E] mb-2" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12 }}>
            {isRTL ? 'يرد خلال ساعتين' : 'Responds within 2 hours'}
          </p>

          {/* Member since */}
          <p style={{ ...josefin, fontSize: 10, color: '#7A6A5E' }}>
            {isRTL ? `مضيف منذ ${hostSince(host.createdAt, locale)}` : `HOST SINCE ${hostSince(host.createdAt, locale)}`}
          </p>
        </div>

        {/* ── Right: message form ── */}
        <div className="flex-1 min-w-0 relative">
          {/* Heading */}
          <h3
            className="text-[#1C1613] mb-1"
            style={{ ...josefin, fontSize: 18 }}
          >
            {isRTL ? 'أسئلة قبل الحجز؟' : 'Questions before you book?'}
          </h3>
          <p className="text-[#7A6A5E] mb-4" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 14 }}>
            {isRTL
              ? 'راسل المضيف مباشرة. معظمهم يردون خلال ساعات.'
              : 'Message the host directly. Most hosts respond within a few hours.'}
          </p>

          {/* Form area — dimmed if not authed */}
          <div className={formDisabled ? 'pointer-events-none' : ''} style={{ opacity: formDisabled ? 0.5 : 1, transition: 'opacity 200ms ease' }}>
            {/* Chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {chips.map((chip, idx) => {
                const active = selectedChips.has(idx)
                return (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(idx)}
                    className="text-xs px-3 py-1.5 transition-all"
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 300,
                      borderRadius: 999,
                      border: active ? '1px solid #C4582A' : '1px solid #EDE0CC',
                      background: active ? 'rgba(196,88,42,0.07)' : '#F7F0E6',
                      color: active ? '#1C1613' : '#7A6A5E',
                      transition: 'border-color 150ms ease, background 150ms ease, color 150ms ease',
                    }}
                  >
                    {chip}
                  </button>
                )
              })}
            </div>

            {/* Textarea + char counter */}
            <div className="relative mb-3">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                placeholder={isRTL ? 'مرحباً، لدي سؤال عن إعلانك...' : 'Hi, I had a question about your listing...'}
                rows={4}
                style={{
                  width: '100%',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 300,
                  fontSize: 15,
                  color: '#1C1613',
                  border: '1px solid #EDE0CC',
                  borderRadius: 14,
                  padding: 16,
                  minHeight: 120,
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 150ms ease, box-shadow 150ms ease',
                  background: 'white',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(196,88,42,0.4)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,88,42,0.08)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#EDE0CC'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              {/* Character counter */}
              <span
                className="absolute bottom-3 end-3 text-[11px] pointer-events-none"
                style={{ color: charCount > 400 ? '#C4582A' : '#7A6A5E', fontFamily: 'Outfit, sans-serif' }}
              >
                {charCount} / 500
              </span>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs mb-3" style={{ color: '#C4582A', fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                {error}
              </p>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending || sent || !message.trim()}
              className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                height: 52,
                borderRadius: 999,
                background: sent ? '#8FA68B' : sending ? 'rgba(196,88,42,0.5)' : message.trim() ? '#C4582A' : 'rgba(196,88,42,0.35)',
                ...josefin,
                fontSize: 13,
                letterSpacing: '0.2em',
                color: 'white',
                cursor: (sending || sent || !message.trim()) ? 'not-allowed' : 'pointer',
                boxShadow: message.trim() && !sending && !sent ? '0 4px 18px rgba(196,88,42,0.28)' : 'none',
                transition: 'background 200ms ease, box-shadow 200ms ease',
              }}
            >
              {sending ? (
                /* Dot loader */
                <span className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-white"
                      style={{ animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                    />
                  ))}
                </span>
              ) : sent ? (
                <span className="flex items-center gap-2">
                  <CheckSvg />
                  {isRTL ? 'تم إرسال الرسالة' : 'MESSAGE SENT'}
                </span>
              ) : (
                isRTL ? 'إرسال رسالة' : 'SEND MESSAGE'
              )}
            </button>
          </div>

          {/* Login overlay — shown when not authenticated */}
          {formDisabled && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ zIndex: 10 }}
            >
              <button
                onClick={handleLoginClick}
                className="flex items-center gap-2 text-white transition-all active:scale-[0.97]"
                style={{
                  background: '#C4582A',
                  borderRadius: 999,
                  height: 44,
                  paddingLeft: 24,
                  paddingRight: 24,
                  ...josefin,
                  fontSize: 12,
                  letterSpacing: '0.18em',
                  boxShadow: '0 4px 20px rgba(196,88,42,0.35)',
                }}
              >
                {isRTL ? 'تسجيل الدخول للتواصل' : 'LOG IN TO MESSAGE HOST'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dot-pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  )
}
