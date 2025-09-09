// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { supabase } from '@/lib/supabase/client';

export interface FilenameMapping {
  option_id: string;
  filename_slug: string;
  setting_id: string;
}

export class DynamicFilenameService {
  private static cache = new Map<string, FilenameMapping[]>();
  private static cacheExpiry = new Map<string, number>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Force cache clear on startup to ensure fresh data after database changes
  static {
    if (typeof window !== 'undefined') {
      console.log('🔄 Clearing DynamicFilenameService cache on startup (ring+bracelet slugs updated)');
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }

  /**
   * Get filename mappings for a specific jewelry type
   */
  static async getFilenameMappings(jewelryType: string): Promise<FilenameMapping[]> {
    const cacheKey = `mappings_${jewelryType}`;
    const now = Date.now();

    // Check if we have valid cached data (reduced cache duration for debugging)
    if (
      this.cache.has(cacheKey) && 
      this.cacheExpiry.has(cacheKey) && 
      now < this.cacheExpiry.get(cacheKey)!
    ) {
      console.log(`📋 Using cached mappings for ${jewelryType}`);
      return this.cache.get(cacheKey)!;
    }

    try {
      // First get the jewelry item ID for this type
      const { data: jewelryItems, error: jewelryError } = await supabase
        .from('jewelry_items')
        .select('id')
        .eq('type', jewelryType)
        .eq('is_active', true);

      if (jewelryError) {
        console.error('Error fetching jewelry items:', jewelryError);
        return [];
      }

      if (!jewelryItems || jewelryItems.length === 0) {
        console.log(`No active jewelry items found for type: ${jewelryType}`);
        return [];
      }

      const jewelryItemIds = jewelryItems.map(item => item.id);

      // Now fetch customization options for these jewelry items
      const { data: mappings, error } = await supabase
        .from('customization_options')
        .select('option_id, filename_slug, setting_id')
        .eq('is_active', true)
        .eq('affects_image_variant', true)
        .in('jewelry_item_id', jewelryItemIds)
        .not('filename_slug', 'is', null);

      if (error) {
        console.error('Error fetching filename mappings:', error);
        return [];
      }

      const result = mappings || [];

      // Cache the result
      this.cache.set(cacheKey, result);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

      console.log(`🗂️ Loaded ${result.length} filename mappings for ${jewelryType}:`, result);

      return result;
    } catch (error) {
      console.error('Error in getFilenameMappings:', error);
      return [];
    }
  }

  /**
   * Get filename slug for a specific option
   */
  static async getFilenameSlug(jewelryType: string, optionId: string): Promise<string> {
    const mappings = await this.getFilenameMappings(jewelryType);
    const mapping = mappings.find(m => m.option_id === optionId);
    
    // Return filename_slug if found, otherwise fallback to option_id
    const result = mapping?.filename_slug || optionId;
    
    console.log(`🔍 Filename slug for ${jewelryType}/${optionId}: "${result}"`);
    return result;
  }

  /**
   * Generate filename for a product variant using dynamic mappings
   * Implements dual-stone logic matching the original VariantGenerator behavior
   */
  static async generateDynamicFilename(
    jewelryType: string, 
    variantOptions: { setting_id: string; option_id: string }[]
  ): Promise<string> {
    console.log(`🎯 Generating dynamic filename for ${jewelryType}:`, variantOptions);

    // Get all filename slugs for this jewelry type
    const mappings = await this.getFilenameMappings(jewelryType);
    const mappingMap = new Map(mappings.map(m => [m.option_id, m.filename_slug]));

    console.log(`📋 Available mappings for ${jewelryType}:`, Object.fromEntries(mappingMap));

    // Extract individual options
    const chainOption = variantOptions.find(opt => opt.setting_id === 'chain_type');
    const firstStoneOption = variantOptions.find(opt => opt.setting_id === 'first_stone');
    const secondStoneOption = variantOptions.find(opt => opt.setting_id === 'second_stone');
    const metalOption = variantOptions.find(opt => opt.setting_id === 'metal');

    // Apply dual-stone logic (matching VariantGenerator behavior)
    let finalStoneOptions: string[] = [];
    
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
        if (['ruby', 'emerald', 'diamond', 'sapphire'].includes(lastPart)) {
          return lastPart;
        }
      }
      return stoneId;
    };

