'use client'

import { useRouter } from 'next/navigation'

interface SortSelectProps {
  locale: string
  currentSort: string
  searchParams: Record<string, string>
}

export function SortSelect({ locale, currentSort, searchParams }: SortSelectProps) {
  const router = useRouter()

  const buildUrl = (sort: string) => {
    const params = new URLSearchParams()
    Object.entries({ ...searchParams, sort }).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    return `/${locale}/listings?${params.toString()}`
  }

  return (
    <select
      className="text-sm border border-[#EDE0CC] rounded-lg px-3 py-1.5 text-[#1C1613] bg-white outline-none focus:border-[#C4582A] cursor-pointer"
      value={currentSort}
      onChange={(e) => router.push(buildUrl(e.target.value))}
    >
      <option value="">{locale === 'ar' ? 'مقترح' : 'Recommended'}</option>
      <option value="price_low">{locale === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
      <option value="price_high">{locale === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
      <option value="rating">{locale === 'ar' ? 'التقييم' : 'Rating'}</option>
      <option value="newest">{locale === 'ar' ? 'الأحدث' : 'Newest'}</option>
    </select>
  )
}
