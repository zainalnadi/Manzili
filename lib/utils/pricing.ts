export interface BookingPriceParams {
  pricePerNight: number
  nights: number
  weeklyDiscount?: number
  monthlyDiscount?: number
  cleaningFee?: number
  guestServiceFeeRate?: number
  hostServiceFeeRate?: number
}

export interface BookingPriceResult {
  nightlySubtotal: number
  discountAmount: number
  cleaningFee: number
  guestServiceFee: number
  totalGuestPays: number
  hostServiceFee: number
  totalHostReceives: number
  appliedDiscount: 'weekly' | 'monthly' | null
}

export function calculateBookingPrice(params: BookingPriceParams): BookingPriceResult {
  const {
    pricePerNight,
    nights,
    weeklyDiscount = 0,
    monthlyDiscount = 0,
    cleaningFee = 0,
    guestServiceFeeRate = 0.09,
    hostServiceFeeRate = 0.03,
  } = params

  const nightlySubtotal = pricePerNight * nights

  let discountRate = 0
  let appliedDiscount: 'weekly' | 'monthly' | null = null

  if (nights >= 28 && monthlyDiscount > 0) {
    discountRate = monthlyDiscount
    appliedDiscount = 'monthly'
  } else if (nights >= 7 && weeklyDiscount > 0) {
    discountRate = weeklyDiscount
    appliedDiscount = 'weekly'
  }

  const discountAmount = nightlySubtotal * discountRate
  const discountedNightly = nightlySubtotal - discountAmount
  const guestServiceFee = discountedNightly * guestServiceFeeRate
  const totalGuestPays = discountedNightly + cleaningFee + guestServiceFee
  const hostServiceFee = discountedNightly * hostServiceFeeRate
  const totalHostReceives = discountedNightly - hostServiceFee

  return {
    nightlySubtotal,
    discountAmount,
    cleaningFee,
    guestServiceFee: Math.round(guestServiceFee * 100) / 100,
    totalGuestPays: Math.round(totalGuestPays * 100) / 100,
    hostServiceFee: Math.round(hostServiceFee * 100) / 100,
    totalHostReceives: Math.round(totalHostReceives * 100) / 100,
    appliedDiscount,
  }
}

export function calculateRefund(params: {
  totalGuestPays: number
  cleaningFee: number
  guestServiceFee: number
  checkIn: Date
  cancelledAt: Date
}): number {
  const { totalGuestPays, cleaningFee, guestServiceFee, checkIn, cancelledAt } = params
  const daysUntilCheckIn = Math.floor(
    (checkIn.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  const refundableBase = totalGuestPays - guestServiceFee // service fee never refunded

  if (daysUntilCheckIn >= 7) {
    // 100% refund of base + cleaning fee
    return refundableBase
  } else if (daysUntilCheckIn >= 3) {
    // 50% refund, cleaning fee refunded
    const nightlyOnly = refundableBase - cleaningFee
    return nightlyOnly * 0.5 + cleaningFee
  } else {
    // 0% refund of nightly, cleaning fee refunded
    return cleaningFee
  }
}
