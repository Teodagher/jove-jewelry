import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndqxwvascqwhqaoqkpng.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcXh3dmFzY3F3aHFhb3FrcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA4MzY0NywiZXhwIjoyMDY5NjU5NjQ3fQ.MFR_nf0aoUKYygdnzNUCB7e8piKmHH7A_ThYxn10QfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface VariantOption {
  id: string;
  name: string;
  image_url: string | null;
  color_gradient: string | null;
  filename_slug: string | null;
}

export interface VariantSetting {
  id: string;
  title: string;
  description: string | null;
  required: boolean;
  affects_image_variant: boolean;
  display_order: number;
  options: VariantOption[];
}

// GET - returns all variant options for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing product ID' },
        { status: 400 }
      );
    }

    // Fetch all customization options for this product
    const { data: options, error } = await supabase
      .from('customization_options')
      .select('*')
      .eq('jewelry_item_id', id)
      .eq('is_active', true)
      .order('setting_display_order', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch variant options' },
        { status: 500 }
      );
    }

    // Group options by setting_id
    const settingsMap = new Map<string, VariantSetting>();

    for (const option of options || []) {
      if (!settingsMap.has(option.setting_id)) {
        settingsMap.set(option.setting_id, {
          id: option.setting_id,
          title: option.setting_title,
          description: option.setting_description || null,
          required: option.required || false,
          affects_image_variant: option.affects_image_variant || false,
          display_order: option.setting_display_order || 0,
          options: [],
        });
      }

      const setting = settingsMap.get(option.setting_id)!;
      setting.options.push({
        id: option.option_id,
        name: option.option_name,
        image_url: option.image_url || null,
        color_gradient: option.color_gradient || null,
        filename_slug: option.filename_slug || null,
      });
    }

    // Convert to array and sort by display order
    const settings = Array.from(settingsMap.values())
      .sort((a, b) => a.display_order - b.display_order);

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
