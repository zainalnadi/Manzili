import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  role: 'GUEST' | 'HOST' | 'PROPERTY_MANAGER' | 'ADMIN'
  fullNameAr?: string | null
  fullNameEn?: string | null
  avatarUrl?: string | null
  preferredLocale: string
}

interface AuthStore {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null }),
}))
