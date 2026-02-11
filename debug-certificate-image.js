const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ndqxwvascqwhqaoqkpng.supabase.co';
const SUPABASE_KEY = 'sbp_b0cee0436eaf8521974230a5dfdc72394f9f8d3f';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getFilenameMappings(jewelryType) {
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
    const { data: mappings, error } = await supabase
      .from('customization_options')
      .select('option_id, filename_slug, setting_id')
      .eq('is_active', true)
      .eq('affects_image_variant', true)
      .in('jewelry_item_id', jewelryItemIds)
      .not('filename_slug', 'is', null);

    console.log('Mappings Query Error:', error);
    console.log('Mappings Results:', mappings);

    const result = new Map();
    for (const m of mappings || []) {
      if (m.option_id && m.filename_slug) {
        result.set(m.option_id, m.filename_slug);
        console.log(`Option: ${m.option_id}, Slug: ${m.filename_slug}, Setting: ${m.setting_id}`);
      }
    }
    return result;
  } catch (error) {
    console.error('Error fetching filename mappings:', error);
    return new Map();
  }
}

async function generateVariantImageUrl(jewelryType, customizations) {
  const baseUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item';
  
  try {
    // Get filename mappings
    const mappingMap = await getFilenameMappings(jewelryType);
    
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

    console.log('Variant Options:', variantOptions);
    console.log('First Stone Option:', firstStoneOption);
    console.log('Second Stone Option:', secondStoneOption);
    console.log('Actual First Stone:', actualFirstStone);

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
    const folder = ['rings', 'bracelets', 'earrings'].includes(jewelryType) 
      ? jewelryType 
      : `${jewelryType}s`;

    console.log('Base Filename:', baseFilename);
    console.log('Folder:', folder);

    // Return constructed URL
    return `${baseUrl}/${folder}/${baseFilename}.webp`;
  } catch (error) {
    console.error('Error generating variant URL:', error);
    return null;
  }
}

async function main() {
  const customizations = {
    metal: 'white_gold',
    first_stone: 'lab_grown_diamond',
    second_stone: 'lab_grown_emerald'
  };

  const jewelryType = 'bracelets';

  console.log('Generating variant image URL...');
  const variantUrl = await generateVariantImageUrl(jewelryType, customizations);
  console.log('Variant Image URL:', variantUrl);
}

main().catch(console.error);