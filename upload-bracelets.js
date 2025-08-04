const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use the same configuration as your app
const supabaseUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcXh3dmFzY3F3aHFhb3FrcG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODM2NDcsImV4cCI6MjA2OTY1OTY0N30.v1xFg9m6qOv6fhT5Wp1f7TCdhp8KspOiXf8EUC2N8bE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function uploadRenamedFiles() {
  const tempDir = './temp-bracelets';
  
  try {
    const files = fs.readdirSync(tempDir);
    console.log(`Found ${files.length} renamed files to upload`);
    
    for (const filename of files) {
      if (!filename.toLowerCase().endsWith('.png')) continue;
      
      const filePath = path.join(tempDir, filename);
      const supabasePath = `bracelets/${filename}`;
      
      console.log(`Uploading: ${filename}`);
      
      // Read file as buffer
      const fileBuffer = fs.readFileSync(filePath);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('customization-item')
        .upload(supabasePath, fileBuffer, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (error) {
        console.error(`❌ Error uploading ${filename}:`, error.message);
      } else {
        console.log(`✅ Successfully uploaded: ${filename}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 All files uploaded successfully!');
    console.log('\nYou can now test the bracelet customization at:');
    console.log('http://localhost:3000/customize/bracelets');
    
  } catch (error) {
    console.error('Error during upload:', error);
  }
}

uploadRenamedFiles();
