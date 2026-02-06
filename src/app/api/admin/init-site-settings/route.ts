import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    // Try to insert default site_style if table exists
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert(
        { key: 'site_style', value: 'original', updated_at: new Date().toISOString() },
        { onConflict: 'key', ignoreDuplicates: true }
      )

    if (error) {
      // Table might not exist - that's okay, we'll handle gracefully
      console.log('site_settings table may not exist yet:', error.message)
      return NextResponse.json({ 
        success: false, 
        message: 'Table may not exist. Run migration first.',
        sql: `
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES ('site_style', 'original')
ON CONFLICT (key) DO NOTHING;
        `
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
