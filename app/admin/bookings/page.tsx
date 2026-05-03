'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { EmptyState } from '@/components/admin/EmptyState'
import { SkeletonRows } from '@/components/admin/Skeleton'
import { formatBookingId, formatDate } from '@/lib/admin-utils'

const STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED']
const TIMELINE_STEPS = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED']

interface Booking {
  id: string
  status: string
  paymentStatus: string
  checkIn: string
  checkOut: string
  nights: number
  totalAmount: number
  totalHostReceives: number
  cleaningFee?: number
  serviceFee?: number
  nightlyTotal?: number
  createdAt: string
  listing: { id: string; titleEn: string | null; titleAr: string | null }
  guest: { id: string; fullNameEn: string | null; fullNameAr: string | null; email: string }
}

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

const pgBtn: React.CSSProperties = {
  padding: '4px 12px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  color: 'rgba(255,255,255,0.5)',
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'Outfit, sans-serif',
}

function filterBtn(active: boolean): React.CSSProperties {
  return {
    padding: '5px 14px',
    borderRadius: 999,
    border: active ? '1px solid #C4582A' : '1px solid rgba(255,255,255,0.08)',
    background: active ? 'rgba(196,88,42,0.12)' : 'transparent',
    color: active ? '#C4582A' : 'rgba(255,255,255,0.4)',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'Outfit, sans-serif',
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{value}</span>
    </div>
  )
}

