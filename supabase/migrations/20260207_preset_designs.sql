-- Migration: Create preset_designs table for pre-configured customization options
-- Date: 2026-02-07

-- =============================================================================
-- 1. PRESET DESIGNS TABLE
-- Stores pre-made customization configurations (e.g., "Green Edition", "Ruby Edition")
-- =============================================================================
CREATE TABLE IF NOT EXISTS preset_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jewelry_item_id UUID NOT NULL REFERENCES jewelry_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                    -- e.g., "The Emerald Edition"
    description TEXT,                      -- Optional description
    slug TEXT NOT NULL,                    -- URL-friendly slug
    customization_data JSONB NOT NULL,     -- The preset selections (e.g., {"first_stone": "diamond", "second_stone": "emerald", "metal": "yellow_gold", "chain_type": "gold_cord"})
    preview_image_url TEXT,                -- Preview image URL
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    badge_text TEXT,                       -- Optional badge (e.g., "Bestseller", "New")
    badge_color TEXT,                      -- Badge color (e.g., "gold", "green", "blue")
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(jewelry_item_id, slug)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_preset_designs_jewelry_item ON preset_designs(jewelry_item_id);
CREATE INDEX IF NOT EXISTS idx_preset_designs_active ON preset_designs(is_active);
CREATE INDEX IF NOT EXISTS idx_preset_designs_display_order ON preset_designs(jewelry_item_id, display_order);

-- Enable RLS
ALTER TABLE preset_designs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access for active presets (for frontend)
CREATE POLICY "preset_designs_public_read" ON preset_designs
    FOR SELECT USING (is_active = true);

-- Policy: Allow authenticated users full access (for admin)
CREATE POLICY "preset_designs_admin_all" ON preset_designs
    FOR ALL USING (auth.role() = 'authenticated');

-- Also allow public full access for now (simpler admin without auth)
CREATE POLICY "preset_designs_public_all" ON preset_designs
    FOR ALL USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_preset_designs_updated_at
    BEFORE UPDATE ON preset_designs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE preset_designs IS 'Pre-configured customization options that users can quick-select (e.g., "The Emerald Edition", "The Ruby Edition")';

