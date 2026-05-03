'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { EmptyState } from '@/components/admin/EmptyState'
import { SkeletonRows } from '@/components/admin/Skeleton'
import { formatDate } from '@/lib/admin-utils'

const STATUS_FILTERS = ['ALL', 'PENDING', 'REVIEWED', 'ACTIONED', 'DISMISSED']

interface Report {
  id: string
  reason: string
  status: string
  details: string | null
  createdAt: string
  reporter: { fullNameEn: string | null; email: string }
  listing: { id: string; titleEn: string | null; status: string }
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

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: string } | null>(null)
  const [removeReason, setRemoveReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/reports')
      .then((r) => r.json())
      .then((d) => setReports(d.reports ?? []))
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function patchReport(id: string, status: string, listingId?: string, reason?: string) {
    setActionLoading(true)
    try {
      await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (status === 'ACTIONED' && listingId) {
        await fetch(`/api/admin/listings/${listingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'REJECTED', reason }),
        })
      }
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
      showToast(status === 'DISMISSED' ? 'Report dismissed' : status === 'REVIEWED' ? 'Report resolved' : 'Content removed')
      setExpandedId(null)
      setConfirmAction(null)
      setRemoveReason('')
    } finally {
      setActionLoading(false)
    }
  }

  const filtered = statusFilter === 'ALL' ? reports : reports.filter((r) => r.status === statusFilter)

  return (
    <div style={{ maxWidth: 1200 }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, background: '#8FA68B', color: '#fff', padding: '10px 20px', borderRadius: 8, fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 18, color: '#fff', margin: 0 }}>Reports</h1>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{reports.length} total</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} style={filterBtn(statusFilter === s)}>{s}</button>
        ))}
      </div>

      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Reporter', 'Content', 'Reason', 'Description', 'Status', 'Date', 'Actions'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={7} count={5} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}><EmptyState label="NO REPORTS FILED" /></td></tr>
            ) : filtered.map((r) => (
              <>
                <tr
                  key={r.id}
                  style={{ borderBottom: expandedId === r.id ? 'none' : '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={tdStyle}>{r.reporter.fullNameEn ?? r.reporter.email}</td>
                  <td style={tdStyle}>
                    <Link href={`/en/listings/${r.listing.id}`} target="_blank" style={{ color: '#C4582A', fontFamily: 'Outfit, sans-serif', fontSize: 12, textDecoration: 'none' }}>
                      {r.listing.titleEn ?? 'Listing →'}
                    </Link>
                  </td>
                  <td style={tdStyle}><StatusBadge status={r.reason} /></td>
                  <td style={{ ...tdStyle, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.5)' }}>{r.details ?? '—'}</td>
                  <td style={tdStyle}><StatusBadge status={r.status} /></td>
                  <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{formatDate(r.createdAt)}</td>
                  <td style={tdStyle}>
                    {r.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                          style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                        >
                          Actions
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                {expandedId === r.id && (
                  <tr key={`${r.id}-expand`}>
                    <td colSpan={7} style={{ padding: '0 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 16 }}>
                        {!confirmAction ? (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setConfirmAction({ id: r.id, type: 'DISMISS' })}
                              style={{ padding: '6px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => setConfirmAction({ id: r.id, type: 'RESOLVE' })}
                              style={{ padding: '6px 16px', background: 'rgba(143,166,139,0.08)', border: '1px solid rgba(143,166,139,0.25)', borderRadius: 6, color: '#8FA68B', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => setConfirmAction({ id: r.id, type: 'REMOVE' })}
                              style={{ padding: '6px 16px', background: 'rgba(196,88,42,0.08)', border: '1px solid rgba(196,88,42,0.25)', borderRadius: 6, color: '#C4582A', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                            >
                              Remove Content
                            </button>
                            <button onClick={() => setExpandedId(null)} style={{ padding: '6px 16px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
                          </div>
                        ) : confirmAction.type === 'REMOVE' ? (
                          <div>
                            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>Reason for content removal:</p>
                            <textarea
                              value={removeReason}
                              onChange={(e) => setRemoveReason(e.target.value)}
                              placeholder="Explain why the content is being removed…"
                              style={{ width: '100%', height: 70, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Outfit, sans-serif', resize: 'none', marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => { setConfirmAction(null); setRemoveReason('') }} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
                              <button
                                onClick={() => patchReport(r.id, 'ACTIONED', r.listing.id, removeReason)}
                                disabled={!removeReason.trim() || actionLoading}
                                style={{ padding: '6px 16px', background: 'rgba(196,88,42,0.12)', border: '1px solid rgba(196,88,42,0.3)', borderRadius: 6, color: '#C4582A', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', opacity: !removeReason.trim() ? 0.5 : 1 }}
                              >
                                Confirm Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>
                              {confirmAction.type === 'DISMISS' ? 'Dismiss this report?' : 'Mark as resolved?'}
                            </p>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => setConfirmAction(null)} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
                              <button
                                onClick={() => patchReport(r.id, confirmAction.type === 'DISMISS' ? 'DISMISSED' : 'REVIEWED')}
                                disabled={actionLoading}
                                style={{ padding: '6px 16px', background: confirmAction.type === 'DISMISS' ? 'rgba(255,255,255,0.04)' : 'rgba(143,166,139,0.12)', border: confirmAction.type === 'DISMISS' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(143,166,139,0.3)', borderRadius: 6, color: confirmAction.type === 'DISMISS' ? 'rgba(255,255,255,0.5)' : '#8FA68B', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                              >
                                Confirm
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
