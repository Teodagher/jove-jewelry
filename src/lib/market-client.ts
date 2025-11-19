/**
 * Client-safe market utilities
 * This file can be imported in Client Components
 */

export type Market = 'lb' | 'au' | 'intl'

export const MARKET_INFO = {
  lb: {
    name: 'Lebanon',
    currency: 'USD',
    flag: '🇱🇧',
    domain: 'maisonjove.com',
    paymentMethods: ['cash_on_delivery', 'stripe'] as const,
  },
  intl: {
    name: 'International',
    currency: 'USD',
    flag: '🌍',
    domain: 'maisonjove.com.au',
    paymentMethods: ['stripe'] as const,
  },
  au: {
    name: 'Australia',
    currency: 'AUD',
    flag: '🇦🇺',
    domain: 'maisonjove.com.au',
    paymentMethods: ['stripe'] as const,
  },
} as const

// All markets available
export const MARKETS: Market[] = ['lb', 'intl', 'au']
export const ADMIN_MARKETS: Market[] = ['lb', 'au']

/**
 * Client-side: Read market from document.cookie
 * Use this in Client Components
 */
export function getMarketClient(): Market {
  if (typeof window === 'undefined') {
    return 'lb'
  }

  const cookies = document.cookie.split('; ')
  const marketCookie = cookies.find(cookie => cookie.startsWith('market='))

  if (marketCookie) {
    const value = marketCookie.split('=')[1]
    if (isValidMarket(value)) {
      return value as Market
    }
  }

  return 'lb'
}

/**
 * Set market cookie (client-side only)
 */
export function setMarketClient(market: Market): void {
  if (typeof window === 'undefined') {
    return
  }

  document.cookie = `market=${market}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

/**
 * Validate if a string is a valid market
 */
function isValidMarket(value: string): value is Market {
  return value === 'lb' || value === 'au' || value === 'intl'
}

/**
 * Get market info by market code
 */
export function getMarketInfo(market: Market) {
  return MARKET_INFO[market]
}
