import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type SiteStyle = 'original' | 'valentines'

// Use app_config table which likely exists, or fall back gracefully
const CONFIG_KEY = 'site_style'

// GET current site style
export async function GET() {
  try {
    // Try site_settings first
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', CONFIG_KEY)
      .single()

    if (!error && data) {
      return NextResponse.json({ style: data.value as SiteStyle })
    }

    // If table doesn't exist, try to create it and default to original
    if (error?.code === '42P01') {
      // Table doesn't exist - create it
      await createSettingsTable()
      return NextResponse.json({ style: 'original' })
    }

    return NextResponse.json({ style: 'original' })
  } catch (error) {
    return NextResponse.json({ style: 'original' })
  }
}

// Helper to create the settings table via raw SQL
async function createSettingsTable() {
  try {
    // Use Supabase's SQL endpoint if available
    const { error } = await supabaseAdmin.rpc('create_site_settings_table')
    if (error) console.log('Could not create table via RPC:', error.message)
  } catch (e) {
    console.log('Settings table creation skipped')
  }
}

// POST to update site style
export async function POST(request: Request) {
  try {
    const { style } = await request.json() as { style: SiteStyle }

    if (!['original', 'valentines'].includes(style)) {
      return NextResponse.json({ error: 'Invalid style' }, { status: 400 })
    }

    // Try to upsert
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert(
        { key: CONFIG_KEY, value: style, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (error) {
      // If table doesn't exist, return the SQL needed
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Table not found. Please run this SQL in Supabase SQL Editor:',
          sql: `CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES ('site_style', 'original');`
        }, { status: 500 })
      }
      console.error('Error updating site style:', error)
      return NextResponse.json({ error: 'Failed to update style' }, { status: 500 })
    }

    return NextResponse.json({ success: true, style })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
