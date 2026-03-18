-- AI Studio Variants table
-- Stores generated product variant images and their metadata

CREATE TABLE IF NOT EXISTS ai_studio_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  original_image_url TEXT NOT NULL,
  generated_image_url TEXT,
  variant_config JSONB NOT NULL,
  prompt_used TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_studio_variants_product_name ON ai_studio_variants(product_name);
CREATE INDEX IF NOT EXISTS idx_ai_studio_variants_status ON ai_studio_variants(status);
CREATE INDEX IF NOT EXISTS idx_ai_studio_variants_created_at ON ai_studio_variants(created_at DESC);

-- Enable RLS
ALTER TABLE ai_studio_variants ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users (admins)
CREATE POLICY "Allow authenticated users to manage variants"
  ON ai_studio_variants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for AI studio variants
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('ai-studio-variants', 'ai-studio-variants', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for public read access
CREATE POLICY "Public read access for ai-studio-variants"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'ai-studio-variants');

-- Storage policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload to ai-studio-variants"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ai-studio-variants');

-- Storage policy for authenticated users to update
CREATE POLICY "Authenticated users can update ai-studio-variants"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ai-studio-variants');

-- Storage policy for authenticated users to delete
CREATE POLICY "Authenticated users can delete from ai-studio-variants"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'ai-studio-variants');
