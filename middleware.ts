import { updateSession } from './src/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

import { type NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
