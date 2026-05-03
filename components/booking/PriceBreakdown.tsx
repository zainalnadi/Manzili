'use client'

import { useTranslations } from 'next-intl'
import { formatEGP } from '@/lib/utils/format'
import { calculateBookingPrice } from '@/lib/utils/pricing'
import { Separator } from '@/components/ui/separator'

interface PriceBreakdownProps {
  pricePerNight: number
  nights: number
  cleaningFee?: number
  weeklyDiscount?: number
  monthlyDiscount?: number
  locale: string
}

export function PriceBreakdown({
  pricePerNight,
  nights,
  cleaningFee = 0,
  weeklyDiscount,
  monthlyDiscount,
  locale,
}: PriceBreakdownProps) {
  const t = useTranslations('listing')
  const isRTL = locale === 'ar'

  const breakdown = calculateBookingPrice({
    pricePerNight,
    nights,
    cleaningFee,
    weeklyDiscount,
    monthlyDiscount,
  })

  return (
    <div className="space-y-3 text-sm" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Outfit, sans-serif' }}>
      {/* Nightly rate × nights */}
      <div className="flex justify-between">
        <span className="text-[#1C1613]">
          {formatEGP(pricePerNight, locale)} × {nights} {t('nights')}
        </span>
        <span className="text-[#1C1613] font-medium">
          {formatEGP(breakdown.nightlySubtotal, locale)}
        </span>
      </div>

      {/* Discount */}
      {breakdown.discountAmount > 0 && (
        <div className="flex justify-between text-[#8FA68B]">
          <span>
            {breakdown.appliedDiscount === 'monthly'
              ? locale === 'ar' ? 'خصم شهري' : 'Monthly discount'
              : locale === 'ar' ? 'خصم أسبوعي' : 'Weekly discount'}
          </span>
          <span>-{formatEGP(breakdown.discountAmount, locale)}</span>
        </div>
      )}

      {/* Cleaning fee */}
      {breakdown.cleaningFee > 0 && (
        <div className="flex justify-between">
          <span className="text-[#1C1613]">{t('cleaning_fee')}</span>
          <span className="text-[#1C1613] font-medium">
            {formatEGP(breakdown.cleaningFee, locale)}
          </span>
        </div>
      )}

      {/* Service fee */}
      <div className="flex justify-between">
        <span className="text-[#1C1613]">{t('service_fee')}</span>
        <span className="text-[#1C1613] font-medium">
          {formatEGP(breakdown.guestServiceFee, locale)}
        </span>
      </div>

      <Separator className="bg-[#EDE0CC]" />

      {/* Total */}
      <div className="flex justify-between font-bold text-base">
        <span className="text-[#1C1613]">{t('total')}</span>
        <span className="text-[#1C1613]">{formatEGP(breakdown.totalGuestPays, locale)}</span>
      </div>
    </div>
  )
}
