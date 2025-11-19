export interface CustomJewelryItem {
  id: string;
  jewelry_type: 'necklaces' | 'rings' | 'bracelets' | 'earrings';
  product_name?: string; // The actual product name
  customization_data: Record<string, unknown>; // The selected options (metal, stones, etc.)
  customization_summary: string; // Human readable description
  base_price: number;
  total_price: number;
  preview_image_url?: string;
  quantity: number;
}

export interface CartItem {
  id: string;
  session_id: string;
  jewelry_type: 'necklaces' | 'rings' | 'bracelets' | 'earrings';
  product_name?: string; // The actual product name
  customization_data: Record<string, unknown>;
  base_price: number;
  total_price: number;
  preview_image_url?: string;
  quantity: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

export interface CartItemInsert {
  session_id: string;
  user_id?: string | null;
  jewelry_type: 'necklaces' | 'rings' | 'bracelets' | 'earrings';
  product_name?: string;
  customization_data: Record<string, unknown>;
  base_price: number;
  total_price: number;
  preview_image_url?: string;
  quantity: number;
}

export interface CartItemUpdate {
  quantity?: number;
  user_id?: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  jewelry_type: 'necklaces' | 'rings' | 'bracelets' | 'earrings';
  product_name?: string;
  customization_data: Record<string, unknown>;
  customization_summary: string;
  base_price: number;
  total_price: number;
  preview_image_url?: string;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_postal_code?: string;
  delivery_notes?: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  notes?: string;
  discount_type?: 'percentage' | 'fixed_amount';
  discount_value?: number;
  discount_amount?: number;
  discount_code?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export interface CheckoutFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_postal_code?: string;
  delivery_notes?: string;
}
