import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndqxwvascqwhqaoqkpng.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcXh3dmFzY3F3aHFhb3FrcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA4MzY0NywiZXhwIjoyMDY5NjU5NjQ3fQ.MFR_nf0aoUKYygdnzNUCB7e8piKmHH7A_ThYxn10QfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface Product {
  id: string;
  name: string;
  type: string;
  slug: string;
  base_image_url: string | null;
}

// GET - returns all customizable products
export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('jewelry_items')
      .select('id, name, type, slug, base_image_url')
      .eq('product_type', 'customizable')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: products || [],
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
