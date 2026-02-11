// =============================================
// JOVÉ LAB Admin - Isolated Types
// =============================================
// These types are completely separate from the main store schema
// They use their own storage and don't touch existing tables

export interface JoveLabTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  hero_image_url: string | null;
  gallery_images: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JoveLabOptionCategory {
  id: string;
  name: string; // e.g., "Shape", "Size", "Metal"
  slug: string;
  display_order: number;
  is_active: boolean;
}

export interface JoveLabOption {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type JoveLabPricingMode = 'fixed' | 'starting_from' | 'estimated_range';

export interface JoveLabPricing {
  id: string;
  template_id: string;
  base_price: number;
  pricing_mode: JoveLabPricingMode;
  min_price: number | null;
  max_price: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface JoveLabPricingAddOn {
  id: string;
  name: string;
  category: string; // 'metal', 'stone_size', 'setting', etc.
  option_value: string; // e.g., 'platinum', '2ct', 'halo'
  price_adjustment: number;
  is_percentage: boolean;
  is_active: boolean;
}

export type JoveLabLeadStatus = 
  | 'new'
  | 'contacted'
  | 'quoted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface JoveLabLead {
  id: string;
  design_id: string;
  
  // Client info
  client_name: string;
  client_email: string;
  client_phone: string | null;
  
  // Design selections (JSON of choices)
  selections: {
    jewelry_type: string | null;
    architecture: string | null;
    stone_personality: string | null;
    proportions: string | null;
    setting_style: string | null;
    metal: string | null;
    notes?: string;
  };
  
  // Pricing
  shown_price: number | null;
  pricing_mode: JoveLabPricingMode | null;
  currency: string;
  
  // Status tracking
  status: JoveLabLeadStatus;
  internal_notes: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  contacted_at: string | null;
  completed_at: string | null;
}

// Stats for dashboard
export interface JoveLabStats {
  total_leads: number;
  leads_this_week: number;
  leads_this_month: number;
  by_status: Record<JoveLabLeadStatus, number>;
  average_price: number;
}

// Form data for creating/editing templates
export interface JoveLabTemplateFormData {
  name: string;
  description: string;
  hero_image_url: string | null;
  gallery_images: string[];
  is_active: boolean;
}

// Form data for options
export interface JoveLabOptionFormData {
  category_id: string;
  name: string;
  description: string;
  image_url: string | null;
  is_active: boolean;
}
