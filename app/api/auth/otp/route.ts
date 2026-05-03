import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SendOtpSchema = z.object({
  phone: z.string().min(10),
  code: z.string().optional(),
})

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code } = SendOtpSchema.parse(body)

    // ── Verify OTP path ────────────────────────────────────────────────────
    if (code !== undefined) {
      const user = await prisma.user.findUnique({
        where: { phone },
        select: { id: true, otpCode: true, otpExpiresAt: true },
      })

      if (!user) return NextResponse.json({ valid: false, error: 'User not found' }, { status: 404 })

      const now = new Date()

      if (!user.otpCode || !user.otpExpiresAt) {
        return NextResponse.json({ valid: false, error: 'No OTP requested' }, { status: 400 })
      }

      if (user.otpExpiresAt < now) {
        return NextResponse.json({ valid: false, error: 'OTP has expired' }, { status: 400 })
      }

      if (user.otpCode !== code) {
        return NextResponse.json({ valid: false }, { status: 200 })
      }

      // OTP matched — clear it so it cannot be reused
      await prisma.user.update({
        where: { phone },
        data: { otpCode: null, otpExpiresAt: null },
      })

      return NextResponse.json({ valid: true })
    }

    // ── Send OTP path ──────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const newCode = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.user.update({
      where: { phone },
      data: { otpCode: newCode, otpExpiresAt: expiresAt },
    })

    // TODO: Replace with real Twilio SMS when configured
    // await twilioClient.messages.create({ to: phone, from: process.env.TWILIO_NUMBER, body: `Your Manzili OTP is: ${newCode}` })

    return NextResponse.json({ message: 'OTP sent', code: newCode /* remove in production */ })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to process OTP request' }, { status: 500 })
  }
}
