const sharp = require('sharp');
const fs = require('fs');

async function convertToWebP() {
  const files = [
    'bracelet-black-leather-blackonyx-whitegold.png',
    'bracelet-black-leather-blackonyx-yellowgold.png'
  ];

  console.log('🖤 Converting Black Onyx bracelet images to WebP...\n');

  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.warn(`⚠️  File not found: ${file}`);
      continue;
    }

    const outputFile = file.replace('.png', '.webp');
    
    try {
      await sharp(file)
        .webp({ quality: 90 })
        .toFile(outputFile);
      
      console.log(`✅ Converted: ${file} → ${outputFile}`);
      
      // Get file info
      const stats = fs.statSync(outputFile);
      console.log(`   📊 Size: ${(stats.size / 1024).toFixed(1)} KB`);
      
    } catch (error) {
      console.error(`❌ Error converting ${file}:`, error.message);
    }
  }
  
  console.log('\n🎉 Conversion completed!');
  console.log('\nNext steps:');
  console.log('1. Upload the .webp files to Supabase Storage:');
  console.log('   - Go to your Supabase dashboard');
  console.log('   - Navigate to Storage → customization-item bucket');
  console.log('   - Go to the bracelets folder');
  console.log('   - Upload the .webp files manually');
  console.log('2. Test the Black Onyx customization');
}

convertToWebP();
