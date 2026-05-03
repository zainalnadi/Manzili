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
import { Home, User } from 'lucide-react'
import { ManziliLogo } from '@/components/shared/ManziliLogo'

export default function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const router = useRouter()
  const { setUser } = useAuthStore()
  const isRTL = locale === 'ar'

  const [intent, setIntent] = useState<'GUEST' | 'HOST'>('GUEST')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullNameAr, setFullNameAr] = useState('')
  const [fullNameEn, setFullNameEn] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullNameAr, fullNameEn, phone: phone || undefined, role: intent }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Registration failed')

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const meRes = await fetch('/api/auth/me')
      const meData = await meRes.json()
      if (meData.user) setUser(meData.user)

      toast.success(locale === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account created!')
      router.push(intent === 'HOST' ? `/${locale}/host` : `/${locale}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#EDE0CC] p-8" style={{ boxShadow: '0 4px 24px rgba(13,33,55,0.08)', fontFamily: 'Outfit, sans-serif' }}>
          <div className="text-center mb-6">
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
              {locale === 'ar' ? 'إنشاء حساب جديد' : 'Create Your Account'}
            </h1>
          </div>

          {/* Intent */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { val: 'GUEST' as const, icon: <User className="w-6 h-6" />, ar: 'أريد الحجز', en: 'I want to book' },
              { val: 'HOST' as const, icon: <Home className="w-6 h-6" />, ar: 'أريد إضافة عقار', en: 'I want to host' },
            ].map(({ val, icon, ar, en }) => (
              <button key={val} type="button" onClick={() => setIntent(val)} className={`p-4 rounded-xl border-2 text-center transition-all ${intent === val ? 'border-[#C4582A] bg-[#C4582A]/5' : 'border-[#EDE0CC] hover:border-[#D0C8BE]'}`}>
                <div className={`mx-auto w-8 h-8 mb-2 flex items-center justify-center ${intent === val ? 'text-[#C4582A]' : 'text-[#7A6A5E]'}`}>{icon}</div>
                <span className={`text-sm font-medium ${intent === val ? 'text-[#C4582A]' : 'text-[#7A6A5E]'}`}>{locale === 'ar' ? ar : en}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#1C1613] font-medium text-sm">{locale === 'ar' ? 'الاسم بالعربية' : 'Name in Arabic'}</Label>
                <Input value={fullNameAr} onChange={(e) => setFullNameAr(e.target.value)} required placeholder="محمد أحمد" className="mt-1 border-[#EDE0CC]" dir="rtl" />
              </div>
              <div>
                <Label className="text-[#1C1613] font-medium text-sm">{locale === 'ar' ? 'الاسم بالإنجليزية' : 'Name in English'}</Label>
                <Input value={fullNameEn} onChange={(e) => setFullNameEn(e.target.value)} required placeholder="Mohamed Ahmed" className="mt-1 border-[#EDE0CC]" dir="ltr" />
              </div>
            </div>
            <div>
              <Label className="text-[#1C1613] font-medium">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@example.com" className="mt-1 border-[#EDE0CC]" dir="ltr" />
            </div>
            <div>
              <Label className="text-[#1C1613] font-medium">{locale === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="8+ characters" className="mt-1 border-[#EDE0CC]" />
            </div>
            <div>
              <Label className="text-[#1C1613] font-medium text-sm">{locale === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone (optional)'}</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 10 xxxx xxxx" className="mt-1 border-[#EDE0CC]" dir="ltr" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-[#1C1613] hover:bg-[#C4582A] text-white py-3 rounded-xl font-semibold text-base">
              {loading ? '...' : (locale === 'ar' ? 'إنشاء الحساب' : 'Create Account')}
            </Button>
          </form>

          <p className="text-center text-sm text-[#7A6A5E] mt-6">
            {locale === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
            <Link href={`/${locale}/auth/login`} className="text-[#C4582A] font-medium hover:underline">
              {locale === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
