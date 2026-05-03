import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const DEFAULTS: Record<string, string> = {
  platformFeePercent: '10',
  maintenanceMode: 'false',
  announcementBanner: '',
  maxFeaturedListings: '12',
  minListingPrice: '200',
  defaultCancellationPolicy: 'MODERATE',
  autoApproveTrustedHosts: 'false',
  notifyAdminNewHost: 'true',
  notifyAdminNewListing: 'true',
}

async function getSettings() {
  const rows = await prisma.systemSetting.findMany()
  const map: Record<string, string> = { ...DEFAULTS }
  for (const row of rows) map[row.key] = row.value
  return map
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getSettings())
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updates = Object.entries(body)

  await Promise.all(updates.map(([key, value]) =>
    prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  ))

  await prisma.auditLog.create({
    data: { adminEmail: session.email, action: 'UPDATE_SETTINGS', entity: 'settings', detail: JSON.stringify(body) },
  })

  return NextResponse.json({ ok: true })
}
