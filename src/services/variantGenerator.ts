// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { supabase } from '@/lib/supabase/client';
import LogicRulesEngine from './logicRulesEngine';
import { DynamicFilenameService } from './dynamicFilenameService';

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
        const filename = await this.generateVariantFilename(productType, variant);
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
   * Generate variant filename based on product type and options using dynamic mapping
   */
  private async generateVariantFilename(productType: string, options: VariantOption[]): Promise<string> {
    console.log(`🎯 generateVariantFilename called with productType: "${productType}", options:`, options);
    
    // Convert options to format expected by DynamicFilenameService
    const variantOptions = options.map(opt => ({
      setting_id: opt.setting_id,
      option_id: opt.option_id
    }));

    try {
      return await DynamicFilenameService.generateDynamicFilename(productType, variantOptions);
    } catch (error) {
      console.error('❌ Error generating dynamic filename, falling back to option_id based naming:', error);
      
      // Fallback to simple option_id based naming if dynamic service fails
      const slugs = options.map(opt => opt.option_id);
      return `${productType}-${slugs.join('-')}.webp`;
    }
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
      
      // Get the public URL first
      const { data: urlData } = this.supabaseClient.storage
        .from('customization-item')
        .getPublicUrl(filePath);
      
      // Make a HEAD request to check if the file actually exists
      // This bypasses any caching issues with storage.list()
      try {
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log(`✅ Image exists: ${filename}`);
          return urlData.publicUrl;
        } else {
          console.log(`❌ Image not found: ${filename} (${response.status})`);
          return null;
        }
      } catch (fetchError) {
        console.log(`❌ Network error checking ${filename}:`, fetchError);
        return null;
      }
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
