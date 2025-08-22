import { supabase } from '@/lib/supabase';
import type { JewelryItem as DBJewelryItem, CustomizationOption as DBCustomizationOption } from '@/lib/supabase';
import type { JewelryItem, CustomizationSetting, CustomizationOption, DiamondType } from '@/types/customization';

export class CustomizationService {
  // Fetch jewelry item with all customization options
  static async getJewelryItemConfig(type: string): Promise<JewelryItem | null> {
    try {
      // Get jewelry item
      const { data: jewelryItem, error: itemError } = await supabase
        .from('jewelry_items')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .single()

      if (itemError || !jewelryItem) {
        console.error('Error fetching jewelry item:', itemError)
        return null
      }

      // Get customization options
      const { data: options, error: optionsError } = await supabase
        .from('customization_options')
        .select('*')
        .eq('jewelry_item_id', jewelryItem.id)
        .eq('is_active', true)
        .order('display_order')
        .order('setting_id')

      if (optionsError) {
        console.error('Error fetching customization options:', optionsError)
        return null
      }

      // Group options by setting_id and preserve display_order
      const settingsMap = new Map<string, CustomizationSetting & { tempOptions: Array<DBCustomizationOption & { optionData: CustomizationOption }> }>()
      
      options?.forEach((option: DBCustomizationOption) => {
        if (!settingsMap.has(option.setting_id)) {
          settingsMap.set(option.setting_id, {
            id: option.setting_id,
            title: option.setting_title,
            type: 'single',
            required: true,
            options: [],
            tempOptions: []
          })
        }

        const setting = settingsMap.get(option.setting_id)!
        setting.tempOptions.push({
          ...option,
          optionData: {
            id: option.option_id,
            name: option.option_name,
            price: option.price,
            priceLabGrown: option.price_lab_grown,
            image: option.image_url || undefined,
            color: option.color_gradient || undefined
          } as CustomizationOption
        })
      })

      // Sort options within each setting by display_order and convert to final format
      settingsMap.forEach((setting) => {
        setting.tempOptions.sort((a, b) => a.display_order - b.display_order)
        setting.options = setting.tempOptions.map(opt => opt.optionData)
        delete (setting as { tempOptions?: unknown }).tempOptions
      })

      // Convert to config format
      const config = {
        id: jewelryItem.type,
        name: jewelryItem.name,
        baseImage: jewelryItem.base_image_url || '',
        basePrice: jewelryItem.base_price,
        basePriceLabGrown: jewelryItem.base_price_lab_grown,
        settings: Array.from(settingsMap.values())
      } as JewelryItem

      return config
    } catch (error) {
      console.error('Error in getJewelryItemConfig:', error)
      return null
    }
  }

  // Update pricing for a specific option
  static async updateOptionPrice(jewelryType: string, settingId: string, optionId: string, newPrice: number): Promise<boolean> {
    try {
      // Get jewelry item ID
      const { data: jewelryItem } = await supabase
        .from('jewelry_items')
        .select('id')
        .eq('type', jewelryType)
        .single()

      if (!jewelryItem) return false

      // Update option price
      const { error } = await supabase
        .from('customization_options')
        .update({ price: newPrice })
        .eq('jewelry_item_id', jewelryItem.id)
        .eq('setting_id', settingId)
        .eq('option_id', optionId)

      return !error
    } catch (error) {
      console.error('Error updating option price:', error)
      return false
    }
  }

  // Update lab grown pricing for a specific option
  static async updateOptionPriceLabGrown(jewelryType: string, settingId: string, optionId: string, newPrice: number): Promise<boolean> {
    try {
      // Get jewelry item ID
      const { data: jewelryItem } = await supabase
        .from('jewelry_items')
        .select('id')
        .eq('type', jewelryType)
        .single()

      if (!jewelryItem) return false

      // Update option lab grown price
      const { error } = await supabase
        .from('customization_options')
        .update({ price_lab_grown: newPrice })
        .eq('jewelry_item_id', jewelryItem.id)
        .eq('setting_id', settingId)
        .eq('option_id', optionId)

      return !error
    } catch (error) {
      console.error('Error updating lab grown option price:', error)
      return false
    }
  }

