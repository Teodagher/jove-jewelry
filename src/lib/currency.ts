import type { Market } from './market-client'

export type Currency = 'USD' | 'AUD'

/**
 * Get the currency code for a market
 */
export function getCurrency(market: Market): Currency {
  switch (market) {
    case 'au':
      return 'AUD'
    case 'lb':
    default:
      return 'USD'
  }
}

/**
 * Get the currency symbol for a currency code
 */
export function getCurrencySymbol(currency: Currency): string {
  switch (currency) {
    case 'USD':
      return '$'
    case 'AUD':
      return 'A$'
    default:
      return '$'
  }
}

/**
 * Format a price with currency
 * @param amount - The numeric amount
 * @param currency - The currency code
 * @param showCode - Whether to show the currency code (e.g., "USD")
 */
export function formatPrice(
  amount: number,
  currency: Currency,
  showCode: boolean = false
): string {
  const symbol = getCurrencySymbol(currency)
  const formatted = amount.toFixed(2)

  if (showCode) {
    return `${symbol}${formatted} ${currency}`
  }

  return `${symbol}${formatted}`
}

/**
 * Format a price with market (convenience function)
 */
export function formatPriceForMarket(
  amount: number,
  market: Market,
  showCode: boolean = false
): string {
  const currency = getCurrency(market)
  return formatPrice(amount, currency, showCode)
}

/**
 * Convert USD to AUD (approximate conversion for reference)
 * Note: In production, you might want to use a live exchange rate API
 */
export function convertUSDtoAUD(usd: number, rate: number = 1.55): number {
  return usd * rate
}

/**
 * Convert AUD to USD (approximate conversion for reference)
 * Note: In production, you might want to use a live exchange rate API
 */
export function convertAUDtoUSD(aud: number, rate: number = 0.65): number {
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

  if (from === 'USD' && to === 'AUD') {
    return convertUSDtoAUD(amount)
  }

  if (from === 'AUD' && to === 'USD') {
    return convertAUDtoUSD(amount)
  }

  return amount
}
