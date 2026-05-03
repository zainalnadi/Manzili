import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json({ user: null })
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      role: true,
      fullNameAr: true,
      fullNameEn: true,
      avatarUrl: true,
      preferredLocale: true,
      nationalIdVerified: true,
    },
  })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { fullNameAr, fullNameEn, phone } = body

  const updated = await prisma.user.update({
    where: { id: authUser.id },
    data: {
      ...(fullNameAr !== undefined && { fullNameAr }),
      ...(fullNameEn !== undefined && { fullNameEn }),
      ...(phone !== undefined && { phone }),
    },
    select: { id: true, fullNameAr: true, fullNameEn: true, phone: true, email: true, avatarUrl: true, nationalIdVerified: true, role: true },
  })

  return NextResponse.json(updated)
}
