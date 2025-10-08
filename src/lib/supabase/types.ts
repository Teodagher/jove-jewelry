// Types for database tables
export interface JewelryItem {
  id: string
  name: string
  type: string
  base_price: number
  base_price_lab_grown?: number // Lab grown pricing
  base_price_gold?: number // Gold pricing
  base_price_silver?: number // Silver pricing
  black_onyx_base_price?: number // Black onyx base pricing
  black_onyx_base_price_lab_grown?: number // Black onyx lab grown base pricing
  black_onyx_base_price_gold?: number // Black onyx gold base pricing
  black_onyx_base_price_silver?: number // Black onyx silver base pricing
  pricing_type?: 'diamond_type' | 'metal_type' // Pricing model: diamond_type (natural/lab_grown) or metal_type (gold/silver)
  base_image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomizationOption {
  id: string
  jewelry_item_id: string
  setting_id: string
  setting_title: string
  option_id: string
  option_name: string
  price: number
  price_lab_grown?: number // Lab grown option pricing
  price_gold?: number // Gold option pricing
  price_silver?: number // Silver option pricing
  image_url: string | null
  color_gradient: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}