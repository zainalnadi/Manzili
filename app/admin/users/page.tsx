'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { EmptyState } from '@/components/admin/EmptyState'
import { SkeletonRows } from '@/components/admin/Skeleton'
import { formatDate } from '@/lib/admin-utils'

const ROLES = ['ALL', 'GUEST', 'HOST', 'PROPERTY_MANAGER', 'ADMIN']
const SUSPEND_DURATIONS = ['24h', '7d', '30d', 'Permanent']
const REJECT_REASONS = ['Document unclear', 'Document expired', 'Name mismatch', 'Document type not accepted', 'Suspected fraud']

interface User {
  id: string
  email: string
  fullNameEn: string | null
  fullNameAr: string | null
  role: string
  status: string
  createdAt: string
  avatarUrl: string | null
  nationalIdVerified: boolean
  bannedAt: string | null
  banReason: string | null
  _count: { listings: number; bookings: number }
}

interface UserDetail extends User {
  listings: Array<{ id: string; titleEn: string | null; status: string; createdAt: string }>
  guestBookings: Array<{ id: string; status: string; totalAmount: number; createdAt: string }>
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

function AdminUsersInner() {
  const searchParams = useSearchParams()
  const qParam = searchParams.get('q') ?? ''

  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [q, setQ] = useState(qParam)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [panelLoading, setPanelLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Action states
  const [suspendAction, setSuspendAction] = useState(false)
  const [suspendDuration, setSuspendDuration] = useState('7d')
  const [suspendReason, setSuspendReason] = useState('')
  const [banAction, setBanAction] = useState(false)
  const [banEmailConfirm, setBanEmailConfirm] = useState('')
  const [banReason, setBanReason] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (roleFilter !== 'ALL') params.set('role', roleFilter)
    if (q) params.set('q', q)
    try {
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      setUsers(data.users ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [roleFilter, page, q])

  useEffect(() => { fetchUsers() }, [fetchUsers])
  useEffect(() => { if (qParam) setQ(qParam) }, [qParam])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function openPanel(id: string) {
    setSelectedId(id)
    setPanelLoading(true)
    setDetail(null)
    setSuspendAction(false)
    setBanAction(false)
    setBanEmailConfirm('')
    setBanReason('')
    setSuspendReason('')
    const res = await fetch(`/api/admin/users/${id}`)
    if (res.ok) setDetail(await res.json())
    setPanelLoading(false)
  }

  function closePanel() {
    setSelectedId(null)
    setDetail(null)
    setSuspendAction(false)
    setBanAction(false)
  }

  async function patchUser(id: string, payload: object, successMsg: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        showToast(successMsg)
        closePanel()
        fetchUsers()
      }
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div style={{ maxWidth: 1200, position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, background: '#8FA68B', color: '#fff', padding: '10px 20px', borderRadius: 8, fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 18, color: '#fff', margin: 0 }}>Users</h1>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{total} total</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {ROLES.map((r) => (
          <button key={r} onClick={() => { setRoleFilter(r); setPage(1) }} style={filterBtn(roleFilter === r)}>{r}</button>
        ))}
        <input
          type="text"
          placeholder="Search email or name…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          style={{ marginLeft: 'auto', height: 32, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0 12px', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Outfit, sans-serif', outline: 'none' }}
        />
      </div>

      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['User', 'Role', 'Status', 'Listings', 'Bookings', 'ID Verified', 'Joined', ''].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={8} count={6} />
            ) : users.length === 0 ? (
              <tr><td colSpan={8}><EmptyState label="NO USERS FOUND" /></td></tr>
            ) : users.map((u) => (
              <tr
                key={u.id}
                onClick={() => openPanel(u.id)}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {u.avatarUrl
                        ? <Image src={u.avatarUrl} alt="" fill style={{ objectFit: 'cover' }} sizes="32px" />
                        : <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{(u.fullNameEn ?? u.email)[0].toUpperCase()}</span>}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>{u.fullNameEn ?? u.fullNameAr ?? '—'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit, sans-serif' }}>{u.email}</p>
                    </div>
                  </div>
                </td>
                <td style={tdStyle}><StatusBadge status={u.role} /></td>
                <td style={tdStyle}><StatusBadge status={u.status} /></td>
                <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.4)' }}>{u._count.listings}</td>
                <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.4)' }}>{u._count.bookings}</td>
                <td style={tdStyle}><StatusBadge status={u.nationalIdVerified ? 'VERIFIED' : 'UNVERIFIED'} /></td>
                <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{formatDate(u.createdAt)}</td>
                <td style={tdStyle}>
                  <button style={{ background: 'none', border: 'none', color: '#C4582A', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>View →</button>
                </td>
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
      {selectedId && (
        <>
          <div onClick={closePanel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, background: '#1E1814', borderLeft: '1px solid rgba(255,255,255,0.08)', zIndex: 101, overflowY: 'auto', padding: 24, animation: 'slideInRight 220ms cubic-bezier(0.22,1,0.36,1)' }}>
            <button onClick={closePanel} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20, marginBottom: 16, padding: 0 }}>×</button>

            {panelLoading ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'Outfit, sans-serif' }}>Loading…</div>
            ) : detail ? (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {detail.avatarUrl
                      ? <Image src={detail.avatarUrl} alt="" fill style={{ objectFit: 'cover' }} sizes="48px" />
                      : <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>{(detail.fullNameEn ?? detail.email)[0].toUpperCase()}</span>}
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 16, color: '#fff', margin: 0 }}>{detail.fullNameEn ?? detail.fullNameAr ?? '—'}</h2>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>{detail.email}</p>
                  </div>
                </div>

                <InfoRow label="Role" value={detail.role} />
                <InfoRow label="Status" value={detail.status} />
                <InfoRow label="ID Verified" value={detail.nationalIdVerified ? 'Yes' : 'No'} />
                <InfoRow label="Listings" value={String(detail.listings.length)} />
                <InfoRow label="Bookings" value={String(detail.guestBookings.length)} />
                <InfoRow label="Joined" value={formatDate(detail.createdAt)} />
                {detail.bannedAt && <InfoRow label="Banned at" value={formatDate(detail.bannedAt)} />}
                {detail.banReason && <InfoRow label="Ban reason" value={detail.banReason} />}

                {/* RESTORE */}
                {(detail.status === 'SUSPENDED' || detail.status === 'BANNED') && (
                  <div style={{ marginTop: 20 }}>
                    <button
                      onClick={() => patchUser(detail.id, { status: 'ACTIVE' }, 'Account restored')}
                      disabled={actionLoading}
                      style={{ width: '100%', height: 40, background: 'rgba(143,166,139,0.12)', border: '1px solid rgba(143,166,139,0.3)', borderRadius: 8, color: '#8FA68B', fontSize: 12, cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                    >
                      RESTORE ACCOUNT
                    </button>
                  </div>
                )}

                {/* SUSPEND */}
                {detail.status !== 'BANNED' && (
                  <div style={{ marginTop: 16 }}>
                    {!suspendAction ? (
                      <button
                        onClick={() => { setSuspendAction(true); setBanAction(false) }}
                        style={{ width: '100%', height: 36, background: 'rgba(201,151,58,0.08)', border: '1px solid rgba(201,151,58,0.25)', borderRadius: 8, color: '#C9973A', fontSize: 12, cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                      >
                        SUSPEND
                      </button>
                    ) : (
                      <div style={{ background: 'rgba(201,151,58,0.06)', border: '1px solid rgba(201,151,58,0.2)', borderRadius: 10, padding: 16 }}>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Suspension Duration</p>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                          {SUSPEND_DURATIONS.map((d) => (
                            <button key={d} onClick={() => setSuspendDuration(d)} style={filterBtn(suspendDuration === d)}>{d}</button>
                          ))}
                        </div>
                        <textarea
                          placeholder="Reason (required)…"
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                          style={{ width: '100%', height: 60, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Outfit, sans-serif', resize: 'none', marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setSuspendAction(false)} style={{ flex: 1, height: 36, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
                          <button
                            onClick={() => patchUser(detail.id, { status: 'SUSPENDED', banReason: suspendReason }, 'User suspended')}
                            disabled={!suspendReason.trim() || actionLoading}
                            style={{ flex: 1, height: 36, background: 'rgba(201,151,58,0.12)', border: '1px solid rgba(201,151,58,0.3)', borderRadius: 8, color: '#C9973A', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', opacity: !suspendReason.trim() ? 0.5 : 1 }}
                          >
                            Confirm Suspend
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* BAN */}
                {detail.status !== 'BANNED' && (
                  <div style={{ marginTop: 12 }}>
                    {!banAction ? (
                      <button
                        onClick={() => { setBanAction(true); setSuspendAction(false) }}
                        style={{ width: '100%', height: 36, background: 'rgba(196,88,42,0.08)', border: '1px solid rgba(196,88,42,0.25)', borderRadius: 8, color: '#C4582A', fontSize: 12, cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                      >
                        BAN
                      </button>
                    ) : (
                      <div style={{ background: 'rgba(196,88,42,0.06)', border: '1px solid rgba(196,88,42,0.2)', borderRadius: 10, padding: 16 }}>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>Type the user's email to confirm the ban:</p>
                        <input
                          type="text"
                          placeholder={`Type "${detail.email}" to confirm`}
                          value={banEmailConfirm}
                          onChange={(e) => setBanEmailConfirm(e.target.value)}
                          style={{ width: '100%', height: 36, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0 12px', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
                        />
                        <textarea
                          placeholder="Ban reason…"
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          style={{ width: '100%', height: 60, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Outfit, sans-serif', resize: 'none', marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setBanAction(false)} style={{ flex: 1, height: 36, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
                          <button
                            onClick={() => patchUser(detail.id, { status: 'BANNED', banReason }, 'User banned')}
                            disabled={banEmailConfirm !== detail.email || actionLoading}
                            style={{ flex: 1, height: 36, background: 'rgba(196,88,42,0.12)', border: '1px solid rgba(196,88,42,0.3)', borderRadius: 8, color: '#C4582A', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', opacity: banEmailConfirm !== detail.email ? 0.5 : 1 }}
                          >
                            Confirm Ban
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Role change */}
                <div style={{ marginTop: 20 }}>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Change Role</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['GUEST', 'HOST', 'PROPERTY_MANAGER'].filter((r) => r !== detail.role).map((r) => (
                      <button
                        key={r}
                        onClick={() => patchUser(detail.id, { role: r }, `Role changed to ${r}`)}
                        disabled={actionLoading}
                        style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                      >
                        → {r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
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

export default function AdminUsersPage() {
  return (
    <Suspense>
      <AdminUsersInner />
    </Suspense>
  )
}
