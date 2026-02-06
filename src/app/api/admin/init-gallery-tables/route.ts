import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // Check if tables already exist
    const { data: existingTables, error: checkError } = await supabaseAdmin
      .from('variant_images')
      .select('id')
      .limit(1);

    if (!checkError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Tables already exist',
        tablesCreated: false 
      });
    }

    // Tables don't exist, need to create them via SQL
    // Note: This requires the migration to be run manually in Supabase SQL Editor
    // since the JS client doesn't support DDL operations

    return NextResponse.json({ 
      success: false, 
      message: 'Tables do not exist. Please run the migration SQL in Supabase SQL Editor.',
      migrationFile: 'supabase/migrations/20260206_create_variant_images.sql',
      instructions: [
        '1. Go to https://supabase.com/dashboard/project/ndqxwvascqwhqaoqkpng/sql',
        '2. Copy the contents of the migration file',
        '3. Paste and run in SQL Editor'
      ]
    });
  } catch (error: any) {
    console.error('Error checking/creating tables:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Check table status
    const results: any = {
      variant_images: false,
      shared_media: false,
      variant_shared_media: false
    };

    // Check variant_images
    const { error: viError } = await supabaseAdmin
      .from('variant_images')
      .select('id')
      .limit(1);
    results.variant_images = !viError || viError.code !== '42P01';

    // Check shared_media
    const { error: smError } = await supabaseAdmin
      .from('shared_media')
      .select('id')
      .limit(1);
    results.shared_media = !smError || smError.code !== '42P01';

    // Check variant_shared_media
    const { error: vsmError } = await supabaseAdmin
      .from('variant_shared_media')
      .select('id')
      .limit(1);
    results.variant_shared_media = !vsmError || vsmError.code !== '42P01';

    const allExist = Object.values(results).every(v => v);

    return NextResponse.json({
      success: true,
      tablesExist: allExist,
      tables: results,
      message: allExist 
        ? 'All gallery tables are ready' 
        : 'Some tables are missing. Run the migration SQL.'
    });
  } catch (error: any) {
    console.error('Error checking tables:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
