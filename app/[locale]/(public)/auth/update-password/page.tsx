'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function UpdatePasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  const isRTL = locale === 'ar'
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validate = (): string | null => {
    if (password.length < 8) {
      return locale === 'ar'
        ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل'
        : 'Password must be at least 8 characters'
    }
    if (password !== confirmPassword) {
      return locale === 'ar'
        ? 'كلمتا المرور غير متطابقتين'
        : 'Passwords do not match'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: sbError } = await supabase.auth.updateUser({ password })

    if (sbError) {
      setError(
        locale === 'ar'
          ? 'فشل تحديث كلمة المرور. قد يكون رابط إعادة التعيين منتهي الصلاحية.'
          : sbError.message,
      )
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirect to login after a short delay
    setTimeout(() => {
      router.push(`/${locale}/auth/login`)
    }, 2500)
  }

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordTooShort = password.length > 0 && password.length < 8

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
              {locale === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Set a new password'}
            </h1>
            <p className="text-[#7A6A5E] text-sm mt-1">
              {locale === 'ar'
                ? 'اختر كلمة مرور قوية لحماية حسابك'
                : 'Choose a strong password to secure your account'}
            </p>
          </div>

          {/* Success state */}
          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#E6F4F1] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-[#8FA68B]" />
              </div>
              <h2 className="font-bold text-[#1C1613] text-base mb-2">
                {locale === 'ar' ? 'تم تحديث كلمة المرور!' : 'Password updated!'}
              </h2>
              <p className="text-[#7A6A5E] text-sm mb-6">
                {locale === 'ar'
                  ? 'تم تغيير كلمة المرور بنجاح. سيتم توجيهك لتسجيل الدخول...'
                  : 'Your password has been changed. Redirecting to login...'}
              </p>
              <Link
                href={`/${locale}/auth/login`}
                className="text-sm font-medium text-[#C4582A] hover:underline"
              >
                {locale === 'ar' ? 'تسجيل الدخول الآن' : 'Sign in now'}
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

              {/* New password */}
              <div>
                <Label htmlFor="password" className="text-[#1C1613] font-medium">
                  {locale === 'ar' ? 'كلمة المرور الجديدة' : 'New password'}
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError(null)
                    }}
                    required
                    minLength={8}
                    placeholder={locale === 'ar' ? '٨ أحرف على الأقل' : '8+ characters'}
                    className={`border-[#EDE0CC] focus:border-[#C4582A] pe-10 ${
                      passwordTooShort ? 'border-[#C4582A] focus:border-[#C4582A]' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute inset-y-0 end-3 flex items-center text-[#7A6A5E] hover:text-[#1C1613]"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordTooShort && (
                  <p className="text-xs text-[#C4582A] mt-1">
                    {locale === 'ar' ? '٨ أحرف على الأقل' : 'At least 8 characters'}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <Label htmlFor="confirm-password" className="text-[#1C1613] font-medium">
                  {locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm password'}
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="confirm-password"
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setError(null)
                    }}
                    required
                    placeholder={locale === 'ar' ? 'أعد كتابة كلمة المرور' : 'Repeat your password'}
                    className={`border-[#EDE0CC] pe-10 ${
                      confirmPassword.length > 0
                        ? passwordsMatch
                          ? 'border-[#8FA68B] focus:border-[#8FA68B]'
                          : 'border-[#C4582A] focus:border-[#C4582A]'
                        : 'focus:border-[#C4582A]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute inset-y-0 end-3 flex items-center text-[#7A6A5E] hover:text-[#1C1613]"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-[#C4582A] mt-1">
                    {locale === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
                  </p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-[#8FA68B] mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {locale === 'ar' ? 'كلمتا المرور متطابقتان' : 'Passwords match'}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1C1613] hover:bg-[#C4582A] text-white py-3 rounded-xl font-semibold text-base"
              >
                {loading
                  ? (locale === 'ar' ? 'جارٍ الحفظ...' : 'Saving...')
                  : (locale === 'ar' ? 'تعيين كلمة المرور' : 'Set new password')}
              </Button>

              <p className="text-center text-sm text-[#7A6A5E] mt-2">
                {locale === 'ar' ? 'تذكرت كلمة المرور؟' : 'Remember your password?'}{' '}
                <Link href={`/${locale}/auth/login`} className="text-[#C4582A] font-medium hover:underline">
                  {locale === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
