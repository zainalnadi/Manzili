import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { jwtVerify } from 'jose'

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_SESSION_SECRET ?? 'fallback-dev-secret-change-in-prod'
)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Admin route protection ────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !pathname.startsWith('/api/admin-auth')) {
    const token = request.cookies.get('admin_session')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    try {
      await jwtVerify(token, ADMIN_SECRET)
    } catch {
      const res = NextResponse.redirect(new URL('/admin/login', request.url))
      res.cookies.delete('admin_session')
      return res
    }
    return NextResponse.next()
  }

  // ── Locale redirect ───────────────────────────────────────────────────────
  if (pathname === '/') {
    const locale = request.cookies.get('locale')?.value ?? 'ar'
    return NextResponse.redirect(new URL(`/${locale}`, request.url))
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // ── Supabase auth for app routes ──────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (pathname.includes('/(guest)') && !user) {
    const locale = pathname.startsWith('/en') ? 'en' : 'ar'
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }
  if (pathname.includes('/(host)') && !user) {
    const locale = pathname.startsWith('/en') ? 'en' : 'ar'
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }
  if (pathname.includes('/(admin)') && !user) {
    const locale = pathname.startsWith('/en') ? 'en' : 'ar'
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
