'use client'

import { useEffect, useState, useCallback } from 'react'
import { EmptyState } from '@/components/admin/EmptyState'
import { SkeletonRows } from '@/components/admin/Skeleton'
import { formatDateTime, formatAuditAction } from '@/lib/admin-utils'

const ENTITIES = ['ALL', 'auth', 'listing', 'user', 'settings', 'booking', 'report']

interface AuditLog {
  id: string
  adminEmail: string
  action: string
  entity: string
  entityId: string | null
  detail: string | null
  ip: string | null
  createdAt: string
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

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '30' })
    if (entityFilter !== 'ALL') params.set('entity', entityFilter)
    if (search) params.set('q', search)
    try {
      const res = await fetch(`/api/admin/audit?${params}`)
      const data = await res.json()
      setLogs(data.logs ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, entityFilter, search])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const totalPages = Math.ceil(total / 30)

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 18, color: '#fff', margin: 0 }}>Audit Log</h1>
        <button
          onClick={() => window.open('/api/admin/audit?csv=true', '_blank')}
          style={{ padding: '7px 16px', background: 'rgba(196,88,42,0.08)', border: '1px solid rgba(196,88,42,0.25)', borderRadius: 8, color: '#C4582A', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
        >
          Export CSV
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {ENTITIES.map((e) => (
          <button key={e} onClick={() => { setEntityFilter(e); setPage(1) }} style={filterBtn(entityFilter === e)}>{e}</button>
        ))}
        <input
          type="text"
          placeholder="Search action or detail…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          style={{ marginLeft: 'auto', height: 32, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0 12px', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Outfit, sans-serif', outline: 'none' }}
        />
      </div>

      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Timestamp', 'Admin', 'Action', 'Entity', 'Entity ID', 'Details', 'IP'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={7} count={8} />
            ) : logs.length === 0 ? (
              <tr><td colSpan={7}><EmptyState label="NO AUDIT ENTRIES" /></td></tr>
            ) : logs.map((log) => (
              <tr
                key={log.id}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ ...tdStyle, fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</td>
                <td style={{ ...tdStyle, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{log.adminEmail.split('@')[0]}</td>
                <td style={{ ...tdStyle, fontSize: 12 }}>{formatAuditAction(log.action)}</td>
                <td style={{ ...tdStyle, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{log.entity}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{log.entityId?.slice(0, 8) ?? '—'}</td>
                <td style={{ ...tdStyle, fontSize: 12, color: 'rgba(255,255,255,0.5)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.detail ? log.detail.slice(0, 40) + (log.detail.length > 40 ? '…' : '') : '—'}
                </td>
                <td style={{ ...tdStyle, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{log.ip ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={pgBtn}>Prev</button>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '4px 8px' }}>
              Page {page} of {totalPages} · {total} total entries
            </span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages} style={pgBtn}>Next</button>
          </div>
        )}
      </div>
    </div>
  )
}
