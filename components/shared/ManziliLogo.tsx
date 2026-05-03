'use client'

/**
 * ManziliLogo — MANZILI | منزلي
 *
 * All Latin letters, including A, are rendered by Josefin Sans 100 — the real
 * font glyph — so weight, size, baseline, and spacing are 100% consistent.
 *
 * The crossbar of the A is hidden by an absolutely-positioned rect painted in
 * the background colour of whatever surface the logo sits on (derived from
 * `variant`). Pass `bgOverride` when the surface colour is non-standard.
 *
 * Variants:
 *   "default" → #6B6060  on cream  (#F7F0E6)
 *   "dark"    → #B0A090  on charcoal (#1C1613)
 *   "terra"   → #C4582A  on terracotta (#C4582A)
 */

interface ManziliLogoProps {
  variant?: 'default' | 'dark' | 'terra'
  height?: number       // overall component height in px (default 28)
  bgOverride?: string   // override crossbar-rect colour (for unusual surfaces)
  className?: string
}

const COLORS = {
  default: { latin: '#6B6060', bar: '#9A8878', arabic: '#6B6060', crossbar: '#F7F0E6' },
  dark:    { latin: '#B0A090', bar: '#5A4A3E', arabic: '#B0A090', crossbar: '#1C1613' },
  terra:   { latin: '#C4582A', bar: 'rgba(196,88,42,0.5)', arabic: '#C4582A', crossbar: '#C4582A' },
}

export function ManziliLogo({
  variant = 'default',
  height = 28,
  bgOverride,
  className = '',
}: ManziliLogoProps) {
  const c = COLORS[variant]
  const crossbarFill = bgOverride ?? c.crossbar

  // All measurements derived from the component height
  const fontSize   = height * 0.78
  const arabicSize = fontSize * 1.18
  const barHeight  = Math.round(fontSize * 0.76)
  const gap        = Math.round(fontSize * 0.42)

  // ── Josefin Sans Thin crossbar metrics (1000-unit em) ──────────────────
  // Ascender above baseline:  ~800 units → baseline sits at 80% from em-top
  // Cap height from baseline: ~700 units → cap top at (80% – 70%) = 10% from top
  // Crossbar from baseline:   ~350 units → at (80% – 35%) = 45% from em-top
  // Crossbar stroke (wt 100): ~26 units  → ~2.6% of em height
  //
  // Horizontal: A glyph advance ≈ 0.58em; with letter-spacing 0.32em the
  // containing span is ≈ 0.90em wide. Side-bearings ≈ 0.015em each.
  // Crossbar occupies ~18%–82% of the glyph body:
  //   left  = side-bearing + 0.18 × glyph_body ≈ 14% of span width
  //   right = side-bearing + (1 – 0.82) × glyph_body → 46% from span right
  // ──────────────────────────────────────────────────────────────────────

  const crossbarTop    = fontSize * 0.44          // px from top of A inline-box
  const crossbarHeight = Math.max(1.5, fontSize * 0.032)  // px, min 1.5px

  const letterStyle: React.CSSProperties = {
    fontFamily: "'Josefin Sans', sans-serif",
    fontWeight: 100,
    fontSize,
    letterSpacing: '0.32em',
    textTransform: 'uppercase',
    color: c.latin,
    lineHeight: 1,
  }

  return (
    <div
      dir="ltr"
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap }}
      aria-label="Manzili منزلي"
    >
      {/* ── Latin wordmark ── */}
      <div style={{ ...letterStyle, display: 'flex', alignItems: 'baseline' }}>

        {/* M */}
        <span>M</span>

        {/* A — real glyph rendered by the font; crossbar hidden by rect overlay */}
        <span
          style={{
            display: 'inline-block',
            position: 'relative',
            lineHeight: 1,
            // Inherit letter/font styles so the A is identical to every sibling
          }}
        >
          {/* The actual A rendered by Josefin Sans */}
          A

          {/* Crossbar removal rect — painted in surface background colour */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left:   '14%',
              right:  '46%',
              top:    `${crossbarTop}px`,
              height: `${crossbarHeight}px`,
              background: crossbarFill,
              display: 'block',
              pointerEvents: 'none',
            }}
          />
        </span>

        {/* NZILI */}
        <span>NZILI</span>
      </div>

      {/* ── Vertical divider — 0.5 px ── */}
      <div
        aria-hidden
        style={{
          width: '0.5px',
          height: barHeight,
          background: c.bar,
          flexShrink: 0,
          alignSelf: 'center',
        }}
      />

      {/* ── Arabic wordmark ── */}
      <div
        style={{
          fontFamily: "'Tajawal', sans-serif",
          fontWeight: 200,
          fontSize: arabicSize,
          color: c.arabic,
          lineHeight: 1,
          direction: 'rtl',
          letterSpacing: '0.02em',
        }}
      >
        منـزلـي
      </div>
    </div>
  )
}

/**
 * ManziliMark — the no-crossbar A in a thin circle, for favicons / avatars
 */
export function ManziliMark({
  size = 32,
  variant = 'default',
  className = '',
}: {
  size?: number
  variant?: 'default' | 'dark' | 'terra'
  className?: string
}) {
  const c = COLORS[variant]
  const cx = size / 2
  const cy = size / 2
  const r  = size * 0.40

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={c.latin} strokeWidth={0.5} />
      <line
        x1={cx}            y1={cy - r * 0.58}
        x2={cx - r * 0.50} y2={cy + r * 0.52}
        stroke={c.latin} strokeWidth={1} strokeLinecap="round"
      />
      <line
        x1={cx}            y1={cy - r * 0.58}
        x2={cx + r * 0.50} y2={cy + r * 0.52}
        stroke={c.latin} strokeWidth={1} strokeLinecap="round"
      />
    </svg>
  )
}
