'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useAuthModal } from '@/components/shared/AuthModal'

/**
 * AuthGuard — renders children when authenticated,
 * shows a loading skeleton + triggers the auth modal when not.
 * After successful login the modal closes and the page reload
 * delivers fresh server-side data.
 */
export function AuthGuard({
  children,
  locale,
}: {
  children: React.ReactNode
  locale: string
}) {
  const { user, isLoading } = useAuthStore()
  const { openAuthModal } = useAuthModal()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      openAuthModal('login', () => {
        // After login, refresh so the server component fetches data with the new session cookie
        router.refresh()
      })
    }
  }, [user, isLoading, openAuthModal, router])

  // While session is being resolved show a subtle skeleton
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-4" aria-hidden>
        <div className="h-7 w-40 bg-[#EDE0CC] rounded-xl animate-pulse" />
        <div className="h-0.5 w-full bg-[#EDE0CC] rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 w-full bg-[#EDE0CC] rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    )
  }

  // Not logged in — render nothing (modal is handling it)
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#EDE0CC] animate-pulse mx-auto" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
