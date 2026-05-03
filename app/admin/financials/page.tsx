'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { EmptyState } from '@/components/admin/EmptyState'
import { SkeletonRows } from '@/components/admin/Skeleton'
import { formatBookingId, formatDate } from '@/lib/admin-utils'

interface Summary {
  totalRevenue: number
  platformFee: number
  payoutsPaid: number
}

interface MonthPoint {
  month: string
  revenue: number
  fees: number
}

interface BookingRow {
  id: string
  guest: string
  listing: string | null
  amount: number
  platformFee: number
  hostReceives: number
  date: string
}

const card: React.CSSProperties = {
  background: '#1E1814',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
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

export default function AdminFinancialsPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [monthlySeries, setMonthlySeries] = useState<MonthPoint[]>([])
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/financials')
      .then((r) => r.json())
      .then((d) => {
        setSummary(d.summary ?? null)
        setMonthlySeries(d.monthlySeries ?? [])
        setBookings(d.recentBookings ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 18, color: '#fff', margin: 0 }}>Financials</h1>
        <button
          onClick={() => window.open('/api/admin/financials?csv=true', '_blank')}
          style={{ padding: '7px 16px', background: 'rgba(196,88,42,0.08)', border: '1px solid rgba(196,88,42,0.25)', borderRadius: 8, color: '#C4582A', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
        >
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Revenue', value: summary?.totalRevenue ?? 0, color: '#C9973A' },
          { label: 'Platform Fees Collected', value: summary?.platformFee ?? 0, color: '#8FA68B' },
          { label: 'Host Payouts', value: summary?.payoutsPaid ?? 0, color: 'rgba(255,255,255,0.6)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...card, padding: 20 }}>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 10px' }}>{label}</p>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 24, color, margin: 0 }}>
              EGP {value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly revenue bar chart */}
      <div style={{ ...card, padding: 20, marginBottom: 20 }}>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 14, color: '#fff', margin: '0 0 20px' }}>Monthly Revenue</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlySeries} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#1E1814', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Outfit' }}
              formatter={((val: unknown) => `EGP ${Number(val).toLocaleString()}`) as never}
            />
            <Bar dataKey="revenue" name="Revenue" fill="#C4582A" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
            <Bar dataKey="fees" name="Fees" fill="#C9973A" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 14, color: '#fff', margin: 0, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Transactions</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['ID', 'Guest', 'Listing', 'Total', 'Platform Fee', 'Host Receives', 'Date'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={7} count={6} />
            ) : bookings.length === 0 ? (
              <tr><td colSpan={7}><EmptyState label="NO TRANSACTIONS YET" /></td></tr>
            ) : bookings.map((b) => (
              <tr
                key={b.id}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{formatBookingId(b.id)}</td>
                <td style={tdStyle}>{b.guest}</td>
                <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.5)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.listing ?? '—'}</td>
                <td style={{ ...tdStyle, color: '#C9973A' }}>EGP {b.amount.toLocaleString()}</td>
                <td style={{ ...tdStyle, color: '#8FA68B' }}>EGP {b.platformFee.toLocaleString()}</td>
                <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.6)' }}>EGP {b.hostReceives.toLocaleString()}</td>
                <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{formatDate(b.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
