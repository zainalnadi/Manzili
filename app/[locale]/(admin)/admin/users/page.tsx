import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils/format'
import Link from 'next/link'
import { Search, ShieldAlert, ShieldOff, Ban } from 'lucide-react'

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { locale } = await params
  const { q } = await searchParams
  const isRTL = locale === 'ar'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (dbUser?.role !== 'ADMIN') redirect(`/${locale}`)

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { fullNameAr: { contains: q, mode: 'insensitive' } },
            { fullNameEn: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const roleConfig: Record<string, { labelAr: string; labelEn: string; bg: string; text: string }> = {
    GUEST:            { labelAr: 'ضيف',         labelEn: 'Guest',            bg: '#F3F2EF', text: '#7A6A5E' },
    HOST:             { labelAr: 'مضيف',         labelEn: 'Host',             bg: '#E8F2F8', text: '#C4582A' },
    PROPERTY_MANAGER: { labelAr: 'مدير عقار',   labelEn: 'Property Manager', bg: '#EEF6F5', text: '#8FA68B' },
    ADMIN:            { labelAr: 'مدير',         labelEn: 'Admin',            bg: '#FDECEA', text: '#C4582A' },
  }

  const statusConfig: Record<string, { labelAr: string; labelEn: string; bg: string; text: string }> = {
    ACTIVE:    { labelAr: 'نشط',    labelEn: 'Active',    bg: '#E6F4F1', text: '#8FA68B' },
    SUSPENDED: { labelAr: 'موقوف', labelEn: 'Suspended', bg: '#FEF3E8', text: '#C9973A' },
    BANNED:    { labelAr: 'محظور', labelEn: 'Banned',    bg: '#FDECEA', text: '#C4582A' },
  }

  const headingStyle = isRTL
    ? { fontFamily: "'Tajawal', sans-serif", fontWeight: 200 }
    : { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.14em', textTransform: 'uppercase' as const }

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl text-[#1C1613]" style={headingStyle}>
            {locale === 'ar' ? 'إدارة المستخدمين' : 'User Management'}
          </h1>
          <p className="text-[#7A6A5E] text-sm mt-0.5">
            {locale === 'ar'
              ? `${users.length} نتيجة`
              : `${users.length} result${users.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Search */}
      <form method="GET" className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-[#7A6A5E] pointer-events-none" />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder={locale === 'ar' ? 'بحث بالإيميل أو الاسم...' : 'Search by email or name...'}
            className="w-full ps-9 pe-4 py-2.5 bg-white border border-[#EDE0CC] rounded-xl text-sm text-[#1C1613] placeholder:text-[#7A6A5E] focus:outline-none focus:border-[#C4582A]"
            dir="ltr"
          />
        </div>
      </form>

      {/* Table */}
      <div className="bg-white border border-[#EDE0CC] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <thead className="bg-[#F7F0E6] border-b border-[#EDE0CC]">
              <tr>
                <th className="text-start px-4 py-3 font-semibold text-[#7A6A5E] whitespace-nowrap">
                  {locale === 'ar' ? 'المستخدم' : 'User'}
                </th>
                <th className="text-start px-4 py-3 font-semibold text-[#7A6A5E] whitespace-nowrap">
                  {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </th>
                <th className="text-start px-4 py-3 font-semibold text-[#7A6A5E] whitespace-nowrap">
                  {locale === 'ar' ? 'الدور' : 'Role'}
                </th>
                <th className="text-start px-4 py-3 font-semibold text-[#7A6A5E] whitespace-nowrap">
                  {locale === 'ar' ? 'الحالة' : 'Status'}
                </th>
                <th className="text-start px-4 py-3 font-semibold text-[#7A6A5E] whitespace-nowrap">
                  {locale === 'ar' ? 'تاريخ الإنشاء' : 'Joined'}
                </th>
                <th className="text-start px-4 py-3 font-semibold text-[#7A6A5E] whitespace-nowrap">
                  {locale === 'ar' ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE0CC]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#7A6A5E]">
                    {locale === 'ar' ? 'لا توجد نتائج' : 'No users found'}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const displayName =
                    (locale === 'ar' ? u.fullNameAr : u.fullNameEn) ??
                    u.email.split('@')[0]
                  const roleCfg = roleConfig[u.role] ?? roleConfig.GUEST
                  const statusCfg = statusConfig[u.status] ?? statusConfig.ACTIVE

                  return (
                    <tr key={u.id} className="hover:bg-[#F7F0E6] transition-colors">
                      {/* Name + avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#C4582A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {displayName?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <span className="font-medium text-[#1C1613] whitespace-nowrap">
                            {displayName}
                          </span>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-4 py-3 text-[#7A6A5E] font-mono text-xs" dir="ltr">
                        {u.email}
                      </td>
                      {/* Role badge */}
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ backgroundColor: roleCfg.bg, color: roleCfg.text }}
                        >
                          {locale === 'ar' ? roleCfg.labelAr : roleCfg.labelEn}
                        </span>
                      </td>
                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ backgroundColor: statusCfg.bg, color: statusCfg.text }}
                        >
                          {locale === 'ar' ? statusCfg.labelAr : statusCfg.labelEn}
                        </span>
                      </td>
                      {/* Created at */}
                      <td className="px-4 py-3 text-[#7A6A5E] text-xs whitespace-nowrap">
                        {formatDate(u.createdAt, locale)}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {u.status === 'ACTIVE' && (
                            <form action={`/api/admin/users/${u.id}`} method="POST">
                              <input type="hidden" name="_method" value="PATCH" />
                              <input type="hidden" name="status" value="SUSPENDED" />
                              <button
                                type="submit"
                                className="flex items-center gap-1 text-xs font-medium bg-[#FEF3E8] hover:bg-[#fce8cc] text-[#C9973A] px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                title={locale === 'ar' ? 'إيقاف' : 'Suspend'}
                              >
                                <ShieldOff className="w-3 h-3" />
                                {locale === 'ar' ? 'إيقاف' : 'Suspend'}
                              </button>
                            </form>
                          )}
                          {u.status === 'SUSPENDED' && (
                            <form action={`/api/admin/users/${u.id}`} method="POST">
                              <input type="hidden" name="_method" value="PATCH" />
                              <input type="hidden" name="status" value="ACTIVE" />
                              <button
                                type="submit"
                                className="flex items-center gap-1 text-xs font-medium bg-[#E6F4F1] hover:bg-[#d0ece8] text-[#8FA68B] px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                title={locale === 'ar' ? 'إلغاء الإيقاف' : 'Unsuspend'}
                              >
                                <ShieldAlert className="w-3 h-3" />
                                {locale === 'ar' ? 'إلغاء الإيقاف' : 'Unsuspend'}
                              </button>
                            </form>
                          )}
                          {u.status !== 'BANNED' && (
                            <form action={`/api/admin/users/${u.id}`} method="POST">
                              <input type="hidden" name="_method" value="PATCH" />
                              <input type="hidden" name="status" value="BANNED" />
                              <button
                                type="submit"
                                className="flex items-center gap-1 text-xs font-medium bg-[#FDECEA] hover:bg-[#fad5d1] text-[#C4582A] px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                title={locale === 'ar' ? 'حظر' : 'Ban'}
                              >
                                <Ban className="w-3 h-3" />
                                {locale === 'ar' ? 'حظر' : 'Ban'}
                              </button>
                            </form>
                          )}
                          {u.status === 'BANNED' && (
                            <form action={`/api/admin/users/${u.id}`} method="POST">
                              <input type="hidden" name="_method" value="PATCH" />
                              <input type="hidden" name="status" value="ACTIVE" />
                              <button
                                type="submit"
                                className="flex items-center gap-1 text-xs font-medium bg-[#E6F4F1] hover:bg-[#d0ece8] text-[#8FA68B] px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                              >
                                <ShieldAlert className="w-3 h-3" />
                                {locale === 'ar' ? 'إلغاء الحظر' : 'Unban'}
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer count */}
      {users.length === 50 && (
        <p className="text-center text-xs text-[#7A6A5E] mt-4">
          {locale === 'ar'
            ? 'يتم عرض أحدث 50 مستخدم — استخدم البحث للعثور على مستخدم معين'
            : 'Showing latest 50 users — use search to find a specific user'}
        </p>
      )}
    </div>
  )
}
