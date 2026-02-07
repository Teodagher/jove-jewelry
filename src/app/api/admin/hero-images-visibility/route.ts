import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

export type Theme = 'original' | 'valentines';
export type Visibility = 'desktop' | 'mobile' | 'both';

// GET visibility settings for a theme
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const theme = searchParams.get('theme') as Theme;
    
    if (!theme || !['original', 'valentines'].includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const settingKey = `hero_images_visibility_${theme}`;
    
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', settingKey)
      .single();

    if (!error && data?.value) {
      try {
        const visibilityMap = JSON.parse(data.value);
        return NextResponse.json({ visibility: visibilityMap });
      } catch (e) {
        return NextResponse.json({ visibility: {} });
      }
    }

    return NextResponse.json({ visibility: {} });
  } catch (error) {
    console.error('Error fetching visibility:', error);
    return NextResponse.json({ visibility: {} });
  }
}

// POST to update visibility settings
export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { theme, visibility } = await request.json() as { 
      theme: Theme; 
      visibility: Record<string, Visibility>;
    };

    if (!theme || !['original', 'valentines'].includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    const settingKey = `hero_images_visibility_${theme}`;
    const value = JSON.stringify(visibility);

    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert(
        { key: settingKey, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('Error saving visibility:', error);
      return NextResponse.json({ error: 'Failed to save visibility' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
