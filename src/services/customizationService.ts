// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { supabase } from '@/lib/supabase/client';
import type { JewelryItem as DBJewelryItem, CustomizationOption as DBCustomizationOption } from '@/lib/supabase/types';
import type { JewelryItem, CustomizationSetting, CustomizationOption, DiamondType, MetalType } from '@/types/customization';
import { DynamicFilenameService } from './dynamicFilenameService';
import type { Market } from '@/lib/market-client';
import { getBasePrice, getOptionPrice, isItemAvailableInMarket, isOptionAvailableInMarket } from '@/lib/pricing';

export class CustomizationService {
  // Fetch jewelry item with all customization options by slug
  static async getJewelryItemConfigBySlug(slug: string, market: Market = 'lb'): Promise<JewelryItem | null> {
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

      // Check if item is available in this market
      // Products must have pricing configured for the specific market
      const itemAvailable = isItemAvailableInMarket(jewelryItem, market)

      if (!itemAvailable) {
        console.warn(`Item ${slug} is not available in market: ${market}`)
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
        // Skip options not available in this market
        const optionAvailable = isOptionAvailableInMarket(option, market)

        if (!optionAvailable) {
          return
        }

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

        // Map prices based on market (no fallback)
        const price = getOptionPrice(option, market, 'default')
        const priceLabGrown = getOptionPrice(option, market, 'lab_grown')
        const priceGold = getOptionPrice(option, market, 'gold')
        const priceSilver = getOptionPrice(option, market, 'silver')

        setting.tempOptions.push({
          ...option,
          optionData: {
            id: option.option_id,
            name: option.option_name,
            price: price ?? 0,
            priceLabGrown: priceLabGrown,
            priceGold: priceGold,
            priceSilver: priceSilver,
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

      // Map base prices based on market (no fallback)
      const basePrice = getBasePrice(jewelryItem, market, 'base_price') ?? 0
      const basePriceLabGrown = getBasePrice(jewelryItem, market, 'base_price_lab_grown')
      const basePriceGold = getBasePrice(jewelryItem, market, 'base_price_gold')
      const basePriceSilver = getBasePrice(jewelryItem, market, 'base_price_silver')
      const blackOnyxBasePrice = getBasePrice(jewelryItem, market, 'black_onyx_base_price')
      const blackOnyxBasePriceLabGrown = getBasePrice(jewelryItem, market, 'black_onyx_base_price_lab_grown')
      const blackOnyxBasePriceGold = getBasePrice(jewelryItem, market, 'black_onyx_base_price_gold')
      const blackOnyxBasePriceSilver = getBasePrice(jewelryItem, market, 'black_onyx_base_price_silver')

      // Convert to config format
      const config = {
        id: jewelryItem.id,
        name: jewelryItem.name,
        type: jewelryItem.type,
        baseImage: jewelryItem.base_image_url || '',
        basePrice: basePrice,
        basePriceLabGrown: basePriceLabGrown,
        basePriceGold: basePriceGold,
        basePriceSilver: basePriceSilver,
        blackOnyxBasePrice: blackOnyxBasePrice,
        blackOnyxBasePriceLabGrown: blackOnyxBasePriceLabGrown,
        blackOnyxBasePriceGold: blackOnyxBasePriceGold,
        blackOnyxBasePriceSilver: blackOnyxBasePriceSilver,
        pricingType: jewelryItem.pricing_type || 'diamond_type',
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
            priceGold: option.price_gold,
            priceSilver: option.price_silver,
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
        basePriceGold: jewelryItem.base_price_gold,
        basePriceSilver: jewelryItem.base_price_silver,
        blackOnyxBasePrice: jewelryItem.black_onyx_base_price,
        blackOnyxBasePriceLabGrown: jewelryItem.black_onyx_base_price_lab_grown,
        blackOnyxBasePriceGold: jewelryItem.black_onyx_base_price_gold,
        blackOnyxBasePriceSilver: jewelryItem.black_onyx_base_price_silver,
        pricingType: jewelryItem.pricing_type || 'diamond_type',
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

  // Update gold base price for jewelry item
  static async updateBasePriceGold(jewelryType: string, newPrice: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jewelry_items')
        .update({ base_price_gold: newPrice })
        .eq('type', jewelryType)

      return !error
    } catch (error) {
      console.error('Error updating gold base price:', error)
      return false
    }
  }

  // Update silver base price for jewelry item
  static async updateBasePriceSilver(jewelryType: string, newPrice: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jewelry_items')
        .update({ base_price_silver: newPrice })
        .eq('type', jewelryType)

      return !error
    } catch (error) {
      console.error('Error updating silver base price:', error)
      return false
    }
  }

  // Update black onyx gold base price for jewelry item
  static async updateBlackOnyxBasePriceGold(jewelryType: string, newPrice: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jewelry_items')
        .update({ black_onyx_base_price_gold: newPrice })
        .eq('type', jewelryType)

      return !error
    } catch (error) {
      console.error('Error updating black onyx gold base price:', error)
      return false
    }
  }

  // Update black onyx silver base price for jewelry item
  static async updateBlackOnyxBasePriceSilver(jewelryType: string, newPrice: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jewelry_items')
        .update({ black_onyx_base_price_silver: newPrice })
        .eq('type', jewelryType)

      return !error
    } catch (error) {
      console.error('Error updating black onyx silver base price:', error)
      return false
    }
  }

  // Update gold pricing for a specific option
  static async updateOptionPriceGold(jewelryType: string, settingId: string, optionId: string, newPrice: number): Promise<boolean> {
    try {
      // Get jewelry item ID
      const { data: jewelryItem } = await supabase
        .from('jewelry_items')
        .select('id')
        .eq('type', jewelryType)
        .single()

      if (!jewelryItem) return false

      // Update option gold price
      const { error } = await supabase
        .from('customization_options')
        .update({ price_gold: newPrice })
        .eq('jewelry_item_id', jewelryItem.id)
        .eq('setting_id', settingId)
        .eq('option_id', optionId)

      return !error
    } catch (error) {
      console.error('Error updating gold option price:', error)
      return false
    }
  }

  // Update silver pricing for a specific option
  static async updateOptionPriceSilver(jewelryType: string, settingId: string, optionId: string, newPrice: number): Promise<boolean> {
    try {
      // Get jewelry item ID
      const { data: jewelryItem } = await supabase
        .from('jewelry_items')
        .select('id')
        .eq('type', jewelryType)
        .single()

      if (!jewelryItem) return false

      // Update option silver price
      const { error } = await supabase
        .from('customization_options')
        .update({ price_silver: newPrice })
        .eq('jewelry_item_id', jewelryItem.id)
        .eq('setting_id', settingId)
        .eq('option_id', optionId)

      return !error
    } catch (error) {
      console.error('Error updating silver option price:', error)
      return false
    }
  }

  // Update pricing type for jewelry item
  static async updatePricingType(jewelryType: string, pricingType: 'diamond_type' | 'metal_type'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jewelry_items')
        .update({ pricing_type: pricingType })
        .eq('type', jewelryType)

      return !error
    } catch (error) {
      console.error('Error updating pricing type:', error)
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
  static async generateVariantImageUrl(jewelryType: string, customizations: { [key: string]: string }): Promise<string | null> {
    const baseUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item'
    
    console.log('🔧 CustomizationService: Generating URL using dynamic service for:', {
      jewelryType,
      customizations,
      timestamp: new Date().toISOString()
    });

    try {
      // Convert customizations to format expected by DynamicFilenameService
      const variantOptions = Object.entries(customizations).map(([settingId, optionId]) => ({
        setting_id: settingId,
        option_id: optionId
      }));

      // Generate filename using dynamic service (returns with .webp extension)
      const filename = await DynamicFilenameService.generateDynamicFilename(jewelryType, variantOptions);
      const baseName = filename.replace(/\.[^/.]+$/, ''); // Strip extension
      const folder = `${jewelryType}s`;

      // Check which file extension actually exists in storage (.webp preferred, fallback to .PNG/.png)
      const extensions = ['.webp', '.PNG', '.png'];

      try {
        const { data: files } = await supabase.storage
          .from('customization-item')
          .list(folder, { search: baseName });

        if (files && files.length > 0) {
          // Find the first matching file with a supported extension
          const match = files.find(f => {
            const fBase = f.name.replace(/\.[^/.]+$/, '');
            return fBase === baseName && extensions.some(ext => f.name.endsWith(ext));
          });

          if (match) {
            // Add cache buster using file's updated_at timestamp to bust Next.js image cache
            const cacheBuster = match.updated_at ? `?t=${new Date(match.updated_at).getTime()}` : '';
            const finalUrl = `${baseUrl}/${folder}/${match.name}${cacheBuster}`;
            console.log('✅ Found existing file with resolved extension:', finalUrl);
            return finalUrl;
          }
        }
      } catch (storageError) {
        console.warn('⚠️ Could not check storage for file extension, defaulting to .webp:', storageError);
      }

      // Default to .webp if no file found (new upload expected)
      const finalUrl = `${baseUrl}/${folder}/${filename}`;
      console.log('✅ Generated URL (default .webp):', finalUrl);
      return finalUrl;

    } catch (error) {
      console.error('❌ Error generating dynamic variant URL:', error);
      return null;
    }
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
    const imageUrl = await this.generateVariantImageUrl(jewelryType, customizations)
    
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

  // Calculate total price based on pricing variant (diamond type or metal type)
  static calculateTotalPrice(
    jewelryItem: JewelryItem,
    customizations: { [key: string]: string },
    pricingVariant: DiamondType | MetalType = 'natural'
  ): number {
    // Determine if we're using diamond_type or metal_type pricing
    const pricingType = jewelryItem.pricingType || 'diamond_type';

    // Check if black onyx is selected as first stone for special pricing
    const isBlackOnyxSelected = customizations.first_stone === 'black_onyx';

    // Start with appropriate base price
    let totalPrice: number;

    if (isBlackOnyxSelected && jewelryItem.blackOnyxBasePrice !== undefined) {
      // Use black onyx specific base price
      if (pricingType === 'diamond_type') {
        totalPrice = pricingVariant === 'lab_grown' && jewelryItem.blackOnyxBasePriceLabGrown !== undefined
          ? jewelryItem.blackOnyxBasePriceLabGrown
          : jewelryItem.blackOnyxBasePrice;
      } else { // metal_type
        if (pricingVariant === 'gold' && jewelryItem.blackOnyxBasePriceGold !== undefined) {
          totalPrice = jewelryItem.blackOnyxBasePriceGold;
        } else if (pricingVariant === 'silver' && jewelryItem.blackOnyxBasePriceSilver !== undefined) {
          totalPrice = jewelryItem.blackOnyxBasePriceSilver;
        } else {
          totalPrice = jewelryItem.blackOnyxBasePrice;
        }
      }
    } else {
      // Use regular base price
      if (pricingType === 'diamond_type') {
        totalPrice = pricingVariant === 'lab_grown' && jewelryItem.basePriceLabGrown
          ? jewelryItem.basePriceLabGrown
          : jewelryItem.basePrice;
      } else { // metal_type
        if (pricingVariant === 'gold' && jewelryItem.basePriceGold !== undefined) {
          totalPrice = jewelryItem.basePriceGold;
        } else if (pricingVariant === 'silver' && jewelryItem.basePriceSilver !== undefined) {
          totalPrice = jewelryItem.basePriceSilver;
        } else {
          totalPrice = jewelryItem.basePrice;
        }
      }
    }

    // Add customization option prices
    jewelryItem.settings.forEach(setting => {
      const selectedValue = customizations[setting.id];
      if (selectedValue && typeof selectedValue === 'string') {
        const selectedOption = setting.options.find(option => option.id === selectedValue);
        if (selectedOption) {
          let optionPrice = selectedOption.price || 0;

          if (pricingType === 'diamond_type') {
            optionPrice = pricingVariant === 'lab_grown' && selectedOption.priceLabGrown !== undefined
              ? selectedOption.priceLabGrown
              : (selectedOption.price || 0);
          } else { // metal_type
            if (pricingVariant === 'gold' && selectedOption.priceGold !== undefined) {
              optionPrice = selectedOption.priceGold;
            } else if (pricingVariant === 'silver' && selectedOption.priceSilver !== undefined) {
              optionPrice = selectedOption.priceSilver;
            } else {
              optionPrice = selectedOption.price || 0;
            }
          }

          totalPrice += optionPrice;
        }
      }
    });

    return totalPrice;
  }
}
