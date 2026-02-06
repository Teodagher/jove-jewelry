import { type NextRequest, NextResponse } from 'next/server'
import { geolocation } from '@vercel/functions'
import { updateSession } from './lib/supabase/middleware'

export type Market = 'lb' | 'au' | 'eu' | 'ae' | 'sa' | 'qa' | 'intl'

const DOMAIN_MARKET_MAP: Record<string, Market> = {
  'maisonjove.com': 'lb',
  'maisonjove.com.au': 'intl', // Default to intl, geo will override
}

const MARKET_DOMAIN_MAP: Record<Market, string> = {
  lb: 'maisonjove.com',
  intl: 'maisonjove.com.au',
  au: 'maisonjove.com.au',
  eu: 'maisonjove.com.au',
  ae: 'maisonjove.com.au',
  sa: 'maisonjove.com.au',
  qa: 'maisonjove.com.au',
}

/**
 * EU country codes
 */
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'GB', 'CH', 'NO', 'IS' // UK, Switzerland, Norway, Iceland
]

function getMarketFromDomain(hostname: string): Market {
  const cleanHostname = hostname.replace(/^www\./, '')
  return DOMAIN_MARKET_MAP[cleanHostname] || 'lb'
}

function getTargetDomainForGeo(country?: string): string | null {
  if (!country) return null
  
  // Lebanon users stay on maisonjove.com
  if (country === 'LB') return 'maisonjove.com'
  
  // All other countries go to maisonjove.com.au
  return 'maisonjove.com.au'
}

/**
 * Get market for pricing based on country code
 * This determines currency display and payment methods
 */
function getMarketForPricing(country?: string): Market {
  if (!country) return 'intl' // Default to international (USD + Stripe)
  
  // Lebanon - USD + Cash on Delivery available
  if (country === 'LB') return 'lb'
  
  // Australia - AUD
  if (country === 'AU') return 'au'
  
  // UAE (Dubai, Abu Dhabi) - AED
  if (country === 'AE') return 'ae'
  
  // Saudi Arabia - SAR
  if (country === 'SA') return 'sa'
  
  // Qatar - QAR
  if (country === 'QA') return 'qa'
  
  // European countries - EUR
  if (EU_COUNTRIES.includes(country)) return 'eu'
  
  // All other countries - USD (international)
  return 'intl'
}

export async function middleware(request: NextRequest) {
  // First, handle Supabase session
  const response = await updateSession(request)

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

  // Get geo-location using @vercel/functions
  const geo = geolocation(request)
  const country = geo.country
  const currentDomain = hostname.replace(/^www\./, '')
  const targetDomain = getTargetDomainForGeo(country)

  // DEBUG: Log geo information
  console.log('🌍 Middleware Debug:', {
    hostname,
    pathname,
    country,
    city: geo.city,
    currentDomain,
    targetDomain,
    geoAvailable: !!country,
  })

  // DEV ONLY: Allow query parameter override for testing
  const url = new URL(request.url)
  const marketOverride = url.searchParams.get('market')

  // If user is on the wrong domain for their geo-location, redirect them
  if (
    !hostname.includes('localhost') &&
    !hostname.includes('127.0.0.1') &&
    targetDomain !== null &&
    currentDomain !== targetDomain &&
    !marketOverride
  ) {
    const redirectUrl = new URL(request.url)
    redirectUrl.host = targetDomain

    const pricingMarket = getMarketForPricing(country)

    redirectUrl.searchParams.set('redirected', 'true')
    const fromLabel = pricingMarket.toUpperCase()
    redirectUrl.searchParams.set('from', fromLabel)

    const redirectResponse = NextResponse.redirect(redirectUrl)

    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    redirectResponse.cookies.set('market', pricingMarket, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
    })

    redirectResponse.headers.set('x-market-detected', pricingMarket)
    redirectResponse.headers.set('x-geo-country', country || 'undefined')
    redirectResponse.headers.set('x-middleware-ran', 'true')

    return redirectResponse
  }

  // No redirect needed - set market based on: query override > existing cookie > geo > domain default
  let market: Market
  
  // Valid market values for override
  const validMarkets: Market[] = ['lb', 'au', 'eu', 'ae', 'sa', 'qa', 'intl']
  
  // Check for existing market cookie (user selection in admin takes priority)
  const existingMarketCookie = request.cookies.get('market')?.value
  
  if (marketOverride && validMarkets.includes(marketOverride as Market)) {
    // Query parameter override (for testing)
    market = marketOverride as Market
  } else if (existingMarketCookie && validMarkets.includes(existingMarketCookie as Market)) {
    // Respect existing cookie (user selected market in admin)
    market = existingMarketCookie as Market
  } else if (country) {
    // Auto-detect from geo-location
    market = getMarketForPricing(country)
  } else {
    // Default based on domain
    market = currentDomain === 'maisonjove.com' ? 'lb' : 'intl'
  }

  const newResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  response.cookies.getAll().forEach(cookie => {
    newResponse.cookies.set(cookie.name, cookie.value, cookie)
  })

  newResponse.cookies.set('market', market, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  })

  newResponse.headers.set('x-market-detected', market)
  newResponse.headers.set('x-geo-country', country || 'undefined')
  newResponse.headers.set('x-middleware-ran', 'true')
  newResponse.headers.set('x-current-domain', currentDomain)
  newResponse.headers.set('x-target-domain', targetDomain || 'none')

  return newResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
