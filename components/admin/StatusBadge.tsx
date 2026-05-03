'use client'

const STYLES: Record<string, { bg: string; color: string; border: string }> = {
  // Green
  ACTIVE: { bg: 'rgba(143,166,139,0.15)', color: '#8FA68B', border: 'rgba(143,166,139,0.3)' },
  CONFIRMED: { bg: 'rgba(143,166,139,0.15)', color: '#8FA68B', border: 'rgba(143,166,139,0.3)' },
  VERIFIED: { bg: 'rgba(143,166,139,0.15)', color: '#8FA68B', border: 'rgba(143,166,139,0.3)' },
  COMPLETED: { bg: 'rgba(143,166,139,0.15)', color: '#8FA68B', border: 'rgba(143,166,139,0.3)' },
  CHECKED_OUT: { bg: 'rgba(143,166,139,0.15)', color: '#8FA68B', border: 'rgba(143,166,139,0.3)' },
  RESOLVED: { bg: 'rgba(143,166,139,0.15)', color: '#8FA68B', border: 'rgba(143,166,139,0.3)' },
  // Gold
  PENDING: { bg: 'rgba(201,150,58,0.15)', color: '#C9963A', border: 'rgba(201,150,58,0.3)' },
  PENDING_REVIEW: { bg: 'rgba(201,150,58,0.15)', color: '#C9963A', border: 'rgba(201,150,58,0.3)' },
  CHECKED_IN: { bg: 'rgba(201,150,58,0.15)', color: '#C9963A', border: 'rgba(201,150,58,0.3)' },
  REVIEWED: { bg: 'rgba(201,150,58,0.15)', color: '#C9963A', border: 'rgba(201,150,58,0.3)' },
  // Terra
  REJECTED: { bg: 'rgba(196,88,42,0.15)', color: '#C4582A', border: 'rgba(196,88,42,0.3)' },
  CANCELLED: { bg: 'rgba(196,88,42,0.15)', color: '#C4582A', border: 'rgba(196,88,42,0.3)' },
  BANNED: { bg: 'rgba(196,88,42,0.15)', color: '#C4582A', border: 'rgba(196,88,42,0.3)' },
  SUSPENDED: { bg: 'rgba(196,88,42,0.15)', color: '#C4582A', border: 'rgba(196,88,42,0.3)' },
  ACTIONED: { bg: 'rgba(196,88,42,0.15)', color: '#C4582A', border: 'rgba(196,88,42,0.3)' },
  // Muted
  DRAFT: { bg: 'rgba(122,106,94,0.15)', color: '#7A6A5E', border: 'rgba(122,106,94,0.3)' },
  PAUSED: { bg: 'rgba(122,106,94,0.15)', color: '#7A6A5E', border: 'rgba(122,106,94,0.3)' },
  DISMISSED: { bg: 'rgba(122,106,94,0.15)', color: '#7A6A5E', border: 'rgba(122,106,94,0.3)' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STYLES[status] ?? STYLES.DRAFT
  return (
    <span style={{
      display: 'inline-block',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 999,
      padding: '3px 10px',
      fontFamily: "'Josefin Sans', sans-serif",
      fontWeight: 100,
      fontSize: 9,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
