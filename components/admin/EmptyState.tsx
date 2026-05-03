'use client'
export function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 16 }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity={0.06}>
        <path d="M24 4L44 14V34L24 44L4 34V14L24 4Z" stroke="white" strokeWidth="2" fill="white"/>
        <path d="M24 4L44 14L24 24L4 14L24 4Z" fill="rgba(255,255,255,0.5)"/>
      </svg>
      <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
        {label}
      </span>
    </div>
  )
}
