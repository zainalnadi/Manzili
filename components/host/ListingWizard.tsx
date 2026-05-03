'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, AlertCircle, Info } from 'lucide-react'

// ── Property Type SVG Icons ───────────────────────────────────────────────────

function ApartmentIcon({ active }: { active?: boolean }) {
  const c = active ? '#C4582A' : '#9A8878'
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="8" width="28" height="34" rx="1" />
      <line x1="10" y1="20" x2="38" y2="20" />
      <line x1="10" y1="31" x2="38" y2="31" />
      <rect x="16" y="35" width="6" height="7" />
      <rect x="26" y="35" width="6" height="7" />
      <rect x="15" y="12" width="5" height="5" />
      <rect x="28" y="12" width="5" height="5" />
      <rect x="15" y="23" width="5" height="5" />
      <rect x="28" y="23" width="5" height="5" />
    </svg>
  )
}

function ChaletIcon({ active }: { active?: boolean }) {
  const c = active ? '#C4582A' : '#9A8878'
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="24,7 42,22 6,22" />
      <rect x="8" y="22" width="32" height="20" />
      <rect x="18" y="30" width="12" height="12" />
      <rect x="10" y="25" width="8" height="8" />
      <rect x="30" y="25" width="8" height="8" />
    </svg>
  )
}

function VillaIcon({ active }: { active?: boolean }) {
  const c = active ? '#C4582A' : '#9A8878'
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="18" width="36" height="24" />
      <polygon points="6,18 24,6 42,18" />
      <rect x="18" y="30" width="12" height="12" />
      <rect x="8" y="22" width="9" height="8" />
      <rect x="31" y="22" width="9" height="8" />
      <line x1="24" y1="6" x2="24" y2="42" strokeDasharray="2 2" strokeOpacity="0.4" />
    </svg>
  )
}

function StudioIcon({ active }: { active?: boolean }) {
  const c = active ? '#C4582A' : '#9A8878'
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="10" width="32" height="30" rx="1" />
      <line x1="8" y1="26" x2="40" y2="26" />
      <rect x="14" y="30" width="20" height="10" />
      <rect x="14" y="13" width="9" height="9" />
      <rect x="25" y="13" width="9" height="9" />
    </svg>
  )
}

function TownhouseIcon({ active }: { active?: boolean }) {
  const c = active ? '#C4582A' : '#9A8878'
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="22" width="16" height="20" />
      <rect x="27" y="22" width="16" height="20" />
      <rect x="16" y="17" width="16" height="25" />
      <polygon points="5,22 13,13 21,22" />
      <polygon points="27,22 35,13 43,22" />
      <polygon points="16,17 24,8 32,17" />
      <rect x="19" y="32" width="10" height="10" />
      <rect x="7" y="27" width="6" height="6" />
      <rect x="35" y="27" width="6" height="6" />
    </svg>
  )
}

function PenthouseIcon({ active }: { active?: boolean }) {
  const c = active ? '#C4582A' : '#9A8878'
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="14" width="28" height="28" />
      <line x1="10" y1="26" x2="38" y2="26" />
      <rect x="16" y="30" width="16" height="12" />
      <rect x="14" y="17" width="6" height="6" />
      <rect x="28" y="17" width="6" height="6" />
      <polyline points="10,14 24,5 38,14" />
      <rect x="21" y="8" width="6" height="6" />
    </svg>
  )
}

const PROPERTY_TYPES = [
  { id: 'APARTMENT', ar: 'شقة', en: 'Apartment', Icon: ApartmentIcon },
  { id: 'CHALET', ar: 'شاليه', en: 'Chalet', Icon: ChaletIcon },
  { id: 'VILLA', ar: 'فيلا', en: 'Villa', Icon: VillaIcon },
  { id: 'STUDIO', ar: 'استوديو', en: 'Studio', Icon: StudioIcon },
  { id: 'TOWNHOUSE', ar: 'تاون هاوس', en: 'Townhouse', Icon: TownhouseIcon },
  { id: 'PENTHOUSE', ar: 'بنتهاوس', en: 'Penthouse', Icon: PenthouseIcon },
]

// ── Amenity SVG Icons ─────────────────────────────────────────────────────────

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  ),
  pool: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M2 12c.5-1 1.5-1 2-1s1.5 0 2 1 1.5 1 2 1 1.5 0 2-1 1.5-1 2-1 1.5 0 2 1 1.5 1 2 1" />
      <path d="M2 17c.5-1 1.5-1 2-1s1.5 0 2 1 1.5 1 2 1 1.5 0 2-1 1.5-1 2-1 1.5 0 2 1 1.5 1 2 1" />
      <circle cx="7" cy="5" r="2" /><polyline points="7 7 7 9 9 9" />
    </svg>
  ),
  ac: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="2" y="6" width="20" height="8" rx="2" />
      <line x1="7" y1="14" x2="7" y2="19" /><line x1="12" y1="14" x2="12" y2="21" />
      <line x1="17" y1="14" x2="17" y2="19" />
    </svg>
  ),
  parking: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
    </svg>
  ),
  kitchen: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <line x1="7" y1="2" x2="7" y2="11" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  ),
  washer: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <circle cx="12" cy="13" r="5" />
      <circle cx="12" cy="13" r="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" strokeWidth="2" />
    </svg>
  ),
  sea_view: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M2 16c.5-1 1.5-1 2-1s1.5 0 2 1 1.5 1 2 1 1.5 0 2-1 1.5-1 2-1 1.5 0 2 1 1.5 1 2 1" />
      <circle cx="12" cy="7" r="4" /><line x1="12" y1="2" x2="12" y2="3" />
      <line x1="12" y1="11" x2="12" y2="12" />
    </svg>
  ),
  beach_access: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="8" x2="12" y2="21" />
      <path d="M12 12c3-2 6-2 8 0" /><path d="M12 16c-3-2-6-2-8 0" />
    </svg>
  ),
  bbq: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="12" y1="20" x2="8" y2="24" /><line x1="12" y1="20" x2="16" y2="24" />
    </svg>
  ),
  generator: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  security: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  gym: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M6.5 6.5h11" /><path d="M6.5 17.5h11" />
      <line x1="3" y1="8" x2="3" y2="16" /><line x1="21" y1="8" x2="21" y2="16" />
      <line x1="1" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="23" y2="12" />
    </svg>
  ),
  kids_play: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M8 8c0 4-3 7-6 8M16 8c0 4 3 7 6 8" />
      <line x1="12" y1="12" x2="12" y2="22" />
    </svg>
  ),
  elevator: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="3" y="2" width="18" height="20" rx="2" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <polyline points="6 14 9 17 12 14" />
      <polyline points="12 10 15 7 18 10" />
    </svg>
  ),
  balcony: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="3" y="10" width="18" height="3" />
      <line x1="6" y1="13" x2="6" y2="20" /><line x1="10" y1="13" x2="10" y2="20" />
      <line x1="14" y1="13" x2="14" y2="20" /><line x1="18" y1="13" x2="18" y2="20" />
      <line x1="4" y1="20" x2="20" y2="20" />
      <path d="M3 10V7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v3" />
    </svg>
  ),
}

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

