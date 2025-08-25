const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Directory containing the missing bracelet files
const missingBraceletsDir = './missing bracelets';

// Expected files to process
const expectedFiles = [
  'bracelet-whitegold-chain-bluesapphire-whitegold.png',
  'bracelet-whitegold-chain-emerald-whitegold.png', 
  'bracelet-whitegold-chain-pinksapphire-whitegold.png',
  'bracelet-whitegold-chain-ruby-whitegold.png'
];

async function compressWhiteGoldBracelets() {
  console.log('🔗 Compressing missing white gold chain bracelets to WebP...\n');
  
  try {
    // Check if directory exists
    if (!fs.existsSync(missingBraceletsDir)) {
      console.error(`❌ Directory not found: ${missingBraceletsDir}`);
      return;
    }
    
    // Create output directory for compressed images
    const outputDir = './compressed-white-gold-bracelets';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
      console.log(`📁 Created output directory: ${outputDir}`);
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
    
    const results = [];
    
    for (const filename of actualFiles) {
      const inputPath = path.join(missingBraceletsDir, filename);
      const webpFilename = filename.replace('.png', '.webp');
      const outputPath = path.join(outputDir, webpFilename);
      
      console.log(`🔄 Processing: ${filename}`);
      
      try {
        // Convert to high-quality WebP (95% quality like the pictures page)
        await sharp(inputPath)
          .resize({ width: 2560, height: 1440, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 95 })
          .toFile(outputPath);
        
        // Get file sizes for comparison
        const originalStats = fs.statSync(inputPath);
        const compressedStats = fs.statSync(outputPath);
        const savings = Math.round(((originalStats.size - compressedStats.size) / originalStats.size) * 100);
        
        console.log(`   ✅ Converted to WebP: ${webpFilename}`);
        console.log(`   📊 Original: ${(originalStats.size / 1024).toFixed(1)} KB`);
        console.log(`   📊 Compressed: ${(compressedStats.size / 1024).toFixed(1)} KB`);
        console.log(`   💾 Savings: ${savings}%`);
        
        results.push({
          original: filename,
          compressed: webpFilename,
          originalSize: originalStats.size,
          compressedSize: compressedStats.size,
          savings: savings
        });
        
      } catch (error) {
        console.error(`   ❌ Error processing ${filename}:`, error.message);
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('🎉 Compression completed!\n');
    console.log('📋 Summary:');
    console.log(`   • Processed ${results.length} images`);
    console.log(`   • Compressed to 95% quality WebP format`);
    console.log(`   • Output directory: ${outputDir}`);
    
    if (results.length > 0) {
      const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
      const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
      const totalSavings = Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100);
      
      console.log(`   • Total original size: ${(totalOriginal / 1024).toFixed(1)} KB`);
      console.log(`   • Total compressed size: ${(totalCompressed / 1024).toFixed(1)} KB`);
      console.log(`   • Total savings: ${totalSavings}%`);
    }
    
    console.log('');
    console.log('📂 Compressed files ready for upload:');
    results.forEach(r => {
      console.log(`   • ${r.compressed}`);
    });
    
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Upload the WebP files from the compressed-white-gold-bracelets/ directory');
    console.log('2. Upload to Supabase Storage: customization-item/bracelets/');
    console.log('3. Update the CustomizationService to include white gold chain combinations');
    console.log('4. Test the bracelet customization with white gold chain options');
    
  } catch (error) {
    console.error('❌ Error during compression:', error);
  }
}

// Check if Sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.error('❌ Sharp is not installed. Please run: npm install sharp');
  process.exit(1);
}

// Run the compression
compressWhiteGoldBracelets();
