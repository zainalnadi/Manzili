'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Menu, X, Heart, ChevronDown, MessageCircle, Briefcase, MapPin, Settings, LogOut, User, Star, Luggage } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthModal } from '@/components/shared/AuthModal'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ManziliLogo } from '@/components/shared/ManziliLogo'
import { NotificationBell } from '@/components/shared/NotificationBell'

interface NavbarProps { locale: string }

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="0.8"/>
      <ellipse cx="8" cy="8" rx="2.8" ry="6.5" stroke="currentColor" strokeWidth="0.8"/>
      <line x1="1.5" y1="6" x2="14.5" y2="6" stroke="currentColor" strokeWidth="0.8"/>
      <line x1="1.5" y1="10" x2="14.5" y2="10" stroke="currentColor" strokeWidth="0.8"/>
    </svg>
  )
}

/* Avatar initials circle */
function UserAvatar({ user }: { user: { fullNameEn?: string | null; fullNameAr?: string | null; email: string; avatarUrl?: string | null } }) {
  const initial = (user.fullNameEn || user.fullNameAr || user.email)?.[0]?.toUpperCase() ?? 'U'
  return (
    <div className="w-7 h-7 rounded-full bg-[#C4582A] flex items-center justify-center text-white text-[11px] flex-shrink-0"
      style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100 }}>
      {initial}
    </div>
  )
}

/* Dropdown section label */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1.5 text-[9px] text-[#9A8878] uppercase tracking-[0.15em]"
      style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100 }}>
      {children}
    </div>
  )
}

