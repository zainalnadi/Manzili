'use client'

import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/admin/EmptyState'
import { SkeletonRows } from '@/components/admin/Skeleton'
import { formatDateTime, formatRelativeTime } from '@/lib/admin-utils'

interface Message {
  id: string
  body: string
  senderId: string
  createdAt: string
  sender?: { fullNameEn: string | null; email: string }
}

interface Conversation {
  id: string
  listing: { titleEn: string | null }
  guest: { id: string; fullNameEn: string | null; email: string }
  host: { id: string; fullNameEn: string | null; email: string }
  messages: Message[]
  lastMessageAt: string
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Conversation | null>(null)

  useEffect(() => {
    fetch('/api/admin/messages')
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 1200 }}>
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 18, color: '#fff', margin: '0 0 20px' }}>Messages</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 12, height: 'calc(100vh - 160px)' }}>
        {/* Conversation list */}
        <div style={{ background: '#1E1814', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 16 }}>
              <SkeletonRows cols={1} count={6} />
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState label="NO CONVERSATIONS YET" />
          ) : conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: 'pointer',
                background: selected?.id === c.id ? 'rgba(196,88,42,0.08)' : 'transparent',
                transition: 'background 120ms',
              }}
              onMouseEnter={(e) => { if (selected?.id !== c.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={(e) => { if (selected?.id !== c.id) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>{c.guest.fullNameEn ?? c.guest.email}</span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginLeft: 8 }}>{formatRelativeTime(c.lastMessageAt)}</span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.listing.titleEn ?? 'Listing'}
              </p>
              {c.messages.length > 0 && (
                <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.messages[c.messages.length - 1].body}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Thread view */}
        <div style={{ background: '#1E1814', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <EmptyState label="SELECT A CONVERSATION" />
          ) : (
            <>
              {/* Thread header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 14, color: '#fff', margin: '0 0 4px' }}>
                  {selected.guest.fullNameEn ?? selected.guest.email}
                </h2>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  Re: {selected.listing.titleEn ?? 'Listing'}
                </p>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>
                  Host: {selected.host.fullNameEn ?? selected.host.email}
                </p>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...selected.messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((m) => {
                  const isGuest = m.senderId === selected.guest.id
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isGuest ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '75%',
                        padding: '10px 14px',
                        borderRadius: isGuest ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                        background: isGuest ? '#C4582A' : '#2A2018',
                        border: isGuest ? 'none' : '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 13, color: isGuest ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>{m.body}</p>
                      </div>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                        {formatDateTime(m.createdAt)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