const GOVERNORATES = [
  'North Coast', 'Ain Sokhna', 'Cairo', 'Hurghada', 'El Gouna',
  'Dahab', 'Sharm El-Sheikh', 'Alexandria', 'Other',
]

const CHECKIN_TIMES = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
const CHECKOUT_TIMES = ['10:00', '11:00', '12:00', '13:00']

const CANCELLATION_POLICIES = [
  {
    id: 'FLEXIBLE', ar: 'مرن', en: 'Flexible',
    descAr: 'استرداد كامل قبل 24 ساعة من الوصول',
    descEn: 'Full refund up to 24 hours before check-in',
  },
  {
    id: 'MODERATE', ar: 'معتدل', en: 'Moderate',
    descAr: 'استرداد كامل قبل 5 أيام من الوصول',
    descEn: 'Full refund up to 5 days before check-in',
  },
  {
    id: 'STRICT', ar: 'صارم', en: 'Strict',
    descAr: 'استرداد 50% قبل 7 أيام من الوصول فقط',
    descEn: '50% refund up to 7 days before check-in only',
  },
]

const STEPS = [
  'Property Type', 'Location', 'Details', 'Photos', 'Amenities',
  'Title & Description', 'Pricing', 'Rules & Policies', 'License', 'Review',
]

const STEPS_AR = [
  'نوع العقار', 'الموقع', 'التفاصيل', 'الصور', 'المميزات',
  'العنوان والوصف', 'التسعير', 'القواعد والسياسات', 'الترخيص', 'المراجعة',
]

const REQUIREMENTS = {
  PHOTOS_MIN: 5,
  AMENITIES_MIN: 3,
  TITLE_MIN: 10,
  DESC_MIN: 100,
  PRICE_MIN: 200,
}

// ── SVG Checkmark (selected card indicator) ───────────────────────────────────

function CheckmarkCircle() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="9" fill="#C4582A" />
      <path d="M5.5 9.2l2.3 2.3 4.7-4.7" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Camera SVG (photos placeholder) ──────────────────────────────────────────

function CameraIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C0B8B0" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

// ── Document SVG (license) ────────────────────────────────────────────────────

function DocumentBadgeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9973A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
      <polyline points="9 9 10 9 11 9" />
    </svg>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function Toggle({
  value, onChange, isRTL, color = '#C4582A',
}: {
  value: boolean; onChange: (v: boolean) => void; isRTL: boolean; color?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-12 h-6 rounded-full relative transition-colors flex-shrink-0"
      style={{ background: value ? color : '#EDE0CC' }}
    >
      <span
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all"
        style={value
          ? (isRTL ? { right: 4 } : { left: 28 })
          : (isRTL ? { right: 28 } : { left: 4 })}
      />
    </button>
  )
}

