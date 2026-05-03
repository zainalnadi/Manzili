'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'

interface Profile {
  id: string
  fullNameAr: string | null
  fullNameEn: string | null
  email: string
  phone: string | null
  avatarUrl: string | null
  nationalIdVerified: boolean
  role: string
}

export default function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const isRTL = locale === 'ar'
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ fullNameAr: '', fullNameEn: '', phone: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { router.push(`/${locale}/auth/login`); return }
        setProfile(data)
        setForm({ fullNameAr: data.fullNameAr ?? '', fullNameEn: data.fullNameEn ?? '', phone: data.phone ?? '' })
        setLoading(false)
      })
  }, [locale, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-[#C4582A] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Outfit, sans-serif' }}>
      <h1 className="text-2xl font-bold text-[#1C1613] mb-8">{locale === 'ar' ? 'الملف الشخصي' : 'My Profile'}</h1>

      {/* Avatar & name */}
      <div className="bg-white border border-[#EDE0CC] rounded-xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-[#C4582A] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {(profile?.fullNameEn ?? profile?.fullNameAr ?? profile?.email ?? 'U')[0].toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-[#1C1613]">{profile?.fullNameEn ?? profile?.fullNameAr ?? '—'}</p>
          <p className="text-sm text-[#7A6A5E]">{profile?.email}</p>
          <p className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block font-medium"
            style={{ backgroundColor: profile?.nationalIdVerified ? '#8FA68B18' : '#C9973A18', color: profile?.nationalIdVerified ? '#8FA68B' : '#C9973A' }}>
            {profile?.nationalIdVerified
              ? (locale === 'ar' ? 'هوية موثقة' : 'ID Verified')
              : (locale === 'ar' ? 'هوية غير موثقة' : 'ID Not Verified')}
          </p>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#EDE0CC] rounded-xl p-6 space-y-5">
        <h2 className="font-bold text-[#1C1613] mb-2">{locale === 'ar' ? 'تعديل البيانات' : 'Edit Information'}</h2>

        <div>
          <label className="block text-sm font-medium text-[#1C1613] mb-1.5">
            {locale === 'ar' ? 'الاسم بالعربية' : 'Name in Arabic'}
          </label>
          <input
            type="text"
            value={form.fullNameAr}
            onChange={(e) => setForm({ ...form, fullNameAr: e.target.value })}
            placeholder="محمد أحمد"
            dir="rtl"
            className="w-full border border-[#EDE0CC] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4582A]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1C1613] mb-1.5">
            {locale === 'ar' ? 'الاسم بالإنجليزية' : 'Name in English'}
          </label>
          <input
            type="text"
            value={form.fullNameEn}
            onChange={(e) => setForm({ ...form, fullNameEn: e.target.value })}
            placeholder="Mohamed Ahmed"
            dir="ltr"
            className="w-full border border-[#EDE0CC] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4582A]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1C1613] mb-1.5">
            {locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+20 10 0000 0000"
            className="w-full border border-[#EDE0CC] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4582A]/30"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#C4582A] text-white rounded-xl py-3 font-medium disabled:opacity-50"
        >
          {saving ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
        </button>

        {saved && (
          <p className="text-center text-sm text-[#8FA68B] font-medium">
            {locale === 'ar' ? 'تم الحفظ بنجاح ✓' : 'Saved successfully ✓'}
          </p>
        )}
      </form>
    </div>
  )
}
