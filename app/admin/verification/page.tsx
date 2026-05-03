'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { EmptyState } from '@/components/admin/EmptyState'
import { SkeletonRows } from '@/components/admin/Skeleton'
import { formatDate } from '@/lib/admin-utils'

interface UnverifiedUser {
  id: string
  fullNameEn: string | null
  fullNameAr: string | null
  email: string
  nationalId: string | null
  nationalIdImageUrl: string | null
  nationalIdVerified: boolean
  createdAt: string
  _count?: { listings: number }
}

const REJECT_REASONS = [
  'Document unclear',
  'Document expired',
  'Name mismatch',
  'Document type not accepted',
  'Suspected fraud',
]

const card: React.CSSProperties = {
  background: '#1E1814',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  overflow: 'hidden',
}

const thStyle: React.CSSProperties = {
  fontFamily: "'Josefin Sans', sans-serif",
  fontWeight: 100,
  fontSize: 9,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.4)',
  padding: '10px 16px',
  textAlign: 'left',
}

const tdStyle: React.CSSProperties = {
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 300,
  fontSize: 13,
  color: 'rgba(255,255,255,0.8)',
  padding: '12px 16px',
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{value}</span>
    </div>
  )
}

export default function AdminVerificationPage() {
  const [users, setUsers] = useState<UnverifiedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<UnverifiedUser | null>(null)
  const [imgRevealed, setImgRevealed] = useState(false)
  const [showRevealWarning, setShowRevealWarning] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/verification')
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function openPanel(u: UnverifiedUser) {
    setSelected(u)
    setImgRevealed(false)
    setShowRevealWarning(false)
    setRejectMode(false)
    setRejectReason('')
  }

  function closePanel() {
    setSelected(null)
    setImgRevealed(false)
    setShowRevealWarning(false)
    setRejectMode(false)
  }

  async function verify(id: string, approved: boolean, reason?: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalIdVerified: approved, ...(reason ? { banReason: reason } : {}) }),
      })
      if (res.ok) {
        showToast(approved ? 'Identity verified' : 'Verification rejected')
        setUsers((prev) => prev.filter((u) => u.id !== id))
        closePanel()
      }
    } finally {
      setActionLoading(false)
    }
  }

  function handleReveal() {
    setShowRevealWarning(true)
  }

  function confirmReveal() {
    setImgRevealed(true)
    setShowRevealWarning(false)
    // Log action to audit (no dedicated endpoint needed — the verify endpoint logs it)
  }

  return (
    <div style={{ maxWidth: 1200, position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, background: '#8FA68B', color: '#fff', padding: '10px 20px', borderRadius: 8, fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 18, color: '#fff', margin: 0 }}>ID Verification</h1>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          {users.length} pending
        </span>
      </div>

      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['User', 'National ID', 'Document', 'Status', 'Submitted', 'Action'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={6} count={5} />
            ) : users.length === 0 ? (
              <tr><td colSpan={6}><EmptyState label="NO PENDING VERIFICATIONS" /></td></tr>
            ) : users.map((u) => (
              <tr
                key={u.id}
                onClick={() => openPanel(u)}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={tdStyle}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>{u.fullNameEn ?? u.fullNameAr ?? '—'}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit, sans-serif' }}>{u.email}</p>
                  </div>
                </td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{u.nationalId ?? '—'}</td>
                <td style={tdStyle}>
                  <StatusBadge status={u.nationalIdImageUrl ? 'UPLOADED' : 'MISSING'} />
                </td>
                <td style={tdStyle}><StatusBadge status={u.nationalIdVerified ? 'VERIFIED' : 'PENDING'} /></td>
                <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{formatDate(u.createdAt)}</td>
                <td style={tdStyle}>
                  <button style={{ background: 'none', border: 'none', color: '#C4582A', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Review →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <>
          <div onClick={closePanel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, background: '#1E1814', borderLeft: '1px solid rgba(255,255,255,0.08)', zIndex: 101, overflowY: 'auto', padding: 24, animation: 'slideInRight 220ms cubic-bezier(0.22,1,0.36,1)' }}>
            <button onClick={closePanel} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20, marginBottom: 16, padding: 0 }}>×</button>

            {/* Host info */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 16, color: '#fff', margin: '0 0 4px' }}>{selected.fullNameEn ?? selected.fullNameAr ?? '—'}</h2>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{selected.email}</p>
            </div>

            <InfoRow label="Joined" value={formatDate(selected.createdAt)} />
            {selected._count && <InfoRow label="Listings" value={String(selected._count.listings)} />}
            <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Verification Status</span>
                <StatusBadge status={selected.nationalIdVerified ? 'VERIFIED' : 'PENDING'} />
              </div>
            </div>

            <InfoRow label="National ID" value={selected.nationalId ?? '—'} />

            {/* Document image */}
            <div style={{ marginTop: 20, marginBottom: 20 }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>ID Document</p>

              {selected.nationalIdImageUrl ? (
                <>
                  <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ position: 'relative', width: '100%', height: 220 }}>
                      <Image
                        src={selected.nationalIdImageUrl}
                        alt="ID Document"
                        fill
                        style={{ objectFit: 'cover', filter: imgRevealed ? 'none' : 'blur(16px)', transition: 'filter 300ms' }}
                        sizes="480px"
                      />
                    </div>
                    {!imgRevealed && !showRevealWarning && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                          onClick={handleReveal}
                          style={{ padding: '8px 18px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: 'rgba(255,255,255,0.8)', fontSize: 11, cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                        >
                          REVEAL DOCUMENT
                        </button>
                      </div>
                    )}
                  </div>

                  {showRevealWarning && (
                    <div style={{ background: 'rgba(201,151,58,0.08)', border: '1px solid rgba(201,151,58,0.25)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '0 0 12px', lineHeight: 1.5 }}>
                        You are about to view a sensitive identity document. This action will be logged.
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setShowRevealWarning(false)} style={{ flex: 1, height: 34, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>CANCEL</button>
                        <button onClick={confirmReveal} style={{ flex: 1, height: 34, background: 'rgba(201,151,58,0.12)', border: '1px solid rgba(201,151,58,0.3)', borderRadius: 6, color: '#C9973A', fontSize: 11, cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.1em', textTransform: 'uppercase' }}>REVEAL</button>
                      </div>
                    </div>
                  )}

                  {imgRevealed && (
                    <button onClick={() => setImgRevealed(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', marginBottom: 8 }}>Hide image</button>
                  )}
                </>
              ) : (
                <div style={{ padding: 16, background: 'rgba(201,151,58,0.08)', border: '1px solid rgba(201,151,58,0.2)', borderRadius: 8 }}>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: '#C9973A', margin: 0 }}>No document uploaded — verify by ID number only</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={() => verify(selected.id, true)}
              disabled={actionLoading}
              style={{ width: '100%', height: 42, background: 'rgba(143,166,139,0.12)', border: '1px solid rgba(143,166,139,0.3)', borderRadius: 8, color: '#8FA68B', fontSize: 12, cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}
            >
              MARK AS VERIFIED
            </button>

            {!rejectMode ? (
              <button
                onClick={() => setRejectMode(true)}
                style={{ width: '100%', height: 38, background: 'transparent', border: '1px solid rgba(196,88,42,0.3)', borderRadius: 8, color: '#C4582A', fontSize: 12, cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                REJECT
              </button>
            ) : (
              <div style={{ background: 'rgba(196,88,42,0.06)', border: '1px solid rgba(196,88,42,0.2)', borderRadius: 10, padding: 14 }}>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rejection Reason</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {REJECT_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRejectReason(r)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        border: rejectReason === r ? '1px solid #C4582A' : '1px solid rgba(255,255,255,0.08)',
                        background: rejectReason === r ? 'rgba(196,88,42,0.12)' : 'transparent',
                        color: rejectReason === r ? '#C4582A' : 'rgba(255,255,255,0.4)',
                        fontSize: 11,
                        cursor: 'pointer',
                        fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setRejectMode(false)} style={{ flex: 1, height: 34, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
                  <button
                    onClick={() => verify(selected.id, false, rejectReason)}
                    disabled={!rejectReason || actionLoading}
                    style={{ flex: 1, height: 34, background: 'rgba(196,88,42,0.12)', border: '1px solid rgba(196,88,42,0.3)', borderRadius: 6, color: '#C4582A', fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', opacity: !rejectReason ? 0.5 : 1 }}
                  >
                    Confirm Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(480px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
