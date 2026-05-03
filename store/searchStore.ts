import { create } from 'zustand'

interface SearchState {
  where: string
  checkIn: Date | null
  checkOut: Date | null
  guests: number
  setWhere: (where: string) => void
  setCheckIn: (date: Date | null) => void
  setCheckOut: (date: Date | null) => void
  setGuests: (count: number) => void
  reset: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  where: '',
  checkIn: null,
  checkOut: null,
  guests: 2,
  setWhere: (where) => set({ where }),
  setCheckIn: (checkIn) => set({ checkIn }),
  setCheckOut: (checkOut) => set({ checkOut }),
  setGuests: (guests) => set({ guests }),
  reset: () => set({ where: '', checkIn: null, checkOut: null, guests: 2 }),
}))
