import type { Market } from './market-client'

export type Currency = 'USD' | 'AUD' | 'EUR' | 'AED' | 'SAR' | 'QAR'

/**
 * Exchange rates from USD (as of 2026-02-06)
 * Update these periodically when Joey asks
 */
export const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  AUD: 1.44,
  EUR: 0.848,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
}

/**
 * Currency display info
 */
export const CURRENCY_INFO: Record<Currency, { symbol: string; name: string; position: 'before' | 'after' }> = {
  USD: { symbol: '$', name: 'US Dollar', position: 'before' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', position: 'before' },
  EUR: { symbol: '€', name: 'Euro', position: 'before' },
  AED: { symbol: 'AED', name: 'UAE Dirham', position: 'after' },
  SAR: { symbol: 'SAR', name: 'Saudi Riyal', position: 'after' },
  QAR: { symbol: 'QAR', name: 'Qatari Riyal', position: 'after' },
}

/**
 * Get the currency code for a market
 */
export function getCurrency(market: Market): Currency {
  switch (market) {
    case 'au':
      return 'AUD'
    case 'eu':
      return 'EUR'
    case 'ae':
      return 'AED'
    case 'sa':
      return 'SAR'
    case 'qa':
      return 'QAR'
    case 'lb':
    case 'intl':
    default:
      return 'USD'
  }
}

/**
 * Get the currency symbol for a currency code
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_INFO[currency].symbol
}

/**
 * Convert amount from USD to target currency
 */
export function convertFromUSD(amountUSD: number, targetCurrency: Currency): number {
  const rate = EXCHANGE_RATES[targetCurrency]
  return amountUSD * rate
}

/**
 * Convert amount from target currency to USD
 */
export function convertToUSD(amount: number, fromCurrency: Currency): number {
  const rate = EXCHANGE_RATES[fromCurrency]
  return amount / rate
}

/**
 * Format a price with currency
 * @param amount - The numeric amount (in USD, will be converted)
 * @param currency - The target currency code
 * @param convert - Whether to convert from USD (default true)
 */
export function formatPrice(
  amount: number,
  currency: Currency,
  convert: boolean = true
): string {
  const displayAmount = convert ? convertFromUSD(amount, currency) : amount
  const info = CURRENCY_INFO[currency]
  
  // Round to 2 decimal places
  const rounded = Math.round(displayAmount * 100) / 100
  const formatted = rounded.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (info.position === 'before') {
    return `${info.symbol}${formatted}`
  } else {
    return `${formatted} ${info.symbol}`
  }
}

/**
 * Format a price with market (convenience function)
 * Amount should be in USD - it will be converted automatically
 */
export function formatPriceForMarket(
  amountUSD: number,
  market: Market,
  showCode: boolean = false
): string {
  const currency = getCurrency(market)
  const formatted = formatPrice(amountUSD, currency, true)
  
  if (showCode) {
    return `${formatted} ${currency}`
  }
  
  return formatted
}

/**
 * Get the converted price for a market
 * @param amountUSD - Amount in USD
 * @param market - Target market
 * @returns The converted amount (number)
 */
export function getConvertedPrice(amountUSD: number, market: Market): number {
  const currency = getCurrency(market)
  return convertFromUSD(amountUSD, currency)
}

/**
 * Legacy function - kept for backwards compatibility
 * @deprecated Use convertFromUSD instead
 */
export function convertUSDtoAUD(usd: number, rate: number = EXCHANGE_RATES.AUD): number {
  return usd * rate
}

/**
 * Legacy function - kept for backwards compatibility
 * @deprecated Use convertToUSD instead
 */
export function convertAUDtoUSD(aud: number, rate: number = 1 / EXCHANGE_RATES.AUD): number {
  return aud * rate
}

/**
 * Convert amount from one currency to another
 */
export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency
): number {
  if (from === to) {
    return amount
  }

  // Convert to USD first, then to target
  const amountUSD = convertToUSD(amount, from)
  return convertFromUSD(amountUSD, to)
}