/* Dropdown item */
function DropItem({
  icon, label, onClick, danger, badge, highlight,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
  badge?: number
  highlight?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg transition-colors text-start ${
        danger
          ? 'text-[#C4582A] hover:bg-[#F0D5C5]/30'
          : highlight
            ? 'text-[#C4582A] bg-[#C4582A]/5 hover:bg-[#C4582A]/10 font-medium'
            : 'text-[#1C1613] hover:bg-[#F7F0E6]'
      }`}
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <span className={danger ? 'text-[#C4582A]' : highlight ? 'text-[#C4582A]' : 'text-[#7A6A5E]'}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="min-w-[18px] h-[18px] rounded-full bg-[#C4582A] text-white text-[10px] font-bold flex items-center justify-center px-1">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

export function Navbar({ locale }: NavbarProps) {
  const t = useTranslations('nav')
  const { user, logout } = useAuthStore()
  const { openAuthModal } = useAuthModal()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isRTL = locale === 'ar'

  /* Scroll-aware border */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  /* Lock body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  /* Close dropdown on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  /* Fetch unread messages count — combines booking threads + direct conversations */
  useEffect(() => {
    if (!user) return
    const fetchUnread = async () => {
      try {
        const [bookingRes, directRes] = await Promise.all([
          fetch('/api/messages/unread-count'),
          fetch('/api/conversations/unread-count'),
        ])
        const bookingCount = bookingRes.ok ? (await bookingRes.json()).count ?? 0 : 0
        const directCount = directRes.ok ? (await directRes.json()).count ?? 0 : 0
        setUnreadMessages(bookingCount + directCount)
      } catch { /* silent */ }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30_000)
    return () => clearInterval(interval)
  }, [user])

  const handleLanguageToggle = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar'
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`
    router.refresh()
    router.push(`/${newLocale}`)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    logout()
    setDropdownOpen(false)
    setMobileOpen(false)
    router.push(`/${locale}`)
  }

  const isHost = user?.role === 'HOST' || user?.role === 'PROPERTY_MANAGER'
  const isAdmin = user?.role === 'ADMIN'
  const displayName = (locale === 'ar' ? user?.fullNameAr : user?.fullNameEn) ?? user?.fullNameEn ?? user?.fullNameAr ?? user?.email ?? ''

  const josefin: React.CSSProperties = {
    fontFamily: "'Josefin Sans', sans-serif",
    fontWeight: 100,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  }

  const iconBtn = `p-2 text-[#7A6A5E] hover:text-[#C4582A] hover:bg-[#F0D5C5]/30 rounded-lg transition-colors duration-150`

  return (
    <>
      <nav
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          background: 'rgba(247,240,230,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '0.5px solid rgba(122,106,94,0.2)' : '0.5px solid transparent',
          transition: 'border-color 300ms ease',
        }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href={`/${locale}`} aria-label="Manzili home" className="flex-shrink-0">
              <ManziliLogo variant="default" height={22} />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">

              {/* Switch to Hosting / Travelling */}
              {user && !isAdmin && (
                <button
                  onClick={() => {
                    if (isHost) {
                      router.push(`/${locale}/host/dashboard`)
                    } else {
                      router.push(`/${locale}/host`)
                    }
                  }}
                  className="px-3 py-1.5 text-[#7A6A5E] text-[11px] hover:text-[#1C1613] transition-colors rounded-full hover:bg-[#EDE0CC]/60"
                  style={josefin}
                >
                  {isHost
                    ? (locale === 'ar' ? 'لوحة المضيف' : 'Switch to Hosting')
                    : (locale === 'ar' ? 'استضف معنا' : 'Switch to Hosting')
                  }
                </button>
              )}

              {user && (
                <>
                  <Link href={`/${locale}/saved`} className={iconBtn} aria-label="Saved">
                    <Heart className="w-[18px] h-[18px]" strokeWidth={1} />
                  </Link>
                  <Link href={`/${locale}/messages`} className={`${iconBtn} relative`} aria-label="Messages">
                    <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1} />
                    {unreadMessages > 0 && (
                      <span className="absolute top-1 end-1 min-w-[14px] h-[14px] rounded-full bg-[#C4582A] text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                  <NotificationBell locale={locale} />
                </>
              )}

              {/* Language toggle */}
              <button
                onClick={handleLanguageToggle}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[#7A6A5E] hover:text-[#1C1613] hover:bg-[#EDE0CC]/60 rounded-full text-[11px] transition-colors duration-150"
                style={josefin}
              >
                <GlobeIcon />
                <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
              </button>

              {user ? (
                /* ── Avatar pill + dropdown ── */
                <div className="relative ms-1" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 border border-[#EDE0CC] rounded-full px-2.5 py-1.5 hover:bg-[#EDE0CC]/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4582A]"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    <Menu className="w-4 h-4 text-[#7A6A5E]" strokeWidth={1} />
                    <UserAvatar user={user} />
                  </button>

                  {/* Dropdown panel */}
                  {dropdownOpen && (
                    <div
                      className="absolute top-full mt-2 bg-white rounded-2xl z-50 py-2"
                      style={{
                        [isRTL ? 'left' : 'right']: 0,
                        width: 240,
                        border: '0.5px solid rgba(122,106,94,0.15)',
                        boxShadow: '0 8px 40px rgba(28,22,19,0.12)',
                        animation: 'fade-up 150ms cubic-bezier(0.23,1,0.32,1) both',
                      }}
                    >
                      {/* User info */}
                      <div className="px-3 py-2.5 border-b border-[#EDE0CC]/60 mb-1">
                        <p className="text-sm font-semibold text-[#1C1613] truncate">{displayName}</p>
                        <p className="text-xs text-[#9A8878] truncate">{user.email}</p>
                      </div>

                      <div className="px-1">
                        {/* Switch to Hosting */}
                        {!isAdmin && (
                          <DropItem
                            icon={isHost ? <Luggage className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                            label={isHost
                              ? (locale === 'ar' ? 'التنقل للسفر' : 'Switch to Travelling')
                              : (locale === 'ar' ? 'استضف معنا' : 'Switch to Hosting')
                            }
                            onClick={() => {
                              setDropdownOpen(false)
                              router.push(isHost ? `/${locale}` : `/${locale}/host`)
                            }}
                            highlight
                          />
                        )}

                        {/* Travelling section */}
                        <SectionLabel>{locale === 'ar' ? 'السفر' : 'Travelling'}</SectionLabel>
                        <DropItem
                          icon={<MapPin className="w-4 h-4" />}
                          label={locale === 'ar' ? 'حجوزاتي' : 'My Bookings'}
                          onClick={() => { setDropdownOpen(false); router.push(`/${locale}/bookings`) }}
                        />
                        <DropItem
                          icon={<Heart className="w-4 h-4" />}
                          label={locale === 'ar' ? 'المحفوظات' : 'Saved'}
                          onClick={() => { setDropdownOpen(false); router.push(`/${locale}/saved`) }}
                        />
                        <DropItem
                          icon={<MessageCircle className="w-4 h-4" />}
                          label={locale === 'ar' ? 'الرسائل' : 'Messages'}
                          onClick={() => { setDropdownOpen(false); router.push(`/${locale}/messages`) }}
                          badge={unreadMessages}
                        />

                        {/* Account section */}
                        <div className="my-1 border-t border-[#EDE0CC]/60" />
                        <SectionLabel>{locale === 'ar' ? 'الحساب' : 'Account'}</SectionLabel>
                        <DropItem
                          icon={<User className="w-4 h-4" />}
                          label={locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
                          onClick={() => { setDropdownOpen(false); router.push(`/${locale}/profile`) }}
                        />
                        {isHost && (
                          <DropItem
                            icon={<Briefcase className="w-4 h-4" />}
                            label={locale === 'ar' ? 'لوحة المضيف' : 'Host Dashboard'}
                            onClick={() => { setDropdownOpen(false); router.push(`/${locale}/host/dashboard`) }}
                          />
                        )}
                        {isAdmin && (
                          <DropItem
                            icon={<Settings className="w-4 h-4" />}
                            label="Admin"
                            onClick={() => { setDropdownOpen(false); router.push(`/${locale}/admin/dashboard`) }}
                          />
                        )}
                        <DropItem
                          icon={<Settings className="w-4 h-4" />}
                          label={locale === 'ar' ? 'الإعدادات' : 'Settings'}
                          onClick={() => { setDropdownOpen(false); router.push(`/${locale}/profile/edit`) }}
                        />
                        <DropItem
                          icon={<LogOut className="w-4 h-4" />}
                          label={locale === 'ar' ? 'تسجيل الخروج' : 'Log out'}
                          onClick={handleLogout}
                          danger
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 ms-1">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="px-3 py-1.5 text-[#7A6A5E] hover:text-[#1C1613] text-[11px] hover:bg-[#EDE0CC]/60 rounded-full transition-colors"
                    style={josefin}
                  >
                    {t('login')}
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="px-5 py-2 bg-[#C4582A] hover:bg-[#A8471F] text-white text-[11px] rounded-full transition-colors active:scale-[0.97]"
                    style={{ ...josefin, display: 'flex', alignItems: 'center', height: 36 }}
                  >
                    {t('register')}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-[#7A6A5E] hover:text-[#1C1613] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen
                ? <X className="w-5 h-5" strokeWidth={1.2} />
                : <Menu className="w-5 h-5" strokeWidth={1.2} />
              }
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        style={{
          background: 'rgba(28,22,19,0.4)',
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transition: 'opacity 300ms ease',
        }}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="fixed top-0 bottom-0 z-50 w-[300px] md:hidden flex flex-col"
        style={{
          [isRTL ? 'left' : 'right']: 0,
          background: 'rgba(247,240,230,0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transform: mobileOpen ? 'translateX(0)' : `translateX(${isRTL ? '-100%' : '100%'})`,
          transition: 'transform 300ms var(--ease-drawer)',
          boxShadow: '-8px 0 40px rgba(28,22,19,0.12)',
        }}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-[#EDE0CC]/60">
          <ManziliLogo variant="default" height={20} />
          <button onClick={() => setMobileOpen(false)} className="p-2 text-[#7A6A5E]">
            <X className="w-5 h-5" strokeWidth={1.2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <button
            onClick={() => { handleLanguageToggle(); setMobileOpen(false) }}
            className="flex items-center gap-2.5 w-full px-3 py-3 text-[#7A6A5E] hover:text-[#1C1613] hover:bg-[#EDE0CC]/40 rounded-xl text-[11px] transition-colors"
            style={josefin}
          >
            <GlobeIcon />
            {locale === 'ar' ? 'English' : 'العربية'}
          </button>

          {user ? (
            <>
              {/* User info */}
              <div className="px-3 py-3 border border-[#EDE0CC] rounded-xl mb-2">
                <p className="text-sm font-semibold text-[#1C1613] truncate">{displayName}</p>
                <p className="text-xs text-[#9A8878] truncate">{user.email}</p>
              </div>

              {/* Switch mode */}
              {!isAdmin && (
                <button
                  onClick={() => { setMobileOpen(false); router.push(isHost ? `/${locale}` : `/${locale}/host`) }}
                  className="flex items-center gap-2.5 w-full px-3 py-3 text-[#C4582A] bg-[#C4582A]/5 hover:bg-[#C4582A]/10 rounded-xl text-sm transition-colors font-medium"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  <Briefcase className="w-4 h-4" />
                  {isHost
                    ? (locale === 'ar' ? 'التنقل للسفر' : 'Switch to Travelling')
                    : (locale === 'ar' ? 'استضف معنا' : 'Switch to Hosting')
                  }
                </button>
              )}

              <Link href={`/${locale}/bookings`} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-3 text-[#1C1613] text-sm hover:bg-[#EDE0CC]/40 rounded-xl transition-colors">
                <MapPin className="w-4 h-4 text-[#7A6A5E]" strokeWidth={1} />
                {locale === 'ar' ? 'حجوزاتي' : 'My Bookings'}
              </Link>
              <Link href={`/${locale}/saved`} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-3 text-[#1C1613] text-sm hover:bg-[#EDE0CC]/40 rounded-xl transition-colors">
                <Heart className="w-4 h-4 text-[#7A6A5E]" strokeWidth={1} />
                {locale === 'ar' ? 'المحفوظات' : 'Saved'}
              </Link>
              <Link href={`/${locale}/messages`} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-3 text-[#1C1613] text-sm hover:bg-[#EDE0CC]/40 rounded-xl transition-colors">
                <MessageCircle className="w-4 h-4 text-[#7A6A5E]" strokeWidth={1} />
                {locale === 'ar' ? 'الرسائل' : 'Messages'}
                {unreadMessages > 0 && (
                  <span className="ms-auto min-w-[18px] h-[18px] rounded-full bg-[#C4582A] text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
              <Link href={`/${locale}/profile`} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-3 text-[#1C1613] text-sm hover:bg-[#EDE0CC]/40 rounded-xl transition-colors">
                <User className="w-4 h-4 text-[#7A6A5E]" strokeWidth={1} />
                {locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
              </Link>
              {isHost && (
                <Link href={`/${locale}/host/dashboard`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-3 text-[#1C1613] text-sm hover:bg-[#EDE0CC]/40 rounded-xl transition-colors">
                  <Briefcase className="w-4 h-4 text-[#7A6A5E]" strokeWidth={1} />
                  {t('host_dashboard')}
                </Link>
              )}
              {isAdmin && (
                <Link href={`/${locale}/admin/dashboard`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-3 text-[#1C1613] text-sm hover:bg-[#EDE0CC]/40 rounded-xl transition-colors">
                  <Settings className="w-4 h-4 text-[#7A6A5E]" strokeWidth={1} />
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-3 text-[#C4582A] text-sm hover:bg-[#F0D5C5]/30 rounded-xl transition-colors">
                <LogOut className="w-4 h-4" strokeWidth={1} />
                {t('logout')}
              </button>
            </>
          ) : (
            <div className="pt-4 space-y-3">
              <button onClick={() => { setMobileOpen(false); openAuthModal('login') }}
                className="block w-full text-center px-4 py-3 border border-[#EDE0CC] rounded-full text-[#1C1613] text-[11px] hover:bg-[#EDE0CC]/40 transition-colors"
                style={josefin}>
                {t('login')}
              </button>
              <button onClick={() => { setMobileOpen(false); openAuthModal('signup') }}
                className="block w-full text-center px-4 py-3 bg-[#C4582A] hover:bg-[#A8471F] text-white text-[11px] rounded-full transition-colors"
                style={josefin}>
                {t('register')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
