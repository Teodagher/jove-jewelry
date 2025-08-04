import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcXh3dmFzY3F3aHFhb3FrcG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODM2NDcsImV4cCI6MjA2OTY1OTY0N30.v1xFg9m6qOv6fhT5Wp1f7TCdhp8KspOiXf8EUC2N8bE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for database tables
export interface JewelryItem {
  id: string
  name: string
  type: string
  base_price: number
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
  image_url: string | null
  color_gradient: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}
