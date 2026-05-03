// Paymob payment gateway integration
// Uses mock if PAYMOB_API_KEY is not set

export interface PaymobOrderParams {
  amountCents: number
  currency?: string
  items?: Array<{
    name: string
    amount: number
    quantity: number
  }>
}

export interface PaymobPaymentKeyParams {
  amountCents: number
  orderId: string
  billingData: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  method: 'card' | 'fawry' | 'vodafone_cash' | 'meeza'
}

export interface PaymobResult {
  paymentKey?: string
  iframeUrl?: string
  fawryCode?: string
  orderId: string
  mock?: boolean
}

const PAYMOB_BASE = 'https://accept.paymob.com/api'

async function getAuthToken(): Promise<string> {
  const res = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
  })
  const data = await res.json()
  return data.token
}

async function createOrder(token: string, params: PaymobOrderParams): Promise<string> {
  const res = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: token,
      delivery_needed: false,
      amount_cents: params.amountCents,
      currency: params.currency ?? 'EGP',
      items: params.items ?? [],
    }),
  })
  const data = await res.json()
  return String(data.id)
}

async function getPaymentKey(token: string, params: PaymobPaymentKeyParams): Promise<string> {
  const integrationIdMap = {
    card: process.env.PAYMOB_CARD_INTEGRATION_ID!,
    fawry: process.env.PAYMOB_FAWRY_INTEGRATION_ID!,
    vodafone_cash: process.env.PAYMOB_WALLET_INTEGRATION_ID!,
    meeza: process.env.PAYMOB_CARD_INTEGRATION_ID!, // Meeza uses card integration
  }

  const res = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: token,
      amount_cents: params.amountCents,
      expiration: 900,
      order_id: params.orderId,
      billing_data: {
        first_name: params.billingData.firstName,
        last_name: params.billingData.lastName,
        email: params.billingData.email,
        phone_number: params.billingData.phone,
        apartment: 'NA',
        floor: 'NA',
        street: 'NA',
        building: 'NA',
        shipping_method: 'NA',
        postal_code: 'NA',
        city: 'NA',
        country: 'EG',
        state: 'NA',
      },
      currency: 'EGP',
      integration_id: integrationIdMap[params.method],
      lock_order_when_paid: true,
    }),
  })
  const data = await res.json()
  return data.token
}

// Mock implementation when no API key
function createMockResult(amountCents: number, method: string): PaymobResult {
  const mockOrderId = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  return {
    orderId: mockOrderId,
    paymentKey: `mock_key_${mockOrderId}`,
    iframeUrl: method === 'card' ? `/api/mock/payment?orderId=${mockOrderId}&amount=${amountCents}` : undefined,
    fawryCode: method === 'fawry' ? `FAWRY-${Math.floor(Math.random() * 9000000) + 1000000}` : undefined,
    mock: true,
  }
}

export async function initiatePayment(
  orderParams: PaymobOrderParams,
  paymentKeyParams: Omit<PaymobPaymentKeyParams, 'orderId'>
): Promise<PaymobResult> {
  if (!process.env.PAYMOB_API_KEY) {
    return createMockResult(orderParams.amountCents, paymentKeyParams.method)
  }

  try {
    const token = await getAuthToken()
    const orderId = await createOrder(token, orderParams)
    const paymentKey = await getPaymentKey(token, { ...paymentKeyParams, orderId })

    const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID ?? '00000'

    return {
      orderId,
      paymentKey,
      iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`,
      mock: false,
    }
  } catch (error) {
    console.error('Paymob error:', error)
    throw new Error('Payment initiation failed')
  }
}

export function verifyWebhookHMAC(payload: Record<string, unknown>, hmac: string): boolean {
  if (!process.env.PAYMOB_HMAC_SECRET) return true // mock mode

  const crypto = require('crypto')
  const concatenated = [
    payload.amount_cents,
    payload.created_at,
    payload.currency,
    payload.error_occured,
    payload.has_parent_transaction,
    payload.id,
    payload.integration_id,
    payload.is_3d_secure,
    payload.is_auth,
    payload.is_capture,
    payload.is_refunded,
    payload.is_standalone_payment,
    payload.is_voided,
    payload.order,
    payload.owner,
    payload.pending,
    payload.source_data_pan,
    payload.source_data_sub_type,
    payload.source_data_type,
    payload.success,
  ].join('')

  const hash = crypto
    .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET)
    .update(concatenated)
    .digest('hex')

  return hash === hmac
}
