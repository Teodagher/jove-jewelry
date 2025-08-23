const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Supabase configuration
const supabaseUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Files to process
const blackOnyxFiles = [
  'bracelet-black-leather-blackonyx-whitegold.png',
  'bracelet-black-leather-blackonyx-yellowgold.png'
];

async function convertToWebP(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp({ quality: 90 })
      .toFile(outputPath);
    console.log(`✅ Converted ${path.basename(inputPath)} to WebP`);
    return true;
  } catch (error) {
    console.error(`❌ Error converting ${path.basename(inputPath)} to WebP:`, error);
    return false;
  }
}

async function uploadToSupabase(filePath, supabasePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    const { data, error } = await supabase.storage
      .from('customization-item')
      .upload(supabasePath, fileBuffer, {
        contentType: 'image/webp',
        upsert: true
      });
    
    if (error) {
      console.error(`❌ Error uploading ${supabasePath}:`, error);
      return false;
    } else {
      console.log(`✅ Successfully uploaded: ${supabasePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error uploading ${supabasePath}:`, error);
    return false;
  }
}

async function uploadBlackOnyxBracelets() {
  console.log('🖤 Starting Black Onyx bracelet upload process...\n');
  
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
    console.log('Please set it with: export SUPABASE_SERVICE_ROLE_KEY=your_key_here');
    return;
  }
  
  let totalProcessed = 0;
  let totalUploaded = 0;
  
  for (const filename of blackOnyxFiles) {
    console.log(`\n📸 Processing: ${filename}`);
    
    if (!fs.existsSync(filename)) {
      console.warn(`⚠️  File not found: ${filename}`);
      continue;
    }
    
    totalProcessed++;
    
    // Convert PNG to WebP
    const webpFilename = filename.replace('.png', '.webp');
    const conversionSuccess = await convertToWebP(filename, webpFilename);
    
    if (!conversionSuccess) continue;
    
    // Upload to Supabase
    const supabasePath = `bracelets/${webpFilename}`;
    const uploadSuccess = await uploadToSupabase(webpFilename, supabasePath);
    
    if (uploadSuccess) {
      totalUploaded++;
    }
    
    // Clean up local WebP file
    try {
      fs.unlinkSync(webpFilename);
      console.log(`🧹 Cleaned up local file: ${webpFilename}`);
    } catch (error) {
      console.warn(`⚠️  Could not clean up ${webpFilename}:`, error.message);
    }
  }
  
  console.log('\n🎉 Black Onyx bracelet upload process completed!');
  console.log(`📊 Processed: ${totalProcessed} files`);
  console.log(`📤 Uploaded: ${totalUploaded} files`);
  
  if (totalUploaded > 0) {
    console.log('\n✨ Your Black Onyx bracelet variants are now available!');
    console.log('\nNext steps:');
    console.log('1. Check your Supabase Storage → customization-item → bracelets/');
    console.log('2. Test the bracelet customization with Black Onyx selection');
    console.log('3. Verify the stone combination logic works correctly');
  }
}

// Run the upload process
uploadBlackOnyxBracelets();
