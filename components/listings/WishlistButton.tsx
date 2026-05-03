'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WishlistButtonProps {
  listingId: string
  initialWishlisted: boolean
  locale: string
}

export function WishlistButton({ listingId, initialWishlisted, locale }: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    if (loading) return
    setLoading(true)
    // Optimistic update
    setWishlisted((prev) => !prev)

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })

      if (res.status === 401) {
        // Revert optimistic update then redirect
        setWishlisted((prev) => !prev)
        router.push(`/${locale}/auth/login`)
        return
      }

      if (!res.ok) {
        // Revert on other errors
        setWishlisted((prev) => !prev)
      }
    } catch {
      // Revert on network error
      setWishlisted((prev) => !prev)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={
        wishlisted
          ? locale === 'ar'
            ? 'إزالة من المفضلة'
            : 'Remove from wishlist'
          : locale === 'ar'
          ? 'أضف إلى المفضلة'
          : 'Add to wishlist'
      }
      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#EDE0CC] bg-white shadow-sm hover:bg-[#F7F0E6] transition-colors disabled:opacity-50"
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      <Heart
        className={`w-5 h-5 transition-colors ${
          wishlisted
            ? 'fill-red-500 text-red-500'
            : 'fill-transparent text-[#7A6A5E] hover:text-red-400'
        }`}
      />
    </button>
  )
}
