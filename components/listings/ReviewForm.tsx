'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ReviewFormProps {
  bookingId: string
  locale: string
  onSubmitted?: () => void
}

const RATING_LABELS = {
  ar: ['رديء', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'],
  en: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
}

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[#7A6A5E] w-32 flex-shrink-0">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 ${
                star <= (hover || value)
                  ? 'fill-[#C9973A] text-[#C9973A]'
                  : 'text-[#EDE0CC]'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReviewForm({ bookingId, locale, onSubmitted }: ReviewFormProps) {
  const router = useRouter()
  const isRTL = locale === 'ar'
  const [loading, setLoading] = useState(false)
  const [ratings, setRatings] = useState({
    overallRating: 0,
    cleanlinessRating: 0,
    accuracyRating: 0,
    locationRating: 0,
    valueRating: 0,
  })
  const [comment, setComment] = useState('')

  const setRating = (key: keyof typeof ratings) => (v: number) =>
    setRatings((r) => ({ ...r, [key]: v }))

  const ratingFields = [
    { key: 'overallRating' as const, ar: 'التقييم العام', en: 'Overall' },
    { key: 'cleanlinessRating' as const, ar: 'النظافة', en: 'Cleanliness' },
    { key: 'accuracyRating' as const, ar: 'الدقة', en: 'Accuracy' },
    { key: 'locationRating' as const, ar: 'الموقع', en: 'Location' },
    { key: 'valueRating' as const, ar: 'القيمة', en: 'Value' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (Object.values(ratings).some((v) => v === 0)) {
      toast.error(locale === 'ar' ? 'يرجى تقييم جميع الفئات' : 'Please rate all categories')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          ...ratings,
          ...(isRTL ? { commentAr: comment } : { commentEn: comment }),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed')
      }
      toast.success(locale === 'ar' ? 'شكراً! تم إرسال تقييمك' : 'Thanks! Your review was submitted')
      onSubmitted?.()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#F7F0E6] rounded-xl p-5 space-y-4"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      <h3 className="font-bold text-[#1C1613]">
        {locale === 'ar' ? 'قيّم تجربتك' : 'Rate your experience'}
      </h3>

      <div className="space-y-3">
        {ratingFields.map(({ key, ar, en }) => (
          <StarRating
            key={key}
            value={ratings[key]}
            onChange={setRating(key)}
            label={locale === 'ar' ? ar : en}
          />
        ))}
      </div>

      <div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={
            locale === 'ar'
              ? 'شارك تجربتك مع الضيوف الآخرين...'
              : 'Share your experience with other guests...'
          }
          className="border-[#EDE0CC] bg-white min-h-24"
          rows={4}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="bg-[#C4582A] hover:bg-[#A8471F] text-white w-full"
      >
        {loading
          ? '...'
          : locale === 'ar'
          ? 'إرسال التقييم'
          : 'Submit Review'}
      </Button>
    </form>
  )
}
