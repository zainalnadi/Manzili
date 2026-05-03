'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { EmptyState } from '@/components/admin/EmptyState'
import { SkeletonRows } from '@/components/admin/Skeleton'
import {
  formatBookingId,
  formatRelativeTime,
  formatRevenueDiff,
  formatAuditAction,
} from '@/lib/admin-utils'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number
  newUsersThisMonth: number
  newUsersLastMonth: number
  totalListings: number
  pendingListings: number
  activeListings: number
  activeListingsLastMonth: number
  totalBookings: number
  pendingBookings: number
  confirmedBookingsThisMonth: number
  confirmedBookingsLastMonth: number
  pendingVerifications: number
  openReports: number
  monthRevenue: number
  lastMonthRevenue: number
}

interface AuditLog {
  id: string
  adminEmail: string
  action: string
  detail: string | null
  createdAt: string
}

interface RecentBooking {
  id: string
  status: string
  totalAmount: number
  createdAt: string
  listingTitle: string | null
  guestName: string | null
}

interface RevenueBucket {
  month: string
  total: number
}

interface OverviewData {
  stats: Stats
  recentAudit: AuditLog[]
  recentBookings: RecentBooking[]
  monthlyRevenueSeries: RevenueBucket[]
}

// ── Design tokens ──────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#1E1814',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'Josefin Sans', sans-serif",
  fontWeight: 100,
  fontSize: 9,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.4)',
  margin: 0,
}

const sectionHeading: React.CSSProperties = {
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 500,
  fontSize: 18,
  color: '#fff',
  margin: 0,
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 30_000)
    return () => clearInterval(id)
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/admin/overview')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const s = data?.stats

  const metrics = s
    ? [
        {
          label: 'Total Users',
          value: s.totalUsers.toLocaleString(),
          diff: formatRevenueDiff(s.newUsersThisMonth, s.newUsersLastMonth),
          color: '#8FA68B',
        },
        {
          label: 'Active Listings',
          value: s.activeListings.toLocaleString(),
          diff: formatRevenueDiff(s.activeListings, s.activeListingsLastMonth),
          color: '#C9973A',
        },
        {
          label: 'Total Bookings',
          value: s.totalBookings.toLocaleString(),
          diff: formatRevenueDiff(s.confirmedBookingsThisMonth, s.confirmedBookingsLastMonth),
          color: '#C4582A',
        },
        {
          label: 'Month Revenue',
          value: `EGP ${s.monthRevenue.toLocaleString()}`,
          diff: formatRevenueDiff(s.monthRevenue, s.lastMonthRevenue),
          color: '#C9973A',
        },
      ]
    : null

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Page heading */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ ...sectionHeading, fontSize: 20 }}>Overview</h1>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>
          Platform snapshot — refreshes every 30 s
        </p>
      </div>

      {/* ── Metric cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {loading || !metrics
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  ...card,
                  height: 100,
                  background: 'rgba(255,255,255,0.04)',
                  animation: 'shimmer 1.4s ease infinite',
                  backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 100%)',
                  backgroundSize: '200% 100%',
                }}
              />
            ))
          : metrics.map(({ label, value, diff, color }) => (
              <div key={label} style={{ ...card, padding: 20 }}>
                <p style={labelStyle}>{label}</p>
                <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 36, color, margin: '10px 0 6px', lineHeight: 1 }}>
                  {value}
                </p>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 11, color: diff.color, margin: 0 }}>
                  {diff.text}
                </p>
              </div>
            ))}
      </div>

      {/* ── Revenue chart + Pending actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Area chart */}
        <div style={{ ...card, padding: 20 }}>
          <p style={{ ...sectionHeading, fontSize: 18, marginBottom: 20 }}>Revenue</p>
          {loading || !data
            ? <div style={{ height: 180, background: 'rgba(255,255,255,0.04)', borderRadius: 8, animation: 'shimmer 1.4s ease infinite' }} />
            : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data.monthlyRevenueSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="terraGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C4582A" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#C4582A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 9, fill: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 10, fill: 'rgba(255,255,255,0.25)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1E1814',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.8)',
                    }}
                    formatter={((v: unknown) => [`EGP ${Number(v).toLocaleString()}`, 'Revenue']) as never}
                    cursor={{ stroke: 'rgba(255,255,255,0.08)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#C4582A"
                    strokeWidth={2}
                    fill="url(#terraGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#C4582A', stroke: '#1E1814', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* Pending actions */}
        <div style={{ ...card, padding: 20 }}>
          <p style={{ ...sectionHeading, fontSize: 18, marginBottom: 16 }}>Pending Actions</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { label: 'Listings to review', count: s?.pendingListings ?? 0, href: '/admin/listings?status=PENDING_REVIEW' },
              { label: 'Bookings pending', count: s?.pendingBookings ?? 0, href: '/admin/bookings?status=PENDING' },
              { label: 'ID verifications', count: s?.pendingVerifications ?? 0, href: '/admin/verification' },
              { label: 'Open reports', count: s?.openReports ?? 0, href: '/admin/reports' },
            ].map(({ label, count, href }) => (
              <Link
                key={label}
                href={href}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.06)',
                  textDecoration: 'none',
                  marginBottom: 6,
                  background: 'rgba(255,255,255,0.02)',
                  opacity: count === 0 ? 0.4 : 1,
                  transition: 'background 140ms',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
              >
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                  {label}
                </span>
                <span style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: count > 0 ? '#C4582A' : 'rgba(255,255,255,0.2)',
                }}>
                  {loading ? '—' : count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Activity feed + Recent bookings ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Activity feed */}
        <div style={{ ...card, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={sectionHeading}>Recent Activity</p>
            <Link href="/admin/audit" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 11, color: '#C4582A', textDecoration: 'none' }}>
              View all
            </Link>
          </div>

          {loading ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody><SkeletonRows count={6} cols={2} /></tbody>
            </table>
          ) : !data?.recentAudit?.length ? (
            <EmptyState label="No recent activity" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.recentAudit.slice(0, 8).map((log) => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                    {formatAuditAction(log.action, log.detail)}
                  </span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginTop: 1 }}>
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent bookings */}
        <div style={{ ...card, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={sectionHeading}>Recent Bookings</p>
            <Link href="/admin/bookings" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 11, color: '#C4582A', textDecoration: 'none' }}>
              View all
            </Link>
          </div>

          {loading ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody><SkeletonRows count={6} cols={3} /></tbody>
            </table>
          ) : !data?.recentBookings?.length ? (
            <EmptyState label="No recent bookings" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.recentBookings
                .filter((b) => ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'].includes(b.status))
                .slice(0, 8)
                .map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.guestName ?? 'Unknown guest'}
                      </p>
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formatBookingId(b.id)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 12, color: '#C9973A', margin: 0 }}>
                        EGP {b.totalAmount.toLocaleString()}
                      </p>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  )
}
