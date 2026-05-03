'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { EmptyState } from '@/components/admin/EmptyState'
import { SkeletonRows } from '@/components/admin/Skeleton'
import { formatDate, formatBookingId } from '@/lib/admin-utils'

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUSES = ['ALL', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'REJECTED', 'DRAFT'] as const

const DENY_REASONS = [
  'Incomplete information',
  'Photos insufficient',
  'Pricing issue',
  'ID not verified',
  'Location unclear',
  'Policy violation',
  'Duplicate listing',
]

// ── Types ──────────────────────────────────────────────────────────────────────

interface ListingRow {
  id: string
  titleEn: string | null
  titleAr: string | null
  status: string
  city: string | null
  governorate: string | null
  propertyType: string
  pricePerNight: number
  createdAt: string
  cover: string | null
  host: { id: string; fullNameEn: string | null; email: string }
  bookingCount: number
  reviewCount: number
}

interface DetailListing extends ListingRow {
  images: Array<{ url: string }>
  _count: { bookings: number; reviews: number }
  adminNote?: string | null
  host: {
    id: string
    fullNameEn: string | null
    email: string
    nationalIdVerified?: boolean
  }
}

type ConfirmMode = null | 'approve' | 'deny'

interface Toast {
  id: number
  message: string
  undoFn?: () => Promise<void>
}

// ── Design tokens ──────────────────────────────────────────────────────────────

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

// ── Page ───────────────────────────────────────────────────────────────────────

function AdminListingsInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const statusParam = searchParams.get('status') ?? 'ALL'

  // List state
  const [listings, setListings] = useState<ListingRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  // Panel state
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailListing | null>(null)
  const [panelLoading, setPanelLoading] = useState(false)
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null)
  const [selectedDenyReason, setSelectedDenyReason] = useState('')
  const [denyDetail, setDenyDetail] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [adminNote, setAdminNote] = useState('')

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef(0)

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchListings = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (statusParam !== 'ALL') params.set('status', statusParam)
    if (q) params.set('q', q)
    try {
      const res = await fetch(`/api/admin/listings?${params}`)
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings ?? [])
        setTotal(data.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [statusParam, page, q])

  useEffect(() => { fetchListings() }, [fetchListings])

  async function openPanel(id: string) {
    setSelectedId(id)
    setConfirmMode(null)
    setSelectedDenyReason('')
    setDenyDetail('')
    setPanelLoading(true)
    setDetail(null)
    const res = await fetch(`/api/admin/listings/${id}`)
    if (res.ok) {
      const d = await res.json()
      setDetail(d)
      setAdminNote(d.adminNote ?? '')
    }
    setPanelLoading(false)
  }

  function closePanel() {
    setSelectedId(null)
    setDetail(null)
    setConfirmMode(null)
    setSelectedDenyReason('')
    setDenyDetail('')
  }

  // ── Admin note auto-save ─────────────────────────────────────────────────────

  async function saveAdminNote() {
    if (!selectedId) return
    await fetch(`/api/admin/listings/${selectedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNote }),
    })
  }

  // ── Toast helpers ────────────────────────────────────────────────────────────

  function addToast(message: string, undoFn?: () => Promise<void>) {
    const id = ++toastIdRef.current
    setToasts((prev) => [...prev, { id, message, undoFn }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 8000)
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // ── Approve flow ─────────────────────────────────────────────────────────────

  async function confirmApprove() {
    if (!selectedId || !detail) return
    const prevStatus = detail.status
    setActionLoading(true)
    try {
      await fetch(`/api/admin/listings/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE', adminNote }),
      })
      closePanel()
      fetchListings()
      addToast('Listing approved — now live on Manzili', async () => {
        await fetch(`/api/admin/listings/${selectedId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: prevStatus }),
        })
        fetchListings()
      })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Deny flow ────────────────────────────────────────────────────────────────

  async function confirmDeny() {
    if (!selectedId || !detail || !selectedDenyReason) return
    const prevStatus = detail.status
    const note = denyDetail ? `${selectedDenyReason} — ${denyDetail}` : selectedDenyReason
    setActionLoading(true)
    try {
      await fetch(`/api/admin/listings/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', adminNote: note }),
      })
      closePanel()
      fetchListings()
      addToast('Listing denied — host notified', async () => {
        await fetch(`/api/admin/listings/${selectedId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: prevStatus }),
        })
        fetchListings()
      })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Filter tab handler ───────────────────────────────────────────────────────

  function setFilter(s: string) {
    router.push(`/admin/listings${s !== 'ALL' ? `?status=${s}` : ''}`)
    setPage(1)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1200, position: 'relative' }}>

      {/* Page heading */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 18, color: '#fff', margin: 0 }}>
          Listings
        </h1>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {total.toLocaleString()} total
        </span>
      </div>

      {/* Filters + search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {STATUSES.map((s) => {
          const active = statusParam === s || (s === 'ALL' && statusParam === 'ALL')
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '5px 14px',
                borderRadius: 999,
                border: `1px solid ${active ? 'rgba(196,88,42,0.5)' : 'rgba(255,255,255,0.1)'}`,
                background: active ? 'rgba(196,88,42,0.12)' : 'transparent',
                color: active ? '#C4582A' : 'rgba(255,255,255,0.4)',
                fontSize: 11,
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 100,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 120ms',
              }}
            >
              {s.replace('_', ' ')}
            </button>
          )
        })}
        <input
          type="text"
          placeholder="Search listings…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          style={{
            marginLeft: 'auto',
            height: 32,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '0 12px',
            color: 'rgba(255,255,255,0.8)',
            fontSize: 13,
            fontFamily: 'Outfit, sans-serif',
            outline: 'none',
            width: 220,
          }}
        />
      </div>

      {/* Table */}
      <div style={{ ...card }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Listing', 'Host', 'Status', 'Price / night', 'Bookings', 'Created', ''].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows count={7} cols={7} />
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState label="No listings found" />
                </td>
              </tr>
            ) : (
              listings.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => openPanel(l.id)}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 120ms' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  {/* Listing */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 44, height: 34, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', flexShrink: 0, position: 'relative' }}>
                        {l.cover && (
                          <Image src={l.cover} alt="" fill style={{ objectFit: 'cover' }} sizes="44px" />
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          {l.titleEn ?? l.titleAr ?? '—'}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                          {[l.city, l.governorate].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Host */}
                  <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.5)' }}>
                    {l.host.fullNameEn ?? l.host.email}
                  </td>

                  {/* Status */}
                  <td style={tdStyle}>
                    <StatusBadge status={l.status} />
                  </td>

                  {/* Price */}
                  <td style={{ ...tdStyle, color: '#C9973A' }}>
                    EGP {l.pricePerNight.toLocaleString()}
                  </td>

                  {/* Bookings */}
                  <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.5)' }}>
                    {l.bookingCount}
                  </td>

                  {/* Created */}
                  <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.35)' }}>
                    {formatDate(l.createdAt)}
                  </td>

                  {/* Action */}
                  <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openPanel(l.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#C4582A',
                        fontSize: 12,
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 300,
                        cursor: 'pointer',
                        padding: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Review →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={pgBtn(page === 1)}
            >
              ← Prev
            </button>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.35)', padding: '4px 12px' }}>
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              style={pgBtn(page * 20 >= total)}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Slide-in panel ── */}
      {selectedId && (
        <>
          {/* Backdrop */}
          <div
            onClick={closePanel}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100 }}
          />

          {/* Panel */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 480,
              background: '#1E1814',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              zIndex: 101,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideIn 240ms cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {/* Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px 0' }}>
              <button
                onClick={closePanel}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4 }}
                aria-label="Close panel"
              >
                ×
              </button>
            </div>

            {panelLoading ? (
              <div style={{ padding: '0 24px' }}>
                {/* Image skeleton */}
                <div style={{ height: 200, borderRadius: 10, background: 'rgba(255,255,255,0.05)', marginBottom: 16, animation: 'shimmer 1.4s ease infinite', backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.03) 100%)', backgroundSize: '200% 100%' }} />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)', marginBottom: 12, width: i % 2 === 0 ? '70%' : '45%' }} />
                ))}
              </div>
            ) : detail ? (
              <div style={{ padding: '0 24px 32px', flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>

                {/* Hero image */}
                {detail.images?.[0] && (
                  <div style={{ position: 'relative', height: 200, borderRadius: 10, overflow: 'hidden', marginBottom: 18 }}>
                    <Image src={detail.images[0].url} alt="" fill style={{ objectFit: 'cover' }} sizes="480px" />
                  </div>
                )}

                {/* Title */}
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 18, color: '#fff', margin: '0 0 4px' }}>
                  {detail.titleEn ?? detail.titleAr ?? '—'}
                </h2>
                {detail.titleAr && detail.titleEn && (
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '0 0 10px', direction: 'rtl', textAlign: 'left' }}>
                    {detail.titleAr}
                  </p>
                )}

                {/* Status */}
                <div style={{ marginBottom: 18 }}>
                  <StatusBadge status={detail.status} />
                </div>

                {/* Host section */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', padding: '12px 14px', marginBottom: 14 }}>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 8px' }}>
                    Host
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                        {detail.host.fullNameEn ?? '—'}
                      </p>
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>
                        {detail.host.email}
                      </p>
                    </div>
                    {detail.host.nationalIdVerified !== undefined && (
                      <span style={{
                        fontFamily: "'Josefin Sans', sans-serif",
                        fontWeight: 100,
                        fontSize: 9,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: detail.host.nationalIdVerified ? 'rgba(143,166,139,0.15)' : 'rgba(196,88,42,0.15)',
                        color: detail.host.nationalIdVerified ? '#8FA68B' : '#C4582A',
                        border: `1px solid ${detail.host.nationalIdVerified ? 'rgba(143,166,139,0.3)' : 'rgba(196,88,42,0.3)'}`,
                      }}>
                        {detail.host.nationalIdVerified ? 'ID Verified' : 'Unverified'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Property details */}
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 18 }}>
                  {[
                    { label: 'Property type', value: detail.propertyType },
                    { label: 'City', value: [detail.city, detail.governorate].filter(Boolean).join(', ') || '—' },
                    { label: 'Price / night', value: `EGP ${detail.pricePerNight.toLocaleString()}`, highlight: true },
                    { label: 'Bookings', value: String(detail._count.bookings) },
                    { label: 'Reviews', value: String(detail._count.reviews) },
                    { label: 'Listed', value: formatDate(detail.createdAt) },
                  ].map(({ label, value, highlight }) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                        {label}
                      </span>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 13, color: highlight ? '#C9973A' : 'rgba(255,255,255,0.8)' }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ── Approve / Deny action area ── */}
                {(detail.status === 'PENDING_REVIEW' || detail.status === 'ACTIVE') && (
                  <div style={{ marginBottom: 20 }}>

                    {/* Default: show action buttons */}
                    {confirmMode === null && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {detail.status === 'PENDING_REVIEW' && (
                          <button
                            onClick={() => setConfirmMode('approve')}
                            style={{
                              width: '100%',
                              height: 44,
                              background: 'rgba(143,166,139,0.15)',
                              border: '1px solid rgba(143,166,139,0.3)',
                              borderRadius: 8,
                              color: '#8FA68B',
                              fontFamily: "'Josefin Sans', sans-serif",
                              fontWeight: 100,
                              fontSize: 11,
                              letterSpacing: '0.18em',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                              transition: 'all 140ms',
                            }}
                          >
                            Approve Listing
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmMode('deny')}
                          style={{
                            width: '100%',
                            height: 44,
                            background: 'rgba(196,88,42,0.12)',
                            border: '1px solid rgba(196,88,42,0.3)',
                            borderRadius: 8,
                            color: '#C4582A',
                            fontFamily: "'Josefin Sans', sans-serif",
                            fontWeight: 100,
                            fontSize: 11,
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            transition: 'all 140ms',
                          }}
                        >
                          Deny Listing
                        </button>
                      </div>
                    )}

                    {/* Approve confirmation */}
                    {confirmMode === 'approve' && (
                      <div style={{ background: 'rgba(143,166,139,0.06)', border: '1px solid rgba(143,166,139,0.15)', borderRadius: 10, padding: '16px' }}>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 14px' }}>
                          Approve this listing? It will go live immediately.
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={confirmApprove}
                            disabled={actionLoading}
                            style={{
                              flex: 1,
                              height: 40,
                              background: 'rgba(143,166,139,0.2)',
                              border: '1px solid rgba(143,166,139,0.4)',
                              borderRadius: 8,
                              color: '#8FA68B',
                              fontFamily: "'Josefin Sans', sans-serif",
                              fontWeight: 100,
                              fontSize: 10,
                              letterSpacing: '0.18em',
                              textTransform: 'uppercase',
                              cursor: actionLoading ? 'not-allowed' : 'pointer',
                              opacity: actionLoading ? 0.6 : 1,
                            }}
                          >
                            {actionLoading ? '…' : 'Confirm Approval'}
                          </button>
                          <button
                            onClick={() => setConfirmMode(null)}
                            style={{
                              height: 40,
                              padding: '0 18px',
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 8,
                              color: '#7A6A5E',
                              fontFamily: "'Josefin Sans', sans-serif",
                              fontWeight: 100,
                              fontSize: 10,
                              letterSpacing: '0.18em',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Deny form */}
                    {confirmMode === 'deny' && (
                      <div style={{ background: 'rgba(196,88,42,0.05)', border: '1px solid rgba(196,88,42,0.15)', borderRadius: 10, padding: '16px' }}>
                        <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 10px' }}>
                          Select reason
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                          {DENY_REASONS.map((reason) => {
                            const selected = selectedDenyReason === reason
                            return (
                              <button
                                key={reason}
                                onClick={() => setSelectedDenyReason(selected ? '' : reason)}
                                style={{
                                  border: `1px solid ${selected ? 'rgba(196,88,42,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                  borderRadius: 999,
                                  padding: '5px 12px',
                                  fontSize: 12,
                                  fontFamily: 'Outfit, sans-serif',
                                  fontWeight: 300,
                                  background: selected ? 'rgba(196,88,42,0.1)' : 'transparent',
                                  color: selected ? '#C4582A' : 'rgba(255,255,255,0.5)',
                                  cursor: 'pointer',
                                  transition: 'all 120ms',
                                }}
                              >
                                {reason}
                              </button>
                            )
                          })}
                        </div>

                        <textarea
                          placeholder="Additional detail (optional)…"
                          value={denyDetail}
                          onChange={(e) => setDenyDetail(e.target.value)}
                          style={{
                            width: '100%',
                            height: 72,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            padding: '10px 12px',
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: 13,
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 300,
                            resize: 'none',
                            outline: 'none',
                            boxSizing: 'border-box',
                            marginBottom: 10,
                          }}
                        />

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={confirmDeny}
                            disabled={!selectedDenyReason || actionLoading}
                            style={{
                              flex: 1,
                              height: 40,
                              background: 'rgba(196,88,42,0.2)',
                              border: '1px solid rgba(196,88,42,0.4)',
                              borderRadius: 8,
                              color: '#C4582A',
                              fontFamily: "'Josefin Sans', sans-serif",
                              fontWeight: 100,
                              fontSize: 10,
                              letterSpacing: '0.18em',
                              textTransform: 'uppercase',
                              cursor: !selectedDenyReason || actionLoading ? 'not-allowed' : 'pointer',
                              opacity: !selectedDenyReason || actionLoading ? 0.45 : 1,
                              transition: 'opacity 140ms',
                            }}
                          >
                            {actionLoading ? '…' : 'Confirm Denial'}
                          </button>
                          <button
                            onClick={() => setConfirmMode(null)}
                            style={{
                              height: 40,
                              padding: '0 18px',
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 8,
                              color: '#7A6A5E',
                              fontFamily: "'Josefin Sans', sans-serif",
                              fontWeight: 100,
                              fontSize: 10,
                              letterSpacing: '0.18em',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin note */}
                <div style={{ marginTop: 'auto' }}>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 8px' }}>
                    Admin Note
                  </p>
                  <textarea
                    placeholder="Internal note (auto-saves on blur)…"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    onBlur={saveAdminNote}
                    style={{
                      width: '100%',
                      height: 80,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 13,
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 300,
                      resize: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* ── Toast stack ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: '#2A2118',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              pointerEvents: 'auto',
              animation: 'fadeUp 200ms ease',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              minWidth: 280,
            }}
          >
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 13, color: 'rgba(255,255,255,0.8)', flex: 1 }}>
              {t.message}
            </span>
            {t.undoFn && (
              <button
                onClick={async () => {
                  dismissToast(t.id)
                  await t.undoFn!()
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#C9973A',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                UNDO
              </button>
            )}
            <button
              onClick={() => dismissToast(t.id)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(480px); }
          to   { transform: translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  )
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function pgBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: '5px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 300,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

export default function AdminListingsPage() {
  return (
    <Suspense>
      <AdminListingsInner />
    </Suspense>
  )
}
