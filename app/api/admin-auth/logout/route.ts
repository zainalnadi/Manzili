import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getAdminSession()
  if (session) {
    await prisma.auditLog.create({
      data: { adminEmail: session.email, action: 'LOGOUT', entity: 'auth' },
    }).catch(() => {})
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.delete('admin_session')
  return response
}
