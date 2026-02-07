const { Client } = require('pg');

async function createTable() {
  // Direct connection string (from Supabase dashboard)
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://postgres:JoveAdmin2025!@db.ndqxwvascqwhqaoqkpng.supabase.co:5432/postgres';
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS preset_designs (
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
    `);
    console.log('Table created successfully');
    
    // Enable RLS
    await client.query(`ALTER TABLE preset_designs ENABLE ROW LEVEL SECURITY;`);
    console.log('RLS enabled');
    
    // Create policy (drop first if exists)
    await client.query(`DROP POLICY IF EXISTS "preset_designs_public_all" ON preset_designs;`);
    await client.query(`CREATE POLICY "preset_designs_public_all" ON preset_designs FOR ALL USING (true);`);
    console.log('Policy created');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

createTable();
