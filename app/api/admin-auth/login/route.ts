import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminToken, isAdminEmail } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

// Simple in-memory IP lockout (resets on server restart — acceptable for admin panel)
const failMap = new Map<string, { count: number; lastAt: number }>()

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const now = Date.now()
  const entry = failMap.get(ip)

  // Lockout: 5 failures within 15 minutes → 15-minute block
  if (entry && entry.count >= 5 && now - entry.lastAt < 15 * 60 * 1000) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { email = '', password = '' } = body

  const isAllowedEmail = isAdminEmail(email)
  const hashB64 = process.env.ADMIN_PASSWORD_HASH_B64 ?? ''
  const hash = hashB64 ? Buffer.from(hashB64, 'base64').toString('utf8') : ''

  const passwordOk = hash ? await bcrypt.compare(password, hash) : false

  if (!isAllowedEmail || !passwordOk) {
    const fail = failMap.get(ip) ?? { count: 0, lastAt: now }
    failMap.set(ip, { count: fail.count + 1, lastAt: now })

    // Audit failed attempt
    await prisma.auditLog.create({
      data: { adminEmail: email, action: 'LOGIN_FAILED', entity: 'auth', ip },
    }).catch(() => {})

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Clear lockout on success
  failMap.delete(ip)

  const token = await createAdminToken(email)

  // Audit success
  await prisma.auditLog.create({
    data: { adminEmail: email, action: 'LOGIN', entity: 'auth', ip },
  }).catch(() => {})

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60, // 8 hours
    path: '/',
  })
  return response
}
