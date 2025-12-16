-- Migration: Create promo codes and usage tracking tables
-- Created: 2025-12-16

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- Discount Configuration
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  
  -- Influencer Tracking
  influencer_name VARCHAR(255),
  influencer_email VARCHAR(255),
  influencer_payout_type VARCHAR(20) CHECK (influencer_payout_type IN ('percentage_of_discount', 'percentage_of_sale', 'fixed', 'none')),
  influencer_payout_value DECIMAL(10, 2) DEFAULT 0,
  
  -- Usage Limits
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  max_uses_per_customer INTEGER DEFAULT 1,
  
  -- Minimum Order Value
  min_order_value DECIMAL(10, 2),
  
  -- Validity Period
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create promo_code_usage table
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Customer Info
  customer_email VARCHAR(255) NOT NULL,
  
  -- Discount Applied
  discount_amount DECIMAL(10, 2) NOT NULL,
  order_subtotal DECIMAL(10, 2) NOT NULL,
  order_total DECIMAL(10, 2) NOT NULL,
  
  -- Influencer Payout
  influencer_payout_amount DECIMAL(10, 2) DEFAULT 0,
  payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'calculated', 'paid')),
  payout_paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(promo_code_id, order_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid ON promo_codes(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_promo_codes_influencer ON promo_codes(influencer_email);

CREATE INDEX IF NOT EXISTS idx_promo_usage_code ON promo_code_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_order ON promo_code_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_customer ON promo_code_usage(customer_email);
CREATE INDEX IF NOT EXISTS idx_promo_usage_payout_status ON promo_code_usage(payout_status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Allow public to read active promo codes (for validation)
CREATE POLICY "Allow public to read active promo codes"
  ON promo_codes FOR SELECT
  USING (is_active = true);

-- Allow authenticated users (admins) to manage promo codes
CREATE POLICY "Allow authenticated users to manage promo codes"
  ON promo_codes FOR ALL
  USING (auth.role() = 'authenticated');

-- Allow public to insert promo code usage (during checkout)
CREATE POLICY "Allow public to insert promo code usage"
  ON promo_code_usage FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view all usage
CREATE POLICY "Allow authenticated users to view usage"
  ON promo_code_usage FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to update payout status
CREATE POLICY "Allow authenticated users to update usage"
  ON promo_code_usage FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Add comment for documentation
COMMENT ON TABLE promo_codes IS 'Stores promotional codes with discount and influencer tracking configuration';
COMMENT ON TABLE promo_code_usage IS 'Tracks each use of a promo code for analytics and influencer payout calculation';
