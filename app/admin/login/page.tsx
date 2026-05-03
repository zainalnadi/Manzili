'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Login failed')
        return
      }
      router.push('/admin')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0F0C0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          padding: '0 24px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 100,
              fontSize: 22,
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
              fontSize: 10,
              letterSpacing: '0.22em',
              color: '#7A6A5E',
              textTransform: 'uppercase',
              marginTop: 6,
            }}
          >
            ADMIN PANEL
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#1A1512',
            border: '1px solid rgba(237,224,204,0.08)',
            borderRadius: 16,
            padding: 32,
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: '#7A6A5E',
                  marginBottom: 6,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  height: 44,
                  background: 'rgba(237,224,204,0.05)',
                  border: '1px solid rgba(237,224,204,0.12)',
                  borderRadius: 8,
                  padding: '0 14px',
                  color: '#EDE0CC',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'Outfit, sans-serif',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(196,88,42,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(237,224,204,0.12)')}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: '#7A6A5E',
                  marginBottom: 6,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  height: 44,
                  background: 'rgba(237,224,204,0.05)',
                  border: '1px solid rgba(237,224,204,0.12)',
                  borderRadius: 8,
                  padding: '0 14px',
                  color: '#EDE0CC',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'Outfit, sans-serif',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(196,88,42,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(237,224,204,0.12)')}
              />
            </div>

            {error && (
              <p
                style={{
                  color: '#C4582A',
                  fontSize: 13,
                  marginBottom: 16,
                  padding: '10px 12px',
                  background: 'rgba(196,88,42,0.08)',
                  borderRadius: 8,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 46,
                background: loading ? '#9A8878' : '#C4582A',
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                fontSize: 13,
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 100,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 200ms ease',
              }}
            >
              {loading ? 'Verifying…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: 'center',
            color: '#4A3D35',
            fontSize: 11,
            marginTop: 24,
            letterSpacing: '0.06em',
          }}
        >
          Restricted access. Authorized personnel only.
        </p>
      </div>
    </div>
  )
}