function Req({ met, ar, en, locale }: { met: boolean; ar: string; en: string; locale: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${met ? 'text-[#8FA68B]' : 'text-[#9A8878]'}`}>
      {met ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="7" fill="#8FA68B" fillOpacity="0.15" />
          <path d="M4.5 7.2l1.8 1.8 3.2-3.2" stroke="#8FA68B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6.5" stroke="#C0B8B0" />
          <line x1="7" y1="4.5" x2="7" y2="7.5" stroke="#C0B8B0" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="7" cy="9.5" r="0.6" fill="#C0B8B0" />
        </svg>
      )}
      {locale === 'ar' ? ar : en}
    </div>
  )
}

function CharCount({ value, min, max = 500 }: { value: string; min: number; max?: number }) {
  const len = value.trim().length
  const ok = len >= min
  return (
    <div className={`flex justify-between text-xs mt-1 ${ok ? 'text-[#8FA68B]' : 'text-[#9A8878]'}`}>
      <span>{ok ? '✓' : `min ${min} chars`}</span>
      <span>{len}/{max}</span>
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function ListingWizard({ locale }: { locale: string }) {
  const router = useRouter()
  const isRTL = locale === 'ar'
  const [step, setStep] = useState(0)
  const [prevStep, setPrevStep] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [triedNext, setTriedNext] = useState(false)
  const [animating, setAnimating] = useState(false)
  const animatingRef = useRef(false)

  const [form, setForm] = useState({
    propertyType: '',
    governorate: '',
    city: '',
    compound: '',
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    amenities: [] as string[],
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    pricePerNight: 1500,
    cleaningFee: 0,
    minimumNights: 1,
    instantBook: false,
    bnplEnabled: true,
    imageUrls: [] as string[],
    houseRulesAr: '',
    houseRulesEn: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    petsAllowed: false,
    smokingAllowed: false,
    partiesAllowed: false,
    cancellationPolicy: 'MODERATE',
    isLicensed: false,
    licenseNumber: '',
  })

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }))
  const toggleAmenity = (id: string) =>
    set('amenities', form.amenities.includes(id)
      ? form.amenities.filter((a) => a !== id)
      : [...form.amenities, id])

  const addImageUrl = () => { if (form.imageUrls.length < 10) set('imageUrls', [...form.imageUrls, '']) }
  const updateImageUrl = (i: number, val: string) => {
    const updated = [...form.imageUrls]; updated[i] = val; set('imageUrls', updated)
  }
  const removeImageUrl = (i: number) => set('imageUrls', form.imageUrls.filter((_, idx) => idx !== i))

  const validPhotos = form.imageUrls.filter((u) => u.trim().startsWith('http')).length

  const stepIsValid = (s: number): boolean => {
    switch (s) {
      case 0: return !!form.propertyType
      case 1: return !!form.governorate && !!form.city.trim()
      case 2: return form.maxGuests >= 1
      case 3: return validPhotos >= REQUIREMENTS.PHOTOS_MIN
      case 4: return form.amenities.length >= REQUIREMENTS.AMENITIES_MIN
      case 5:
        return form.titleAr.trim().length >= REQUIREMENTS.TITLE_MIN &&
          form.titleEn.trim().length >= REQUIREMENTS.TITLE_MIN &&
          form.descriptionAr.trim().length >= REQUIREMENTS.DESC_MIN &&
          form.descriptionEn.trim().length >= REQUIREMENTS.DESC_MIN
      case 6: return form.pricePerNight >= REQUIREMENTS.PRICE_MIN
      case 7: return true
      case 8: return true
      case 9: return true
      default: return true
    }
  }

  const canProceed = stepIsValid(step)

  const transition = (toStep: number) => {
    if (animatingRef.current) return
    animatingRef.current = true
    setAnimating(true)
    setPrevStep(step)
    setTimeout(() => {
      setStep(toStep)
      setAnimating(false)
      animatingRef.current = false
    }, 220)
  }

  const handleNext = () => {
    setTriedNext(true)
    if (!stepIsValid(step)) return
    setTriedNext(false)
    transition(step + 1)
  }

  const handleBack = () => {
    setTriedNext(false)
    transition(step - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, imageUrls: form.imageUrls.filter((u) => u.trim() !== '') }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      toast.success(locale === 'ar' ? 'تم إنشاء الإعلان كمسودة!' : 'Listing created as draft!')
      router.push(`/${locale}/host/dashboard`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100
  const goingForward = step >= prevStep

  const headingStyle: React.CSSProperties = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200, fontSize: '1.35rem' }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '1.05rem' }

  return (
    <div
      className="max-w-2xl mx-auto px-4 sm:px-6 py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* ── Progress Bar ── */}
      <div className="mb-8">
        <p
          className="text-[#9A8878] mb-2"
          style={{
            fontFamily: isRTL ? "'Tajawal', sans-serif" : "'Josefin Sans', sans-serif",
            fontWeight: 100,
            fontSize: 9,
            letterSpacing: isRTL ? 0 : '0.18em',
            textTransform: isRTL ? 'none' : 'uppercase',
          }}
        >
          {locale === 'ar'
            ? `الخطوة ${step + 1} من ${STEPS.length} · ${STEPS_AR[step]}`
            : `Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`}
        </p>
        {/* 2px progress bar */}
        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: '#EDE0CC' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: '#C4582A',
              transition: 'width 300ms cubic-bezier(0.22,1,0.36,1)',
            }}
          />
        </div>
      </div>

      {/* ── Step Container with slide transition ── */}
      <div
        style={{
          animation: animating
            ? undefined
            : `step-${goingForward ? 'in' : 'in-back'} 220ms cubic-bezier(0.22,1,0.36,1) both`,
        }}
      >
        {/* ── Step 0: Property Type ── */}
        {step === 0 && (
          <div>
            <h2 style={headingStyle} className="text-[#1C1613] mb-2">
              {locale === 'ar' ? 'ما نوع العقار؟' : 'What type of property?'}
            </h2>
            <p className="text-sm text-[#7A6A5E] mb-6">
              {locale === 'ar' ? 'اختر نوع العقار الذي تريد تأجيره' : 'Select the type of property you want to rent out'}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-[#9A8878] mb-4">
              <Info className="w-3.5 h-3.5" />
              {locale === 'ar' ? 'مطلوب: اختر نوعاً واحداً للمتابعة' : 'Required: select one type to continue'}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PROPERTY_TYPES.map((t) => {
                const isSelected = form.propertyType === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => set('propertyType', t.id)}
                    className="relative p-4 text-center transition-all"
                    style={{
                      borderRadius: 14,
                      border: isSelected ? '1.5px solid #C4582A' : '1.5px solid #EDE0CC',
                      background: isSelected ? 'rgba(196,88,42,0.04)' : 'white',
                      boxShadow: isSelected ? '0 0 0 3px rgba(196,88,42,0.08)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = '#FDFAF7'
                        e.currentTarget.style.borderColor = 'rgba(196,88,42,0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'white'
                        e.currentTarget.style.borderColor = '#EDE0CC'
                      }
                    }}
                  >
                    <div className="flex justify-center mb-3">
                      <t.Icon active={isSelected} />
                    </div>
                    <span className="text-sm text-[#1C1613]" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>
                      {locale === 'ar' ? t.ar : t.en}
                    </span>
                    {isSelected && (
                      <div className="absolute bottom-2.5 end-2.5">
                        <CheckmarkCircle />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {triedNext && !canProceed && (
              <p className="text-xs text-[#C4582A] mt-3 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {locale === 'ar' ? 'يرجى اختيار نوع العقار' : 'Please select a property type'}
              </p>
            )}
          </div>
        )}

        {/* ── Step 1: Location ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 style={headingStyle} className="text-[#1C1613] mb-2">
              {locale === 'ar' ? 'أين يقع العقار؟' : 'Where is the property?'}
            </h2>

            <div className="bg-[#F7F0E6] rounded-xl p-3 space-y-1.5 mb-2">
              <Req met={!!form.governorate} ar="اختر المنطقة / المحافظة" en="Select a governorate / region" locale={locale} />
              <Req met={form.city.trim().length >= 2} ar="أدخل اسم المدينة" en="Enter the city name" locale={locale} />
            </div>

            <div>
              <Label>{locale === 'ar' ? 'المحافظة / المنطقة *' : 'Governorate / Region *'}</Label>
              <select
                value={form.governorate}
                onChange={(e) => set('governorate', e.target.value)}
                className="w-full mt-1 border border-[#EDE0CC] rounded-lg px-3 text-sm text-[#1C1613] bg-white outline-none focus:border-[#C4582A] transition-colors"
                style={{ height: 48, borderRadius: 8 }}
              >
                <option value="">{locale === 'ar' ? 'اختر المنطقة' : 'Select region'}</option>
                {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <Label>{locale === 'ar' ? 'المدينة *' : 'City *'}</Label>
              <Input
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                className="mt-1 border-[#EDE0CC] focus:border-[#C4582A] focus:ring-[#C4582A]/10"
                style={{ height: 48, borderRadius: 8 }}
                placeholder={locale === 'ar' ? 'مثال: مرسى مطروح' : 'e.g. Marsa Matrouh'}
              />
            </div>
            <div>
              <Label>{locale === 'ar' ? 'اسم الكمباوند (اختياري)' : 'Compound name (optional)'}</Label>
              <Input
                value={form.compound}
                onChange={(e) => set('compound', e.target.value)}
                className="mt-1 border-[#EDE0CC] focus:border-[#C4582A]"
                style={{ height: 48, borderRadius: 8 }}
                placeholder={locale === 'ar' ? 'مثال: هاسيندا باي' : 'e.g. Hacienda Bay'}
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Details ── */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 style={headingStyle} className="text-[#1C1613] mb-2">
              {locale === 'ar' ? 'تفاصيل العقار' : 'Property details'}
            </h2>
            <p className="text-sm text-[#7A6A5E] -mt-2">
              {locale === 'ar' ? 'حدد أعداد الغرف والضيوف بدقة' : 'Set accurate room and guest counts'}
            </p>

            {[
              { key: 'bedrooms', ar: 'غرف النوم', en: 'Bedrooms', min: 0 },
              { key: 'bathrooms', ar: 'الحمامات', en: 'Bathrooms', min: 1 },
              { key: 'maxGuests', ar: 'أقصى عدد ضيوف', en: 'Max guests', min: 1 },
            ].map(({ key, ar, en, min }) => (
              <div key={key}>
                <Label>{locale === 'ar' ? ar : en}</Label>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => set(key, Math.max(min, (form as any)[key] - 1))}
                    className="w-10 h-10 rounded-full border border-[#EDE0CC] flex items-center justify-center text-[#1C1613] hover:bg-[#F7F0E6] text-xl transition-colors"
                  >−</button>
                  <span className="text-xl font-bold text-[#1C1613] w-8 text-center">{(form as any)[key]}</span>
                  <button
                    onClick={() => set(key, (form as any)[key] + 1)}
                    className="w-10 h-10 rounded-full border border-[#EDE0CC] flex items-center justify-center text-[#1C1613] hover:bg-[#F7F0E6] text-xl transition-colors"
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Step 3: Photos ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 style={headingStyle} className="text-[#1C1613] mb-2">
                {locale === 'ar' ? 'صور العقار' : 'Property Photos'}
              </h2>
              <p className="text-sm text-[#7A6A5E]">
                {locale === 'ar'
                  ? 'الصورة الأولى ستكون الصورة الرئيسية. الصور الجيدة تجلب ضيوفاً أكثر!'
                  : 'The first photo will be the cover. Great photos attract more guests!'}
              </p>
            </div>

            <div className="bg-[#F7F0E6] rounded-xl p-3 space-y-2">
              <p className="text-xs font-medium text-[#1C1613] mb-2">
                {locale === 'ar' ? 'متطلبات الصور:' : 'Photo requirements:'}
              </p>
              <Req met={validPhotos >= REQUIREMENTS.PHOTOS_MIN}
                ar={`${REQUIREMENTS.PHOTOS_MIN} صور كحد أدنى (لديك ${validPhotos})`}
                en={`Minimum ${REQUIREMENTS.PHOTOS_MIN} photos (you have ${validPhotos})`}
                locale={locale}
              />
              <Req met={form.imageUrls.length > 0 && !!form.imageUrls[0]?.trim()}
                ar="الصورة الأولى هي الصورة الرئيسية"
                en="First photo is your cover photo"
                locale={locale}
              />
              <Req met={validPhotos <= 10}
                ar="الحد الأقصى 10 صور"
                en="Maximum 10 photos allowed"
                locale={locale}
              />
            </div>

            <div className="space-y-3">
              {form.imageUrls.length === 0 && (
                <div className="border-2 border-dashed border-[#EDE0CC] rounded-2xl p-8 text-center hover:border-[#C4582A] transition-colors">
                  <div className="flex justify-center mb-3"><CameraIcon /></div>
                  <p className="text-[#7A6A5E] text-sm mb-3">
                    {locale === 'ar' ? 'ابدأ بإضافة الصور' : 'Start adding your photos'}
                  </p>
                  <button
                    onClick={addImageUrl}
                    className="inline-flex items-center gap-2 px-5 py-2 text-white text-sm transition-colors active:scale-[0.97]"
                    style={{ background: '#C4582A', borderRadius: 999 }}
                  >
                    <Plus className="w-4 h-4" />
                    {locale === 'ar' ? 'أضف صورة' : 'Add Photo'}
                  </button>
                </div>
              )}

              {form.imageUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    index === 0 ? 'bg-[#C4582A] text-white' : 'bg-[#F7F0E6] border border-[#EDE0CC] text-[#7A6A5E]'
                  }`}>
                    {index === 0 ? '★' : index + 1}
                  </div>
                  <Input
                    value={url}
                    onChange={(e) => updateImageUrl(index, e.target.value)}
                    className="flex-1 border-[#EDE0CC] text-sm"
                    style={{ borderRadius: 8, height: 48 }}
                    dir="ltr"
                    placeholder="https://example.com/photo.jpg"
                  />
                  {url.startsWith('http') && (
                    <img
                      src={url}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover border border-[#EDE0CC] flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <button
                    onClick={() => removeImageUrl(index)}
                    className="p-2 text-[#7A6A5E] hover:text-[#C4582A] hover:bg-[#F7F0E6] rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {form.imageUrls.length > 0 && form.imageUrls.length < 10 && (
                <button
                  onClick={addImageUrl}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[#EDE0CC] rounded-xl w-full text-sm text-[#7A6A5E] hover:border-[#C4582A] hover:text-[#C4582A] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {locale === 'ar'
                    ? `أضف صورة أخرى (${validPhotos}/${REQUIREMENTS.PHOTOS_MIN} مطلوبة)`
                    : `Add another photo (${validPhotos}/${REQUIREMENTS.PHOTOS_MIN} required)`}
                </button>
              )}
            </div>

            {triedNext && !canProceed && (
              <p className="text-xs text-[#C4582A] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {locale === 'ar'
                  ? `أضف على الأقل ${REQUIREMENTS.PHOTOS_MIN} صور صالحة للمتابعة`
                  : `Add at least ${REQUIREMENTS.PHOTOS_MIN} valid photo URLs to continue`}
              </p>
            )}
          </div>
        )}

        {/* ── Step 4: Amenities ── */}
        {step === 4 && (
          <div>
            <h2 style={headingStyle} className="text-[#1C1613] mb-2">
              {locale === 'ar' ? 'ما هي مميزات العقار؟' : 'What amenities do you offer?'}
            </h2>

            <div className="bg-[#F7F0E6] rounded-xl p-3 mb-4">
              <Req
                met={form.amenities.length >= REQUIREMENTS.AMENITIES_MIN}
                ar={`حدد ${REQUIREMENTS.AMENITIES_MIN} مميزات كحد أدنى (اخترت ${form.amenities.length})`}
                en={`Select at least ${REQUIREMENTS.AMENITIES_MIN} amenities (selected ${form.amenities.length})`}
                locale={locale}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITIES.map((a) => {
                const isSelected = form.amenities.includes(a.id)
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleAmenity(a.id)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border-2 text-start transition-all"
                    style={{
                      borderColor: isSelected ? '#C4582A' : '#EDE0CC',
                      background: isSelected ? 'rgba(196,88,42,0.04)' : 'white',
                      color: isSelected ? '#C4582A' : '#7A6A5E',
                    }}
                  >
                    <span className="flex-shrink-0">{AMENITY_ICONS[a.id]}</span>
                    <span className="text-sm text-[#1C1613] flex-1">{locale === 'ar' ? a.ar : a.en}</span>
                    {isSelected && (
                      <span className="flex-shrink-0"><CheckmarkCircle /></span>
                    )}
                  </button>
                )
              })}
            </div>

            {triedNext && !canProceed && (
              <p className="text-xs text-[#C4582A] mt-3 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {locale === 'ar'
                  ? `اختر على الأقل ${REQUIREMENTS.AMENITIES_MIN} مميزات للمتابعة`
                  : `Select at least ${REQUIREMENTS.AMENITIES_MIN} amenities to continue`}
              </p>
            )}
          </div>
        )}

        {/* ── Step 5: Title & Description ── */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 style={headingStyle} className="text-[#1C1613] mb-2">
              {locale === 'ar' ? 'عنوان ووصف العقار' : 'Title and description'}
            </h2>

            <div className="bg-[#F7F0E6] rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-medium text-[#1C1613] mb-2">
                {locale === 'ar' ? 'المتطلبات:' : 'Requirements:'}
              </p>
              <Req
                met={form.titleAr.trim().length >= REQUIREMENTS.TITLE_MIN && form.titleEn.trim().length >= REQUIREMENTS.TITLE_MIN}
                ar={`كلا العنوانين: ${REQUIREMENTS.TITLE_MIN} حروف كحد أدنى`}
                en={`Both titles: ${REQUIREMENTS.TITLE_MIN}+ characters`}
                locale={locale}
              />
              <Req
                met={form.descriptionAr.trim().length >= REQUIREMENTS.DESC_MIN && form.descriptionEn.trim().length >= REQUIREMENTS.DESC_MIN}
                ar={`كلا الوصفين: ${REQUIREMENTS.DESC_MIN} حرف كحد أدنى`}
                en={`Both descriptions: ${REQUIREMENTS.DESC_MIN}+ characters`}
                locale={locale}
              />
            </div>

            <div>
              <Label>{locale === 'ar' ? 'العنوان بالعربية *' : 'Title in Arabic *'}</Label>
              <Input value={form.titleAr} onChange={(e) => set('titleAr', e.target.value)}
                className="mt-1 border-[#EDE0CC]" style={{ height: 48, borderRadius: 8 }}
                dir="rtl" placeholder="مثال: شاليه فاخر بإطلالة بحرية في الساحل الشمالي" maxLength={80} />
              <CharCount value={form.titleAr} min={REQUIREMENTS.TITLE_MIN} max={80} />
            </div>

            <div>
              <Label>{locale === 'ar' ? 'العنوان بالإنجليزية *' : 'Title in English *'}</Label>
              <Input value={form.titleEn} onChange={(e) => set('titleEn', e.target.value)}
                className="mt-1 border-[#EDE0CC]" style={{ height: 48, borderRadius: 8 }}
                dir="ltr" placeholder="e.g. Luxury sea-view chalet on the North Coast" maxLength={80} />
              <CharCount value={form.titleEn} min={REQUIREMENTS.TITLE_MIN} max={80} />
            </div>

            <div>
              <Label>{locale === 'ar' ? 'الوصف بالعربية *' : 'Description in Arabic *'}</Label>
              <Textarea value={form.descriptionAr} onChange={(e) => set('descriptionAr', e.target.value)}
                className="mt-1 border-[#EDE0CC] min-h-32" style={{ borderRadius: 8 }}
                dir="rtl" placeholder={`صف العقار بالتفصيل... (${REQUIREMENTS.DESC_MIN} حرف كحد أدنى)`}
                rows={5} maxLength={2000} />
              <CharCount value={form.descriptionAr} min={REQUIREMENTS.DESC_MIN} max={2000} />
            </div>

            <div>
              <Label>{locale === 'ar' ? 'الوصف بالإنجليزية *' : 'Description in English *'}</Label>
              <Textarea value={form.descriptionEn} onChange={(e) => set('descriptionEn', e.target.value)}
                className="mt-1 border-[#EDE0CC] min-h-32" style={{ borderRadius: 8 }}
                dir="ltr" placeholder={`Describe the property in detail... (min ${REQUIREMENTS.DESC_MIN} chars)`}
                rows={5} maxLength={2000} />
              <CharCount value={form.descriptionEn} min={REQUIREMENTS.DESC_MIN} max={2000} />
            </div>
          </div>
        )}

        {/* ── Step 6: Pricing ── */}
        {step === 6 && (
          <div className="space-y-5">
            <h2 style={headingStyle} className="text-[#1C1613] mb-2">
              {locale === 'ar' ? 'التسعير' : 'Pricing'}
            </h2>

            <div className="bg-[#F7F0E6] rounded-xl p-3 space-y-1.5">
              <Req
                met={form.pricePerNight >= REQUIREMENTS.PRICE_MIN}
                ar={`السعر: ${REQUIREMENTS.PRICE_MIN} ج.م على الأقل في الليلة`}
                en={`Minimum price: EGP ${REQUIREMENTS.PRICE_MIN} per night`}
                locale={locale}
              />
              <Req
                met={form.minimumNights >= 1}
                ar="الحد الأدنى للليالي: ليلة واحدة على الأقل"
                en="Minimum nights: at least 1 night"
                locale={locale}
              />
            </div>

            {[
              { key: 'pricePerNight', ar: 'السعر في الليلة (ج.م) *', en: 'Price per night (EGP) *', min: REQUIREMENTS.PRICE_MIN, hint: locale === 'ar' ? `الحد الأدنى: ${REQUIREMENTS.PRICE_MIN} ج.م` : `Min: EGP ${REQUIREMENTS.PRICE_MIN}` },
              { key: 'cleaningFee', ar: 'رسوم التنظيف (ج.م)', en: 'Cleaning fee (EGP)', min: 0, hint: locale === 'ar' ? 'اختياري' : 'Optional' },
              { key: 'minimumNights', ar: 'الحد الأدنى للليالي *', en: 'Minimum nights *', min: 1, hint: locale === 'ar' ? 'الحد الأدنى: ليلة واحدة' : 'Min: 1 night' },
            ].map(({ key, ar, en, min, hint }) => (
              <div key={key}>
                <Label>{locale === 'ar' ? ar : en}</Label>
                <Input
                  type="number"
                  value={(form as any)[key]}
                  onChange={(e) => set(key, Number(e.target.value))}
                  min={min}
                  className={`mt-1 border-[#EDE0CC] ${key === 'pricePerNight' && (form as any)[key] < REQUIREMENTS.PRICE_MIN ? 'border-[#C4582A]/50' : ''}`}
                  style={{ height: 48, borderRadius: 8 }}
                  dir="ltr"
                />
                <p className="text-xs text-[#9A8878] mt-1">{hint}</p>
              </div>
            ))}

            <div className="flex items-center justify-between p-4 bg-[#F7F0E6] rounded-xl">
              <div>
                <p className="font-medium text-[#1C1613] text-sm">{locale === 'ar' ? 'حجز فوري' : 'Instant Book'}</p>
                <p className="text-xs text-[#7A6A5E]">{locale === 'ar' ? 'السماح بالحجز دون موافقة' : 'Allow booking without approval'}</p>
              </div>
              <Toggle value={form.instantBook} onChange={(v) => set('instantBook', v)} isRTL={isRTL} />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F7F0E6] rounded-xl">
              <div>
                <p className="font-medium text-[#1C1613] text-sm">{locale === 'ar' ? 'قبول الدفع بالتقسيط (فاليو)' : 'Accept ValU BNPL'}</p>
                <p className="text-xs text-[#7A6A5E]">{locale === 'ar' ? 'زيادة الحجوزات بقبول التقسيط' : 'Increase bookings by accepting installments'}</p>
              </div>
              <Toggle value={form.bnplEnabled} onChange={(v) => set('bnplEnabled', v)} isRTL={isRTL} color="#C9973A" />
            </div>
          </div>
        )}

        {/* ── Step 7: Rules & Policies ── */}
        {step === 7 && (
          <div className="space-y-5">
            <h2 style={headingStyle} className="text-[#1C1613] mb-2">
              {locale === 'ar' ? 'القواعد والسياسات' : 'Rules & Policies'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{locale === 'ar' ? 'وقت الوصول' : 'Check-in time'}</Label>
                <select
                  value={form.checkInTime}
                  onChange={(e) => set('checkInTime', e.target.value)}
                  className="w-full mt-1 border border-[#EDE0CC] px-3 text-sm text-[#1C1613] bg-white outline-none focus:border-[#C4582A]"
                  style={{ height: 48, borderRadius: 8 }}
                  dir="ltr"
                >
                  {CHECKIN_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>{locale === 'ar' ? 'وقت المغادرة' : 'Check-out time'}</Label>
                <select
                  value={form.checkOutTime}
                  onChange={(e) => set('checkOutTime', e.target.value)}
                  className="w-full mt-1 border border-[#EDE0CC] px-3 text-sm text-[#1C1613] bg-white outline-none focus:border-[#C4582A]"
                  style={{ height: 48, borderRadius: 8 }}
                  dir="ltr"
                >
                  {CHECKOUT_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {[
              { key: 'petsAllowed', ar: 'الحيوانات الأليفة مسموحة', en: 'Pets allowed', descAr: 'السماح للضيوف بإحضار حيواناتهم', descEn: 'Allow guests to bring pets' },
              { key: 'smokingAllowed', ar: 'التدخين مسموح', en: 'Smoking allowed', descAr: 'السماح بالتدخين داخل العقار', descEn: 'Allow smoking inside' },
              { key: 'partiesAllowed', ar: 'الحفلات مسموحة', en: 'Parties allowed', descAr: 'السماح بإقامة حفلات', descEn: 'Allow parties or large gatherings' },
            ].map(({ key, ar, en, descAr, descEn }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-[#F7F0E6] rounded-xl">
                <div>
                  <p className="font-medium text-[#1C1613] text-sm">{locale === 'ar' ? ar : en}</p>
                  <p className="text-xs text-[#7A6A5E]">{locale === 'ar' ? descAr : descEn}</p>
                </div>
                <Toggle value={(form as any)[key]} onChange={(v) => set(key, v)} isRTL={isRTL} />
              </div>
            ))}

            <div>
              <Label>{locale === 'ar' ? 'سياسة الإلغاء' : 'Cancellation policy'}</Label>
              <div className="mt-2 space-y-2">
                {CANCELLATION_POLICIES.map((policy) => {
                  const isSelected = form.cancellationPolicy === policy.id
                  return (
                    <button
                      key={policy.id}
                      onClick={() => set('cancellationPolicy', policy.id)}
                      className="w-full text-start p-4 rounded-xl border-2 transition-all"
                      style={{
                        borderColor: isSelected ? '#C4582A' : '#EDE0CC',
                        background: isSelected ? 'rgba(196,88,42,0.04)' : 'white',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#1C1613] text-sm">{locale === 'ar' ? policy.ar : policy.en}</span>
                        {isSelected && <CheckmarkCircle />}
                      </div>
                      <p className="text-xs text-[#7A6A5E] mt-1">{locale === 'ar' ? policy.descAr : policy.descEn}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label>{locale === 'ar' ? 'قواعد المنزل بالعربية (اختياري)' : 'House rules in Arabic (optional)'}</Label>
              <Textarea value={form.houseRulesAr} onChange={(e) => set('houseRulesAr', e.target.value)}
                className="mt-1 border-[#EDE0CC] min-h-24" style={{ borderRadius: 8 }}
                dir="rtl" placeholder="مثال: لا ضوضاء بعد الساعة 11 مساءً..." rows={3} />
            </div>
            <div>
              <Label>{locale === 'ar' ? 'قواعد المنزل بالإنجليزية (اختياري)' : 'House rules in English (optional)'}</Label>
              <Textarea value={form.houseRulesEn} onChange={(e) => set('houseRulesEn', e.target.value)}
                className="mt-1 border-[#EDE0CC] min-h-24" style={{ borderRadius: 8 }}
                dir="ltr" placeholder="e.g. No noise after 11 PM..." rows={3} />
            </div>
          </div>
        )}

        {/* ── Step 8: License ── */}
        {step === 8 && (
          <div className="space-y-5">
            <div>
              <h2 style={headingStyle} className="text-[#1C1613] mb-1">
                {locale === 'ar' ? 'ترخيص العقار' : 'Property License'}
              </h2>
              <p className="text-sm text-[#7A6A5E]">
                {locale === 'ar'
                  ? 'هذه الخطوة اختيارية. الترخيص يزيد مصداقية إعلانك.'
                  : "Optional. A license increases your listing's credibility."}
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[#C9973A]/8 border border-[#C9973A]/30 rounded-xl">
              <span className="mt-0.5 flex-shrink-0"><DocumentBadgeIcon /></span>
              <div>
                <p className="text-sm font-medium text-[#1C1613]">
                  {locale === 'ar' ? 'الإعلانات المرخصة تحصل على شارة موثوق' : 'Licensed listings get a verified badge'}
                </p>
                <p className="text-xs text-[#7A6A5E] mt-1">
                  {locale === 'ar' ? 'وتظهر في نتائج البحث بشكل أفضل.' : 'And rank higher in search results.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F7F0E6] rounded-xl">
              <div>
                <p className="font-medium text-[#1C1613] text-sm">{locale === 'ar' ? 'العقار مرخص رسمياً' : 'Property is officially licensed'}</p>
                <p className="text-xs text-[#7A6A5E]">{locale === 'ar' ? 'لديّ ترخيص سياحي أو تجاري' : 'I have a tourism or commercial license'}</p>
              </div>
              <Toggle value={form.isLicensed} onChange={(v) => set('isLicensed', v)} isRTL={isRTL} color="#C9973A" />
            </div>

            {form.isLicensed && (
              <div>
                <Label>{locale === 'ar' ? 'رقم الترخيص' : 'License number'}</Label>
                <Input
                  value={form.licenseNumber}
                  onChange={(e) => set('licenseNumber', e.target.value)}
                  className="mt-1 border-[#EDE0CC]"
                  style={{ height: 48, borderRadius: 8 }}
                  dir="ltr"
                  placeholder={locale === 'ar' ? 'أدخل رقم الترخيص' : 'Enter license number'}
                />
                <p className="text-xs text-[#7A6A5E] mt-1.5">
                  {locale === 'ar' ? 'سيتم التحقق خلال 48 ساعة' : 'Will be verified within 48 hours'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 9: Review ── */}
        {step === 9 && (
          <div className="space-y-4">
            <h2 style={headingStyle} className="text-[#1C1613] mb-4">
              {locale === 'ar' ? 'مراجعة ونشر' : 'Review and publish'}
            </h2>

            <div className="bg-[#F7F0E6] rounded-2xl p-5 space-y-3 text-sm">
              {[
                { labelAr: 'نوع العقار', labelEn: 'Type', val: form.propertyType },
                { labelAr: 'الموقع', labelEn: 'Location', val: [form.compound, form.city, form.governorate].filter(Boolean).join(', ') },
                { labelAr: 'غرف / حمامات / ضيوف', labelEn: 'Beds / Baths / Guests', val: `${form.bedrooms} / ${form.bathrooms} / ${form.maxGuests}` },
                { labelAr: 'الصور', labelEn: 'Photos', val: `${validPhotos} ${locale === 'ar' ? 'صورة' : 'photos'}` },
                { labelAr: 'المميزات', labelEn: 'Amenities', val: `${form.amenities.length} ${locale === 'ar' ? 'مميزة' : 'selected'}` },
                { labelAr: 'السعر / الليلة', labelEn: 'Price / night', val: `EGP ${form.pricePerNight.toLocaleString()}` },
                { labelAr: 'رسوم التنظيف', labelEn: 'Cleaning fee', val: form.cleaningFee > 0 ? `EGP ${form.cleaningFee.toLocaleString()}` : (locale === 'ar' ? 'مجاناً' : 'Free') },
                { labelAr: 'وصول / مغادرة', labelEn: 'Check-in / out', val: `${form.checkInTime} / ${form.checkOutTime}` },
                { labelAr: 'سياسة الإلغاء', labelEn: 'Cancellation', val: (() => { const p = CANCELLATION_POLICIES.find((c) => c.id === form.cancellationPolicy); return p ? (locale === 'ar' ? p.ar : p.en) : form.cancellationPolicy })() },
                { labelAr: 'الترخيص', labelEn: 'License', val: form.isLicensed ? `${locale === 'ar' ? 'مرخص' : 'Licensed'}${form.licenseNumber ? ` · ${form.licenseNumber}` : ''}` : (locale === 'ar' ? 'غير مرخص' : 'Unlicensed') },
              ].map(({ labelAr, labelEn, val }) => (
                <div key={labelEn} className="flex justify-between gap-4 py-1 border-b border-[#EDE0CC] last:border-0">
                  <span className="text-[#7A6A5E] flex-shrink-0">{locale === 'ar' ? labelAr : labelEn}</span>
                  <span className="font-medium text-[#1C1613] text-end">{val}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#7A6A5E] flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {locale === 'ar'
                ? 'سيتم مراجعة الإعلان خلال 24 ساعة قبل النشر'
                : 'Your listing will be reviewed within 24 hours before going live'}
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#EDE0CC]">
        {/* Back button — plain text, --mid, no border */}
        {step > 0 ? (
          <button
            onClick={handleBack}
            className="text-sm text-[#7A6A5E] hover:text-[#1C1613] transition-colors px-2"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}
          >
            {locale === 'ar' ? 'السابق' : 'Back'}
          </button>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed && triedNext}
            className="text-white transition-all active:scale-[0.97]"
            style={{
              background: canProceed ? '#C4582A' : 'rgba(196,88,42,0.4)',
              borderRadius: 999,
              height: 48,
              paddingLeft: 32,
              paddingRight: 32,
              fontFamily: isRTL ? "'Tajawal', sans-serif" : "'Josefin Sans', sans-serif",
              fontWeight: isRTL ? 300 : 100,
              fontSize: 13,
              letterSpacing: isRTL ? 0 : '0.16em',
              textTransform: isRTL ? 'none' : 'uppercase',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              boxShadow: canProceed ? '0 4px 16px rgba(196,88,42,0.25)' : 'none',
              transition: 'background 150ms ease, box-shadow 150ms ease',
            }}
          >
            {locale === 'ar' ? 'التالي' : 'Next'}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-white transition-all active:scale-[0.97]"
            style={{
              background: loading ? 'rgba(143,166,139,0.5)' : '#8FA68B',
              borderRadius: 999,
              height: 48,
              paddingLeft: 32,
              paddingRight: 32,
              fontFamily: isRTL ? "'Tajawal', sans-serif" : "'Josefin Sans', sans-serif",
              fontWeight: isRTL ? 300 : 100,
              fontSize: 13,
              letterSpacing: isRTL ? 0 : '0.16em',
              textTransform: isRTL ? 'none' : 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" strokeDasharray="60" strokeDashoffset="20" />
                </svg>
                {locale === 'ar' ? 'جاري النشر...' : 'Publishing...'}
              </span>
            ) : (locale === 'ar' ? 'نشر الإعلان' : 'Publish Listing')}
          </button>
        )}
      </div>

      <style>{`
        @keyframes step-in {
          from { opacity: 0; transform: translateX(18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes step-in-back {
          from { opacity: 0; transform: translateX(-18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
