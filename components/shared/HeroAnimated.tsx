'use client'

/**
 * HeroAnimated — staggered word entrance for the hero headline.
 * Each word fades in + slides up with 60ms stagger, 500ms duration.
 * Uses CSS animations so they run off the main thread.
 */

interface HeroAnimatedProps {
  text: string
  isRTL: boolean
  className?: string
  style?: React.CSSProperties
  as?: 'h1' | 'h2'
}

export function HeroAnimated({ text, isRTL, className = '', style: extraStyle, as: Tag = 'h1' }: HeroAnimatedProps) {
  const words = text.split(' ')

  return (
    <Tag
      className={className}
      style={{
        fontFamily: isRTL ? "'Tajawal', sans-serif" : "'Josefin Sans', sans-serif",
        fontWeight: isRTL ? 200 : 100,
        letterSpacing: isRTL ? '0' : '0.1em',
        textTransform: isRTL ? 'none' : 'uppercase',
        lineHeight: 0.95,
        ...extraStyle,
      }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            marginInlineEnd: '0.28em',
            animation: `word-in 500ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 60}ms both`,
            willChange: 'transform, opacity',
          }}
        >
          {word}
        </span>
      ))}
    </Tag>
  )
}
