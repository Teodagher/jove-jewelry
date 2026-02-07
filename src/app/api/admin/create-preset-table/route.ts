import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if table exists by trying to select from it
    const { error: checkError } = await supabase
      .from('preset_designs')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      return NextResponse.json({ success: true, message: 'Table already exists' });
    }
    
    // Return instructions for manual creation
    return NextResponse.json({ 
      success: false, 
      message: 'Table does not exist. Run this SQL in Supabase dashboard SQL Editor.',
      sql: `
CREATE TABLE preset_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jewelry_item_id UUID NOT NULL REFERENCES jewelry_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    customization_data JSONB NOT NULL,
    preview_image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    badge_text TEXT,
    badge_color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(jewelry_item_id, slug)
);
ALTER TABLE preset_designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "preset_designs_public_all" ON preset_designs FOR ALL USING (true);
      `
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to check/create table' }, { status: 500 });
  }
}
