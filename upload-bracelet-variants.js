const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to set this
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Directory containing the bracelet files
const braceletsDir = './bracelets';

// Mapping for renaming files to include black-leather
const fileMapping = {
  'bracelet-blue-sapphire-whitegold.PNG': 'bracelet-black-leather-blue-sapphire-whitegold.PNG',
  'bracelet-blue-sapphire-yellowgold.PNG': 'bracelet-black-leather-blue-sapphire-yellowgold.PNG',
  'bracelet-emerald-whitegold.PNG': 'bracelet-black-leather-emerald-whitegold.PNG',
  'bracelet-pink-sapphire-whitegold.PNG': 'bracelet-black-leather-pink-sapphire-whitegold.PNG',
  'bracelet-pink-sapphire-yellowgold.png': 'bracelet-black-leather-pink-sapphire-yellowgold.png',
  'bracelet-ruby-whitegold.PNG': 'bracelet-black-leather-ruby-whitegold.PNG',
  'bracelet-ruby-whitegold(1).PNG': 'bracelet-black-leather-ruby-whitegold-alt.PNG', // Handle duplicate
  'bracelet.emerald-yellowgold.png': 'bracelet-black-leather-emerald-yellowgold.png',
  'bracelet-preview.png': 'bracelet-black-leather-preview.png'
};

async function uploadBraceletVariants() {
  console.log('Starting bracelet variant upload process...');
  
  try {
    // Read all files in the bracelets directory
    const files = fs.readdirSync(braceletsDir);
    console.log(`Found ${files.length} files in bracelets directory`);
    
    for (const filename of files) {
      if (!filename.toLowerCase().includes('.png')) continue;
      
      const filePath = path.join(braceletsDir, filename);
      const newFilename = fileMapping[filename] || filename;
      const supabasePath = `bracelets/${newFilename}`;
      
      console.log(`Uploading: ${filename} → ${newFilename}`);
      
      // Read file
      const fileBuffer = fs.readFileSync(filePath);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('customization-item')
        .upload(supabasePath, fileBuffer, {
          contentType: 'image/png',
          upsert: true // This will overwrite if file exists
        });
      
      if (error) {
        console.error(`Error uploading ${filename}:`, error);
      } else {
        console.log(`✅ Successfully uploaded: ${newFilename}`);
      }
    }
    
    console.log('\n🎉 Upload process completed!');
    console.log('\nNext steps:');
    console.log('1. Check your Supabase Storage bucket to verify uploads');
    console.log('2. Test the bracelet customization page');
    console.log('3. Delete old files if needed');
    
  } catch (error) {
    console.error('Error during upload process:', error);
  }
}

// Run the upload process
uploadBraceletVariants();