function Timeline({ currentStatus }: { currentStatus: string }) {
  const stepIndex = TIMELINE_STEPS.indexOf(currentStatus)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 8 }}>
      {TIMELINE_STEPS.map((step, i) => {
        const reached = i <= stepIndex
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: reached ? '#8FA68B' : 'rgba(255,255,255,0.2)', border: reached ? 'none' : '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 9, color: reached ? '#8FA68B' : 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{step}</span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < stepIndex ? '#8FA68B' : 'rgba(255,255,255,0.1)', marginBottom: 20 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function AdminBookingsInner() {
  const searchParams = useSearchParams()
  const statusParam = searchParams.get('status') ?? 'ALL'

  const [bookings, setBookings] = useState<Booking[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState(statusParam)
  const [selected, setSelected] = useState<Booking | null>(null)
  const [cancelMode, setCancelMode] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (q) params.set('q', q)
    try {
      const res = await fetch(`/api/admin/bookings?${params}`)
      const data = await res.json()
      setBookings(data.bookings ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, q])

  useEffect(() => { fetchBookings() }, [fetchBookings])
  useEffect(() => { setStatusFilter(statusParam) }, [statusParam])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function openPanel(b: Booking) {
    setSelected(b)
    setCancelMode(false)
    setCancelReason('')
  }

  function closePanel() {
    setSelected(null)
    setCancelMode(false)
  }

  async function cancelBooking() {
    if (!selected) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/bookings/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', reason: cancelReason }),
      })
      if (res.ok) {
        showToast('Booking cancelled')
        closePanel()
        fetchBookings()
      }
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div style={{ maxWidth: 1200, position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, background: '#8FA68B', color: '#fff', padding: '10px 20px', borderRadius: 8, fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 18, color: '#fff', margin: 0 }}>Bookings</h1>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{total} total</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }} style={filterBtn(statusFilter === s)}>{s}</button>
        ))}
        <input
          type="text"
          placeholder="Search guest, listing…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          style={{ marginLeft: 'auto', height: 32, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0 12px', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Outfit, sans-serif', outline: 'none' }}
        />
      </div>

      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['ID', 'Guest', 'Listing', 'Dates', 'Nights', 'Amount', 'Status', 'Payment', 'Created'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={9} count={6} />
            ) : bookings.length === 0 ? (
              <tr><td colSpan={9}><EmptyState label="NO BOOKINGS FOUND" /></td></tr>
            ) : bookings.map((b) => (
              <tr
                key={b.id}
                onClick={() => openPanel(b)}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: '#C9973A' }}>{formatBookingId(b.id)}</td>
                <td style={tdStyle}>{b.guest.fullNameEn ?? b.guest.email}</td>
                <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.5)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.listing.titleEn ?? b.listing.titleAr}</td>
                <td style={{ ...tdStyle, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</td>
                <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.5)' }}>{b.nights}</td>
                <td style={{ ...tdStyle, color: '#C9973A' }}>EGP {b.totalAmount.toLocaleString()}</td>
                <td style={tdStyle}><StatusBadge status={b.status} /></td>
                <td style={tdStyle}><StatusBadge status={b.paymentStatus} /></td>
                <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{formatDate(b.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={pgBtn}>Prev</button>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '4px 8px' }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages} style={pgBtn}>Next</button>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <>
          <div onClick={closePanel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, background: '#1E1814', borderLeft: '1px solid rgba(255,255,255,0.08)', zIndex: 101, overflowY: 'auto', padding: 24, animation: 'slideInRight 220ms cubic-bezier(0.22,1,0.36,1)' }}>
            <button onClick={closePanel} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20, marginBottom: 16, padding: 0 }}>×</button>

            <p style={{ fontFamily: 'monospace', fontSize: 18, color: '#C9973A', margin: '0 0 20px', fontWeight: 600 }}>{formatBookingId(selected.id)}</p>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Guest</p>
              <InfoRow label="Name" value={selected.guest.fullNameEn ?? selected.guest.fullNameAr ?? '—'} />
              <InfoRow label="Email" value={selected.guest.email} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Listing</p>
              <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <Link href={`/en/listings/${selected.listing.id}`} target="_blank" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: '#C4582A', textDecoration: 'none' }}>
                  {selected.listing.titleEn ?? selected.listing.titleAr ?? 'View Listing →'}
                </Link>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Payment Breakdown</p>
              <InfoRow label="Check-in" value={formatDate(selected.checkIn)} />
              <InfoRow label="Check-out" value={formatDate(selected.checkOut)} />
              <InfoRow label="Nights" value={String(selected.nights)} />
              {selected.nightlyTotal !== undefined && <InfoRow label="Nightly total" value={`EGP ${selected.nightlyTotal.toLocaleString()}`} />}
              {selected.cleaningFee !== undefined && <InfoRow label="Cleaning fee" value={`EGP ${selected.cleaningFee.toLocaleString()}`} />}
              {selected.serviceFee !== undefined && <InfoRow label="Service fee" value={`EGP ${selected.serviceFee.toLocaleString()}`} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Total</span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 13, color: '#C9973A' }}>EGP {selected.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Timeline</p>
              <Timeline currentStatus={selected.status} />
            </div>

            {selected.status !== 'CANCELLED' && selected.status !== 'COMPLETED' && (
              <div style={{ marginTop: 8 }}>
                {!cancelMode ? (
                  <button
                    onClick={() => setCancelMode(true)}
                    style={{ width: '100%', height: 40, background: 'rgba(196,88,42,0.08)', border: '1px solid rgba(196,88,42,0.25)', borderRadius: 8, color: '#C4582A', fontSize: 12, cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                  >
                    CANCEL BOOKING
                  </button>
                ) : (
                  <div style={{ background: 'rgba(196,88,42,0.06)', border: '1px solid rgba(196,88,42,0.2)', borderRadius: 10, padding: 16 }}>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>Provide a cancellation reason:</p>
                    <textarea
                      placeholder="Reason for cancellation…"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      style={{ width: '100%', height: 80, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Outfit, sans-serif', resize: 'none', marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setCancelMode(false)} style={{ flex: 1, height: 36, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
                      <button
                        onClick={cancelBooking}
                        disabled={!cancelReason.trim() || actionLoading}
                        style={{ flex: 1, height: 36, background: 'rgba(196,88,42,0.12)', border: '1px solid rgba(196,88,42,0.3)', borderRadius: 8, color: '#C4582A', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', opacity: !cancelReason.trim() ? 0.5 : 1 }}
                      >
                        Confirm Cancel
                      </button>
                    </div>
                  </div>
                )}
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

export default function AdminBookingsPage() {
  return (
    <Suspense>
      <AdminBookingsInner />
    </Suspense>
  )
}
