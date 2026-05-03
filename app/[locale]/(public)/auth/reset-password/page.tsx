'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  const isRTL = locale === 'ar'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/${locale}/auth/update-password`
        : `/${locale}/auth/update-password`

    const { error: sbError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (sbError) {
      setError(
        locale === 'ar'
          ? 'حدث خطأ أثناء إرسال الرابط. تأكد من صحة البريد الإلكتروني.'
          : sbError.message,
      )
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div
      className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md">
        <div
          className="bg-white rounded-2xl border border-[#EDE0CC] p-8"
          style={{ boxShadow: '0 4px 24px rgba(13,33,55,0.08)', fontFamily: 'Outfit, sans-serif' }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-3xl font-bold text-[#C4582A] mb-1">منزلي</div>
            <h1 className="text-xl font-bold text-[#1C1613]">
              {locale === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset your password'}
            </h1>
            <p className="text-[#7A6A5E] text-sm mt-1">
              {locale === 'ar'
                ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين'
                : 'Enter your email and we will send you a reset link'}
            </p>
          </div>

          {/* Success state */}
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#E6F4F1] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-[#8FA68B]" />
              </div>
              <h2 className="font-bold text-[#1C1613] text-base mb-2">
                {locale === 'ar' ? 'تم إرسال رابط إعادة التعيين' : 'Reset link sent to your email'}
              </h2>
              <p className="text-[#7A6A5E] text-sm mb-6">
                {locale === 'ar'
                  ? `تحقق من بريدك الإلكتروني ${email} واتبع التعليمات لإعادة تعيين كلمة المرور.`
                  : `Check your inbox at ${email} and follow the instructions to reset your password.`}
              </p>
              <Link
                href={`/${locale}/auth/login`}
                className="flex items-center justify-center gap-2 text-sm font-medium text-[#C4582A] hover:underline"
              >
                <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                {locale === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to login'}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error */}
              {error && (
                <div className="px-4 py-3 bg-[#FDECEA] border border-[#C4582A]/20 rounded-xl text-[#C4582A] text-sm">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-[#1C1613] font-medium">
                  {locale === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                  className="mt-1 border-[#EDE0CC] focus:border-[#C4582A]"
                  dir="ltr"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1C1613] hover:bg-[#C4582A] text-white py-3 rounded-xl font-semibold text-base"
              >
                {loading
                  ? (locale === 'ar' ? 'جارٍ الإرسال...' : 'Sending...')
                  : (locale === 'ar' ? 'إرسال رابط إعادة التعيين' : 'Send reset link')}
              </Button>

              <div className="flex items-center justify-center mt-2">
                <Link
                  href={`/${locale}/auth/login`}
                  className="flex items-center gap-1.5 text-sm text-[#7A6A5E] hover:text-[#1C1613] transition-colors"
                >
                  <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  {locale === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to login'}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
