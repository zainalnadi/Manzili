'use client'

import { useState, useRef, useEffect } from 'react'
import { Flag, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ReportButtonProps {
  listingId: string
  locale: string
}

type ReportReason =
  | 'INACCURATE_PHOTOS'
  | 'WRONG_LOCATION'
  | 'SCAM'
  | 'OFFENSIVE_CONTENT'
  | 'DUPLICATE'
  | 'OTHER'

const REASONS: { value: ReportReason; ar: string; en: string }[] = [
  { value: 'INACCURATE_PHOTOS', ar: 'صور غير دقيقة', en: 'Inaccurate photos' },
  { value: 'WRONG_LOCATION', ar: 'موقع خاطئ', en: 'Wrong location' },
  { value: 'SCAM', ar: 'احتيال أو نصب', en: 'Scam or fraud' },
  { value: 'OFFENSIVE_CONTENT', ar: 'محتوى مسيء', en: 'Offensive content' },
  { value: 'DUPLICATE', ar: 'إعلان مكرر', en: 'Duplicate listing' },
  { value: 'OTHER', ar: 'سبب آخر', en: 'Other' },
]

export function ReportButton({ listingId, locale }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, reason, details: details.trim() || undefined }),
      })

      if (res.ok) {
        setSubmitted(true)
        toast.success(locale === 'ar' ? 'شكرًا على الإبلاغ' : 'Thanks for reporting', {
          duration: 3000,
        })
        setTimeout(() => {
          setOpen(false)
          setSubmitted(false)
          setReason('')
          setDetails('')
        }, 1800)
      } else {
        toast.error(locale === 'ar' ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again')
      }
    } catch {
      toast.error(locale === 'ar' ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={locale === 'ar' ? 'الإبلاغ عن مشكلة' : 'Report a problem'}
        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full border border-[#EDE0CC] bg-white text-sm text-[#7A6A5E] shadow-sm hover:bg-[#F7F0E6] hover:text-[#C4582A] transition-colors"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        <Flag className="w-4 h-4" />
        <span>{locale === 'ar' ? 'إبلاغ' : 'Report'}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={locale === 'ar' ? 'الإبلاغ عن مشكلة' : 'Report a problem'}
        >
          <div
            ref={modalRef}
            className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6 relative"
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-[#7A6A5E] hover:text-[#1C1613] transition-colors"
              aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-[#1C1613] mb-4">
              {locale === 'ar' ? 'الإبلاغ عن مشكلة' : 'Report a problem'}
            </h2>

            {submitted ? (
              <p className="text-[#8FA68B] font-semibold text-center py-4">
                {locale === 'ar' ? 'شكرًا على الإبلاغ' : 'Thanks for reporting'}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  {REASONS.map(({ value, ar, en }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        reason === value
                          ? 'border-[#C4582A] bg-[#C4582A]/5'
                          : 'border-[#EDE0CC] hover:bg-[#F7F0E6]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={value}
                        checked={reason === value}
                        onChange={() => setReason(value)}
                        className="accent-[#C4582A]"
                      />
                      <span className="text-sm text-[#1C1613]">
                        {locale === 'ar' ? ar : en}
                      </span>
                    </label>
                  ))}
                </div>

                {reason && (
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={
                      locale === 'ar'
                        ? 'تفاصيل إضافية (اختياري)'
                        : 'Additional details (optional)'
                    }
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-xl border border-[#EDE0CC] bg-[#F7F0E6] px-3 py-2 text-sm text-[#1C1613] placeholder:text-[#7A6A5E] outline-none focus:border-[#C4582A] resize-none transition-colors"
                  />
                )}

                <button
                  type="submit"
                  disabled={!reason || submitting}
                  className="w-full h-10 rounded-xl bg-[#C4582A] text-white text-sm font-semibold hover:bg-[#a33825] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {locale === 'ar' ? 'إرسال البلاغ' : 'Submit report'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
