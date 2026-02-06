import type { Market } from './market-client'

/**
 * Price variants for jewelry items (base prices)
 * These match the actual database column names
 */
export type BasePriceVariant =
  | 'base_price'
  | 'base_price_lab_grown'
  | 'base_price_gold'
  | 'base_price_silver'
  | 'black_onyx_base_price'
  | 'black_onyx_base_price_lab_grown'
  | 'black_onyx_base_price_gold'
  | 'black_onyx_base_price_silver'

/**
 * Price variants for customization options
 */
export type OptionPriceVariant = 'default' | 'lab_grown' | 'gold' | 'silver'

/**
 * Interface for database jewelry item prices
 * All prices stored in USD - conversion happens at display time
 */
export interface JewelryItemWithMarketPrices {
  base_price: number
  base_price_lab_grown?: number | null
  base_price_gold?: number | null
  base_price_silver?: number | null
  black_onyx_base_price?: number | null
  black_onyx_base_price_lab_grown?: number | null
  black_onyx_base_price_gold?: number | null
  black_onyx_base_price_silver?: number | null
}

/**
 * Interface for database customization option prices
 * All prices stored in USD - conversion happens at display time
 */
export interface CustomizationOptionWithMarketPrices {
  price: number
  price_lab_grown?: number | null
  price_gold?: number | null
  price_silver?: number | null
}

/**
 * Get base price for a jewelry item in a specific market
 * Returns null if the price is not available in that market
 *
 * Note: All prices are stored in USD. Currency conversion happens at display time.
 */
export function getBasePrice(
  item: JewelryItemWithMarketPrices,
  market: Market,
  variant: BasePriceVariant = 'base_price'
): number | null {
  // All markets use USD base columns - conversion happens at display time
  const columnName = variant

  const price = (item as any)[columnName]

  // Return null if price is undefined or null (not available in market)
  if (price === undefined || price === null) {
    return null
  }

  return Number(price)
}

/**
 * Get price for a customization option in a specific market
 * Returns null if the price is not available in that market
 * 
 * Note: All prices are stored in USD. Currency conversion happens at display time.
 */
export function getOptionPrice(
  option: CustomizationOptionWithMarketPrices,
  market: Market,
  variant: OptionPriceVariant = 'default'
): number | null {
  // All markets use USD base columns - conversion happens at display time
  const columnName = variant === 'default' ? 'price' : `price_${variant}`

  const price = (option as any)[columnName]

  // Return null if price is undefined or null (not available in market)
  if (price === undefined || price === null) {
    return null
  }

  return Number(price)
}

/**
 * Check if a jewelry item is available in a specific market
 * An item is available if it has at least one base price set for that market
 */
export function isItemAvailableInMarket(
  item: JewelryItemWithMarketPrices,
  market: Market
): boolean {
  // Check all base price variants
  const variants: BasePriceVariant[] = [
    'base_price',
    'base_price_lab_grown',
    'base_price_gold',
    'base_price_silver',
    'black_onyx_base_price',
    'black_onyx_base_price_lab_grown',
    'black_onyx_base_price_gold',
    'black_onyx_base_price_silver',
  ]

  return variants.some(variant => {
    const price = getBasePrice(item, market, variant)
    return price !== null && price > 0
  })
}

/**
 * Check if a customization option is available in a specific market
 * An option is available if it has at least one price set for that market
 */
export function isOptionAvailableInMarket(
  option: CustomizationOptionWithMarketPrices,
  market: Market
): boolean {
  // Check all option price variants
  const variants: OptionPriceVariant[] = ['default', 'lab_grown', 'gold', 'silver']

  return variants.some(variant => {
    const price = getOptionPrice(option, market, variant)
    // Allow price of 0 (free options) - only exclude null/undefined
    return price !== null && price !== undefined
  })
}

/**
 * Get all available base price variants for an item in a market
 */
export function getAvailableBasePriceVariants(
  item: JewelryItemWithMarketPrices,
  market: Market
): BasePriceVariant[] {
  const variants: BasePriceVariant[] = [
    'base_price',
    'base_price_lab_grown',
    'base_price_gold',
    'base_price_silver',
    'black_onyx_base_price',
    'black_onyx_base_price_lab_grown',
    'black_onyx_base_price_gold',
    'black_onyx_base_price_silver',
  ]

  return variants.filter(variant => {
    const price = getBasePrice(item, market, variant)
    return price !== null && price > 0
  })
}

/**
 * Get all available option price variants for an option in a market
 */
export function getAvailableOptionPriceVariants(
  option: CustomizationOptionWithMarketPrices,
  market: Market
): OptionPriceVariant[] {
  const variants: OptionPriceVariant[] = ['default', 'lab_grown', 'gold', 'silver']

  return variants.filter(variant => {
    const price = getOptionPrice(option, market, variant)
    return price !== null && price > 0
  })
}
