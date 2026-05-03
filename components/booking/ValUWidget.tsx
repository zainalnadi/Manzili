'use client'

import { useTranslations } from 'next-intl'
import { getValUPlans } from '@/lib/valu'
import { formatEGP } from '@/lib/utils/format'
import { Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ValUWidgetProps {
  totalAmount: number
  locale: string
  selectedMonths: number
  onSelect: (months: number) => void
}

export function ValUWidget({ totalAmount, locale, selectedMonths, onSelect }: ValUWidgetProps) {
  const t = useTranslations('listing')
  const isRTL = locale === 'ar'
  const plans = getValUPlans(totalAmount)

  return (
    <div className="space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
      <p className="text-xs text-[#7A6A5E]">
        {locale === 'ar' ? 'اختر خطة التقسيط' : 'Choose your installment plan'}
      </p>

      <div className="grid grid-cols-3 gap-2">
        {plans.map((plan) => (
          <button
            key={plan.months}
            onClick={() => onSelect(plan.months)}
            className={`relative rounded-lg border-2 p-2 text-center transition-all ${
              selectedMonths === plan.months
                ? 'border-[#C9973A] bg-[#C9973A]/5'
                : 'border-[#EDE0CC] hover:border-[#C9973A]/50'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#C9973A] text-white text-[10px] px-1.5 py-0 border-0 whitespace-nowrap">
                  {t('most_popular')}
                </Badge>
              </div>
            )}
            <div className="font-bold text-[#1C1613] text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {plan.months}{locale === 'ar' ? ' شهر' : 'mo'}
            </div>
            <div className="text-[#C4582A] text-xs font-medium mt-0.5">
              {formatEGP(plan.monthlyPayment, locale)}
              <span className="text-[#7A6A5E] text-[10px]">/{locale === 'ar' ? 'شهر' : 'mo'}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-[#7A6A5E] bg-[#F7F0E6] rounded-lg px-2 py-1.5">
        <span className="text-[#C9973A] font-bold text-xs">فاليو</span>
        <span>
          {locale === 'ar'
            ? '• متكامل مع فاليو (تجريبي)'
            : '• ValU Integration (Demo Mode)'}
        </span>
      </div>
    </div>
  )
}
