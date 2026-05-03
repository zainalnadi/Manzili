import Link from 'next/link'
import { ManziliLogo } from '@/components/shared/ManziliLogo'

interface FooterProps {
  locale: string
}

export function Footer({ locale }: FooterProps) {
  const isRTL = locale === 'ar'

  const josefin: React.CSSProperties = {
    fontFamily: "'Josefin Sans', sans-serif",
    fontWeight: 100,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
  }

  const outfit: React.CSSProperties = {
    fontFamily: isRTL ? "'Tajawal', sans-serif" : "'Outfit', sans-serif",
    fontWeight: isRTL ? 200 : 300,
  }

  return (
    <footer
      className="bg-[#1C1613] text-white"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <ManziliLogo variant="dark" height={20} />
            </div>
            <p className="text-[#7A6A5E] text-sm leading-relaxed" style={outfit}>
              {locale === 'ar'
                ? 'منصة الإيجار القصير المصممة للمصريين، بالجنيه المصري'
                : "Egypt's domestic short-term rental platform, built for Egyptians"}
            </p>
          </div>

          {/* Explore */}
          <div>
            <div className="mb-4">
              {/* Terra accent line above heading */}
              <div style={{ width: 80, height: 2, background: '#C4582A', marginBottom: 10 }} />
              <h3 className="text-[#B0A090] text-[10px]" style={josefin}>
                {locale === 'ar' ? 'استكشف' : 'Explore'}
              </h3>
            </div>
            <ul className="space-y-2.5">
              {[
                { href: 'north-coast', ar: 'الساحل الشمالي', en: 'North Coast' },
                { href: 'ain-sokhna', ar: 'العين السخنة',   en: 'Ain Sokhna' },
                { href: 'cairo',      ar: 'القاهرة',         en: 'Cairo' },
                { href: 'hurghada',   ar: 'الغردقة',         en: 'Hurghada' },
                { href: 'el-gouna',   ar: 'الجونة',          en: 'El Gouna' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={`/${locale}/listings?where=${item.href}`}
                    className="text-[#7A6A5E] hover:text-[#F7F0E6] transition-colors text-sm"
                    style={outfit}
                  >
                    {locale === 'ar' ? item.ar : item.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hosting */}
          <div>
            <h3 className="text-[#B0A090] text-[10px] mb-4" style={josefin}>
              {locale === 'ar' ? 'استضافة' : 'Hosting'}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href={`/${locale}/host`}
                  className="text-[#7A6A5E] hover:text-[#F7F0E6] transition-colors text-sm" style={outfit}>
                  {locale === 'ar' ? 'أصبح مضيفاً' : 'Become a Host'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/host/dashboard`}
                  className="text-[#7A6A5E] hover:text-[#F7F0E6] transition-colors text-sm" style={outfit}>
                  {locale === 'ar' ? 'لوحة المضيف' : 'Host Dashboard'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support + Legal */}
          <div>
            <h3 className="text-[#B0A090] text-[10px] mb-4" style={josefin}>
              {locale === 'ar' ? 'الدعم والقانوني' : 'Support'}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:support@manzili.eg"
                  className="text-[#7A6A5E] hover:text-[#F7F0E6] transition-colors text-sm" style={outfit}>
                  support@manzili.eg
                </a>
              </li>
              <li>
                <Link href={`/${locale}/legal/privacy`}
                  className="text-[#7A6A5E] hover:text-[#F7F0E6] transition-colors text-sm" style={outfit}>
                  {locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/legal/terms`}
                  className="text-[#7A6A5E] hover:text-[#F7F0E6] transition-colors text-sm" style={outfit}>
                  {locale === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/legal/cookies`}
                  className="text-[#7A6A5E] hover:text-[#F7F0E6] transition-colors text-sm" style={outfit}>
                  {locale === 'ar' ? 'سياسة ملفات تعريف الارتباط' : 'Cookie Policy'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[#2C2420] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#5A4A3E] text-[10px]" style={josefin}>
            © 2026 MANZILI
          </p>
          <div className="flex items-center gap-4">
            <span
              className="text-[11px] text-[#5A4A3E]"
              style={outfit}
            >
              {locale === 'ar' ? 'صُنع في مصر 🇪🇬' : 'Made in Egypt 🇪🇬'}
            </span>
            <span className="text-[#5A4A3E] text-xs" style={outfit}>
              {locale === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
