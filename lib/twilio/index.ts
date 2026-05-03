// Twilio SMS + WhatsApp integration

export async function sendSMS(to: string, message: string): Promise<void> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[MOCK SMS] To: ${to} | Message: ${message}`)
    return
  }

  const twilio = require('twilio')
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  })
}

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[MOCK WHATSAPP] To: ${to} | Message: ${message}`)
    return
  }

  const twilio = require('twilio')
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

  await client.messages.create({
    body: message,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${to}`,
  })
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTP(phone: string, otp: string, locale: string = 'ar'): Promise<void> {
  const message = locale === 'ar'
    ? `رمز التحقق الخاص بك هو: ${otp} - منزلي`
    : `Your Manzili verification code is: ${otp}`

  await sendSMS(phone, message)
}
