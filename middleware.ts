import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // Check if this is an admin route (but not the admin login page)
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      // Not authenticated, redirect to admin login
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Check if user has admin role
    const { data: userData } = await supabase
      .from('users')
      .select('roles')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!userData?.roles?.includes('admin')) {
      // Not an admin, redirect to main site
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    // Disable for now - using server-side auth in layouts
    // '/admin/:path*'
  ],
}
