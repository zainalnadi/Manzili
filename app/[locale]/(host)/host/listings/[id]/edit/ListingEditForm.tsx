'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const AMENITIES = [
  { id: 'wifi', ar: 'واي فاي', en: 'WiFi' },
  { id: 'pool', ar: 'حمام سباحة', en: 'Pool' },
  { id: 'ac', ar: 'تكييف', en: 'AC' },
  { id: 'parking', ar: 'موقف', en: 'Parking' },
  { id: 'kitchen', ar: 'مطبخ', en: 'Kitchen' },
  { id: 'washer', ar: 'غسالة', en: 'Washer' },
  { id: 'sea_view', ar: 'إطلالة بحرية', en: 'Sea View' },
  { id: 'beach_access', ar: 'وصول للشاطئ', en: 'Beach Access' },
  { id: 'bbq', ar: 'شواء', en: 'BBQ' },
  { id: 'generator', ar: 'مولد', en: 'Generator' },
  { id: 'security', ar: 'حراسة', en: 'Security' },
  { id: 'gym', ar: 'جيم', en: 'Gym' },
  { id: 'kids_play', ar: 'العاب أطفال', en: 'Kids Play' },
  { id: 'elevator', ar: 'مصعد', en: 'Elevator' },
  { id: 'balcony', ar: 'شرفة', en: 'Balcony' },
]

const GOVERNORATES = ['North Coast', 'Ain Sokhna', 'Cairo', 'Hurghada', 'El Gouna', 'Dahab', 'Sharm El-Sheikh', 'Alexandria', 'Other']
const CHECKIN_TIMES = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
const CHECKOUT_TIMES = ['10:00', '11:00', '12:00', '13:00']