    const actualFirstStone = firstStoneOption ? extractStoneFromContextual(firstStoneOption.option_id) : '';
    const actualSecondStone = secondStoneOption ? extractStoneFromContextual(secondStoneOption.option_id) : '';

    // Dual stone logic: When first stone is not diamond, use both stones
    if (firstStoneOption && actualFirstStone !== 'diamond' && secondStoneOption) {
      // Use both stones for non-diamond first stone combinations
      finalStoneOptions = [firstStoneOption.option_id, secondStoneOption.option_id];
      console.log(`🎯 Using BOTH stones: ${firstStoneOption.option_id} + ${secondStoneOption.option_id}`);
    } else if (secondStoneOption) {
      // Use second stone only (diamond + second stone OR no first stone)
      finalStoneOptions = [secondStoneOption.option_id];
      console.log(`🎯 Using SECOND stone only: ${secondStoneOption.option_id}`);
    } else if (firstStoneOption) {
      // Use first stone as fallback
      finalStoneOptions = [firstStoneOption.option_id];
      console.log(`🎯 Using FIRST stone as fallback: ${firstStoneOption.option_id}`);
    }

    // Build filename parts in order
    const filenameParts = [jewelryType];

    // Add chain/cord
    if (chainOption) {
      const chainSlug = mappingMap.get(chainOption.option_id) || chainOption.option_id;
      filenameParts.push(chainSlug);
      console.log(`✅ Added chain: ${chainOption.option_id} → "${chainSlug}"`);
    }

    // Add stones
    for (const stoneOptionId of finalStoneOptions) {
      const stoneSlug = mappingMap.get(stoneOptionId) || stoneOptionId;
      filenameParts.push(stoneSlug);
      console.log(`✅ Added stone: ${stoneOptionId} → "${stoneSlug}"`);
    }

    // Add metal
    if (metalOption) {
      const metalSlug = mappingMap.get(metalOption.option_id) || metalOption.option_id;
      filenameParts.push(metalSlug);
      console.log(`✅ Added metal: ${metalOption.option_id} → "${metalSlug}"`);
    }

    // Add any remaining options not in the standard categories
    for (const option of variantOptions) {
      if (!['chain_type', 'first_stone', 'second_stone', 'metal'].includes(option.setting_id)) {
        const slug = mappingMap.get(option.option_id) || option.option_id;
        filenameParts.push(slug);
        console.log(`✅ Added extra ${option.setting_id}: ${option.option_id} → "${slug}"`);
      }
    }

    const filename = filenameParts.join('-') + '.webp';
    console.log(`🎯 Generated filename: "${filename}"`);
    
    return filename;
  }

  /**
   * Clear cache for a specific jewelry type (useful after admin updates)
   */
  static clearCache(jewelryType?: string): void {
    if (jewelryType) {
      const cacheKey = `mappings_${jewelryType}`;
      this.cache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
      console.log(`🧹 Cleared filename mapping cache for ${jewelryType}`);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
      console.log(`🧹 Cleared all filename mapping cache`);
    }
  }

  /**
   * Clear cache automatically when database changes are detected
   * Call this after creating/updating customization options
   */
  static async refreshAfterDbChange(jewelryType: string): Promise<void> {
    this.clearCache(jewelryType);
    // Pre-warm the cache with fresh data
    await this.getFilenameMappings(jewelryType);
    console.log(`🔄 Refreshed filename mappings for ${jewelryType}`);
  }

  /**
   * Validate that all options in a variant have filename mappings
   */
  static async validateVariantMappings(
    jewelryType: string,
    variantOptions: { setting_id: string; option_id: string }[]
  ): Promise<{ isValid: boolean; missing: string[] }> {
    const mappings = await this.getFilenameMappings(jewelryType);
    const mappingMap = new Map(mappings.map(m => [m.option_id, m.filename_slug]));

    const missing: string[] = [];

    for (const option of variantOptions) {
      if (!mappingMap.has(option.option_id)) {
        missing.push(option.option_id);
      }
    }

    return {
      isValid: missing.length === 0,
      missing
    };
  }
}

export const dynamicFilenameService = new DynamicFilenameService();

// Make cache clearing available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).clearFilenameCache = (jewelryType?: string) => {
    DynamicFilenameService.clearCache(jewelryType);
    console.log(`🔄 Cache cleared${jewelryType ? ` for ${jewelryType}` : ' for all jewelry types'}`);
  };
}