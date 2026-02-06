import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type SiteStyle = 'original' | 'valentines'

// GET current site style
export async function GET() {
  try {
    // Check site_settings table for current style
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'site_style')
      .single()

    if (error || !data) {
      // Default to original if not set
      return NextResponse.json({ style: 'original' })
    }

    return NextResponse.json({ style: data.value as SiteStyle })
  } catch (error) {
    return NextResponse.json({ style: 'original' })
  }
}

// POST to update site style
export async function POST(request: Request) {
  try {
    const { style } = await request.json() as { style: SiteStyle }

    if (!['original', 'valentines'].includes(style)) {
      return NextResponse.json({ error: 'Invalid style' }, { status: 400 })
    }

    // Upsert the site style setting
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert(
        { key: 'site_style', value: style, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (error) {
      console.error('Error updating site style:', error)
      return NextResponse.json({ error: 'Failed to update style' }, { status: 500 })
    }

    return NextResponse.json({ success: true, style })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
