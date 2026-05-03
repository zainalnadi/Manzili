import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const entity = searchParams.get('entity') ?? undefined
  const csv = searchParams.get('csv') === 'true'
  const limit = csv ? 1000 : 30

  const where = entity ? { entity } : {}

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: csv ? 0 : (page - 1) * limit,
    take: limit,
  })

  if (csv) {
    const header = 'id,adminEmail,action,entity,entityId,detail,ip,createdAt\n'
    const rows = logs.map((l) =>
      [l.id, l.adminEmail, l.action, l.entity, l.entityId ?? '', (l.detail ?? '').replace(/,/g, ';'), l.ip ?? '', l.createdAt.toISOString()].join(',')
    )
    return new NextResponse(header + rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="audit-log.csv"',
      },
    })
  }

  const total = await prisma.auditLog.count({ where })
  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
}
