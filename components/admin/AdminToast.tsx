'use client'
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: string; message: string; type: ToastType; action?: { label: string; onClick: () => void } }
interface ToastCtx { toast: (msg: string, type?: ToastType, action?: Toast['action']) => void }

const Ctx = createContext<ToastCtx>({ toast: () => {} })

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info', action?: Toast['action']) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev.slice(-2), { id, message, type, action }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), action ? 8000 : 4000)
  }, [])

  const borderColor = (type: ToastType) => type === 'success' ? '#8FA68B' : type === 'error' ? '#C4582A' : '#C9973A'

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: '#2A2018', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `3px solid ${borderColor(t.type)}`, borderRadius: 12, padding: '14px 18px', minWidth: 280, maxWidth: 380, fontFamily: 'Outfit, sans-serif', animation: 'slideInToast 220ms ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{t.message}</span>
              {t.action && (
                <button onClick={t.action.onClick} style={{ background: 'none', border: 'none', color: borderColor(t.type), fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap', padding: 0 }}>
                  {t.action.label}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInToast { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </Ctx.Provider>
  )
}

export function useAdminToast() { return useContext(Ctx) }
