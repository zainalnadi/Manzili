// Shared admin utility functions - used everywhere in admin

export function formatBookingId(id: string): string {
  return `MNZ-${id.slice(0, 8).toUpperCase()}`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return `${formatDate(d)} · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

export function formatRelativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function formatRevenueDiff(thisMonth: number, lastMonth: number): { text: string; color: string } {
  if (thisMonth === 0 && lastMonth === 0) return { text: '—', color: '#4A3D35' }
  if (lastMonth === 0 && thisMonth > 0) return { text: 'New this month', color: '#8FA68B' }
  const pct = ((thisMonth - lastMonth) / lastMonth) * 100
  const capped = Math.min(Math.abs(pct), 999)
  const sign = pct >= 0 ? '↑' : '↓'
  const color = pct >= 0 ? '#8FA68B' : '#C4582A'
  return { text: `${sign} ${capped.toFixed(0)}%`, color }
}

export function formatAuditAction(action: string, detail?: string | null): string {
  const map: Record<string, string> = {
    LOGIN: 'Admin signed in',
    LOGIN_FAILED: 'Failed login attempt',
    LOGOUT: 'Admin signed out',
    APPROVE_LISTING: 'Approved listing',
    REJECT_LISTING: 'Denied listing',
    UPDATE_LISTING_STATUS: 'Updated listing status',
    SET_USER_BANNED: 'Banned user account',
    SET_USER_SUSPENDED: 'Suspended user account',
    SET_USER_ACTIVE: 'Reinstated user account',
    SET_USER_ROLE_HOST: 'Changed user role to Host',
    SET_USER_ROLE_GUEST: 'Changed user role to Guest',
    APPROVE_ID_VERIFICATION: 'Approved ID verification',
    REJECT_ID_VERIFICATION: 'Rejected ID verification',
    UPDATE_SETTINGS: 'Updated platform settings',
    REPORT_RESOLVED: 'Resolved content report',
    REPORT_DISMISSED: 'Dismissed content report',
    CANCEL_BOOKING: 'Cancelled booking',
  }
  const base = map[action] ?? action.replace(/_/g, ' ').toLowerCase()
  return detail ? `${base} — ${detail}` : base
}

// Generate time buckets for last N months (always includes current month)
export function generateMonthBuckets(n: number): { label: string; start: Date; end: Date }[] {
  const now = new Date()
  const buckets = []
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    const label = start.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    buckets.push({ label, start, end })
  }
  return buckets
}
