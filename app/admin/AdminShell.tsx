'use client'

import { ReactNode, useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminToastProvider } from '@/components/admin/AdminToast'

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV = [
  { href: '/admin',              label: 'Overview',     icon: GridIcon,     shortcut: 'O' },
  { href: '/admin/listings',     label: 'Listings',     icon: HomeIcon,     shortcut: 'L' },
  { href: '/admin/users',        label: 'Users',        icon: UsersIcon,    shortcut: 'U' },
  { href: '/admin/bookings',     label: 'Bookings',     icon: CalendarIcon, shortcut: 'B' },
  { href: '/admin/messages',     label: 'Messages',     icon: MessageIcon,  shortcut: 'M' },
  { href: '/admin/verification', label: 'Verification', icon: ShieldIcon,   shortcut: 'V' },
  { href: '/admin/reports',      label: 'Reports',      icon: FlagIcon,     shortcut: 'R' },
  { href: '/admin/financials',   label: 'Financials',   icon: ChartIcon,    shortcut: 'F' },
  { href: '/admin/settings',     label: 'Settings',     icon: GearIcon,     shortcut: 'S' },
  { href: '/admin/audit',        label: 'Audit Log',    icon: LogIcon,      shortcut: 'A' },
]

// ── Types ─────────────────────────────────────────────────────────────────────
interface SearchResultItem {
  id: string
  type: 'user' | 'listing' | 'booking'
  name?: string
  title?: string
  status?: string
  detail?: string
}

interface SearchResults {
  users: SearchResultItem[]
  listings: SearchResultItem[]
  bookings: SearchResultItem[]
}

