import type { Metadata } from 'next'
import '../globals.css'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { Toaster } from '@/components/ui/sonner'
import AuthProvider from '@/components/shared/AuthProvider'
import { AuthModalProvider } from '@/components/shared/AuthModal'

const locales = ['ar', 'en']

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'

  return {
    title: isAr ? 'منزلي — إيجارات قصيرة المدى في مصر' : 'Manzili — Egypt Short-Term Rentals',
    description: isAr
      ? 'اكتشف شاليهات الساحل الشمالي، فيلات العين السخنة، وشقق القاهرة. ادفع بالجنيه المصري مع إمكانية التقسيط عبر فاليو.'
      : 'Discover North Coast chalets, Ain Sokhna villas, and Cairo apartments. Pay in EGP with ValU BNPL available.',
    keywords: isAr
      ? ['إيجار', 'شاليه', 'فيلا', 'مصر', 'الساحل الشمالي', 'العين السخنة', 'منزلي']
      : ['Egypt rentals', 'North Coast', 'Ain Sokhna', 'Cairo', 'short-term rental', 'Manzili'],
    openGraph: {
      title: isAr ? 'منزلي — إيجارات قصيرة المدى في مصر' : 'Manzili — Egypt Short-Term Rentals',
      description: isAr
        ? 'اكتشف أفضل الوجهات السياحية في مصر بأسعار بالجنيه المصري'
        : 'Discover the best holiday destinations in Egypt. Pay in EGP.',
      type: 'website',
      locale: isAr ? 'ar_EG' : 'en_US',
      siteName: 'Manzili | منزلي',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
          width: 1200,
          height: 630,
          alt: 'Manzili — Egypt Short-Term Rentals',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isAr ? 'منزلي — إيجارات قصيرة المدى في مصر' : 'Manzili — Egypt Short-Term Rentals',
      description: isAr
        ? 'الساحل الشمالي، العين السخنة، القاهرة — بالجنيه المصري'
        : 'North Coast, Ain Sokhna, Cairo — all in EGP',
    },
    robots: 'index, follow',
    alternates: {
      canonical: `https://manzili.eg/${locale}`,
      languages: {
        'ar': 'https://manzili.eg/ar',
        'en': 'https://manzili.eg/en',
      },
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!locales.includes(locale)) {
    notFound()
  }

  const messages = await getMessages()
  const isRTL = locale === 'ar'

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@100;200;300&family=Outfit:wght@300;400;500;600&family=Tajawal:wght@200;300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F7F0E6]">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AuthProvider>
            <AuthModalProvider>
              <Navbar locale={locale} />
              <main className="min-h-screen">{children}</main>
              <Footer locale={locale} />
              <Toaster position={isRTL ? 'bottom-left' : 'bottom-right'} />
            </AuthModalProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}
