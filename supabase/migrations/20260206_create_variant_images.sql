-- Migration: Create variant_images and shared_media tables for multi-image galleries
-- Date: 2026-02-06

-- =============================================================================
-- 1. VARIANT IMAGES TABLE
-- Stores multiple images per product variant
-- =============================================================================
CREATE TABLE IF NOT EXISTS variant_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_key TEXT NOT NULL,  -- The filename pattern/variant identifier (e.g., "bracelet-black-leather-emerald-whitegold")
    image_url TEXT NOT NULL,    -- Full Supabase storage URL
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,  -- First/main image for the variant
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast lookups by variant_key
CREATE INDEX IF NOT EXISTS idx_variant_images_variant_key ON variant_images(variant_key);
CREATE INDEX IF NOT EXISTS idx_variant_images_display_order ON variant_images(variant_key, display_order);

-- Enable RLS
ALTER TABLE variant_images ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (for frontend)
CREATE POLICY "variant_images_public_read" ON variant_images
    FOR SELECT USING (true);

-- Policy: Allow authenticated users to manage (for admin)
CREATE POLICY "variant_images_auth_all" ON variant_images
    FOR ALL USING (auth.role() = 'authenticated');

-- =============================================================================
-- 2. SHARED MEDIA TABLE
-- Pool of reusable images that can be linked to multiple variants
-- =============================================================================
CREATE TABLE IF NOT EXISTS shared_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                          -- Human-readable name
    description TEXT,                            -- Optional description
    image_url TEXT NOT NULL,                     -- Full Supabase storage URL
    thumbnail_url TEXT,                          -- Optional thumbnail URL
    tags TEXT[] DEFAULT '{}',                    -- Tags for filtering (e.g., ['bracelet', 'gold', 'emerald'])
    file_size_bytes INTEGER,                     -- File size for reference
    width INTEGER,                               -- Image width
    height INTEGER,                              -- Image height
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for tag-based filtering
CREATE INDEX IF NOT EXISTS idx_shared_media_tags ON shared_media USING GIN(tags);

-- Enable RLS
ALTER TABLE shared_media ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "shared_media_public_read" ON shared_media
    FOR SELECT USING (true);

-- Policy: Allow authenticated users to manage
CREATE POLICY "shared_media_auth_all" ON shared_media
    FOR ALL USING (auth.role() = 'authenticated');

-- =============================================================================
-- 3. VARIANT SHARED MEDIA JUNCTION TABLE
-- Links shared media to variants (many-to-many)
-- =============================================================================
CREATE TABLE IF NOT EXISTS variant_shared_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_key TEXT NOT NULL,
    shared_media_id UUID NOT NULL REFERENCES shared_media(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(variant_key, shared_media_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_variant_shared_media_variant_key ON variant_shared_media(variant_key);
CREATE INDEX IF NOT EXISTS idx_variant_shared_media_shared_media_id ON variant_shared_media(shared_media_id);

-- Enable RLS
ALTER TABLE variant_shared_media ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "variant_shared_media_public_read" ON variant_shared_media
    FOR SELECT USING (true);

-- Policy: Allow authenticated users to manage
CREATE POLICY "variant_shared_media_auth_all" ON variant_shared_media
    FOR ALL USING (auth.role() = 'authenticated');

-- =============================================================================
-- 4. UPDATED_AT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to variant_images
DROP TRIGGER IF EXISTS update_variant_images_updated_at ON variant_images;
CREATE TRIGGER update_variant_images_updated_at
    BEFORE UPDATE ON variant_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to shared_media
DROP TRIGGER IF EXISTS update_shared_media_updated_at ON shared_media;
CREATE TRIGGER update_shared_media_updated_at
    BEFORE UPDATE ON shared_media
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 5. HELPER FUNCTION: Get all images for a variant (including shared media)
-- =============================================================================
CREATE OR REPLACE FUNCTION get_variant_images(p_variant_key TEXT)
RETURNS TABLE (
    image_url TEXT,
    display_order INTEGER,
    is_primary BOOLEAN,
    source TEXT  -- 'direct' or 'shared'
) AS $$
BEGIN
    RETURN QUERY
    -- Direct variant images
    SELECT 
        vi.image_url,
        vi.display_order,
        vi.is_primary,
        'direct'::TEXT as source
    FROM variant_images vi
    WHERE vi.variant_key = p_variant_key
    
    UNION ALL
    
    -- Shared media linked to variant
    SELECT 
        sm.image_url,
        vsm.display_order + 1000 as display_order,  -- Offset to show after direct images
        false as is_primary,
        'shared'::TEXT as source
    FROM variant_shared_media vsm
    JOIN shared_media sm ON sm.id = vsm.shared_media_id
    WHERE vsm.variant_key = p_variant_key
    
    ORDER BY display_order;
END;
$$ LANGUAGE plpgsql;
