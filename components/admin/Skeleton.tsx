'use client'
import { useEffect, useState } from 'react'

export function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px' }}>
          <div style={{ height: 13, borderRadius: 4, background: 'rgba(255,255,255,0.05)', animation: 'shimmer 1.4s ease infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)' }} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonRows({ count = 5, cols = 6 }: { count?: number; cols?: number }) {
  return <>{Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}</>
}
