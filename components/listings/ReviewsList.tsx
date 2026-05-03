'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import Image from 'next/image'
import { formatDate } from '@/lib/utils/format'
import { toast } from 'sonner'

interface Review {
  id: string
  overallRating: number
  cleanlinessRating: number
  accuracyRating: number
  locationRating: number
  valueRating: number
  commentAr?: string | null
  commentEn?: string | null
  hostReplyAr?: string | null
  hostReplyEn?: string | null
  createdAt: Date
  author: { fullNameAr?: string | null; fullNameEn?: string | null; avatarUrl?: string | null }
}

function HostReplyForm({ reviewId, locale, existing, onSaved }: { reviewId: string; locale: string; existing?: string | null; onSaved: (text: string) => void }) {
  const [text, setText] = useState(existing ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locale === 'ar' ? { replyAr: text } : { replyEn: text }),
      })
      if (!res.ok) throw new Error()
      onSaved(text)
      toast.success(locale === 'ar' ? 'تم حفظ ردك' : 'Reply saved')
    } catch {
      toast.error(locale === 'ar' ? 'فشل الحفظ' : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 ms-10 p-3 bg-[#F7F0E6] rounded-xl border border-[#EDE0CC]">
      <p className="text-xs font-semibold text-[#7A6A5E] mb-2">{locale === 'ar' ? 'ردك كمضيف' : 'Your response as host'}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full text-sm border border-[#EDE0CC] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#C4582A] resize-none"
        placeholder={locale === 'ar' ? 'اكتب ردك هنا...' : 'Write your response here...'}
      />
      <button
        onClick={handleSave}
        disabled={saving || !text.trim()}
        className="mt-2 text-xs px-4 py-1.5 bg-[#1C1613] hover:bg-[#C4582A] text-white rounded-lg transition-colors disabled:opacity-40"
      >
        {saving ? '...' : (locale === 'ar' ? 'حفظ الرد' : 'Save response')}
      </button>
    </div>
  )
}

function ReviewCard({ review, name, comment, hostReply, locale, isHost }: {
  review: Review
  name: string | null | undefined
  comment: string | null | undefined
  hostReply: string | null | undefined
  locale: string
  isHost?: boolean
}) {
  const [reply, setReply] = useState<string | null>(hostReply ?? null)
  const [showReplyForm, setShowReplyForm] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#EDE0CC] overflow-hidden flex-shrink-0">
          {review.author.avatarUrl
            ? <Image src={review.author.avatarUrl} alt={name ?? ''} width={40} height={40} className="object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#7A6A5E]">{(name ?? 'G')[0]?.toUpperCase()}</div>
          }
        </div>
        <div>
          <p className="font-medium text-[#1C1613] text-sm">{name ?? 'Guest'}</p>
          <p className="text-xs text-[#7A6A5E]">{formatDate(review.createdAt, locale)}</p>
        </div>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-3.5 h-3.5 ${i < review.overallRating ? 'fill-[#C9973A] text-[#C9973A]' : 'text-[#EDE0CC]'}`} />
        ))}
      </div>
      {comment && <p className="text-sm text-[#1C1613] leading-relaxed line-clamp-4">{comment}</p>}

      {/* Host reply display */}
      {reply && (
        <div className="ms-10 p-3 bg-[#F7F0E6] rounded-xl border-s-2 border-[#C4582A]">
          <p className="text-xs font-semibold text-[#C4582A] mb-1">{locale === 'ar' ? 'رد المضيف' : 'Host response'}</p>
          <p className="text-sm text-[#1C1613]">{reply}</p>
        </div>
      )}

      {/* Host can add/edit reply */}
      {isHost && !showReplyForm && (
        <button
          onClick={() => setShowReplyForm(true)}
          className="text-xs text-[#C4582A] hover:underline ms-10"
        >
          {reply ? (locale === 'ar' ? 'تعديل الرد' : 'Edit response') : (locale === 'ar' ? '+ إضافة رد' : '+ Add response')}
        </button>
      )}
      {isHost && showReplyForm && (
        <HostReplyForm
          reviewId={review.id}
          locale={locale}
          existing={reply}
          onSaved={(text) => { setReply(text); setShowReplyForm(false) }}
        />
      )}
    </div>
  )
}

export function ReviewsList({ reviews, totalCount, averageRating, locale, isHost }: {
  reviews: Review[]
  totalCount: number
  averageRating?: number | null
  locale: string
  isHost?: boolean
}) {
  const isRTL = locale === 'ar'
  if (!totalCount) return (
    <div className="py-8 text-center text-[#7A6A5E]">
      <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p>{locale === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}</p>
    </div>
  )

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-6">
        <Star className="w-5 h-5 fill-[#1C1613] text-[#1C1613]" />
        <span className="text-xl font-bold text-[#1C1613]">{averageRating?.toFixed(1)}</span>
        <span className="text-[#7A6A5E]">·</span>
        <h2 className="text-lg font-bold text-[#1C1613]">{totalCount} {locale === 'ar' ? 'تقييم' : 'reviews'}</h2>
      </div>

      {reviews[0] && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-8 p-4 bg-[#F7F0E6] rounded-xl">
          {[
            { key: 'cleanlinessRating', ar: 'النظافة', en: 'Cleanliness' },
            { key: 'accuracyRating', ar: 'الدقة', en: 'Accuracy' },
            { key: 'locationRating', ar: 'الموقع', en: 'Location' },
            { key: 'valueRating', ar: 'القيمة', en: 'Value' },
          ].map(({ key, ar, en }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-[#7A6A5E] w-20 flex-shrink-0">{locale === 'ar' ? ar : en}</span>
              <div className="flex-1 h-1.5 bg-[#EDE0CC] rounded-full overflow-hidden">
                <div className="h-full bg-[#C4582A] rounded-full" style={{ width: `${(reviews[0][key as keyof typeof reviews[0]] as number / 5) * 100}%` }} />
              </div>
              <span className="text-xs font-medium text-[#1C1613] w-5">{reviews[0][key as keyof typeof reviews[0]] as number}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((r) => {
          const name = locale === 'ar' ? r.author.fullNameAr : r.author.fullNameEn
          const comment = locale === 'ar' ? r.commentAr : r.commentEn
          const hostReply = locale === 'ar' ? r.hostReplyAr : r.hostReplyEn
          return (
            <ReviewCard
              key={r.id}
              review={r}
              name={name}
              comment={comment}
              hostReply={hostReply}
              locale={locale}
              isHost={isHost}
            />
          )
        })}
      </div>
    </div>
  )
}
