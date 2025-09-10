// Types for database tables
export interface JewelryItem {
  id: string
  name: string
  type: string
  base_price: number
  base_price_lab_grown?: number // New field for lab grown pricing
  black_onyx_base_price?: number // New field for black onyx base pricing
  black_onyx_base_price_lab_grown?: number // New field for black onyx lab grown base pricing
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
  price_lab_grown?: number // New field for lab grown option pricing
  image_url: string | null
  color_gradient: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}