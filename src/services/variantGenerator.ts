// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { supabase } from '@/lib/supabase/client';
import LogicRulesEngine from './logicRulesEngine';

export interface VariantOption {
  setting_id: string;
  setting_title: string;
  option_id: string;
  option_name: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  filename: string;
  options: VariantOption[];
  imageUrl: string | null;
  exists: boolean;
}

export interface VariantGenerationResult {
  variants: ProductVariant[];
  totalVariants: number;
  existingImages: number;
  missingImages: number;
}

export class VariantGenerator {
  private supabaseClient = supabase;

  /**
   * Generate all possible variants for a product based on its customization options
   * Now respects dynamic logic rules to exclude impossible combinations
   */
  async generateVariantsForProduct(productId: string, productType: string): Promise<VariantGenerationResult> {
    try {
      console.log(`🔧 Starting variant generation for product ${productId} (${productType})`);
      
      // Fetch all customization options for this product
      const { data: options, error } = await this.supabaseClient
        .from('customization_options')
        .select('*')
        .eq('jewelry_item_id', productId)
        .eq('is_active', true)
        .order('setting_display_order')
        .order('display_order');

      if (error) {
        console.error('❌ Error fetching customization options:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`📋 Found ${options?.length || 0} customization options`);

      if (!options || options.length === 0) {
        console.log('⚠️ No customization options found for this product');
        return {
          variants: [],
          totalVariants: 0,
          existingImages: 0,
          missingImages: 0
        };
      }

      // Initialize rules engine for this product
      console.log(`🔧 Loading rules engine for product ${productId}...`);
      const rulesEngine = await LogicRulesEngine.create(productId);
      console.log(`✅ Rules engine loaded with ${rulesEngine ? 'rules' : 'no rules'}`);

      // Convert options to rules engine format for validation
      const allSettings = this.convertOptionsToRulesFormat(options);

      // Group options by setting_id, but only include settings that affect image variants
      const settingsMap = new Map<string, VariantOption[]>();
      
      options.forEach(option => {
        // Skip settings that don't affect image variants (e.g., diamond type, ring size)
        if (option.affects_image_variant === false) {
          console.log(`⏭️ Skipping setting "${option.setting_title}" (doesn't affect image variants)`);
          return;
        }

        if (!settingsMap.has(option.setting_id)) {
          settingsMap.set(option.setting_id, []);
        }
        settingsMap.get(option.setting_id)!.push({
          setting_id: option.setting_id,
          setting_title: option.setting_title,
          option_id: option.option_id,
          option_name: option.option_name
        });
      });

      console.log(`🔄 Grouped into ${settingsMap.size} settings:`, Array.from(settingsMap.keys()));
      
      // Debug: Show all options for each setting
      settingsMap.forEach((options, settingId) => {
        const settingTitle = options[0]?.setting_title || 'Unknown';
        console.log(`📋 Setting "${settingTitle}" (${settingId}):`, options.map(o => `${o.option_name} (${o.option_id})`));
      });

      // Generate all possible combinations that pass rules validation
      const settingsArray = Array.from(settingsMap.values());
      console.log(`🔢 Generating combinations from ${settingsArray.length} setting groups...`);
      
      const allVariants = this.generateCombinations(settingsArray);
      console.log(`🔄 Generated ${allVariants.length} raw combinations, now filtering with rules...`);
      
      // Debug: Show first few raw combinations to verify they're being generated correctly
      console.log(`📋 First 5 raw combinations:`, allVariants.slice(0, 5).map(variant => 
        variant.map(o => `${o.setting_title}: ${o.option_name}`).join(' + ')
      ));
      
      // Filter variants using rules engine
      const validVariants = this.filterVariantsWithRules(allVariants, rulesEngine, allSettings);
      console.log(`✅ ${validVariants.length} valid variants after rules filtering (${allVariants.length - validVariants.length} excluded)`);

      // Convert to ProductVariant format with naming logic
      const productVariants: ProductVariant[] = [];
      
      // First, generate all variants without checking image existence (much faster)
      for (let i = 0; i < validVariants.length; i++) {
        const variant = validVariants[i];
        const filename = this.generateVariantFilename(productType, variant);
        const variantName = this.generateVariantName(variant);
        
        // Debug: Show variant details (commented out for cleaner logs)
        // console.log(`🔍 Variant ${i + 1}/${validVariants.length}:`, {
        //   name: variantName,
        //   filename: filename,
        //   options: variant.map(o => `${o.setting_title}: ${o.option_name} (${o.option_id})`)
        // });
        
        // Generate unique ID based on actual options to prevent collisions
        const optionIds = variant.map(o => o.option_id).sort().join('-');
        const variantId = `${productId}_${optionIds}`;
        
        // For necklaces and bracelets, check if this filename already exists in our variants
        // If so, we'll reuse the existing variant for multiple option combinations
        if (productType === 'necklace' || productType === 'bracelet') {
          const existingVariant = productVariants.find(v => v.filename === filename);
          if (existingVariant) {
            // Skip creating a duplicate variant - multiple option combinations 
            // can share the same base image (e.g., different accent colors or stone combinations)
            console.log(`⏭️ Skipping duplicate ${productType} variant: ${filename} (already exists for variant ${existingVariant.name})`);
            console.log(`   Current variant options: ${variant.map(o => `${o.setting_title}:${o.option_name}`).join(', ')}`);
            console.log(`   Existing variant options: ${existingVariant.options.map(o => `${o.setting_title}:${o.option_name}`).join(', ')}`);
            continue;
          }
        }
        
        productVariants.push({
          id: variantId,
          name: variantName,
          filename,
          options: variant,
          imageUrl: null,
          exists: false
        });
      }

      // Then batch check image existence for better performance
      await this.batchCheckImageExistence(productType, productVariants);

      const existingImages = productVariants.filter(v => v.exists).length;
      const missingImages = productVariants.length - existingImages;

      return {
        variants: productVariants,
        totalVariants: productVariants.length,
        existingImages,
        missingImages
      };

    } catch (error) {
      console.error('Error generating variants:', error);
      throw error;
    }
  }

  /**
   * Generate all combinations from grouped options
   */
  private generateCombinations(settingsArray: VariantOption[][]): VariantOption[][] {
    if (settingsArray.length === 0) return [];
    if (settingsArray.length === 1) return settingsArray[0].map(option => [option]);

    const result: VariantOption[][] = [];
    const [firstSetting, ...restSettings] = settingsArray;
    const restCombinations = this.generateCombinations(restSettings);

    for (const option of firstSetting) {
      if (restCombinations.length === 0) {
        result.push([option]);
      } else {
        for (const combination of restCombinations) {
          result.push([option, ...combination]);
        }
      }
    }

    return result;
  }

  /**
   * Generate variant filename based on product type and options
   */
  private generateVariantFilename(productType: string, options: VariantOption[]): string {
    console.log(`🎯 generateVariantFilename called with productType: "${productType}" (type: ${typeof productType}), options:`, options);
    
    if (productType === 'bracelet') {
      console.log(`📿 ✅ MATCH! Calling generateBraceletFilename for bracelet`);
      return this.generateBraceletFilename(options);
    } else if (productType === 'ring') {
      console.log(`💍 Calling generateRingFilename for ring`);
      return this.generateRingFilename(options);
    } else if (productType === 'necklace') {
      console.log(`📿 Calling generateNecklaceFilename for necklace`);
      return this.generateNecklaceFilename(options);
    }
    
    // For other product types, use a generic format with dual stone logic
    console.log(`❓ Unknown product type "${productType}", using generic format with dual stone logic`);
    
    // Apply the same dual stone logic for unknown product types
    let firstStone = '';
    let secondStone = '';
    const otherOptions: string[] = [];
    
    options.forEach(option => {
      const settingTitle = option.setting_title.toLowerCase();
      const optionId = option.option_id;
      
      if (settingTitle.includes('stone') && settingTitle.includes('first')) {
        firstStone = optionId;
      } else if (settingTitle.includes('stone') && settingTitle.includes('second')) {
        secondStone = optionId;
      } else {
        otherOptions.push(optionId);
      }
    });
    
    // Helper function to extract stone name from contextual IDs
    const extractStoneFromContextual = (stoneId: string): string => {
      if (stoneId && stoneId.includes('_')) {
        const parts = stoneId.split('_');
        const lastPart = parts[parts.length - 1];
        if (['ruby', 'emerald', 'diamond', 'sapphire'].includes(lastPart)) {
          return lastPart;
        }
        // Try two-word stones
        if (parts.length >= 2) {
          const twoWordStone = parts.slice(-2).join('_');
          if (twoWordStone.includes('sapphire')) {
            return twoWordStone;
          }
        }
      }
      return stoneId;
    };
    
    const actualFirstStone = firstStone ? extractStoneFromContextual(firstStone) : '';
    
    // Build filename parts
    const filenameParts = [productType];
    
    // Add stones based on dual stone logic
    if (firstStone && actualFirstStone !== 'diamond' && secondStone) {
      // Use both stones for non-diamond first stone combinations
      filenameParts.push(firstStone, secondStone);
      console.log(`🎯 Generic dual stone: ${firstStone} + ${secondStone}`);
    } else if (secondStone) {
      // Use second stone if available
      filenameParts.push(secondStone);
    } else if (firstStone) {
      // Use first stone as fallback
      filenameParts.push(firstStone);
    }
    
    // Add other options
    filenameParts.push(...otherOptions);
    
    return `${filenameParts.join('-')}.webp`;
  }

  /**
   * Generate bracelet-specific filename following the existing convention
   */
  private generateBraceletFilename(options: VariantOption[]): string {
    console.log(`🚨 BRACELET FILENAME DEBUG - Starting generation for variant with ${options.length} options`);
    // Initialize variables for bracelet components
    let chainType = '';
    let metal = '';
    let stone = '';
    let secondStone = '';

    // Extract option values based on setting types
    console.log(`🔍 Processing bracelet options:`, options.map(o => `${o.setting_title}: ${o.option_id} (${o.option_name})`));
    options.forEach(option => {
      const settingTitle = option.setting_title.toLowerCase();
      const optionId = option.option_id;

      if (settingTitle.includes('chain') || settingTitle.includes('cord')) {
        chainType = optionId;
      } else if (settingTitle.includes('metal')) {
        metal = optionId;
      } else if (settingTitle.includes('stone') && settingTitle.includes('first')) {
        stone = optionId;
        console.log(`🎯 Found FIRST stone: ${optionId} from setting "${option.setting_title}"`);
      } else if (settingTitle.includes('stone') && settingTitle.includes('second')) {
        secondStone = optionId;
        console.log(`🎯 Found SECOND stone: ${optionId} from setting "${option.setting_title}"`);
      } else if (settingTitle.includes('stone') && !stone) {
        stone = optionId; // Fallback for single stone setting
        console.log(`🎯 Found fallback stone: ${optionId} from setting "${option.setting_title}"`);
      }
    });

    // Apply the same logic as in CustomizationService
    const metalMap: { [key: string]: string } = {
      'white_gold': 'whitegold',
      'yellow_gold': 'yellowgold'
    };

    const stoneMap: { [key: string]: string } = {
      'blue_sapphire': 'blue-sapphire',
      'pink_sapphire': 'pink-sapphire',
      'yellow_sapphire': 'yellow-sapphire',
      'emerald': 'emerald',
      'ruby': 'ruby',
      'rubyy': 'ruby', // Map rubyy variant to ruby naming
      'black_onyx': 'blackonyx',
      'black_onyx_emerald': 'blackonyx', // Map Black Onyx variant to same naming
      'diamond': 'diamond'
    };

    const whiteGoldChainStoneMap: { [key: string]: string } = {
      'blue_sapphire': 'bluesapphire',
      'pink_sapphire': 'pinksapphire',
      'yellow_sapphire': 'yellowsapphire',
      'emerald': 'emerald',
      'ruby': 'ruby',
      'rubyy': 'ruby' // Map rubyy variant to ruby naming for white gold chains
    };

    const chainMap: { [key: string]: string } = {
      'black_leather': 'black-leather',
      'gold_cord': 'gold-cord',
      'white_gold_chain': 'whitegold-chain'
    };

    // Smart chain mapping
    if (chainType === 'gold_cord' && metal === 'white_gold') {
      chainType = 'white_gold_chain';
    }

    // Helper function to extract stone name from contextual IDs (e.g., "first_stone_ruby" → "ruby")
    const extractStoneFromContextual = (stoneId: string): string => {
      // If it contains an underscore and ends with a known stone, extract it
      if (stoneId.includes('_')) {
        const parts = stoneId.split('_');
        const lastPart = parts[parts.length - 1];
        // Check if the last part is a known stone
        if (stoneMap[lastPart] || whiteGoldChainStoneMap[lastPart]) {
          return lastPart;
        }
        // Try two-word stones like "blue_sapphire", "pink_sapphire", etc.
        if (parts.length >= 2) {
          const twoWordStone = parts.slice(-2).join('_');
          if (stoneMap[twoWordStone] || whiteGoldChainStoneMap[twoWordStone]) {
            return twoWordStone;
          }
        }
      }
      return stoneId; // Return original if no pattern matches
    };

    // For bracelets, we need to create unique variants for first + second stone combinations
    // Each combination should have a unique filename to represent the specific stone pairing
    let finalStone = secondStone; // Default: use second stone
    let finalSecondStone = '';
    
    // Extract actual stone names from contextual IDs for comparison
    const actualFirstStone = stone ? extractStoneFromContextual(stone) : '';
    const actualSecondStone = secondStone ? extractStoneFromContextual(secondStone) : '';
    
    let usingFirstStone = false;
    let usingBothStones = false;
    
    if (actualFirstStone === 'black_onyx') {
      finalStone = 'black_onyx';  // Black Onyx combinations use blackonyx filename
      console.log(`🖤 Black Onyx detected as first stone, using black_onyx for variant`);
    } else if (stone && actualFirstStone !== 'diamond') {
      // When first stone is not diamond, we need unique variants for each first+second stone combination
      finalStone = stone; // Use first stone
      finalSecondStone = actualSecondStone; // Include second stone in filename
      usingFirstStone = true;
      usingBothStones = true;
      console.log(`🎯 Using BOTH stones for variant: ${stone} (${actualFirstStone}) + ${secondStone} (${actualSecondStone})`);
    } else if (secondStone) {
      finalStone = secondStone; // Use second stone
      console.log(`🎯 Using SECOND stone for variant: ${secondStone} → ${actualSecondStone}`);
    }
    
    console.log(`🔍 Bracelet stone selection: first="${stone}" (${actualFirstStone}), second="${secondStone}" (${actualSecondStone}), final="${finalStone}"`);
    
    // If we have no stone at all, skip this variant
    if (!finalStone) {
      console.log(`⚠️ No stone found for bracelet variant, skipping`);
      return 'bracelet-no-stone.webp'; // This will likely not match any files
    }
    
    // Map values to filename format
    const mappedChain = chainMap[chainType] || chainType;
    const mappedMetal = metalMap[metal] || metal;

    // Stone selection is now handled above using CustomizationService logic

    // Extract actual stone name from potentially contextual ID
    const actualStone = extractStoneFromContextual(finalStone);
    
    // Use different stone mapping for white gold chain
    let mappedStone: string;
    if (chainType === 'white_gold_chain' || chainType === 'whitegold_chain') {
      mappedStone = whiteGoldChainStoneMap[actualStone] || stoneMap[actualStone] || actualStone;
    } else {
      mappedStone = stoneMap[actualStone] || actualStone;
    }

    // Generate filename based on stone combination
    let filename: string;
    if (usingBothStones && finalSecondStone) {
      // For dual stone combinations, include both stones in filename
      let mappedSecondStone: string;
      if (chainType === 'white_gold_chain' || chainType === 'whitegold_chain') {
        mappedSecondStone = whiteGoldChainStoneMap[finalSecondStone] || stoneMap[finalSecondStone] || finalSecondStone;
      } else {
        mappedSecondStone = stoneMap[finalSecondStone] || finalSecondStone;
      }
      filename = `bracelet-${mappedChain}-${mappedStone}-${mappedSecondStone}-${mappedMetal}.webp`;
    } else {
      // Single stone or traditional logic
      const stonePrefix = usingFirstStone && !usingBothStones ? 'first-' : '';
      filename = `bracelet-${mappedChain}-${stonePrefix}${mappedStone}-${mappedMetal}.webp`;
    }
    console.log(`🔧 Generated bracelet filename: ${filename} from chain:${chainType}, stone:${finalStone}, metal:${metal}`);
    console.log(`🗺️ Stone extraction: ${finalStone} → ${actualStone} → ${mappedStone}`);
    console.log(`🔍 Available in stoneMap: ${Object.keys(stoneMap).join(', ')}`);
    return filename;
  }

  /**
   * Generate ring-specific filename following the existing convention: "Ring {stone} {metal}.webp"
   */
  private generateRingFilename(options: VariantOption[]): string {
    let metal = '';
    let firstStone = '';
    let secondStone = '';

    // Extract relevant options (skip ring size, diamond type, stone size, engraving)
    options.forEach(option => {
      const settingTitle = option.setting_title.toLowerCase();
      const optionId = option.option_id;

      if (settingTitle.includes('metal')) {
        metal = optionId;
      } else if (settingTitle.includes('stone') && settingTitle.includes('first')) {
        firstStone = optionId;
        console.log(`🎯 Found FIRST stone for ring: ${optionId} from setting "${option.setting_title}"`);
      } else if (settingTitle.includes('stone') && settingTitle.includes('second')) {
        secondStone = optionId;
        console.log(`🎯 Found SECOND stone for ring: ${optionId} from setting "${option.setting_title}"`);
      }
    });

    // Apply dual stone logic for rings - create unique variants for first + second stone combinations
    let finalStone = secondStone; // Default: use second stone
    let finalSecondStone = '';
    
    // Helper function to extract stone name from contextual IDs
    const extractStoneFromContextual = (stoneId: string): string => {
      if (stoneId && stoneId.includes('_')) {
        const parts = stoneId.split('_');
        const lastPart = parts[parts.length - 1];
        // Try two-word stones like "blue_sapphire", "pink_sapphire", etc.
        if (parts.length >= 2) {
          const twoWordStone = parts.slice(-2).join('_');
          if (['blue_sapphire', 'pink_sapphire', 'yellow_sapphire'].includes(twoWordStone)) {
            return twoWordStone;
          }
        }
        if (['ruby', 'emerald', 'diamond'].includes(lastPart)) {
          return lastPart;
        }
      }
      return stoneId;
    };

    const actualFirstStone = firstStone ? extractStoneFromContextual(firstStone) : '';
    const actualSecondStone = secondStone ? extractStoneFromContextual(secondStone) : '';
    
    let usingBothStones = false;
    
    // When first stone is not diamond, we need unique variants for each first+second stone combination
    if (firstStone && actualFirstStone !== 'diamond') {
      finalStone = firstStone;
      finalSecondStone = actualSecondStone;
      usingBothStones = true;
      console.log(`🎯 Using BOTH stones for ring variant: ${firstStone} (${actualFirstStone}) + ${secondStone} (${actualSecondStone})`);
    } else if (secondStone) {
      finalStone = secondStone;
      console.log(`🎯 Using SECOND stone for ring variant: ${secondStone} → ${actualSecondStone}`);
    }

    console.log(`🔍 Ring stone selection: first="${firstStone}" (${actualFirstStone}), second="${secondStone}" (${actualSecondStone}), final="${finalStone}"`);
    
    const stone = finalStone;

    // Map option IDs to display names for the filename
    const stoneMap: { [key: string]: string } = {
      'blue_sapphire': 'blue sapphire',
      'pink_sapphire': 'pink sapphire',
      'yellow_sapphire': 'yellow sapphire',
      'emerald': 'emerald',
      'ruby': 'ruby',
      'rubyy': 'ruby' // Map rubyy variant to ruby naming
    };

    const metalMap: { [key: string]: string } = {
      'white_gold': 'white gold',
      'yellow_gold': 'yellow gold'
    };

    const stoneString = stoneMap[stone] || stone;
    const metalString = metalMap[metal] || metal;

    // Generate filename based on stone combination
    let filename: string;
    if (usingBothStones && finalSecondStone) {
      // For dual stone combinations, include both stones in filename
      const secondStoneString = stoneMap[finalSecondStone] || finalSecondStone;
      filename = `Ring ${stoneString} ${secondStoneString} ${metalString}.webp`;
      console.log(`🔧 Generated dual stone ring filename: "${filename}" from stones: "${stone}" + "${finalSecondStone}", metal: "${metal}"`);
    } else {
      // Single stone or traditional logic
      filename = `Ring ${stoneString} ${metalString}.webp`;
      console.log(`🔧 Generated ring filename: "${filename}" from stone: "${stone}", metal: "${metal}"`);
    }
    
    return filename;
  }

  /**
   * Generate necklace-specific filename following the original format: "necklace-{chain}-{stone}-{metal}.webp"
   */
  private generateNecklaceFilename(options: VariantOption[]): string {
    let chainType = '';
    let metal = '';
    let firstStone = '';
    let secondStone = '';

    // Extract the core options that determine the image variant (chain, first stone, second stone, metal)
    options.forEach(option => {
      const settingTitle = option.setting_title.toLowerCase();
      const optionId = option.option_id;

      if (settingTitle.includes('chain') || settingTitle.includes('cord')) {
        chainType = optionId;
      } else if (settingTitle.includes('metal')) {
        metal = optionId;
      } else if (settingTitle.includes('stone') && settingTitle.includes('first')) {
        firstStone = optionId;
        console.log(`🎯 Found FIRST stone for necklace: ${optionId} from setting "${option.setting_title}"`);
      } else if (settingTitle.includes('stone') && settingTitle.includes('second')) {
        secondStone = optionId;
        console.log(`🎯 Found SECOND stone for necklace: ${optionId} from setting "${option.setting_title}"`);
      } else if (settingTitle.includes('stone') && !settingTitle.includes('diamond') && !firstStone) {
        // Fallback for single stone setting
        firstStone = optionId;
        console.log(`🎯 Found fallback stone for necklace: ${optionId} from setting "${option.setting_title}"`);
      }
    });

    // Apply dual stone logic for necklaces
    // Helper function to extract stone name from contextual IDs
    const extractStoneFromContextual = (stoneId: string): string => {
      if (stoneId && stoneId.includes('_')) {
        const parts = stoneId.split('_');
        const lastPart = parts[parts.length - 1];
        // Try two-word stones like "blue_sapphire", "pink_sapphire", etc.
        if (parts.length >= 2) {
          const twoWordStone = parts.slice(-2).join('_');
          if (['blue_sapphire', 'pink_sapphire', 'yellow_sapphire'].includes(twoWordStone)) {
            return twoWordStone;
          }
        }
        if (['ruby', 'emerald', 'diamond'].includes(lastPart)) {
          return lastPart;
        }
      }
      return stoneId;
    };

    const actualFirstStone = firstStone ? extractStoneFromContextual(firstStone) : '';
    const actualSecondStone = secondStone ? extractStoneFromContextual(secondStone) : '';
    
    let finalStone = secondStone || firstStone; // Default: use second stone or first if no second
    let finalSecondStone = '';
    let usingBothStones = false;
    
    // When first stone is not diamond, we need unique variants for each first+second stone combination
    if (firstStone && actualFirstStone !== 'diamond' && secondStone) {
      finalStone = firstStone;
      finalSecondStone = actualSecondStone;
      usingBothStones = true;
      console.log(`🎯 Using BOTH stones for necklace variant: ${firstStone} (${actualFirstStone}) + ${secondStone} (${actualSecondStone})`);
    } else if (secondStone) {
      finalStone = secondStone;
      console.log(`🎯 Using SECOND stone for necklace variant: ${secondStone} → ${actualSecondStone}`);
    } else if (firstStone) {
      finalStone = firstStone;
      console.log(`🎯 Using FIRST stone for necklace variant: ${firstStone} → ${actualFirstStone}`);
    }
    
    console.log(`🔍 Necklace stone selection: first="${firstStone}" (${actualFirstStone}), second="${secondStone}" (${actualSecondStone}), final="${finalStone}"`);

    // Map option IDs to filename format (using original mapping)
    const metalMap: { [key: string]: string } = {
      'white_gold': 'whitegold',
      'yellow_gold': 'yellowgold'
    };
    
    const stoneMap: { [key: string]: string } = {
      'blue_sapphire': 'bluesapphire',
      'pink_sapphire': 'pinksapphire',
      'yellow_sapphire': 'yellowsapphire',
      'emerald': 'emerald',
      'ruby': 'ruby',
      'rubyy': 'ruby' // Map rubyy variant to ruby naming
    };
    
    const chainMap: { [key: string]: string } = {
      'black_leather': 'black-leather',
      'white_gold_chain': 'white-gold',
      'yellow_gold_chain_real': 'yellow-gold'
    };

    // Map values using original format
    const mappedChain = chainMap[chainType] || chainType;
    const mappedMetal = metalMap[metal] || metal;
    
    // Extract actual stone name from potentially contextual ID
    const actualFinalStone = extractStoneFromContextual(finalStone);
    const mappedStone = stoneMap[actualFinalStone] || actualFinalStone;

    // Generate filename based on stone combination
    let filename: string;
    if (usingBothStones && finalSecondStone) {
      // For dual stone combinations, include both stones in filename
      const mappedSecondStone = stoneMap[finalSecondStone] || finalSecondStone;
      filename = `necklace-${mappedChain}-${mappedStone}-${mappedSecondStone}-${mappedMetal}.webp`;
      console.log(`🔧 Generated dual stone necklace filename: "${filename}" from chain:${chainType}, stones:${finalStone}+${finalSecondStone}, metal:${metal}`);
    } else {
      // Single stone or traditional logic
      filename = `necklace-${mappedChain}-${mappedStone}-${mappedMetal}.webp`;
      console.log(`🔧 Generated necklace filename: "${filename}" from chain:${chainType}, stone:${finalStone}, metal:${metal}`);
    }
    
    return filename;
  }

  /**
   * Generate human-readable variant name
   */
  private generateVariantName(options: VariantOption[]): string {
    return options.map(opt => opt.option_name).join(' + ');
  }

  /**
   * Batch check image existence for better performance
   */
  private async batchCheckImageExistence(productType: string, variants: ProductVariant[]): Promise<void> {
    try {
      console.log(`🔍 Checking existence for ${variants.length} variant images...`);
      
      // Get all files in the product type folder
      const { data: files, error } = await this.supabaseClient.storage
        .from('customization-item')
        .list(productType + 's', {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error('Error listing storage files:', error);
        return;
      }

      if (!files) {
        console.log(`📁 No files found in ${productType}s folder`);
        return;
      }

      // Create a Set of existing filenames for fast lookup
      const existingFiles = new Set(files.map(file => file.name));
      console.log(`📊 Found ${existingFiles.size} existing files in storage`);

      // Update variants with existence status and URLs
      let foundCount = 0;
      const processedFilenames = new Set<string>(); // Track processed filenames to avoid double-counting
      
      for (const variant of variants) {
        let foundFile = null;
        let actualFilename = null;
        
        // Check for multiple file extensions (webp preferred, but fallback to PNG/png)
        const baseFilename = variant.filename.replace(/\.[^/.]+$/, ""); // Remove extension
        const possibleExtensions = ['.webp', '.PNG', '.png'];
        
        for (const ext of possibleExtensions) {
          const testFilename = baseFilename + ext;
          if (existingFiles.has(testFilename)) {
            foundFile = testFilename;
            actualFilename = testFilename;
            break;
          }
        }
        
        if (foundFile) {
          const filePath = `${productType}s/${actualFilename}`;
          const { data: urlData } = this.supabaseClient.storage
            .from('customization-item')
            .getPublicUrl(filePath);
          
          variant.imageUrl = urlData.publicUrl;
          variant.exists = true;
          variant.filename = actualFilename; // Update to actual filename found
          
          // Track processed filenames and count unique files
          const isFirstTimeSeeing = !processedFilenames.has(actualFilename);
          if (isFirstTimeSeeing) {
            processedFilenames.add(actualFilename);
            foundCount++;
          }
          
          console.log(`✅ Found ${actualFilename} for variant ${variant.name} (unique: ${isFirstTimeSeeing})`);
        } else {
          console.log(`❌ No file found for variant ${variant.name} (expected: ${variant.filename})`);
        }
      }
      
      console.log(`🔍 Duplicate filename check: ${variants.length} variants, ${processedFilenames.size} unique filenames, ${foundCount} actual files`);
      console.log(`📂 Unique filenames generated:`, Array.from(new Set(variants.map(v => v.filename))).sort());

      console.log(`✅ Found ${foundCount} existing images out of ${variants.length} variants`);
      console.log(`📋 Generated variant filenames:`, variants.map(v => v.filename));
      console.log(`📁 Available files in storage:`, Array.from(existingFiles));
    } catch (error) {
      console.error('Error in batch image check:', error);
      // Don't throw error - just log it and continue with all variants marked as non-existent
    }
  }

  /**
   * Check if image exists in Supabase Storage (single file check)
   */
  private async checkImageExists(productType: string, filename: string): Promise<string | null> {
    try {
      const filePath = `${productType}s/${filename}`;
      
      // Try to get the file info to check if it exists
      const { data, error } = await this.supabaseClient.storage
        .from('customization-item')
        .list(productType + 's', {
          search: filename
        });

      if (error || !data || data.length === 0) {
        return null;
      }

      // File exists, return the public URL
      const { data: urlData } = this.supabaseClient.storage
        .from('customization-item')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error checking image existence:', error);
      return null;
    }
  }

  /**
   * Get base storage URL for uploads
   */
  getStorageBaseUrl(productType: string): string {
    return `${productType}s/`;
  }

  /**
   * Generate upload path for a specific variant
   */
  generateUploadPath(productType: string, filename: string): string {
    return `${productType}s/${filename}`;
  }

  /**
   * Convert customization options to rules engine format
   */
  private convertOptionsToRulesFormat(options: any[]) {
    const settingsMap = new Map<string, any>();
    
    options.forEach(option => {
      if (!settingsMap.has(option.setting_id)) {
        settingsMap.set(option.setting_id, {
          id: option.setting_id,
          title: option.setting_title,
          description: undefined,
          required: option.required ?? true,
          options: []
        });
      }

      const setting = settingsMap.get(option.setting_id)!;
      setting.options.push({
        id: option.option_id,
        option_id: option.option_id,
        option_name: option.option_name,
        price: option.price || 0,
        price_lab_grown: option.price_lab_grown,
        image_url: option.image_url,
        color_gradient: option.color_gradient,
        display_order: option.display_order || 0,
        is_active: option.is_active ?? true
      });
    });

    return Array.from(settingsMap.values());
  }

  /**
   * Filter variants using the rules engine to exclude impossible combinations
   */
  private filterVariantsWithRules(
    variants: VariantOption[][],
    rulesEngine: LogicRulesEngine | null,
    allSettings: any[]
  ): VariantOption[][] {
    if (!rulesEngine) {
      console.log('⚠️ No rules engine available, returning all variants');
      return variants;
    }

    console.log(`🔍 Filtering ${variants.length} variants using rules engine...`);
    const validVariants: VariantOption[][] = [];

    for (const variant of variants) {
      // Convert variant to customization state format
      const customizationState: Record<string, string> = {};
      variant.forEach(option => {
        customizationState[option.setting_id] = option.option_id;
      });

      try {
        // Apply rules to see if this combination is valid
        const result = rulesEngine.applyRules(allSettings, customizationState);
        
        // Check if this variant's options are all still available after applying rules
        const isValid = variant.every(option => {
          const filteredSetting = result.filteredSettings.find(s => s.id === option.setting_id);
          if (!filteredSetting) return false;
          
          return filteredSetting.options.some(o => o.option_id === option.option_id);
        });

        if (isValid) {
          validVariants.push(variant);
          console.log(`✅ Valid variant: ${variant.map(o => o.option_name).join(' + ')}`);
        } else {
          console.log(`❌ Excluded variant: ${variant.map(o => o.option_name).join(' + ')} (violates rules)`);
          console.log(`   State: ${JSON.stringify(customizationState)}`);
          console.log(`   Filtered settings: ${result.filteredSettings.map(s => s.id + ':' + s.options.map(o => o.option_id).join(',')).join(' | ')}`);
        }
      } catch (error) {
        console.error(`⚠️ Error validating variant ${variant.map(o => o.option_name).join(' + ')}:`, error);
        // In case of error, include the variant to be safe
        validVariants.push(variant);
      }
    }

    console.log(`🎯 Rules filtering complete: ${validVariants.length}/${variants.length} variants are valid`);
    return validVariants;
  }
}

export const variantGenerator = new VariantGenerator();
