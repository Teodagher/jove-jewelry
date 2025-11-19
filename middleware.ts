import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'

export type Market = 'lb' | 'au' | 'intl'

// Extend NextRequest to include Vercel's geo property
interface NextRequestWithGeo extends NextRequest {
  geo?: {
    country?: string
  }
}

const DOMAIN_MARKET_MAP: Record<string, Market> = {
  'maisonjove.com': 'lb',
  'maisonjove.com.au': 'au',
}

const MARKET_DOMAIN_MAP: Record<Market, string> = {
  lb: 'maisonjove.com',
  intl: 'maisonjove.com.au',
  au: 'maisonjove.com.au',
}

function getMarketFromDomain(hostname: string): Market {
  // Remove www. prefix if present
  const cleanHostname = hostname.replace(/^www\./, '')
  // Default to 'lb' for localhost and unknown domains
  return DOMAIN_MARKET_MAP[cleanHostname] || 'lb'
}

function getTargetDomainForGeo(country?: string): string {
  // Lebanon users stay on maisonjove.com
  if (country === 'LB') return 'maisonjove.com'

  // All other countries (including undefined/unknown) go to maisonjove.com.au
  // This includes when geo-location fails or returns undefined
  return 'maisonjove.com.au'
}

function getMarketForPricing(country?: string): Market {
  // Market determines pricing currency AND payment methods
  // 'lb' = USD pricing + Cash on Delivery + Stripe (Lebanon only)
  // 'intl' = USD pricing + Stripe only (International)
  // 'au' = AUD pricing + Stripe only (Australia only)

  if (country === 'AU') return 'au' // Australia gets AUD pricing + Stripe only
  if (country === 'LB') return 'lb' // Lebanon gets USD pricing + Cash on Delivery + Stripe

  return 'intl' // Everyone else gets USD pricing + Stripe only
}

export async function middleware(request: NextRequest) {
  // First, handle Supabase session
  let response = await updateSession(request)

  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Skip market logic for admin routes, API routes, and static files
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return response
  }

  const country = (request as NextRequestWithGeo).geo?.country
  const currentDomain = hostname.replace(/^www\./, '')
  const targetDomain = getTargetDomainForGeo(country)

  // DEBUG: Log geo information
  console.log('🌍 Middleware Debug:', {
    hostname,
    pathname,
    country,
    currentDomain,
    targetDomain,
    geoAvailable: !!(request as NextRequestWithGeo).geo,
  })

  // DEV ONLY: Allow query parameter override for testing
  const url = new URL(request.url)
  const marketOverride = url.searchParams.get('market')

  // If user is on the wrong domain for their geo-location, redirect them
  // Only redirect if:
  // 1. We're on a production domain (not localhost)
  // 2. The current domain doesn't match the target domain
  // 3. No market override query parameter (for testing)
  if (
    !hostname.includes('localhost') &&
    !hostname.includes('127.0.0.1') &&
    currentDomain !== targetDomain &&
    !marketOverride
  ) {
    const redirectUrl = new URL(request.url)
    redirectUrl.host = targetDomain

    // Add query parameters to show notification
    redirectUrl.searchParams.set('redirected', 'true')
    // Set the "from" parameter based on target domain for notification display
    const fromLabel = targetDomain === 'maisonjove.com.au' ? 'International' : 'LB'
    redirectUrl.searchParams.set('from', fromLabel)

    const redirectResponse = NextResponse.redirect(redirectUrl)

    // Copy over Supabase cookies
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })

    // Set market cookie based on geo-location (determines pricing)
    const pricingMarket = getMarketForPricing(country)
    redirectResponse.cookies.set('market', pricingMarket, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
    })

    return redirectResponse
  }

  // No redirect needed - set market based on geo-location or override
  // Market determines pricing currency (lb=USD, intl=USD, au=AUD) and payment methods
  const market = (marketOverride === 'au' || marketOverride === 'lb' || marketOverride === 'intl')
    ? marketOverride as Market
    : getMarketForPricing(country)

  // Create new response with market cookie
  const newResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Copy all cookies from supabase response
  response.cookies.getAll().forEach(cookie => {
    newResponse.cookies.set(cookie.name, cookie.value, cookie)
  })

  // Set market cookie based on domain
  newResponse.cookies.set('market', market, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
    sameSite: 'lax',
  })

  return newResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
