'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { X, Eye, EyeOff } from 'lucide-react'

// ─── Context ───────────────────────────────────────────────────────────────────

type AuthModalMode = 'login' | 'signup'

interface AuthModalContextValue {
  openAuthModal: (mode?: AuthModalMode, onSuccess?: () => void) => void
  closeAuthModal: () => void
}

const AuthModalContext = createContext<AuthModalContextValue>({
  openAuthModal: () => {},
  closeAuthModal: () => {},
})

export function useAuthModal() {
  return useContext(AuthModalContext)
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AuthModalMode>('login')
  const [onSuccessCb, setOnSuccessCb] = useState<(() => void) | null>(null)

  const openAuthModal = useCallback((m: AuthModalMode = 'login', onSuccess?: () => void) => {
    setMode(m)
    setOnSuccessCb(onSuccess ? () => onSuccess : null)
    setIsOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsOpen(false)
    setOnSuccessCb(null)
  }, [])

  const handleSuccess = useCallback(() => {
    setIsOpen(false)
    const cb = onSuccessCb
    setOnSuccessCb(null)
    cb?.()
  }, [onSuccessCb])

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      {isOpen && (
        <AuthModalDialog
          mode={mode}
          onClose={closeAuthModal}
          onSuccess={handleSuccess}
          onSwitchMode={setMode}
        />
      )}
    </AuthModalContext.Provider>
  )
}

// ─── Modal Dialog ─────────────────────────────────────────────────────────────

interface DialogProps {
  mode: AuthModalMode
  onClose: () => void
  onSuccess: () => void
  onSwitchMode: (mode: AuthModalMode) => void
}

function AuthModalDialog({ mode, onClose, onSuccess, onSwitchMode }: DialogProps) {
  const { setUser } = useAuthStore()
  const backdropRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

  const refreshUser = async () => {
    const data = await fetch('/api/auth/me').then((r) => r.json())
    if (data?.id) setUser(data)
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(28,22,19,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full bg-white"
        style={{
          maxWidth: 440,
          borderRadius: 20,
          boxShadow: '0 24px 80px rgba(28,22,19,0.2)',
          animation: 'modal-in 200ms cubic-bezier(0.23,1,0.32,1) both',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 w-8 h-8 flex items-center justify-center rounded-full text-[#7A6A5E] hover:text-[#1C1613] hover:bg-[#F7F0E6] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tabs */}
        <div className="px-7 pt-7 pb-0">
          <div className="flex gap-0 border-b border-[#EDE0CC]">
            {(['login', 'signup'] as AuthModalMode[]).map((tab) => (
              <button
                key={tab}
                onClick={() => onSwitchMode(tab)}
                className="relative pb-3 text-sm transition-colors"
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 100,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginRight: tab === 'login' ? '28px' : 0,
                  color: mode === tab ? '#1C1613' : '#9A8878',
                }}
              >
                {tab === 'login' ? 'Log In' : 'Sign Up'}
                {mode === tab && (
                  <span
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-[#C4582A]"
                    style={{ borderRadius: 999 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="px-7 pt-6 pb-7">
          {mode === 'login' ? (
            <LoginForm onSuccess={async () => { await refreshUser(); onSuccess() }} />
          ) : (
            <SignupForm onSuccess={async () => { await refreshUser(); onSuccess() }} />
          )}
          <p className="text-center text-xs text-[#9A8878] mt-5" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {mode === 'login' ? (
              <>Don&apos;t have an account?{' '}
                <button onClick={() => onSwitchMode('signup')} className="text-[#C4582A] hover:underline">Sign up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => onSwitchMode('login')} className="text-[#C4582A] hover:underline">Log in</button>
              </>
            )}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Login Form ────────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields'); return }
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) throw authErr
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg.includes('Invalid login') ? 'Invalid email or password' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <AuthField
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoFocus
      />
      <AuthField
        label="Password"
        type={showPw ? 'text' : 'password'}
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        suffix={
          <button type="button" onClick={() => setShowPw(!showPw)} className="text-[#9A8878] hover:text-[#1C1613] transition-colors">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />
      {error && (
        <p className="text-xs text-[#C4582A] bg-[#C4582A]/8 px-3 py-2 rounded-lg">{error}</p>
      )}
      <SubmitButton loading={loading} label="Log In" />
    </form>
  )
}

// ─── Signup Form ───────────────────────────────────────────────────────────────

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !password) { setError('Please fill in all fields'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (authErr) throw authErr
      // If email confirmation is disabled, user is immediately signed in
      if (data.session) {
        onSuccess()
      } else {
        setSuccess(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed'
      setError(msg.includes('already registered') ? 'An account with this email already exists' : msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-4 space-y-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="w-12 h-12 rounded-full bg-[#8FA68B]/15 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8FA68B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <p className="text-sm text-[#1C1613] font-medium">Check your email</p>
        <p className="text-xs text-[#7A6A5E]">We&apos;ve sent a confirmation link to <strong>{email}</strong></p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <AuthField
        label="Full Name"
        type="text"
        value={fullName}
        onChange={setFullName}
        placeholder="Your name"
        autoFocus
      />
      <AuthField
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
      />
      <AuthField
        label="Password"
        type={showPw ? 'text' : 'password'}
        value={password}
        onChange={setPassword}
        placeholder="Min. 6 characters"
        suffix={
          <button type="button" onClick={() => setShowPw(!showPw)} className="text-[#9A8878] hover:text-[#1C1613] transition-colors">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />
      {error && (
        <p className="text-xs text-[#C4582A] bg-[#C4582A]/8 px-3 py-2 rounded-lg">{error}</p>
      )}
      <SubmitButton loading={loading} label="Create Account" />
    </form>
  )
}

// ─── Shared Field ──────────────────────────────────────────────────────────────

function AuthField({
  label, type, value, onChange, placeholder, suffix, autoFocus,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  suffix?: React.ReactNode
  autoFocus?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label className="block text-[10px] font-bold text-[#7A6A5E] uppercase tracking-widest mb-1.5"
        style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
        {label}
      </label>
      <div
        className="flex items-center gap-2 px-3 rounded-xl transition-all"
        style={{
          height: 48,
          border: focused ? '1.5px solid #C4582A' : '1.5px solid rgba(122,106,94,0.25)',
          background: focused ? '#FFF' : '#FDFAF7',
          boxShadow: focused ? '0 0 0 3px rgba(196,88,42,0.10)' : 'none',
          transition: 'border 150ms ease, box-shadow 150ms ease, background 150ms ease',
        }}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm text-[#1C1613] placeholder:text-[#C0B8B0]"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        />
        {suffix}
      </div>
    </div>
  )
}

// ─── Submit Button ─────────────────────────────────────────────────────────────

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full text-white transition-all active:scale-[0.98]"
      style={{
        height: 52,
        borderRadius: 999,
        background: loading ? 'rgba(196,88,42,0.45)' : '#C4582A',
        fontFamily: "'Josefin Sans', sans-serif",
        fontWeight: 100,
        fontSize: 13,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        boxShadow: !loading ? '0 4px 16px rgba(196,88,42,0.25)' : 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 150ms ease, box-shadow 150ms ease, transform 100ms ease',
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" strokeDasharray="60" strokeDashoffset="20" />
          </svg>
          Loading...
        </span>
      ) : label}
    </button>
  )
}