// ── Main component ────────────────────────────────────────────────────────────
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // Admin info
  const [adminEmail, setAdminEmail] = useState('')

  // Realtime live status
  const [liveStatus, setLiveStatus] = useState<string>('CONNECTING')

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sign-out confirmation
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  // Keyboard shortcut state
  const [gPressed, setGPressed] = useState(false)
  const gTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch admin email ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin-auth/me')
      .then((r) => r.json())
      .then((d) => setAdminEmail(d.email ?? ''))
      .catch(() => {})
  }, [])

  // ── Supabase Realtime subscription ────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        () => {}
      )
      .subscribe((status) => {
        setLiveStatus(status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ── Global keyboard shortcuts (G + key navigation) ────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Still allow Escape to close search
        if (e.key === 'Escape') {
          setSearchOpen(false)
          setSelectedIndex(-1)
          searchInputRef.current?.blur()
        }
        return
      }

      if (e.key === 'Escape') {
        setGPressed(false)
        if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current)
        return
      }

      if (gPressed) {
        // Second key
        setGPressed(false)
        if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current)
        const key = e.key.toUpperCase()
        const nav = NAV.find((n) => n.shortcut === key)
        if (nav) {
          e.preventDefault()
          router.push(nav.href)
        }
        return
      }

      if (e.key.toUpperCase() === 'G' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setGPressed(true)
        gTimeoutRef.current = setTimeout(() => {
          setGPressed(false)
        }, 1000)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current)
    }
  }, [gPressed, router])

  // ── Search debounce ────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)

    if (searchQuery.length < 2) {
      setSearchResults(null)
      setSearchOpen(false)
      setSelectedIndex(-1)
      return
    }

    searchDebounceRef.current = setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`)
        .then((r) => r.json())
        .then((data: SearchResults) => {
          setSearchResults(data)
          setSearchOpen(true)
          setSelectedIndex(-1)
        })
        .catch(() => {
          setSearchResults(null)
        })
    }, 300)

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [searchQuery])

  // ── Click outside search dropdown ─────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false)
        setSelectedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Flatten search results for keyboard navigation ─────────────────────────
  const flatResults: SearchResultItem[] = searchResults
    ? [
        ...(searchResults.users ?? []),
        ...(searchResults.listings ?? []),
        ...(searchResults.bookings ?? []),
      ]
    : []

  // ── Handle search keyboard navigation ─────────────────────────────────────
  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!searchOpen) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && flatResults[selectedIndex]) {
        navigateToResult(flatResults[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setSearchOpen(false)
      setSelectedIndex(-1)
      searchInputRef.current?.blur()
    }
  }

  function navigateToResult(item: SearchResultItem) {
    setSearchOpen(false)
    setSearchQuery('')
    setSelectedIndex(-1)
    if (item.type === 'user') router.push(`/admin/users/${item.id}`)
    else if (item.type === 'listing') router.push(`/admin/listings/${item.id}`)
    else if (item.type === 'booking') router.push(`/admin/bookings/${item.id}`)
  }

  // ── Sign out ───────────────────────────────────────────────────────────────
  async function logout() {
    await fetch('/api/admin-auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  // ── Active nav check ───────────────────────────────────────────────────────
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  // ── Skip shell on login page ───────────────────────────────────────────────
  if (pathname === '/admin/login') return <>{children}</>

  // ── Live indicator config ──────────────────────────────────────────────────
  const isLive = liveStatus === 'SUBSCRIBED'
  const liveLabel = isLive ? 'LIVE' : 'RECONNECTING'
  const liveColor = isLive ? '#8FA68B' : '#C9973A'

  // ── Search result display helpers ──────────────────────────────────────────
  const totalResults = searchResults
    ? (searchResults.users?.length ?? 0) +
      (searchResults.listings?.length ?? 0) +
      (searchResults.bookings?.length ?? 0)
    : 0

  let flatIndex = -1

  return (
    <AdminToastProvider>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: '#120E0B',
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside
          className="admin-sidebar"
          style={{
            width: 240,
            background: '#1A1410',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 40,
          }}
        >
          {/* Brand */}
          <div
            style={{
              padding: '24px 20px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 100,
                fontSize: 16,
                letterSpacing: '0.2em',
                color: '#EDE0CC',
                textTransform: 'uppercase',
              }}
            >
              MANZILI
            </span>
            <p
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 100,
                fontSize: 9,
                letterSpacing: '0.22em',
                color: '#4A3D35',
                textTransform: 'uppercase',
                marginTop: 3,
                marginBottom: 0,
              }}
            >
              ADMIN PANEL
            </p>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
            {NAV.map(({ href, label, icon: Icon, shortcut }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 8,
                    marginBottom: 2,
                    color: active ? '#EDE0CC' : '#7A6A5E',
                    background: active ? 'rgba(196,88,42,0.12)' : 'transparent',
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    textDecoration: 'none',
                    transition: 'all 140ms ease',
                    position: 'relative',
                  }}
                >
                  <Icon size={15} color={active ? '#C4582A' : '#7A6A5E'} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {href === '/admin/listings' && <PendingBadge />}
                  {/* Keyboard shortcut hint */}
                  <span
                    style={{
                      fontSize: 9,
                      color: gPressed ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                      fontFamily: 'monospace',
                      letterSpacing: '0.04em',
                      transition: 'color 120ms ease',
                      flexShrink: 0,
                    }}
                  >
                    G {shortcut}
                  </span>
                </Link>
              )
            })}
          </nav>

          {/* Admin info + sign out */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: '#4A3D35',
                marginBottom: 6,
                marginTop: 0,
                letterSpacing: '0.04em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {adminEmail}
            </p>

            {showSignOutConfirm ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    color: '#7A6A5E',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  Sign out?
                </span>
                <button
                  onClick={logout}
                  style={{
                    fontSize: 12,
                    color: '#C4582A',
                    background: 'none',
                    border: 'none',
                    padding: '0 4px',
                    cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  style={{
                    fontSize: 12,
                    color: '#7A6A5E',
                    background: 'none',
                    border: 'none',
                    padding: '0 4px',
                    cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSignOutConfirm(true)}
                style={{
                  fontSize: 12,
                  color: '#7A6A5E',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                Sign out
              </button>
            )}
          </div>
        </aside>

        {/* ── Main area ───────────────────────────────────────────────────── */}
        <div
          style={{
            marginLeft: 240,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          {/* Topbar */}
          <header
            style={{
              height: 56,
              background: '#1A1410',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 24px',
              gap: 16,
              position: 'sticky',
              top: 0,
              zIndex: 30,
              flexShrink: 0,
            }}
          >
            {/* Search with dropdown */}
            <div
              ref={searchContainerRef}
              style={{ flex: 1, maxWidth: 440, position: 'relative' }}
            >
              <div style={{ position: 'relative' }}>
                <SearchIcon
                  size={14}
                  color="#4A3D35"
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search users, listings, bookings…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults && searchQuery.length >= 2) setSearchOpen(true)
                  }}
                  onKeyDown={handleSearchKeyDown}
                  style={{
                    width: '100%',
                    height: 36,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '0 12px 0 34px',
                    color: '#EDE0CC',
                    fontSize: 13,
                    fontFamily: 'Outfit, sans-serif',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 140ms ease',
                  }}
                />
              </div>

              {/* Search dropdown */}
              {searchOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: '100%',
                    background: '#1E1814',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    zIndex: 200,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    overflow: 'hidden',
                    maxHeight: 400,
                    overflowY: 'auto',
                  }}
                >
                  {totalResults === 0 ? (
                    <div
                      style={{
                        padding: '20px 14px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: 12,
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      No results for &lsquo;{searchQuery}&rsquo;
                    </div>
                  ) : (
                    <>
                      {/* Users group */}
                      {searchResults && searchResults.users?.length > 0 && (
                        <>
                          <div style={groupHeaderStyle}>
                            USERS ({searchResults.users.length})
                          </div>
                          {searchResults.users.map((item) => {
                            flatIndex++
                            const idx = flatIndex
                            return (
                              <SearchResultRow
                                key={item.id}
                                item={item}
                                isSelected={selectedIndex === idx}
                                onSelect={() => navigateToResult(item)}
                                onHover={() => setSelectedIndex(idx)}
                              />
                            )
                          })}
                        </>
                      )}

                      {/* Listings group */}
                      {searchResults && searchResults.listings?.length > 0 && (
                        <>
                          <div style={groupHeaderStyle}>
                            LISTINGS ({searchResults.listings.length})
                          </div>
                          {searchResults.listings.map((item) => {
                            flatIndex++
                            const idx = flatIndex
                            return (
                              <SearchResultRow
                                key={item.id}
                                item={item}
                                isSelected={selectedIndex === idx}
                                onSelect={() => navigateToResult(item)}
                                onHover={() => setSelectedIndex(idx)}
                              />
                            )
                          })}
                        </>
                      )}

                      {/* Bookings group */}
                      {searchResults && searchResults.bookings?.length > 0 && (
                        <>
                          <div style={groupHeaderStyle}>
                            BOOKINGS ({searchResults.bookings.length})
                          </div>
                          {searchResults.bookings.map((item) => {
                            flatIndex++
                            const idx = flatIndex
                            return (
                              <SearchResultRow
                                key={item.id}
                                item={item}
                                isSelected={selectedIndex === idx}
                                onSelect={() => navigateToResult(item)}
                                onHover={() => setSelectedIndex(idx)}
                              />
                            )
                          })}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* LIVE indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: liveColor,
                  flexShrink: 0,
                  animation: isLive ? 'livePulse 2s ease-in-out infinite' : undefined,
                }}
              />
              <span
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 100,
                  fontSize: 9,
                  letterSpacing: '0.18em',
                  color: liveColor,
                  textTransform: 'uppercase',
                }}
              >
                {liveLabel}
              </span>
            </div>

            {/* View site link */}
            <a
              href="/en"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: '#4A3D35', textDecoration: 'none' }}
            >
              View site
            </a>
          </header>

          {/* Page content */}
          <main
            style={{
              flex: 1,
              padding: 24,
              background: '#120E0B',
            }}
          >
            {children}
          </main>
        </div>

        {/* Global styles */}
        <style>{`
          @keyframes livePulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.35; }
          }
          @media (max-width: 768px) {
            .admin-sidebar { display: none !important; }
          }
        `}</style>
      </div>
    </AdminToastProvider>
  )
}

// ── Group header style ────────────────────────────────────────────────────────
const groupHeaderStyle: React.CSSProperties = {
  fontFamily: "'Josefin Sans', sans-serif",
  fontWeight: 100,
  fontSize: 9,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.3)',
  padding: '8px 14px 4px',
}

// ── Search result row ─────────────────────────────────────────────────────────
function SearchResultRow({
  item,
  isSelected,
  onSelect,
  onHover,
}: {
  item: SearchResultItem
  isSelected: boolean
  onSelect: () => void
  onHover: () => void
}) {
  const label =
    item.type === 'booking'
      ? `MNZ-${item.id.slice(0, 8).toUpperCase()}`
      : item.name ?? item.title ?? item.id

  const detail = item.detail ?? ''

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onHover}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        cursor: 'pointer',
        background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 80ms ease',
      }}
    >
      <span
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 300,
          fontSize: 13,
          color: 'rgba(255,255,255,0.8)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
        {item.status && (
          <StatusBadge status={item.status} />
        )}
        {detail && (
          <span
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 300,
              fontSize: 11,
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            {detail}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    ACTIVE: '#8FA68B',
    APPROVED: '#8FA68B',
    CONFIRMED: '#8FA68B',
    PENDING: '#C9973A',
    PENDING_REVIEW: '#C9973A',
    SUSPENDED: '#C4582A',
    REJECTED: '#C4582A',
    CANCELLED: '#7A6A5E',
    COMPLETED: '#6A8EAE',
  }
  const color = colorMap[status?.toUpperCase()] ?? '#7A6A5E'
  return (
    <span
      style={{
        fontSize: 9,
        fontFamily: "'Josefin Sans', sans-serif",
        fontWeight: 100,
        letterSpacing: '0.12em',
        color,
        textTransform: 'uppercase',
        border: `1px solid ${color}`,
        borderRadius: 4,
        padding: '1px 5px',
        opacity: 0.85,
      }}
    >
      {status}
    </span>
  )
}

// ── Pending badge ─────────────────────────────────────────────────────────────
function PendingBadge() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    fetch('/api/admin/pending-counts')
      .then((r) => r.json())
      .then((d) => setCount(d.listings ?? d.count ?? 0))
      .catch(() => {})
  }, [])
  if (!count) return null
  return (
    <span
      style={{
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        background: '#C4582A',
        color: '#fff',
        fontSize: 10,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingInline: 4,
        flexShrink: 0,
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────
function Svg({
  size,
  color,
  style,
  children,
}: {
  size: number
  color: string
  style?: React.CSSProperties
  children: ReactNode
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {children}
    </svg>
  )
}

function GridIcon(p: { size: number; color: string }) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Svg>
  )
}
function HomeIcon(p: { size: number; color: string }) {
  return (
    <Svg {...p}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </Svg>
  )
}
function UsersIcon(p: { size: number; color: string }) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
    </Svg>
  )
}
function CalendarIcon(p: { size: number; color: string }) {
  return (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  )
}
function MessageIcon(p: { size: number; color: string }) {
  return (
    <Svg {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  )
}
function ShieldIcon(p: { size: number; color: string }) {
  return (
    <Svg {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  )
}
function FlagIcon(p: { size: number; color: string }) {
  return (
    <Svg {...p}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </Svg>
  )
}
function ChartIcon(p: { size: number; color: string }) {
  return (
    <Svg {...p}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </Svg>
  )
}
function GearIcon(p: { size: number; color: string }) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </Svg>
  )
}
function LogIcon(p: { size: number; color: string }) {
  return (
    <Svg {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </Svg>
  )
}
function SearchIcon(p: { size: number; color: string; style?: React.CSSProperties }) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  )
}
