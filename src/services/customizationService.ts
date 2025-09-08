// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { supabase } from '@/lib/supabase';
import type { JewelryItem as DBJewelryItem, CustomizationOption as DBCustomizationOption } from '@/lib/supabase';
import type { JewelryItem, CustomizationSetting, CustomizationOption, DiamondType } from '@/types/customization';

export class CustomizationService {
  // Fetch jewelry item with all customization options by slug
  static async getJewelryItemConfigBySlug(slug: string): Promise<JewelryItem | null> {
    try {
      // Get jewelry item by slug
      const { data: jewelryItem, error: itemError } = await supabase
        .from('jewelry_items')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .eq('product_type', 'customizable')
        .single()

      if (itemError || !jewelryItem) {
        console.error('Error fetching jewelry item by slug:', itemError)
        return null
      }

      // Get customization options
      const { data: options, error: optionsError } = await supabase
        .from('customization_options')
        .select('*')
        .eq('jewelry_item_id', jewelryItem.id)
        .eq('is_active', true)
        .order('setting_display_order')
        .order('display_order')

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
            required: option.required ?? true,
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
        id: jewelryItem.id,
        name: jewelryItem.name,
        type: jewelryItem.type,
        baseImage: jewelryItem.base_image_url || '',
        basePrice: jewelryItem.base_price,
        basePriceLabGrown: jewelryItem.base_price_lab_grown,
        blackOnyxBasePrice: jewelryItem.black_onyx_base_price,
        blackOnyxBasePriceLabGrown: jewelryItem.black_onyx_base_price_lab_grown,
        settings: Array.from(settingsMap.values()).sort((a, b) => {
          // Sort settings by their display order from the first option in each setting
          const aOrder = options?.find(opt => opt.setting_id === a.id)?.setting_display_order || 0;
          const bOrder = options?.find(opt => opt.setting_id === b.id)?.setting_display_order || 0;
          return aOrder - bOrder;
        })
      } as JewelryItem

      return config
    } catch (error) {
      console.error('Error in getJewelryItemConfigBySlug:', error)
      return null
    }
  }

  // Fetch jewelry item with all customization options (legacy method - keep for backwards compatibility)
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
            required: option.required ?? true,
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
        id: jewelryItem.id,
        name: jewelryItem.name,
        type: jewelryItem.type,
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
        'yellow_sapphire': 'yellow-sapphire',
        'emerald': 'emerald',
        'ruby': 'ruby',
        'rubyy': 'ruby', // Map rubyy variant to ruby naming
        'black_onyx': 'blackonyx',
        'black_onyx_emerald': 'blackonyx'  // Special case: Black Onyx + Emerald combination
        // Note: diamond variants not available yet
      }
      
      // Special mapping for white gold chain (uses different naming convention)
      const whiteGoldChainStoneMap: { [key: string]: string } = {
        'blue_sapphire': 'bluesapphire',
        'pink_sapphire': 'pinksapphire',
        'yellow_sapphire': 'yellowsapphire',
        'emerald': 'emerald',
        'ruby': 'ruby',
        'rubyy': 'ruby' // Map rubyy variant to ruby naming
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
      
      // For bracelets: Handle dual stone combinations (updated to match VariantGenerator logic)
      let variantStone = customizations.second_stone;
      let variantSecondStone = '';
      let usingFirstStone = false;
      let usingBothStones = false;
      
      // Helper function to extract stone name from contextual ID
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
      
      const actualFirstStone = customizations.first_stone ? extractStoneFromContextual(customizations.first_stone) : '';
      const actualSecondStone = customizations.second_stone ? extractStoneFromContextual(customizations.second_stone) : '';
      
      if (customizations.first_stone === 'black_onyx') {
        variantStone = 'black_onyx';  // Black Onyx combinations use blackonyx filename
        console.log('🖤 Black Onyx detected as first stone, using black_onyx for variant');
      } else if (customizations.first_stone && actualFirstStone !== 'diamond') {
        // When first stone is not diamond, use dual stone combination
        variantStone = customizations.first_stone;
        variantSecondStone = actualSecondStone;
        usingFirstStone = true;
        usingBothStones = true;
        console.log('🎯 Using BOTH stones for bracelet variant:', customizations.first_stone, '(', actualFirstStone, ') +', customizations.second_stone, '(', actualSecondStone, ')');
      } else if (customizations.second_stone) {
        variantStone = customizations.second_stone;
        console.log('🎯 Using SECOND stone for bracelet variant:', customizations.second_stone, '→', actualSecondStone);
      }
      
      console.log('🔍 Bracelet variant selection:', {
        firstStone: customizations.first_stone,
        secondStone: customizations.second_stone,
        selectedVariantStone: variantStone,
        usingFirstStone: usingFirstStone,
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
        
        // Extract actual stone names for mapping
        const actualVariantStone = extractStoneFromContextual(variantStone);
        const stoneFilename = currentStoneMap[actualVariantStone];
        const metalFilename = metalMap[metal];
        const chainFilename = chainMap[chainType];
        
        // Generate filename based on stone combination (matching VariantGenerator logic)
        let filename: string;
        let combinationKey: string;
        
        if (usingBothStones && variantSecondStone) {
          // Dual stone combination: bracelet-{chain}-{firstStone}-{secondStone}-{metal}.webp
          const secondStoneFilename = useWhiteGoldMapping ? 
            (whiteGoldChainStoneMap[variantSecondStone] || stoneMap[variantSecondStone] || variantSecondStone) :
            (stoneMap[variantSecondStone] || variantSecondStone);
          
          filename = `bracelet-${chainFilename}-${stoneFilename}-${secondStoneFilename}-${metalFilename}.webp`;
          combinationKey = `${chainFilename}-${stoneFilename}-${secondStoneFilename}-${metalFilename}`;
          
          console.log('🎯 Generating dual stone bracelet URL:', {
            firstStone: actualVariantStone,
            secondStone: variantSecondStone,
            filename,
            combinationKey
          });
        } else {
          // Single stone or traditional logic
          const stonePrefix = usingFirstStone && !usingBothStones ? 'first-' : '';
          filename = `bracelet-${chainFilename}-${stonePrefix}${stoneFilename}-${metalFilename}.webp`;
          combinationKey = `${chainFilename}-${stonePrefix}${stoneFilename}-${metalFilename}`;
          
          console.log('🎯 Generating single stone bracelet URL:', {
            stone: actualVariantStone,
            filename,
            combinationKey,
            stonePrefix
          });
        }
        
        const finalUrl = `${baseUrl}/bracelets/${filename}`;
        console.log('🎯 Bracelet URL generated (Dual Stone WebP):', finalUrl);
        console.log('🔍 Generated filename:', filename);
        console.log('🔍 Combination key:', combinationKey);
        
        return finalUrl;
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
        'yellow_sapphire': 'yellow sapphire',
        'emerald': 'emerald',
        'ruby': 'ruby',
        'rubyy': 'ruby' // Map rubyy variant to ruby naming
      }
      
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

      // Get the selections
      const metal = customizations.metal
      
      // Apply dual stone logic for rings (matching VariantGenerator logic)
      let variantStone = customizations.second_stone;
      let variantSecondStone = '';
      let usingBothStones = false;
      
      const actualFirstStone = customizations.first_stone ? extractStoneFromContextual(customizations.first_stone) : '';
      const actualSecondStone = customizations.second_stone ? extractStoneFromContextual(customizations.second_stone) : '';
      
      // When first stone is not diamond, use dual stone combination
      if (customizations.first_stone && actualFirstStone !== 'diamond') {
        variantStone = customizations.first_stone;
        variantSecondStone = actualSecondStone;
        usingBothStones = true;
        console.log('🎯 Using BOTH stones for ring variant:', customizations.first_stone, '(', actualFirstStone, ') +', customizations.second_stone, '(', actualSecondStone, ')');
      } else if (customizations.second_stone) {
        variantStone = customizations.second_stone;
        console.log('🎯 Using SECOND stone for ring variant:', customizations.second_stone, '→', actualSecondStone);
      }
      
      if (variantStone && metal && metalMap[metal]) {
        const actualVariantStone = extractStoneFromContextual(variantStone);
        const stoneFilename = stoneMap[actualVariantStone] || actualVariantStone;
        const metalFilename = metalMap[metal];
        
        console.log('🔧 Ring stone mapping debug:', {
          variantStone,
          actualVariantStone,
          stoneFilename,
          availableInStoneMap: Object.keys(stoneMap),
          metalFilename
        });
        
        // Generate filename based on stone combination
        let filename: string;
        if (usingBothStones && variantSecondStone) {
          // Dual stone combination: Ring {firstStone} {secondStone} {metal}.webp
          const secondStoneFilename = stoneMap[variantSecondStone] || variantSecondStone;
          filename = `Ring ${stoneFilename} ${secondStoneFilename} ${metalFilename}.webp`;
          console.log('🎯 Generating dual stone ring URL:', {
            firstStone: actualVariantStone,
            secondStone: variantSecondStone,
            filename
          });
        } else {
          // Single stone or traditional logic
          filename = `Ring ${stoneFilename} ${metalFilename}.webp`;
          console.log('🎯 Generating single stone ring URL:', {
            stone: actualVariantStone,
            filename
          });
        }
        
        const finalUrl = `${baseUrl}/rings/${filename}`;
        console.log('💍 Ring URL generated (Dual Stone WebP):', finalUrl);
        
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
        'yellow_sapphire': 'yellowsapphire',
        'emerald': 'emerald',
        'ruby': 'ruby',
        'rubyy': 'ruby' // Map rubyy variant to ruby naming
      }
      
      const chainMap: { [key: string]: string } = {
        'black_leather': 'black-leather',
        'white_gold_chain': 'white-gold',
        'yellow_gold_chain_real': 'yellow-gold'
      }
      
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

      // Get the selections
      const metal = customizations.metal
      const chainType = customizations.chain_type
      
      // Apply dual stone logic for necklaces (matching VariantGenerator logic)
      let variantStone = customizations.second_stone || customizations.first_stone;
      let variantSecondStone = '';
      let usingBothStones = false;
      
      const actualFirstStone = customizations.first_stone ? extractStoneFromContextual(customizations.first_stone) : '';
      const actualSecondStone = customizations.second_stone ? extractStoneFromContextual(customizations.second_stone) : '';
      
      // When first stone is not diamond and we have a second stone, use dual stone combination
      if (customizations.first_stone && actualFirstStone !== 'diamond' && customizations.second_stone) {
        variantStone = customizations.first_stone;
        variantSecondStone = actualSecondStone;
        usingBothStones = true;
        console.log('🎯 Using BOTH stones for necklace variant:', customizations.first_stone, '(', actualFirstStone, ') +', customizations.second_stone, '(', actualSecondStone, ')');
      } else if (customizations.second_stone) {
        variantStone = customizations.second_stone;
        console.log('🎯 Using SECOND stone for necklace variant:', customizations.second_stone, '→', actualSecondStone);
      } else if (customizations.first_stone) {
        variantStone = customizations.first_stone;
        console.log('🎯 Using FIRST stone for necklace variant:', customizations.first_stone, '→', actualFirstStone);
      }
      
      if (variantStone && metal && chainType && metalMap[metal] && chainMap[chainType]) {
        const actualVariantStone = extractStoneFromContextual(variantStone);
        const stoneFilename = stoneMap[actualVariantStone];
        const metalFilename = metalMap[metal];
        const chainFilename = chainMap[chainType];
        
        // Generate filename based on stone combination
        let filename: string;
        let combinationKey: string;
        
        if (usingBothStones && variantSecondStone) {
          // Dual stone combination: necklace-{chain}-{firstStone}-{secondStone}-{metal}.webp
          const secondStoneFilename = stoneMap[variantSecondStone] || variantSecondStone;
          filename = `necklace-${chainFilename}-${stoneFilename}-${secondStoneFilename}-${metalFilename}.webp`;
          combinationKey = `${chainFilename}-${stoneFilename}-${secondStoneFilename}-${metalFilename}`;
          
          console.log('🎯 Generating dual stone necklace URL:', {
            firstStone: actualVariantStone,
            secondStone: variantSecondStone,
            filename,
            combinationKey
          });
        } else {
          // Single stone or traditional logic
          filename = `necklace-${chainFilename}-${stoneFilename}-${metalFilename}.webp`;
          combinationKey = `${chainFilename}-${stoneFilename}-${metalFilename}`;
          
          console.log('🎯 Generating single stone necklace URL:', {
            stone: actualVariantStone,
            filename,
            combinationKey
          });
        }
        
        const finalUrl = `${baseUrl}/necklaces/${filename}`;
        console.log('✨ Necklace URL generated (Dual Stone WebP):', finalUrl);
        
        return finalUrl;
      }
    }
    
    // Fallback - no image available for this jewelry type/combination
    return null
  }

  // Get product with all customization data for admin editing
  static async getProductForEditing(productId: string) {
    try {
      const { data: product, error: productError } = await supabase
        .from('jewelry_items')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        console.error('Error fetching product for editing:', productError);
        return null;
      }

      // Get customization options if it's a customizable product
      let customizationData = null;
      if (product.product_type === 'customizable') {
        const { data: options, error: optionsError } = await supabase
          .from('customization_options')
          .select('*')
          .eq('jewelry_item_id', productId)
          .order('setting_display_order')
          .order('display_order');

        if (optionsError) {
          console.error('Error fetching customization options:', optionsError);
        } else {
          customizationData = options;
        }
      }

      return {
        product,
        customizationOptions: customizationData
      };
    } catch (error) {
      console.error('Error in getProductForEditing:', error);
      return null;
    }
  }

  // Update product basic information
  static async updateProduct(productId: string, updates: Partial<any>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jewelry_items')
        .update(updates)
        .eq('id', productId);

      if (error) {
        console.error('Error updating product:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  }

  // Update customization option
  static async updateCustomizationOption(optionId: string, updates: Partial<any>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customization_options')
        .update(updates)
        .eq('id', optionId);

      if (error) {
        console.error('Error updating customization option:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating customization option:', error);
      return false;
    }
  }

  // Create new customization option
  static async createCustomizationOption(jewelryItemId: string, optionData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customization_options')
        .insert({
          jewelry_item_id: jewelryItemId,
          ...optionData
        });

      if (error) {
        console.error('Error creating customization option:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating customization option:', error);
      return false;
    }
  }

  // Delete customization option
  static async deleteCustomizationOption(optionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customization_options')
        .delete()
        .eq('id', optionId);

      if (error) {
        console.error('Error deleting customization option:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting customization option:', error);
      return false;
    }
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
