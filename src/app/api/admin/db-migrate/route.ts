import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: 'public' }
  });
  
  try {
    // Check if table exists
    const { error: checkError } = await supabase
      .from('preset_designs')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Table already exists'
      });
    }
    
    // Table doesn't exist - we can't create it via JS client
    // But we can use the Supabase SQL API
    // Need to run via dashboard
    return NextResponse.json({ 
      success: false, 
      needsMigration: true,
      message: 'Table preset_designs does not exist',
      instructions: 'Please run the SQL in Supabase Dashboard → SQL Editor'
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST() {
  // This will be called after the table exists to seed initial data
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // First get jewelry items to get their IDs
    const { data: items, error: itemsError } = await supabase
      .from('jewelry_items')
      .select('id, name, type')
      .in('type', ['necklace', 'bracelet', 'ring']);
    
    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
    
    const presets = [];
    
    for (const item of items || []) {
      // Green Edition
      presets.push({
        jewelry_item_id: item.id,
        name: 'The Emerald Edition',
        description: 'Classic elegance with vibrant green stones',
        slug: 'emerald-edition',
        customization_data: {
          first_stone: 'diamond',
          second_stone: 'emerald',
          metal: 'yellow_gold',
          chain_type: item.type === 'bracelet' ? 'gold_cord' : 'yellow_gold_chain_real',
          diamond_size: 'small_015ct'
        },
        badge_text: 'Popular',
        badge_color: 'green',
        display_order: 1
      });
      
      // Red Edition  
      presets.push({
        jewelry_item_id: item.id,
        name: 'The Ruby Edition',
        description: 'Bold and passionate with ruby red stones',
        slug: 'ruby-edition',
        customization_data: {
          first_stone: 'diamond',
          second_stone: 'ruby',
          metal: 'yellow_gold',
          chain_type: item.type === 'bracelet' ? 'gold_cord' : 'yellow_gold_chain_real',
          diamond_size: 'small_015ct'
        },
        badge_text: 'Bestseller',
        badge_color: 'gold',
        display_order: 2
      });
      
      // Blue Edition
      presets.push({
        jewelry_item_id: item.id,
        name: 'The Sapphire Edition',
        description: 'Timeless sophistication with deep blue stones',
        slug: 'sapphire-edition',
        customization_data: {
          first_stone: 'diamond',
          second_stone: 'blue_sapphire',
          metal: 'yellow_gold',
          chain_type: item.type === 'bracelet' ? 'gold_cord' : 'yellow_gold_chain_real',
          diamond_size: 'small_015ct'
        },
        badge_text: 'New',
        badge_color: 'blue',
        display_order: 3
      });
    }
    
    // Insert presets (upsert to avoid duplicates)
    const { data, error } = await supabase
      .from('preset_designs')
      .upsert(presets, { 
        onConflict: 'jewelry_item_id,slug',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Created ${data?.length || 0} presets`,
      data 
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
