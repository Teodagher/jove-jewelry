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
        blackOnyxBasePrice: jewelryItem.black_onyx_base_price,
        blackOnyxBasePriceLabGrown: jewelryItem.black_onyx_base_price_lab_grown,
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

  // Update black onyx base price for jewelry item
  static async updateBlackOnyxBasePrice(jewelryType: string, newPrice: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jewelry_items')
        .update({ black_onyx_base_price: newPrice })
        .eq('type', jewelryType)

      return !error
    } catch (error) {
      console.error('Error updating black onyx base price:', error)
      return false
    }
  }

  // Update black onyx lab grown base price for jewelry item
  static async updateBlackOnyxBasePriceLabGrown(jewelryType: string, newPrice: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jewelry_items')
        .update({ black_onyx_base_price_lab_grown: newPrice })
        .eq('type', jewelryType)

      return !error
    } catch (error) {
      console.error('Error updating black onyx lab grown base price:', error)
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
  static generateVariantImageUrl(jewelryType: string, customizations: { [key: string]: string }): string | null {
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
        'ruby': 'ruby',
        'black_onyx': 'blackonyx',
        'black_onyx_emerald': 'blackonyx'  // Special case: Black Onyx + Emerald combination
        // Note: diamond variants not available yet
      }
      
      // Special mapping for white gold chain (uses different naming convention)
      const whiteGoldChainStoneMap: { [key: string]: string } = {
        'blue_sapphire': 'bluesapphire',
        'pink_sapphire': 'pinksapphire',
        'emerald': 'emerald',
        'ruby': 'ruby'
      }
      
      const chainMap: { [key: string]: string } = {
        'black_leather': 'black-leather',
        'gold_cord': 'gold-cord',
        'white_gold_chain': 'whitegold-chain'
      }
      
      // Get the selections
      const metal = customizations.metal
      let chainType = customizations.chain_type
      
      // Smart chain mapping: When user selects "gold cord", the actual chain depends on the metal
      // - gold_cord + white_gold → use white_gold_chain (white gold cord)
      // - gold_cord + yellow_gold → use gold_cord (yellow gold cord)
      if (chainType === 'gold_cord' && metal === 'white_gold') {
        chainType = 'white_gold_chain'; // Map to white gold chain for white gold metal
        console.log('🔗 Smart mapping: gold_cord + white_gold → white_gold_chain');
      }
      
      // For bracelets: Handle different stone combinations
      // If first_stone is black_onyx, use black_onyx for the variant (Black Onyx + Emerald combination)
      // If first_stone is diamond, use second_stone for the variant
      // If first_stone is not diamond and not black_onyx, use first_stone for the variant
      let variantStone = customizations.second_stone;
      if (customizations.first_stone === 'black_onyx') {
        variantStone = 'black_onyx';  // Black Onyx combinations use blackonyx filename
        console.log('🖤 Black Onyx detected as first stone, using black_onyx for variant');
      } else if (customizations.first_stone && customizations.first_stone !== 'diamond') {
        variantStone = customizations.first_stone;
      }
      
      console.log('🔍 Bracelet variant selection:', {
        firstStone: customizations.first_stone,
        secondStone: customizations.second_stone,
        selectedVariantStone: variantStone,
        metal,
        originalChainType: customizations.chain_type,
        finalChainType: chainType,
        smartMappingApplied: customizations.chain_type !== chainType
      });
      
      if (variantStone && metal && chainType && metalMap[metal] && chainMap[chainType]) {
        // Use special stone mapping for white gold chains, regular mapping for others
        const useWhiteGoldMapping = chainType === 'white_gold_chain';
        const currentStoneMap = useWhiteGoldMapping ? whiteGoldChainStoneMap : stoneMap;
        
        if (!currentStoneMap[variantStone]) {
          console.log('❌ Stone not supported for this chain type:', {
            variantStone,
            chainType,
            useWhiteGoldMapping
          });
          return null;
        }
        
        const stoneFilename = currentStoneMap[variantStone]
        const metalFilename = metalMap[metal]
        const chainFilename = chainMap[chainType]
        
        // New naming convention: bracelet-[chain]-[stone]-[metal]
        // Handle mixed case extensions based on specific combinations
        let filename: string;
        
        // Only generate URLs for combinations that actually exist  
        // Based on our storage and high-quality compression output, these are the valid bracelet combinations:
        const validBraceletCombinations = [
          // Black leather combinations (both metals supported)
          'black-leather-blue-sapphire-whitegold',
          'black-leather-blue-sapphire-yellowgold',
          'black-leather-emerald-whitegold',
          'black-leather-emerald-yellowgold',
          'black-leather-pink-sapphire-whitegold',
          'black-leather-pink-sapphire-yellowgold',
          'black-leather-ruby-whitegold',
          'black-leather-ruby-yellowgold',
          // Black Onyx combinations (both metals supported)
          'black-leather-blackonyx-whitegold',
          'black-leather-blackonyx-yellowgold',
          // Gold cord combinations (ONLY yellow gold metal supported)
          'gold-cord-blue-sapphire-yellowgold',
          'gold-cord-emerald-yellowgold',
          'gold-cord-pink-sapphire-yellowgold',
          'gold-cord-ruby-yellowgold',
          // White gold chain combinations (ONLY white gold metal supported)
          'whitegold-chain-bluesapphire-whitegold',
          'whitegold-chain-emerald-whitegold',
          'whitegold-chain-pinksapphire-whitegold',
          'whitegold-chain-ruby-whitegold'
          // NOTE: No diamond variants available for any combination
        ];
        
        const combinationKey = `${chainFilename}-${stoneFilename}-${metalFilename}`;
        
        if (validBraceletCombinations.includes(combinationKey)) {
          // Special case: ruby + yellowgold only exists as PNG (not yet converted to WebP)
          if (combinationKey === 'black-leather-ruby-yellowgold') {
            filename = `bracelet-${chainFilename}-${stoneFilename}-${metalFilename}.png`;
            const finalUrl = `${baseUrl}/bracelets/${filename}`;
            console.log('🎯 Bracelet URL generated (PNG fallback):', finalUrl, '(Ruby+YellowGold needs WebP conversion)');
            return finalUrl;
          }
          
          // Use compressed WebP images for much faster loading (HQ: ~50KB, 95% smaller!)
          filename = `bracelet-${chainFilename}-${stoneFilename}-${metalFilename}.webp`;
          
          const finalUrl = `${baseUrl}/bracelets/${filename}`;
          console.log('🎯 Bracelet URL generated (HQ WebP):', finalUrl, '(~50KB, 95% smaller, much better quality!)');
          
          return finalUrl;
        } else {
          console.warn('⚠️ Bracelet combination not available:', combinationKey);
          console.log('📋 Available combinations for reference:', validBraceletCombinations);
          
          // Special handling for common invalid combinations  
          if (customizations.chain_type === 'gold_cord' && metal === 'white_gold' && chainType === 'white_gold_chain') {
            console.warn('❌ White gold chain variant not found - may need to upload more images');
          }
          if (customizations.first_stone === 'diamond' && !customizations.second_stone) {
            console.warn('❌ Diamond variant requires a second stone selection');
          }
          
          console.log('📋 Image not available for this combination');
          return null; // Return null to indicate no image available
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
        // Return null when conditions aren't met - no image available
        return null;
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
    
    // Fallback - no image available for this jewelry type/combination
    return null
  }

  // Check if a variant image exists for given customizations
  static async checkVariantImageExists(jewelryType: string, customizations: { [key: string]: string }): Promise<boolean> {
    const imageUrl = this.generateVariantImageUrl(jewelryType, customizations)
    
    if (!imageUrl) {
      return false
    }
    
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  // Calculate total price based on diamond type
  static calculateTotalPrice(jewelryItem: JewelryItem, customizations: { [key: string]: string }, diamondType: DiamondType = 'natural'): number {
    // Check if black onyx is selected as first stone for special pricing
    const isBlackOnyxSelected = customizations.first_stone === 'black_onyx';
    
    // Start with appropriate base price
    let totalPrice: number;
    
    if (isBlackOnyxSelected && jewelryItem.blackOnyxBasePrice !== undefined) {
      // Use black onyx specific base price
      totalPrice = diamondType === 'lab_grown' && jewelryItem.blackOnyxBasePriceLabGrown !== undefined
        ? jewelryItem.blackOnyxBasePriceLabGrown 
        : jewelryItem.blackOnyxBasePrice;
    } else {
      // Use regular base price
      totalPrice = diamondType === 'lab_grown' && jewelryItem.basePriceLabGrown 
        ? jewelryItem.basePriceLabGrown 
        : jewelryItem.basePrice;
    }

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