  // Update base price for jewelry item
  static async updateBasePrice(jewelryType: string, newPrice: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jewelry_items')
        .update({ base_price: newPrice })
        .eq('type', jewelryType)

      return !error
    } catch (error) {
      console.error('Error updating base price:', error)
      return false
    }
  }

  // Update lab grown base price for jewelry item
  static async updateBasePriceLabGrown(jewelryType: string, newPrice: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jewelry_items')
        .update({ base_price_lab_grown: newPrice })
        .eq('type', jewelryType)

      return !error
    } catch (error) {
      console.error('Error updating lab grown base price:', error)
      return false
    }
  }

  // Get all pricing data for admin interface
  static async getAllPricingData(jewelryType: string) {
    try {
      const { data: jewelryItem } = await supabase
        .from('jewelry_items')
        .select(`
          *,
          customization_options (*)
        `)
        .eq('type', jewelryType)
        .single()

      return jewelryItem
    } catch (error) {
      console.error('Error fetching pricing data:', error)
      return null
    }
  }

  // Generate dynamic variant image URL based on customization selections
  static generateVariantImageUrl(jewelryType: string, customizations: { [key: string]: string }): string {
    const baseUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item'
    
    console.log('🔧 CustomizationService: Generating URL for:', {
      jewelryType,
      customizations,
      timestamp: new Date().toISOString()
    });
    
    if (jewelryType === 'bracelet') {
      // Map database values to filename format
      const metalMap: { [key: string]: string } = {
        'white_gold': 'whitegold',
        'yellow_gold': 'yellowgold'
      }
      
      const stoneMap: { [key: string]: string } = {
        'blue_sapphire': 'blue-sapphire',
        'pink_sapphire': 'pink-sapphire',
        'emerald': 'emerald',
        'ruby': 'ruby'
        // Note: diamond variants not available yet
      }
      
      const chainMap: { [key: string]: string } = {
        'black_leather': 'black-leather',
        'gold_cord': 'gold-cord'
      }
      
      // Get the selections
      const metal = customizations.metal
      const chainType = customizations.chain_type
      
      // For bracelets: Diamond is always present, so we use the second stone for variants
      // If first_stone is diamond, use second_stone for the variant
      // If first_stone is not diamond, use first_stone for the variant
      let variantStone = customizations.second_stone;
      if (customizations.first_stone && customizations.first_stone !== 'diamond') {
        variantStone = customizations.first_stone;
      }
      
      if (variantStone && metal && chainType && metalMap[metal] && stoneMap[variantStone] && chainMap[chainType]) {
        const stoneFilename = stoneMap[variantStone]
        const metalFilename = metalMap[metal]
        const chainFilename = chainMap[chainType]
        
        // New naming convention: bracelet-[chain]-[stone]-[metal]
        // Handle mixed case extensions based on specific combinations
        let filename: string;
        
        // Only generate URLs for combinations that actually exist  
        // Based on our high-quality compression output, these are the valid bracelet combinations:
        const validBraceletCombinations = [
          // Black leather combinations (both metals supported)
          'black-leather-blue-sapphire-whitegold',
          'black-leather-blue-sapphire-yellowgold',
          'black-leather-emerald-whitegold',
          'black-leather-emerald-yellowgold',
          'black-leather-pink-sapphire-whitegold',
          'black-leather-pink-sapphire-yellowgold',
          'black-leather-ruby-whitegold',
          // Gold cord combinations (only yellow gold metal supported)
          'gold-cord-blue-sapphire-yellowgold',
          'gold-cord-emerald-yellowgold',
          'gold-cord-pink-sapphire-yellowgold',
          'gold-cord-ruby-yellowgold'
        ];
        
        const combinationKey = `${chainFilename}-${stoneFilename}-${metalFilename}`;
        
        if (validBraceletCombinations.includes(combinationKey)) {
          // Use compressed WebP images for much faster loading (HQ: ~50KB, 95% smaller!)
          filename = `bracelet-${chainFilename}-${stoneFilename}-${metalFilename}.webp`;
          
          const finalUrl = `${baseUrl}/bracelets/${filename}`;
          console.log('🎯 Bracelet URL generated (HQ WebP):', finalUrl, '(~50KB, 95% smaller, much better quality!)');
          
          return finalUrl;
        } else {
          console.warn('⚠️ Bracelet combination not available:', combinationKey);
          console.log('📋 Using base bracelet image instead');
          return 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/bracelet-preview.png';
        }
      } else {
        console.log('❌ Bracelet conditions not met:', {
          variantStone,
          metal,
          chainType,
          metalMapHas: !!metalMap[metal],
          stoneMapHas: !!stoneMap[variantStone],
          chainMapHas: !!chainMap[chainType]
        });
        // Return base bracelet image when conditions aren't met
        return 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/bracelet-preview.png';
      }
    }
    
    if (jewelryType === 'ring') {
      // Map database values to filename format for rings
      const metalMap: { [key: string]: string } = {
        'white_gold': 'white gold',
        'yellow_gold': 'yellow gold'
      }
      
      const stoneMap: { [key: string]: string } = {
        'blue_sapphire': 'blue sapphire',
        'pink_sapphire': 'pink sapphire',
        'emerald': 'emerald',
        'ruby': 'ruby'
      }
      
      // Get the selections
      const metal = customizations.metal
      
      // For rings: Use second_stone for the variant (first_stone is always diamond)
      const variantStone = customizations.second_stone
      
      if (variantStone && metal && metalMap[metal] && stoneMap[variantStone]) {
        const stoneFilename = stoneMap[variantStone]
        const metalFilename = metalMap[metal]
        
        // Ring naming convention: Ring [stone] [metal].webp (compressed)
        const filename = `Ring ${stoneFilename} ${metalFilename}.webp`;
        
        const finalUrl = `${baseUrl}/rings/${filename}`;
        console.log('💍 Ring URL generated (HQ WebP):', finalUrl, '(~50KB, 95% smaller, crisp details!)');
        
        return finalUrl
      }
    }
    
    if (jewelryType === 'necklace') {
      // Map database values to filename format for necklaces
      const metalMap: { [key: string]: string } = {
        'white_gold': 'whitegold',
        'yellow_gold': 'yellowgold'
      }
      
      const stoneMap: { [key: string]: string } = {
        'blue_sapphire': 'bluesapphire',
        'pink_sapphire': 'pinksapphire',
        'emerald': 'emerald',
        'ruby': 'ruby'
      }
      
      const chainMap: { [key: string]: string } = {
        'black_leather': 'black-leather',
        'white_gold_chain': 'white-gold',
        'yellow_gold_chain_real': 'yellow-gold'
      }
      
      // Get the selections
      const metal = customizations.metal
      const chainType = customizations.chain_type
      
      // For necklaces: Use any non-diamond stone for the variant
      // Check first_stone first, then second_stone
      let variantStone = customizations.second_stone;
      if (customizations.first_stone && customizations.first_stone !== 'diamond') {
        variantStone = customizations.first_stone;
      }
      
      if (variantStone && metal && chainType && metalMap[metal] && stoneMap[variantStone] && chainMap[chainType]) {
        const stoneFilename = stoneMap[variantStone]
        const metalFilename = metalMap[metal]
        const chainFilename = chainMap[chainType]
        
        // Chain type is already mapped correctly in chainMap
        const finalChainType = chainFilename;
        
        // Only generate URLs for combinations that actually exist
        // Based on our compression script output, these are the valid combinations:
        const validCombinations = [
          // Black leather combinations
          'black-leather-bluesapphire-whitegold',
          'black-leather-bluesapphire-yellowgold', 
          'black-leather-emerald-whitegold',
          'black-leather-emerald-yellowgold',
          'black-leather-pinksapphire-whitegold',
          'black-leather-pinksapphire-yellowgold',
          'black-leather-ruby-whitegold',
          'black-leather-ruby-yellowgold',
          // White gold chain combinations (only with white gold metal)
          'white-gold-bluesapphire-whitegold',
          'white-gold-emerald-whitegold',
          'white-gold-pinksapphire-whitegold',
          'white-gold-ruby-whitegold',
          // Yellow gold chain combinations (only with yellow gold metal)
          'yellow-gold-bluesapphire-yellowgold',
          'yellow-gold-emerald-yellowgold',
          'yellow-gold-pinksapphire-yellowgold',
          'yellow-gold-ruby-yellowgold'
        ];
        
        const combinationKey = `${finalChainType}-${stoneFilename}-${metalFilename}`;
        
        if (validCombinations.includes(combinationKey)) {
          // Necklace naming convention: necklace-[chain]-[stone]-[metal].webp (compressed)
          const filename = `necklace-${finalChainType}-${stoneFilename}-${metalFilename}.webp`;
          const finalUrl = `${baseUrl}/necklaces/${filename}`;
          
          console.log('✨ Necklace URL generated:', finalUrl, '(Compressed WebP: ~25KB - 98% smaller!)');
          
          return finalUrl;
        } else {
          console.warn('⚠️ Necklace combination not available:', combinationKey);
          console.log('📋 Using base image instead');
        }
      }
    }
    
    // Fallback to base image if no variant found
    return `${baseUrl}/necklace.png`
  }

  // Check if a variant image exists for given customizations
  static async checkVariantImageExists(jewelryType: string, customizations: { [key: string]: string }): Promise<boolean> {
    const imageUrl = this.generateVariantImageUrl(jewelryType, customizations)
    
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  // Calculate total price based on diamond type
  static calculateTotalPrice(jewelryItem: JewelryItem, customizations: { [key: string]: string }, diamondType: DiamondType = 'natural'): number {
    // Start with base price
    let totalPrice = diamondType === 'lab_grown' && jewelryItem.basePriceLabGrown 
      ? jewelryItem.basePriceLabGrown 
      : jewelryItem.basePrice;

    // Add customization option prices
    jewelryItem.settings.forEach(setting => {
      const selectedValue = customizations[setting.id];
      if (selectedValue && typeof selectedValue === 'string') {
        const selectedOption = setting.options.find(option => option.id === selectedValue);
        if (selectedOption) {
          const optionPrice = diamondType === 'lab_grown' && selectedOption.priceLabGrown !== undefined
            ? selectedOption.priceLabGrown
            : (selectedOption.price || 0);
          totalPrice += optionPrice;
        }
      }
    });

    return totalPrice;
  }
}
