'use client'

interface WhyCardProps {
  children: React.ReactNode
}

export function WhyCard({ children }: WhyCardProps) {
  return (
    <div
      className="bg-white rounded-2xl p-8 text-center h-full"
      style={{
        border: '0.5px solid rgba(122,106,94,0.15)',
        transition: 'border-color 250ms ease, box-shadow 250ms ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(196,88,42,0.3)'
        el.style.boxShadow = '0 8px 32px rgba(196,88,42,0.06)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(122,106,94,0.15)'
        el.style.boxShadow = 'none'
      }}
    >
      {children}
    </div>
  )
}
