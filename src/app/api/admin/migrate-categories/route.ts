import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

export async function POST() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // Add parent_id column to product_categories if it doesn't exist
    const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'product_categories' AND column_name = 'parent_id'
          ) THEN 
            ALTER TABLE product_categories ADD COLUMN parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;
            CREATE INDEX idx_product_categories_parent ON product_categories(parent_id);
          END IF;
        END $$;
      `
    })

    if (alterError) {
      // Try direct approach if RPC doesn't exist
      // Just add the column - will fail silently if exists
      const { error: directError } = await supabaseAdmin
        .from('product_categories')
        .select('parent_id')
        .limit(1)

      if (directError && directError.message.includes('parent_id')) {
        // Column doesn't exist, need to create it via SQL
        return NextResponse.json({
          success: false,
          message: 'Need to add parent_id column manually in Supabase dashboard',
          sql: `
ALTER TABLE product_categories 
ADD COLUMN parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;

CREATE INDEX idx_product_categories_parent ON product_categories(parent_id);
          `
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Migration complete or column already exists' 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 })
  }
}
