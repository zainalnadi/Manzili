import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullNameAr: z.string().min(2),
  fullNameEn: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['GUEST', 'HOST']).default('GUEST'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = RegisterSchema.parse(body)

    // Create Supabase auth user
    const supabase = createAdminClient()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create DB user
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: data.email,
        fullNameAr: data.fullNameAr,
        fullNameEn: data.fullNameEn,
        phone: data.phone,
        role: data.role,
        preferredLocale: 'ar',
      },
    })

    return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role } })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Validation error' }, { status: 400 })
    }
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
