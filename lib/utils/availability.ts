import { addDays, isBefore, isAfter, isSameDay, startOfDay } from 'date-fns'

export function isDateAvailable(
  date: Date,
  blockedDates: Date[],
  minimumNights: number = 1
): boolean {
  const today = startOfDay(new Date())
  const d = startOfDay(date)

  if (isBefore(d, today)) return false

  return !blockedDates.some((blocked) => isSameDay(startOfDay(blocked), d))
}

export function getBlockedDatesInRange(
  checkIn: Date,
  checkOut: Date,
  blockedDates: Date[]
): Date[] {
  return blockedDates.filter((date) => {
    const d = startOfDay(date)
    return isAfter(d, startOfDay(checkIn)) && isBefore(d, startOfDay(checkOut))
  })
}

export function hasUnavailableDatesInRange(
  checkIn: Date,
  checkOut: Date,
  blockedDates: Date[]
): boolean {
  return getBlockedDatesInRange(checkIn, checkOut, blockedDates).length > 0
}
