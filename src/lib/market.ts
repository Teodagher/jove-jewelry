import { cookies } from 'next/headers'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

// Re-export all client-safe utilities
export {
  type Market,
  MARKET_INFO,
  MARKETS,
  ADMIN_MARKETS,
  getMarketClient,
  setMarketClient,
  getMarketInfo
} from './market-client'

// Import Market type for use in this file
import type { Market } from './market-client'

/**
 * Server-side: Read market from cookies
 * Use this in Server Components and Server Actions
 */
export async function getMarket(cookieStore?: ReadonlyRequestCookies): Promise<Market> {
  const store = cookieStore || await cookies()
  const marketCookie = store.get('market')

  if (marketCookie && isValidMarket(marketCookie.value)) {
    return marketCookie.value as Market
  }

  // Default to Lebanon if no valid market cookie
  return 'lb'
}

/**
 * Validate if a string is a valid market
 */
function isValidMarket(value: string): boolean {
  return value === 'lb' || value === 'au'
}
