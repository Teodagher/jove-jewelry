const { createClient } = require('@supabase/supabase-js')

async function testImageUrl() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndqxwvascqwhqaoqkpng.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  const jewelryType = 'rings'
  const customizationData = {
    metal: 'whitegold',
    first_stone: 'diamond',
    diamond_size: 'medium',
    size: 'medium 030ct'
  }

  console.log('Generating variant image URL...')
  console.log('Jewelry Type:', jewelryType)
  console.log('Customization Data:', JSON.stringify(customizationData, null, 2))

  // Function to get filename mappings
  async function getFilenameMappings(supabase, jewelryType) {
    try {
      // Get jewelry item IDs for this type
      const { data: jewelryItems } = await supabase
        .from('jewelry_items')
        .select('id')
        .eq('type', jewelryType)
        .eq('is_active', true);

      if (!jewelryItems || jewelryItems.length === 0) {
        return new Map();
      }

      const jewelryItemIds = jewelryItems.map((item) => item.id);

      // Fetch customization options with filename slugs
      const { data: mappings } = await supabase
        .from('customization_options')
        .select('option_id, filename_slug')
        .eq('is_active', true)
        .eq('affects_image_variant', true)
        .in('jewelry_item_id', jewelryItemIds)
        .not('filename_slug', 'is', null);

      const result = new Map();
      for (const m of mappings || []) {
        if (m.option_id && m.filename_slug) {
          result.set(m.option_id, m.filename_slug);
        }
      }
      return result;
    } catch (error) {
      console.error('Error fetching filename mappings:', error);
      return new Map();
    }
  }

  // Function to generate variant image URL
  async function generateVariantImageUrl(
    supabase,
    jewelryType,
    customizations
  ) {
    const baseUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item';
    
    try {
      // Get filename mappings
      const mappingMap = await getFilenameMappings(supabase, jewelryType);
      
      // Build variant options from customizations
      const variantOptions = Object.entries(customizations).map(([setting_id, option_id]) => ({
        setting_id,
        option_id
      }));

      // Extract options by setting
      const chainOption = variantOptions.find(opt => opt.setting_id === 'chain_type');
      const firstStoneOption = variantOptions.find(opt => opt.setting_id === 'first_stone');
      const secondStoneOption = variantOptions.find(opt => opt.setting_id === 'second_stone');
      const metalOption = variantOptions.find(opt => opt.setting_id === 'metal');

      // Build filename parts
      const filenameParts = [jewelryType];

      // Add chain/cord
      if (chainOption) {
        const slug = mappingMap.get(chainOption.option_id) || chainOption.option_id;
        filenameParts.push(slug);
      }

      // Dual-stone logic: when first_stone is diamond, skip it from filename
      const extractStone = (id) => {
        if (id && id.includes('_')) {
          const parts = id.split('_');
          if (parts.length >= 2) {
            const twoWord = parts.slice(-2).join('_');
            if (['blue_sapphire', 'pink_sapphire', 'yellow_sapphire'].includes(twoWord)) return twoWord;
          }
          const last = parts[parts.length - 1];
          if (['ruby', 'emerald', 'diamond', 'sapphire'].includes(last)) return last;
        }
        return id;
      };

      const actualFirstStone = firstStoneOption ? extractStone(firstStoneOption.option_id) : '';

      if (firstStoneOption && actualFirstStone !== 'diamond' && secondStoneOption) {
        // Both stones, first is not diamond
        filenameParts.push(mappingMap.get(firstStoneOption.option_id) || firstStoneOption.option_id);
        filenameParts.push(mappingMap.get(secondStoneOption.option_id) || secondStoneOption.option_id);
      } else if (secondStoneOption) {
        // First stone is diamond (skipped) or absent, include second stone only
        filenameParts.push(mappingMap.get(secondStoneOption.option_id) || secondStoneOption.option_id);
      } else if (firstStoneOption) {
        // Only first stone exists, include it regardless
        filenameParts.push(mappingMap.get(firstStoneOption.option_id) || firstStoneOption.option_id);
      }

      // Add metal
      if (metalOption) {
        const slug = mappingMap.get(metalOption.option_id) || metalOption.option_id;
        filenameParts.push(slug);
      }

      const baseFilename = filenameParts.join('-');
      const folder = `${jewelryType}s`;

      // List files in the folder to find the actual filename (handles different extensions)
      const { data: files, error: listError } = await supabase
        .storage
        .from('customization-item')
        .list(folder, { limit: 1000 });

      if (listError) {
        console.error('Error listing files:', listError);
        return null;
      }

      // Find matching file (case-insensitive)
      const matchingFile = files?.find((f) => {
        const nameWithoutExt = f.name.substring(0, f.name.lastIndexOf('.'));
        return nameWithoutExt.toLowerCase() === baseFilename.toLowerCase();
      });

      if (matchingFile) {
        return `${baseUrl}/${folder}/${matchingFile.name}`;
      }

      // Fallback: try with .webp extension
      return `${baseUrl}/${folder}/${baseFilename}.webp`;
    } catch (error) {
      console.error('Error generating variant URL:', error);
      return null;
    }
  }

  // Generate and print the variant image URL
  const url = await generateVariantImageUrl(supabase, jewelryType, customizationData)
  console.log('Generated URL:', url)

  // Validate URL
  if (url) {
    const response = await fetch(url)
    console.log('Fetch status:', response.status, response.statusText)
    if (response.ok) {
      const contentType = response.headers.get('content-type')
      console.log('Content-Type:', contentType)
      
      const imageBlob = await response.blob()
      console.log('Image size:', imageBlob.size, 'bytes')
    } else {
      console.error('Failed to fetch image')
    }
  }
}

testImageUrl().catch(console.error)