#!/usr/bin/env node
/**
 * Script to initialize variant_images and shared_media tables
 * Run with: node scripts/init-variant-images-tables.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndqxwvascqwhqaoqkpng.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcXh3dmFzY3F3aHFhb3FrcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA4MzY0NywiZXhwIjoyMDY5NjU5NjQ3fQ.MFR_nf0aoUKYygdnzNUCB7e8piKmHH7A_ThYxn10QfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initTables() {
  console.log('🚀 Initializing variant images tables...');

  // Test connection by trying to select from an existing table
  const { data: testData, error: testError } = await supabase
    .from('jewelry_items')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('❌ Connection test failed:', testError.message);
    process.exit(1);
  }
  console.log('✅ Database connection successful');

  // Check if variant_images table exists by trying to select from it
  const { data: variantImagesData, error: variantImagesError } = await supabase
    .from('variant_images')
    .select('id')
    .limit(1);

  if (variantImagesError && variantImagesError.code === '42P01') {
    console.log('⚠️  Tables do not exist yet. Please run the migration SQL in Supabase SQL Editor.');
    console.log('');
    console.log('📝 Migration file: supabase/migrations/20260206_create_variant_images.sql');
    console.log('');
    console.log('Steps:');
    console.log('1. Go to https://supabase.com/dashboard/project/ndqxwvascqwhqaoqkpng/sql');
    console.log('2. Copy the contents of the migration file');
    console.log('3. Paste and run in SQL Editor');
    console.log('');
    process.exit(1);
  } else if (variantImagesError) {
    console.error('❌ Error checking tables:', variantImagesError.message);
    process.exit(1);
  }

  console.log('✅ variant_images table exists');

  // Check shared_media table
  const { data: sharedMediaData, error: sharedMediaError } = await supabase
    .from('shared_media')
    .select('id')
    .limit(1);

  if (sharedMediaError && sharedMediaError.code === '42P01') {
    console.log('⚠️  shared_media table does not exist. Please run the full migration.');
    process.exit(1);
  } else if (sharedMediaError) {
    console.error('❌ Error checking shared_media:', sharedMediaError.message);
    process.exit(1);
  }

  console.log('✅ shared_media table exists');

  // Check variant_shared_media table
  const { data: junctionData, error: junctionError } = await supabase
    .from('variant_shared_media')
    .select('id')
    .limit(1);

  if (junctionError && junctionError.code === '42P01') {
    console.log('⚠️  variant_shared_media table does not exist. Please run the full migration.');
    process.exit(1);
  } else if (junctionError) {
    console.error('❌ Error checking variant_shared_media:', junctionError.message);
    process.exit(1);
  }

  console.log('✅ variant_shared_media table exists');
  console.log('');
  console.log('🎉 All tables are ready!');
}

initTables().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
