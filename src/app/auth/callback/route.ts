import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Validate redirect is a safe relative path
      let redirectTo = next
      if (!redirectTo.startsWith('/') || redirectTo.startsWith('//') || redirectTo.includes('://')) {
        redirectTo = '/'
      }
      // For email confirmation (default next=/), redirect to home with confirmed flag
      if (redirectTo === '/') {
        return NextResponse.redirect(`${origin}/?confirmed=true`)
      }
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`)
}
