/**
 * Client-safe market utilities
 * This file can be imported in Client Components
 */

export type Market = 'lb' | 'au' | 'eu' | 'ae' | 'sa' | 'qa' | 'intl'

export const MARKET_INFO = {
  lb: {
    name: 'Lebanon',
    currency: 'USD',
    flag: '🇱🇧',
    domain: 'maisonjove.com',
    paymentMethods: ['cash_on_delivery', 'stripe'] as const, // Lebanon ONLY has COD option
  },
  au: {
    name: 'Australia',
    currency: 'AUD',
    flag: '🇦🇺',
    domain: 'maisonjove.com.au',
    paymentMethods: ['stripe'] as const,
  },
  eu: {
    name: 'Europe',
    currency: 'EUR',
    flag: '🇪🇺',
    domain: 'maisonjove.com.au',
    paymentMethods: ['stripe'] as const,
  },
  ae: {
    name: 'UAE',
    currency: 'AED',
    flag: '🇦🇪',
    domain: 'maisonjove.com.au',
    paymentMethods: ['stripe'] as const,
  },
  sa: {
    name: 'Saudi Arabia',
    currency: 'SAR',
    flag: '🇸🇦',
    domain: 'maisonjove.com.au',
    paymentMethods: ['stripe'] as const,
  },
  qa: {
    name: 'Qatar',
    currency: 'QAR',
    flag: '🇶🇦',
    domain: 'maisonjove.com.au',
    paymentMethods: ['stripe'] as const,
  },
  intl: {
    name: 'International',
    currency: 'USD',
    flag: '🌍',
    domain: 'maisonjove.com.au',
    paymentMethods: ['stripe'] as const,
  },
} as const

// All markets available
export const MARKETS: Market[] = ['lb', 'au', 'eu', 'ae', 'sa', 'qa', 'intl']

// Markets shown in admin for market preview
// All prices are stored in USD - conversion happens at display time
export const ADMIN_MARKETS: Market[] = ['lb', 'au', 'eu', 'ae', 'sa', 'qa', 'intl']

/**
 * EU country codes for market detection
 */
export const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // Also include UK, Switzerland, Norway for EUR display
  'GB', 'CH', 'NO', 'IS'
]

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
  return MARKETS.includes(value as Market)
}

/**
 * Get market info by market code
 */
export function getMarketInfo(market: Market) {
  return MARKET_INFO[market]
}

/**
 * Check if a market allows Cash on Delivery
 * Only Lebanon (lb) allows COD
 */
export function allowsCashOnDelivery(market: Market): boolean {
  return market === 'lb'
}