interface Props {
  locale: string
  listingId: string
  initial: {
    titleAr: string
    titleEn: string
    descriptionAr: string
    descriptionEn: string
    governorate: string
    city: string
    compound: string
    bedrooms: number
    bathrooms: number
    maxGuests: number
    pricePerNight: number
    cleaningFee: number
    minimumNights: number
    amenities: string[]
    instantBook: boolean
    bnplEnabled: boolean
    imageUrls: string[]
    houseRulesAr: string
    houseRulesEn: string
    checkInTime: string
    checkOutTime: string
    petsAllowed: boolean
    smokingAllowed: boolean
    partiesAllowed: boolean
    cancellationPolicy: string
    isLicensed: boolean
    licenseNumber: string
  }
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${value ? 'bg-[#C4582A]' : 'bg-[#EDE0CC]'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-7' : 'left-1'}`} />
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1C1613] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-[#EDE0CC] rounded-xl px-3 py-2.5 text-sm text-[#1C1613] bg-white focus:outline-none focus:border-[#C4582A]'

export function ListingEditForm({ locale, listingId, initial }: Props) {
  const router = useRouter()
  const isRTL = locale === 'ar'
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)

  const set = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }))
  const toggleAmenity = (id: string) =>
    set('amenities', form.amenities.includes(id)
      ? form.amenities.filter((a) => a !== id)
      : [...form.amenities, id])

  const addImage = () => { if (form.imageUrls.length < 10) set('imageUrls', [...form.imageUrls, '']) }
  const updateImage = (i: number, val: string) => {
    const u = [...form.imageUrls]; u[i] = val; set('imageUrls', u)
  }
  const removeImage = (i: number) => set('imageUrls', form.imageUrls.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/host/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          imageUrls: form.imageUrls.filter((u) => u.trim().startsWith('http')),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed')
      }
      toast.success(locale === 'ar' ? 'تم الحفظ' : 'Saved successfully')
      router.push(`/${locale}/host/listings`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const headingStyle = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200 }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' as const }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/${locale}/host/listings`}
          className="p-2 rounded-lg hover:bg-[#F7F0E6] text-[#7A6A5E] transition-colors">
          <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
        </Link>
        <h1 className="text-xl text-[#1C1613]" style={headingStyle}>
          {locale === 'ar' ? 'تعديل الإعلان' : 'Edit Listing'}
        </h1>
      </div>

      <div className="space-y-8">
        {/* Titles */}
        <section>
          <h2 className="text-sm font-semibold text-[#7A6A5E] mb-4 uppercase tracking-wide">{locale === 'ar' ? 'العنوان والوصف' : 'Title & Description'}</h2>
          <div className="space-y-4">
            <Field label={locale === 'ar' ? 'العنوان بالعربية *' : 'Title in Arabic *'}>
              <input value={form.titleAr} onChange={(e) => set('titleAr', e.target.value)} className={inputCls} dir="rtl" maxLength={80} />
            </Field>
            <Field label={locale === 'ar' ? 'العنوان بالإنجليزية *' : 'Title in English *'}>
              <input value={form.titleEn} onChange={(e) => set('titleEn', e.target.value)} className={inputCls} dir="ltr" maxLength={80} />
            </Field>
            <Field label={locale === 'ar' ? 'الوصف بالعربية *' : 'Description in Arabic *'}>
              <textarea value={form.descriptionAr} onChange={(e) => set('descriptionAr', e.target.value)} className={`${inputCls} min-h-28 resize-none`} dir="rtl" rows={5} maxLength={2000} />
            </Field>
            <Field label={locale === 'ar' ? 'الوصف بالإنجليزية *' : 'Description in English *'}>
              <textarea value={form.descriptionEn} onChange={(e) => set('descriptionEn', e.target.value)} className={`${inputCls} min-h-28 resize-none`} dir="ltr" rows={5} maxLength={2000} />
            </Field>
          </div>
        </section>

        {/* Location */}
        <section>
          <h2 className="text-sm font-semibold text-[#7A6A5E] mb-4 uppercase tracking-wide">{locale === 'ar' ? 'الموقع' : 'Location'}</h2>
          <div className="space-y-4">
            <Field label={locale === 'ar' ? 'المنطقة *' : 'Governorate *'}>
              <select value={form.governorate} onChange={(e) => set('governorate', e.target.value)} className={inputCls}>
                {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label={locale === 'ar' ? 'المدينة *' : 'City *'}>
              <input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls} />
            </Field>
            <Field label={locale === 'ar' ? 'الكمباوند (اختياري)' : 'Compound (optional)'}>
              <input value={form.compound} onChange={(e) => set('compound', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </section>

        {/* Details */}
        <section>
          <h2 className="text-sm font-semibold text-[#7A6A5E] mb-4 uppercase tracking-wide">{locale === 'ar' ? 'التفاصيل' : 'Details'}</h2>
          <div className="grid grid-cols-3 gap-4">
            {([
              { key: 'bedrooms' as const, ar: 'غرف النوم', en: 'Bedrooms', min: 0 },
              { key: 'bathrooms' as const, ar: 'الحمامات', en: 'Bathrooms', min: 1 },
              { key: 'maxGuests' as const, ar: 'أقصى ضيوف', en: 'Max Guests', min: 1 },
            ]).map(({ key, ar, en, min }) => (
              <Field key={key} label={locale === 'ar' ? ar : en}>
                <div className="flex items-center gap-2">
                  <button onClick={() => set(key, Math.max(min, form[key] - 1))}
                    className="w-8 h-8 rounded-full border border-[#EDE0CC] text-lg flex items-center justify-center hover:bg-[#F7F0E6]">−</button>
                  <span className="text-lg font-bold text-[#1C1613] w-8 text-center">{form[key]}</span>
                  <button onClick={() => set(key, form[key] + 1)}
                    className="w-8 h-8 rounded-full border border-[#EDE0CC] text-lg flex items-center justify-center hover:bg-[#F7F0E6]">+</button>
                </div>
              </Field>
            ))}
          </div>
        </section>

        {/* Photos */}
        <section>
          <h2 className="text-sm font-semibold text-[#7A6A5E] mb-4 uppercase tracking-wide">{locale === 'ar' ? 'الصور' : 'Photos'}</h2>
          <div className="space-y-2">
            {form.imageUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-[#C4582A] text-white' : 'bg-[#F7F0E6] text-[#7A6A5E]'}`}>
                  {i === 0 ? '★' : i + 1}
                </span>
                <input value={url} onChange={(e) => updateImage(i, e.target.value)} className={`${inputCls} flex-1`} dir="ltr" placeholder="https://..." />
                {url.startsWith('http') && (
                  <img src={url} alt="" className="w-10 h-10 rounded-lg object-cover border border-[#EDE0CC] flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                )}
                <button onClick={() => removeImage(i)} className="p-1.5 text-[#7A6A5E] hover:text-[#C4582A] rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {form.imageUrls.length < 10 && (
              <button onClick={addImage}
                className="flex items-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-[#EDE0CC] rounded-xl text-sm text-[#7A6A5E] hover:border-[#C4582A] hover:text-[#C4582A] transition-colors">
                <Plus className="w-4 h-4" />
                {locale === 'ar' ? 'إضافة صورة' : 'Add photo'}
              </button>
            )}
          </div>
        </section>

        {/* Amenities */}
        <section>
          <h2 className="text-sm font-semibold text-[#7A6A5E] mb-4 uppercase tracking-wide">{locale === 'ar' ? 'المميزات' : 'Amenities'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AMENITIES.map((a) => (
              <button key={a.id} onClick={() => toggleAmenity(a.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-start text-sm transition-all ${
                  form.amenities.includes(a.id) ? 'border-[#C4582A] bg-[#C4582A]/5 text-[#1C1613]' : 'border-[#EDE0CC] text-[#7A6A5E] hover:border-[#D0C8BE]'
                }`}>
                {form.amenities.includes(a.id) && <Check className="w-3.5 h-3.5 text-[#C4582A] flex-shrink-0" />}
                {locale === 'ar' ? a.ar : a.en}
              </button>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="text-sm font-semibold text-[#7A6A5E] mb-4 uppercase tracking-wide">{locale === 'ar' ? 'التسعير' : 'Pricing'}</h2>
          <div className="space-y-4">
            <Field label={locale === 'ar' ? 'السعر في الليلة (ج.م) *' : 'Price per night (EGP) *'}>
              <input type="number" value={form.pricePerNight} onChange={(e) => set('pricePerNight', Number(e.target.value))} min={200} className={inputCls} dir="ltr" />
            </Field>
            <Field label={locale === 'ar' ? 'رسوم التنظيف (ج.م)' : 'Cleaning fee (EGP)'}>
              <input type="number" value={form.cleaningFee} onChange={(e) => set('cleaningFee', Number(e.target.value))} min={0} className={inputCls} dir="ltr" />
            </Field>
            <Field label={locale === 'ar' ? 'الحد الأدنى للليالي' : 'Minimum nights'}>
              <input type="number" value={form.minimumNights} onChange={(e) => set('minimumNights', Number(e.target.value))} min={1} className={inputCls} dir="ltr" />
            </Field>
            <div className="flex items-center justify-between p-4 bg-[#F7F0E6] rounded-xl">
              <div>
                <p className="font-medium text-[#1C1613] text-sm">{locale === 'ar' ? 'حجز فوري' : 'Instant Book'}</p>
                <p className="text-xs text-[#7A6A5E]">{locale === 'ar' ? 'دون الحاجة للموافقة' : 'No approval needed'}</p>
              </div>
              <Toggle value={form.instantBook} onChange={(v) => set('instantBook', v)} />
            </div>
            <div className="flex items-center justify-between p-4 bg-[#F7F0E6] rounded-xl">
              <div>
                <p className="font-medium text-[#1C1613] text-sm">{locale === 'ar' ? 'قبول فاليو (تقسيط)' : 'Accept ValU BNPL'}</p>
              </div>
              <Toggle value={form.bnplEnabled} onChange={(v) => set('bnplEnabled', v)} />
            </div>
          </div>
        </section>

        {/* Rules */}
        <section>
          <h2 className="text-sm font-semibold text-[#7A6A5E] mb-4 uppercase tracking-wide">{locale === 'ar' ? 'القواعد والسياسات' : 'Rules & Policies'}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label={locale === 'ar' ? 'وقت الوصول' : 'Check-in time'}>
                <select value={form.checkInTime} onChange={(e) => set('checkInTime', e.target.value)} className={inputCls} dir="ltr">
                  {CHECKIN_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label={locale === 'ar' ? 'وقت المغادرة' : 'Check-out time'}>
                <select value={form.checkOutTime} onChange={(e) => set('checkOutTime', e.target.value)} className={inputCls} dir="ltr">
                  {CHECKOUT_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            {([
              { key: 'petsAllowed' as const, ar: 'الحيوانات مسموحة', en: 'Pets allowed' },
              { key: 'smokingAllowed' as const, ar: 'التدخين مسموح', en: 'Smoking allowed' },
              { key: 'partiesAllowed' as const, ar: 'الحفلات مسموحة', en: 'Parties allowed' },
            ]).map(({ key, ar, en }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-[#F7F0E6] rounded-xl">
                <span className="text-sm text-[#1C1613]">{locale === 'ar' ? ar : en}</span>
                <Toggle value={form[key]} onChange={(v) => set(key, v)} />
              </div>
            ))}
            <Field label={locale === 'ar' ? 'سياسة الإلغاء' : 'Cancellation policy'}>
              <select value={form.cancellationPolicy} onChange={(e) => set('cancellationPolicy', e.target.value)} className={inputCls}>
                <option value="FLEXIBLE">{locale === 'ar' ? 'مرن' : 'Flexible'}</option>
                <option value="MODERATE">{locale === 'ar' ? 'معتدل' : 'Moderate'}</option>
                <option value="STRICT">{locale === 'ar' ? 'صارم' : 'Strict'}</option>
              </select>
            </Field>
            <Field label={locale === 'ar' ? 'قواعد المنزل (عربي)' : 'House rules (Arabic)'}>
              <textarea value={form.houseRulesAr} onChange={(e) => set('houseRulesAr', e.target.value)} className={`${inputCls} min-h-20 resize-none`} dir="rtl" rows={3} />
            </Field>
            <Field label={locale === 'ar' ? 'قواعد المنزل (إنجليزي)' : 'House rules (English)'}>
              <textarea value={form.houseRulesEn} onChange={(e) => set('houseRulesEn', e.target.value)} className={`${inputCls} min-h-20 resize-none`} dir="ltr" rows={3} />
            </Field>
          </div>
        </section>

        {/* License */}
        <section>
          <h2 className="text-sm font-semibold text-[#7A6A5E] mb-4 uppercase tracking-wide">{locale === 'ar' ? 'الترخيص' : 'License'}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#F7F0E6] rounded-xl">
              <span className="text-sm text-[#1C1613]">{locale === 'ar' ? 'العقار مرخص' : 'Property is licensed'}</span>
              <Toggle value={form.isLicensed} onChange={(v) => set('isLicensed', v)} />
            </div>
            {form.isLicensed && (
              <Field label={locale === 'ar' ? 'رقم الترخيص' : 'License number'}>
                <input value={form.licenseNumber} onChange={(e) => set('licenseNumber', e.target.value)} className={inputCls} dir="ltr" />
              </Field>
            )}
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-40"
          style={{ background: saving ? 'rgba(196,88,42,0.45)' : '#C4582A', fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          {saving ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
        </button>
      </div>
    </div>
  )
}
