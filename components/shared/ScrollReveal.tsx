'use client'

/**
 * ScrollReveal — progressive enhancement.
 *
 * SSR: renders children fully visible (no opacity/transform styles at all).
 * After hydration: if element is already in viewport → animate in after a short
 * delay. If below fold → use IntersectionObserver to trigger on scroll.
 *
 * The key fix: we never go to opacity:0 until we know the observer is set up.
 * This prevents the "flash-of-invisible-content" on hydration.
 */

import { useEffect, useRef, useState } from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function ScrollReveal({ children, className = '', delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'ssr' | 'hidden' | 'visible'>('ssr')

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const inView = rect.top < window.innerHeight && rect.bottom > 0

    if (inView) {
      // Already visible on mount — animate in quickly
      setState('hidden')
      const t = setTimeout(() => setState('visible'), delay + 50)
      return () => clearTimeout(t)
    }

    // Below fold — transition to hidden state then observe
    setState('hidden')

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setState('visible'), delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -10px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  if (state === 'ssr') {
    // No inline styles — identical to what SSR renders
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: state === 'visible' ? 1 : 0,
        transform: state === 'visible' ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 550ms cubic-bezier(0.23,1,0.32,1) ${delay}ms, transform 550ms cubic-bezier(0.23,1,0.32,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
