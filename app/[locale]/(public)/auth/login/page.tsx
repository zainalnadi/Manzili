'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { ManziliLogo } from '@/components/shared/ManziliLogo'

export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const router = useRouter()
  const { setUser } = useAuthStore()
  const isRTL = locale === 'ar'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(locale === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid email or password')
      setLoading(false)
      return
    }
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    if (data.user) setUser(data.user)
    toast.success(locale === 'ar' ? 'مرحباً بك!' : 'Welcome back!')
    router.push(`/${locale}`)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#EDE0CC] p-8" style={{ boxShadow: '0 4px 24px rgba(13,33,55,0.08)', fontFamily: 'Outfit, sans-serif' }}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <ManziliLogo variant="default" height={24} />
            </div>
            <h1
              className="text-[#1C1613]"
              style={isRTL
                ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200, fontSize: '1.25rem' }
                : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '1.1rem' }
              }
            >
              {locale === 'ar' ? 'مرحباً بعودتك' : 'Welcome Back'}
            </h1>
            <p className="text-[#7A6A5E] text-sm mt-1.5">{locale === 'ar' ? 'سجّل دخولك للمتابعة' : 'Sign in to continue'}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[#1C1613] font-medium">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@example.com" className="mt-1 border-[#EDE0CC] focus:border-[#C4582A]" dir="ltr" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#1C1613] font-medium">{locale === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                <Link href={`/${locale}/auth/reset-password`} className="text-xs text-[#7A6A5E] hover:text-[#C4582A] transition-colors">
                  {locale === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </Link>
              </div>
              <div className="relative mt-1">
                <Input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="border-[#EDE0CC] focus:border-[#C4582A] pe-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute inset-y-0 end-3 flex items-center text-[#7A6A5E]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-[#1C1613] hover:bg-[#C4582A] text-white py-3 rounded-xl font-semibold text-base">
              {loading ? '...' : (locale === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
            </Button>
          </form>

          <p className="text-center text-sm text-[#7A6A5E] mt-6">
            {locale === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
            <Link href={`/${locale}/auth/register`} className="text-[#C4582A] font-medium hover:underline">
              {locale === 'ar' ? 'إنشاء حساب' : 'Sign up'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
