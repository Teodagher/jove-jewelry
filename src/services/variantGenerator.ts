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

      // Generate all possible combinations that pass rules validation
      const settingsArray = Array.from(settingsMap.values());
      console.log(`🔢 Generating combinations from ${settingsArray.length} setting groups...`);
      
      const allVariants = this.generateCombinations(settingsArray);
      console.log(`🔄 Generated ${allVariants.length} raw combinations, now filtering with rules...`);
      
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
        
        // Generate unique ID based on actual options to prevent collisions
        const optionIds = variant.map(o => o.option_id).sort().join('-');
        const variantId = `${productId}_${optionIds}`;
        
        // For necklaces, check if this filename already exists in our variants
        // If so, we'll reuse the existing variant for multiple option combinations
        if (productType === 'necklace') {
          const existingVariant = productVariants.find(v => v.filename === filename);
          if (existingVariant) {
            // Skip creating a duplicate variant - multiple option combinations 
            // can share the same base image (e.g., different accent colors)
            console.log(`⏭️ Skipping duplicate necklace variant: ${filename} (already exists for variant ${existingVariant.name})`);
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
    if (productType === 'bracelet') {
      return this.generateBraceletFilename(options);
    } else if (productType === 'ring') {
      return this.generateRingFilename(options);
    } else if (productType === 'necklace') {
      return this.generateNecklaceFilename(options);
    }
    
    // For other product types, use a generic format
    const optionParts = options.map(opt => opt.option_id).join('-');
    return `${productType}-${optionParts}.webp`;
  }

  /**
   * Generate bracelet-specific filename following the existing convention
   */
  private generateBraceletFilename(options: VariantOption[]): string {
    // Initialize variables for bracelet components
    let chainType = '';
    let metal = '';
    let stone = '';
    let secondStone = '';

    // Extract option values based on setting types
    options.forEach(option => {
      const settingTitle = option.setting_title.toLowerCase();
      const optionId = option.option_id;

      if (settingTitle.includes('chain') || settingTitle.includes('cord')) {
        chainType = optionId;
      } else if (settingTitle.includes('metal')) {
        metal = optionId;
      } else if (settingTitle.includes('stone') && settingTitle.includes('first')) {
        stone = optionId;
      } else if (settingTitle.includes('stone') && settingTitle.includes('second')) {
        secondStone = optionId;
      } else if (settingTitle.includes('stone') && !stone) {
        stone = optionId; // Fallback for single stone setting
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
      'emerald': 'emerald',
      'ruby': 'ruby',
      'black_onyx': 'blackonyx',
      'black_onyx_emerald': 'blackonyx', // Map Black Onyx variant to same naming
      'diamond': 'diamond'
    };

    const whiteGoldChainStoneMap: { [key: string]: string } = {
      'blue_sapphire': 'bluesapphire',
      'pink_sapphire': 'pinksapphire',
      'emerald': 'emerald',
      'ruby': 'ruby'
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

    // For bracelets, use the second stone as the primary stone for filename
    // The first stone is used for rules but doesn't appear in the filename
    let finalStone = secondStone;
    
    // If no second stone but we have a first stone, use it (fallback)
    if (!finalStone && stone) {
      finalStone = stone;
    }

    // Map values to filename format
    const mappedChain = chainMap[chainType] || chainType;
    const mappedMetal = metalMap[metal] || metal;
    
    // Use different stone mapping for white gold chain
    let mappedStone: string;
    if (chainType === 'white_gold_chain' || chainType === 'whitegold_chain') {
      mappedStone = whiteGoldChainStoneMap[finalStone] || stoneMap[finalStone] || finalStone;
    } else {
      mappedStone = stoneMap[finalStone] || finalStone;
    }

    const filename = `bracelet-${mappedChain}-${mappedStone}-${mappedMetal}.webp`;
    console.log(`🔧 Generated bracelet filename: ${filename} from chain:${chainType}, stone:${finalStone}, metal:${metal}`);
    return filename;
  }

  /**
   * Generate ring-specific filename following the existing convention: "Ring {stone} {metal}.webp"
   */
  private generateRingFilename(options: VariantOption[]): string {
    let metal = '';
    let stone = '';

    // Extract relevant options (skip ring size, diamond type, stone size, engraving)
    options.forEach(option => {
      const settingTitle = option.setting_title.toLowerCase();
      const optionId = option.option_id;

      if (settingTitle.includes('metal')) {
        metal = optionId;
      } else if (settingTitle.includes('second stone')) {
        // Use second stone since your images are based on second stone variants
        stone = optionId;
      }
    });

    // Map option IDs to display names for the filename
    const stoneMap: { [key: string]: string } = {
      'blue_sapphire': 'blue sapphire',
      'pink_sapphire': 'pink sapphire',
      'emerald': 'emerald',
      'ruby': 'ruby'
    };

    const metalMap: { [key: string]: string } = {
      'white_gold': 'white gold',
      'yellow_gold': 'yellow gold'
    };

    const stoneString = stoneMap[stone] || stone;
    const metalString = metalMap[metal] || metal;

    const filename = `Ring ${stoneString} ${metalString}.webp`;
    console.log(`🔧 Generated ring filename: "${filename}" from stone: "${stone}", metal: "${metal}"`);
    
    return filename;
  }

  /**
   * Generate necklace-specific filename following the original format: "necklace-{chain}-{stone}-{metal}.webp"
   */
  private generateNecklaceFilename(options: VariantOption[]): string {
    let chainType = '';
    let metal = '';
    let stone = '';

    // Extract the core options that determine the image variant (chain, stone, metal)
    // Ignore other options like accent colors, diamond types, etc. that don't affect the base image
    options.forEach(option => {
      const settingTitle = option.setting_title.toLowerCase();
      const optionId = option.option_id;

      if (settingTitle.includes('chain') || settingTitle.includes('cord')) {
        chainType = optionId;
      } else if (settingTitle.includes('metal')) {
        metal = optionId;
      } else if (settingTitle.includes('stone') && !settingTitle.includes('diamond')) {
        // Use any non-diamond stone for the variant
        stone = optionId;
      }
    });

    // Map option IDs to filename format (using original mapping)
    const metalMap: { [key: string]: string } = {
      'white_gold': 'whitegold',
      'yellow_gold': 'yellowgold'
    };
    
    const stoneMap: { [key: string]: string } = {
      'blue_sapphire': 'bluesapphire',
      'pink_sapphire': 'pinksapphire',
      'emerald': 'emerald',
      'ruby': 'ruby'
    };
    
    const chainMap: { [key: string]: string } = {
      'black_leather': 'black-leather',
      'white_gold_chain': 'white-gold',
      'yellow_gold_chain_real': 'yellow-gold'
    };

    // Map values using original format
    const mappedChain = chainMap[chainType] || chainType;
    const mappedMetal = metalMap[metal] || metal;
    const mappedStone = stoneMap[stone] || stone;

    const filename = `necklace-${mappedChain}-${mappedStone}-${mappedMetal}.webp`;
    console.log(`🔧 Generated necklace filename: "${filename}" from chain:${chainType}, stone:${stone}, metal:${metal}`);
    
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
          foundCount++;
          
          console.log(`✅ Found ${actualFilename} for variant ${variant.name}`);
        } else {
          console.log(`❌ No file found for variant ${variant.name} (expected: ${variant.filename})`);
        }
      }

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
