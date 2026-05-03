'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ShareButtonProps {
  title: string
  locale: string
}

export function ShareButton({ title, locale }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = window.location.href

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url })
      } catch (err) {
        // User cancelled or share failed — fall through to clipboard
        if (err instanceof Error && err.name === 'AbortError') return
        await copyToClipboard(url)
      }
    } else {
      await copyToClipboard(url)
    }
  }

  async function copyToClipboard(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success(
        locale === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!',
        { duration: 2500 }
      )
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error(
        locale === 'ar' ? 'تعذّر نسخ الرابط' : 'Could not copy link',
        { duration: 2500 }
      )
    }
  }

  return (
    <button
      onClick={handleShare}
      aria-label={locale === 'ar' ? 'مشاركة' : 'Share'}
      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full border border-[#EDE0CC] bg-white text-sm text-[#7A6A5E] shadow-sm hover:bg-[#F7F0E6] hover:text-[#1C1613] transition-colors"
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {copied ? (
        <Check className="w-4 h-4 text-[#8FA68B]" />
      ) : (
        <Share2 className="w-4 h-4" />
      )}
      <span>{locale === 'ar' ? 'مشاركة' : 'Share'}</span>
    </button>
  )
}
