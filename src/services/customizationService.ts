import { supabase } from '@/lib/supabase';
import type { JewelryItem as DBJewelryItem, CustomizationOption as DBCustomizationOption } from '@/lib/supabase';
import type { JewelryItem, CustomizationSetting, CustomizationOption } from '@/types/customization';

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
        
        // Special cases for lowercase .png files (based on actual uploaded files)
        if ((stoneFilename === 'pink-sapphire' && metalFilename === 'yellowgold') ||
            (stoneFilename === 'emerald' && metalFilename === 'yellowgold') ||
            (stoneFilename === 'ruby' && metalFilename === 'yellowgold')) {
          filename = `bracelet-${chainFilename}-${stoneFilename}-${metalFilename}.png`;
        } else {
          // Default to uppercase .PNG for most files
          filename = `bracelet-${chainFilename}-${stoneFilename}-${metalFilename}.PNG`;
        }
        
        return `${baseUrl}/bracelets/${filename}`
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
        
        // Special case for ruby + white gold (filename uses "whitegold" as one word)
        let filename: string;
        if (variantStone === 'ruby' && metal === 'white_gold') {
          filename = `Ring ${stoneFilename} whitegold.png`;
        } else {
          // Ring naming convention: Ring [stone] [metal].png
          filename = `Ring ${stoneFilename} ${metalFilename}.png`;
        }
        
        return `${baseUrl}/rings/${filename}`
      }
    }
    
    // Fallback to base image if no variant found
    return `${baseUrl}/bracelet.png`
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
}
