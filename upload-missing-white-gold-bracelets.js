const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Directory containing the missing bracelet files
const missingBraceletsDir = './missing bracelets';

// Expected files to process
const expectedFiles = [
  'bracelet-whitegold-chain-bluesapphire-whitegold.png',
  'bracelet-whitegold-chain-emerald-whitegold.png', 
  'bracelet-whitegold-chain-pinksapphire-whitegold.png',
  'bracelet-whitegold-chain-ruby-whitegold.png'
];

async function processAndUploadWhiteGoldBracelets() {
  console.log('🔗 Processing missing white gold chain bracelets...\n');
  
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    console.log('Please run: export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    return;
  }
  
  try {
    // Check if directory exists
    if (!fs.existsSync(missingBraceletsDir)) {
      console.error(`❌ Directory not found: ${missingBraceletsDir}`);
      return;
    }
    
    // Read all files in the directory
    const actualFiles = fs.readdirSync(missingBraceletsDir)
      .filter(file => file.toLowerCase().endsWith('.png'));
    
    console.log(`📁 Found ${actualFiles.length} PNG files in directory`);
    console.log('Files:', actualFiles);
    console.log('');
    
    if (actualFiles.length === 0) {
      console.warn('⚠️  No PNG files found in the directory');
      return;
    }
    
    for (const filename of actualFiles) {
      const inputPath = path.join(missingBraceletsDir, filename);
      const webpFilename = filename.replace('.png', '.webp');
      const outputPath = path.join(missingBraceletsDir, webpFilename);
      
      console.log(`🔄 Processing: ${filename}`);
      
      try {
        // Step 1: Convert to high-quality WebP (95% quality like the pictures page)
        await sharp(inputPath)
          .resize({ width: 2560, height: 1440, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 95 })
          .toFile(outputPath);
        
        // Get file sizes for comparison
        const originalStats = fs.statSync(inputPath);
        const compressedStats = fs.statSync(outputPath);
        const savings = Math.round(((originalStats.size - compressedStats.size) / originalStats.size) * 100);
        
        console.log(`   ✅ Converted to WebP`);
        console.log(`   📊 Original: ${(originalStats.size / 1024).toFixed(1)} KB`);
        console.log(`   📊 Compressed: ${(compressedStats.size / 1024).toFixed(1)} KB`);
        console.log(`   💾 Savings: ${savings}%`);
        
        // Step 2: Upload to Supabase Storage
        const webpBuffer = fs.readFileSync(outputPath);
        const supabasePath = `bracelets/${webpFilename}`;
        
        console.log(`   ⬆️  Uploading to: ${supabasePath}`);
        
        const { data, error } = await supabase.storage
          .from('customization-item')
          .upload(supabasePath, webpBuffer, {
            contentType: 'image/webp',
            upsert: true // Overwrite if exists
          });
        
        if (error) {
          console.error(`   ❌ Upload error:`, error);
        } else {
          console.log(`   🎯 Successfully uploaded: ${webpFilename}`);
        }
        
        // Clean up temporary WebP file
        fs.unlinkSync(outputPath);
        console.log(`   🗑️  Cleaned up temporary file`);
        
      } catch (error) {
        console.error(`   ❌ Error processing ${filename}:`, error.message);
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('🎉 Processing completed!\n');
    console.log('📋 Summary:');
    console.log(`   • Processed ${actualFiles.length} images`);
    console.log(`   • Compressed to 95% quality WebP format`);
    console.log(`   • Uploaded to Supabase Storage: customization-item/bracelets/`);
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Update the CustomizationService to include white gold chain combinations');
    console.log('2. Test the bracelet customization with white gold chain options');
    console.log('3. Verify images load correctly in the browser');
    
  } catch (error) {
    console.error('❌ Error during processing:', error);
  }
}

// Check if Sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.error('❌ Sharp is not installed. Please run: npm install sharp');
  process.exit(1);
}

// Run the process
processAndUploadWhiteGoldBracelets();
