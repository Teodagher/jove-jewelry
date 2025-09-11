'use client';

import React, { useState, useMemo, useEffect } from 'react'
import { JewelryItem, CustomizationState, CustomizationOption, DiamondType } from '@/types/customization';
import type { CustomizationSetting } from '@/types/customization';
import { CustomizationService } from '@/services/customizationService';
import LogicRulesEngine, { type RulesEngineResult } from '@/services/logicRulesEngine';
import { supabase } from '@/lib/supabase/client';
import JewelryPreview from './JewelryPreview';
import RingSizeSelector from './RingSizeSelector';
import RealLifeImageViewer from './RealLifeImageViewer';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { BuyNowButton } from '@/components/ui/buy-now-button';
import ProductDescription from '@/components/ProductDescription';
import PoweredByAstryCustomization from '@/components/PoweredByAstryCustomization';
import DiamondLoader from '@/components/ui/DiamondLoader';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { motion, AnimatePresence } from 'framer-motion';

// Preload critical images for faster UX
const preloadImage = (src: string) => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  }
};

interface CustomizationComponentProps {
  jewelryItem: JewelryItem;
  onCustomizationChange?: (state: CustomizationState, totalPrice: number) => void;
}

export default function CustomizationComponent({ 
  jewelryItem, 
  onCustomizationChange 
}: CustomizationComponentProps) {
  const [customizationState, setCustomizationState] = useState<CustomizationState>({});
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedDiamondType, setSelectedDiamondType] = useState<DiamondType>('lab_grown');
  const [rulesEngine, setRulesEngine] = useState<LogicRulesEngine | null>(null);
  const [appliedRules, setAppliedRules] = useState<RulesEngineResult | null>(null);
  const [rulesLoading, setRulesLoading] = useState(true);
  const { addCustomJewelryToCart } = useCart();
  const router = useRouter();

  // Extract all image URLs from customization options for preloading
  const allOptionImageUrls = useMemo(() => {
    const urls: string[] = [];
    jewelryItem.settings.forEach(setting => {
      setting.options.forEach(option => {
        if (option.image) {
          urls.push(option.image);
        } else if (option.imageUrl) {
          urls.push(option.imageUrl);
        }
      });
    });
    return urls;
  }, [jewelryItem.settings]);

  // Use image preloader hook for progressive loading with 1 second minimum
  const { 
    allLoaded: allImagesLoaded, 
    getImageState, 
    progress: imageLoadingProgress 
  } = useImagePreloader(allOptionImageUrls, 1000);

  // Initialize the rules engine for this product
  useEffect(() => {
    const initRulesEngine = async () => {
      try {
        setRulesLoading(true);
        const engine = await LogicRulesEngine.create(jewelryItem.id);
        setRulesEngine(engine);
        
        // Apply rules immediately to the current state to prevent flicker
        if (engine) {
          const settings = jewelryItem.settings.map(setting => ({
            id: setting.id,
            title: setting.title,
            description: setting.description ?? undefined,
            type: setting.type,
            required: setting.required,
            options: setting.options.map(option => ({
              id: option.id,
              option_id: option.id,
              option_name: option.name,
              price: option.price || 0,
              price_lab_grown: option.priceLabGrown ?? null,
              image_url: option.image ?? option.imageUrl ?? null,
              color_gradient: option.color ?? option.colorGradient ?? null,
              display_order: 0,
              is_active: true
            }))
          }));

          const stateForRules: Record<string, string> = {};
          Object.entries(customizationState).forEach(([key, value]) => {
            if (typeof value === 'string') {
              stateForRules[key] = value;
            }
          });

          const result = engine.applyRules(settings, stateForRules);
          setAppliedRules(result);

          // Apply auto-selections if any
          if (result.autoSelections && Object.keys(result.autoSelections).length > 0) {
            setCustomizationState(prevState => {
              const newState = { ...prevState };
              let hasChanges = false;

              Object.entries(result.autoSelections).forEach(([settingId, optionId]) => {
                if (newState[settingId] !== optionId) {
                  newState[settingId] = optionId;
                  hasChanges = true;
                }
              });

              return hasChanges ? newState : prevState;
            });
          }

          // Apply proposed selections if any (sets value but allows user to change it later)
          if (result.proposedSelections && Object.keys(result.proposedSelections).length > 0) {
            console.log('📋 Received proposedSelections:', result.proposedSelections);
            setCustomizationState(prevState => {
              console.log('📋 Current state before applying proposed selections:', prevState);
              const newState = { ...prevState };
              let hasChanges = false;

              Object.entries(result.proposedSelections).forEach(([settingId, optionId]) => {
                console.log(`📋 Applying proposed selection: ${settingId} = ${optionId}`);
                if (newState[settingId] !== optionId) {
                  newState[settingId] = optionId;
                  hasChanges = true;
                }
              });

              console.log('📋 New state after proposed selections:', newState);
              return hasChanges ? newState : prevState;
            });
          }
        }
      } catch (error) {
      } finally {
        setRulesLoading(false);
      }
    };

    initRulesEngine();
  }, [jewelryItem.id]);

  // Initialize with default selections for immediate preview
  useEffect(() => {
    // Only initialize if we haven't set any values yet (prevents overriding user selections)
    if (Object.keys(customizationState).length > 0) return;
    
    const updates: { [key: string]: string } = {};
    
    // Auto-select diamond for first stone
    const firstStoneSetting = jewelryItem.settings.find(setting => setting.id === 'first_stone');
    if (firstStoneSetting) {
      const diamondOption = firstStoneSetting.options.find(option => option.id === 'diamond');
      if (diamondOption) {
        updates.first_stone = 'diamond';
      }
    }
    
    // Auto-select chain type based on jewelry type
    const chainTypeSetting = jewelryItem.settings.find(setting => setting.id === 'chain_type');
    if (chainTypeSetting) {
      if (jewelryItem.id === 'bracelet') {
        // For bracelets, default to black leather cord
        const blackLeatherOption = chainTypeSetting.options.find(option => option.id === 'black_leather');
        if (blackLeatherOption) {
          updates.chain_type = 'black_leather';
        }
      } else {
        // For other jewelry types, default to black leather first (most common image)
        const blackLeatherOption = chainTypeSetting.options.find(option => option.id === 'black_leather');
        const whiteGoldChainOption = chainTypeSetting.options.find(option => option.id === 'white_gold_chain');
        if (blackLeatherOption) {
          updates.chain_type = 'black_leather';
        } else if (whiteGoldChainOption) {
          updates.chain_type = 'white_gold_chain';
        }
      }
    }
    
    // Auto-select metal based on chain type for better image matching
    const metalSetting = jewelryItem.settings.find(setting => setting.id === 'metal');
    if (metalSetting) {
      // Default to white gold for most consistent image availability
      const whiteGoldOption = metalSetting.options.find(option => option.id === 'white_gold');
      if (whiteGoldOption) {
        updates.metal = 'white_gold';
      }
    }
    
    // Auto-select emerald for second stone (most available image variant)
    const secondStoneSetting = jewelryItem.settings.find(setting => setting.id === 'second_stone');
    if (secondStoneSetting) {
      const emeraldOption = secondStoneSetting.options.find(option => option.id === 'emerald');
      if (emeraldOption) {
        updates.second_stone = 'emerald';
      }
    }
    
    // Set all defaults at once to trigger preview image immediately
    if (Object.keys(updates).length > 0) {
      setCustomizationState(updates);
    }
  }, [jewelryItem.settings, jewelryItem.id, customizationState]);

  // Aggressively preload common variant images for better performance
  useEffect(() => {
    const preloadWithRetry = (url: string, retries = 3) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      link.crossOrigin = 'anonymous';
      
      link.onload = () => {
        document.head.removeChild(link);
      };
      
      link.onerror = () => {
        document.head.removeChild(link);
        if (retries > 0) {
          setTimeout(() => preloadWithRetry(url, retries - 1), 1000);
        }
      };
      
      document.head.appendChild(link);
    };
    
    if (jewelryItem.id === 'bracelet') {
      // Preload only ACTUALLY existing bracelet combinations (based on compression script output)
      const existingBracelets = [
        'bracelet-black-leather-blue-sapphire-whitegold.webp',
        'bracelet-black-leather-blue-sapphire-yellowgold.webp',
        'bracelet-black-leather-emerald-whitegold.webp',
        'bracelet-black-leather-emerald-yellowgold.webp',
        'bracelet-black-leather-pink-sapphire-whitegold.webp',
        'bracelet-black-leather-pink-sapphire-yellowgold.webp',
        'bracelet-black-leather-ruby-whitegold.webp',
        'bracelet-gold-cord-blue-sapphire-yellowgold.webp',
        'bracelet-gold-cord-emerald-yellowgold.webp',
        'bracelet-gold-cord-pink-sapphire-yellowgold.webp',
        'bracelet-gold-cord-ruby-yellowgold.webp'
      ];
      
      existingBracelets.forEach(filename => {
        const preloadUrl = `https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item/bracelets/${filename}`;
        preloadWithRetry(preloadUrl);
      });
      } else if (jewelryItem.type === 'necklace') {
      // Preload only existing necklace combinations
      const existingNecklaces = [
        'necklace-black-leather-emerald-whitegold.webp',
        'necklace-black-leather-emerald-yellowgold.webp',
        'necklace-black-leather-ruby-whitegold.webp',
        'necklace-black-leather-ruby-yellowgold.webp',
        'necklace-black-leather-bluesapphire-whitegold.webp',
        'necklace-black-leather-bluesapphire-yellowgold.webp',
        'necklace-white-gold-emerald-whitegold.webp',
        'necklace-white-gold-ruby-whitegold.webp'
      ];
      
      existingNecklaces.forEach(filename => {
        const preloadUrl = `https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item/necklaces/${filename}`;
        preloadWithRetry(preloadUrl);
      });
      } else if (jewelryItem.type === 'ring') {
      // Preload all ring combinations (HQ WebP)
      const existingRings = [
        'Ring blue sapphire white gold.webp',
        'Ring blue sapphire yellow gold.webp',
        'Ring emerald white gold.webp',
        'Ring emerald yellow gold.webp',
        'Ring pink sapphire white gold.webp',
        'Ring pink sapphire yellow gold.webp',
        'Ring ruby white gold.webp',
        'Ring ruby yellow gold.webp'
      ];
      
      existingRings.forEach(filename => {
        const preloadUrl = `https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item/rings/${filename}`;
        preloadWithRetry(preloadUrl);
      });
    }
  }, [jewelryItem.type]);

  // Calculate total prices for both diamond types
  const totalPriceNatural = useMemo(() => {
    // Convert customizationState to plain object for service method
    const plainCustomizations: { [key: string]: string } = {};
    Object.entries(customizationState).forEach(([key, value]) => {
      if (typeof value === 'string') {
        plainCustomizations[key] = value;
      }
    });
    
    return CustomizationService.calculateTotalPrice(jewelryItem, plainCustomizations, 'natural');
  }, [customizationState, jewelryItem]);

  const totalPriceLabGrown = useMemo(() => {
    // Convert customizationState to plain object for service method
    const plainCustomizations: { [key: string]: string } = {};
    Object.entries(customizationState).forEach(([key, value]) => {
      if (typeof value === 'string') {
        plainCustomizations[key] = value;
      }
    });
    
    return CustomizationService.calculateTotalPrice(jewelryItem, plainCustomizations, 'lab_grown');
  }, [customizationState, jewelryItem]);

  // Apply rules whenever customization state changes
  useEffect(() => {
    if (!rulesEngine) return;

    try {
      // Convert JewelryItem settings to the format expected by rules engine
      const settings = jewelryItem.settings.map(setting => ({
        id: setting.id,
        title: setting.title,
        description: setting.description ?? undefined,
        type: setting.type,
        required: setting.required,
        options: setting.options.map(option => ({
          id: option.id,
          option_id: option.id, // Use same value for both
          option_name: option.name,
          price: option.price || 0,
          price_lab_grown: option.priceLabGrown ?? null,
          image_url: option.image ?? option.imageUrl ?? null, // Use image field first, then imageUrl
          color_gradient: option.color ?? option.colorGradient ?? null, // Use color field first, then colorGradient
          display_order: 0, // Default order
          is_active: true
        }))
      }));

      // Convert CustomizationState to Record<string, string> for rules engine
      const stateForRules: Record<string, string> = {};
      Object.entries(customizationState).forEach(([key, value]) => {
        if (typeof value === 'string') {
          stateForRules[key] = value;
        }
      });

      const result = rulesEngine.applyRules(settings, stateForRules);
      setAppliedRules(result);

      // Apply auto-selections if any
      if (result.autoSelections && Object.keys(result.autoSelections).length > 0) {
        setCustomizationState(prevState => {
          const newState = { ...prevState };
          let hasChanges = false;

          Object.entries(result.autoSelections).forEach(([settingId, optionId]) => {
            if (newState[settingId] !== optionId) {
              newState[settingId] = optionId;
              hasChanges = true;
            }
          });

          return hasChanges ? newState : prevState;
        });
      }

      // Apply proposed selections if any (sets value but allows user to change it later)
      if (result.proposedSelections && Object.keys(result.proposedSelections).length > 0) {
        console.log('🔄 Received proposedSelections in rules effect:', result.proposedSelections);
        setCustomizationState(prevState => {
          console.log('🔄 Current state before applying proposed selections:', prevState);
          const newState = { ...prevState };
          let hasChanges = false;

          Object.entries(result.proposedSelections).forEach(([settingId, optionId]) => {
            console.log(`🔄 Applying proposed selection: ${settingId} = ${optionId}`);
            if (newState[settingId] !== optionId) {
              newState[settingId] = optionId;
              hasChanges = true;
            }
          });

          console.log('🔄 New state after proposed selections:', newState);
          return hasChanges ? newState : prevState;
        });
      }
    } catch (error) {
    }
  }, [rulesEngine, customizationState, jewelryItem.settings]);

  // Check if Lab Grown option should be available
  const isLabGrownAvailable = useMemo(() => {
    // Black Onyx is only available as Natural diamonds
    return customizationState.first_stone !== 'black_onyx';
  }, [customizationState.first_stone]);

  // Current selected price
  const totalPrice = selectedDiamondType === 'natural' ? totalPriceNatural : totalPriceLabGrown;

  // Generate preview image URL based on customization state (async)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(jewelryItem.baseImage);
  const [imageVariantSettings, setImageVariantSettings] = useState<Set<string>>(new Set());

  // Load which settings affect image variants from database
  useEffect(() => {
    const loadImageVariantSettings = async () => {
      try {
        const { data: settingsData, error } = await supabase
          .from('customization_options')
          .select('setting_id')
          .eq('jewelry_item_id', jewelryItem.id)
          .eq('affects_image_variant', true)
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching image variant settings:', error);
          return;
        }

        const variantSettingIds = new Set((settingsData as any[])?.map((item: any) => item.setting_id) || []);
        setImageVariantSettings(variantSettingIds);
        console.log(`🖼️ Loaded image variant settings for ${jewelryItem.type}:`, Array.from(variantSettingIds));
      } catch (error) {
        console.error('Error loading image variant settings:', error);
      }
    };

    loadImageVariantSettings();
  }, [jewelryItem.id, jewelryItem.type]);

  useEffect(() => {
    const generatePreviewUrl = async () => {
      // Check if we have any image variant settings loaded
      if (imageVariantSettings.size === 0) {
        // If no variant settings loaded yet, use base image
        setPreviewImageUrl(jewelryItem.baseImage);
        return;
      }

      // Check if all required image variant settings have values selected
      const requiredSettingsWithValues = Array.from(imageVariantSettings).filter(settingId => {
        const settingValue = customizationState[settingId];
        return settingValue && settingValue !== '';
      });

      const hasAllRequiredImageVariants = requiredSettingsWithValues.length === imageVariantSettings.size;

      console.log(`🔍 Image variant check for ${jewelryItem.type}:`, {
        allVariantSettings: Array.from(imageVariantSettings),
        settingsWithValues: requiredSettingsWithValues,
        hasAllRequired: hasAllRequiredImageVariants,
        customizationState
      });

      // Only generate variant URL if we have values for ALL settings that affect image variants
      if (hasAllRequiredImageVariants) {
        // Convert CustomizationState to string-only object for the service, but only include image variant settings
        const stringCustomizations: { [key: string]: string } = {};
        Array.from(imageVariantSettings).forEach(settingId => {
          const value = customizationState[settingId];
          if (typeof value === 'string' && value !== '') {
            stringCustomizations[settingId] = value;
          }
        });

        console.log(`✅ Generating variant URL for ${jewelryItem.type} with customizations:`, stringCustomizations);

        const generatedUrl = await CustomizationService.generateVariantImageUrl(jewelryItem.type, stringCustomizations);
        if (generatedUrl) {
          setPreviewImageUrl(generatedUrl);
          return;
        }
      }
      
      // Fallback logic for initial load or when not all variant settings are selected
      
      // If no base image and no customizations selected yet, use a default variant
      if (!jewelryItem.baseImage && Object.keys(customizationState).length === 0) {
        if (jewelryItem.type === 'bracelet') {
          setPreviewImageUrl('https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item/bracelets/bracelet-black-leather-emerald-whitegold.webp');
          return;
        }
        if (jewelryItem.type === 'necklace') {
          setPreviewImageUrl('https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item/necklaces/necklace-black-leather-emerald-yellowgold.webp');
          return;
        }
        if (jewelryItem.type === 'ring') {
          setPreviewImageUrl('https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item/rings/Ring%20emerald%20white%20gold.png');
          return;
        }
      }
      
      setPreviewImageUrl(jewelryItem.baseImage);
    };

    generatePreviewUrl();
  }, [customizationState, jewelryItem, imageVariantSettings]);



  // Handle option selection
  const handleOptionSelect = (settingId: string, optionId: string) => {
    const newState = {
      ...customizationState,
      [settingId]: optionId
    };
    
    // Auto-adjust metal based on chain type to ensure image availability
    if (settingId === 'chain_type') {
      if (jewelryItem.id === 'necklace') {
        if (optionId === 'yellow_gold_chain_real') {
          // Yellow gold chain only works with yellow gold metal
          newState.metal = 'yellow_gold';
        } else if (optionId === 'white_gold_chain') {
          // White gold chain only works with white gold metal  
          newState.metal = 'white_gold';
        }
        // Black leather works with both, so don't auto-change
      } else if (jewelryItem.id === 'bracelet') {
        if (optionId === 'gold_cord') {
          // Gold cord bracelets only work with yellow gold metal
          newState.metal = 'yellow_gold';
        } else if (optionId === 'black_leather') {
          // Black leather bracelets work with both, but default to white gold
          newState.metal = 'white_gold';
        }
      }
    }
    
    // Auto-select Black Onyx + Emerald combination when Black Onyx is selected as first stone
    if (settingId === 'first_stone' && optionId === 'black_onyx') {
      // Automatically select the Black Onyx + Emerald combination for second stone
      newState.second_stone = 'black_onyx_emerald';
      
      // Auto-select default black onyx stone size (small)
      newState.black_onyx_stone_size = 'small_onyx_08ct';
      
      // Clear diamond size selection if it was set
      delete newState.diamond_size;
      
      // Force natural diamond type for Black Onyx (Black Onyx only available as natural)
      setSelectedDiamondType('natural');
      
      // Force black leather chain type for Black Onyx (only leather cords compatible)
      if (newState.chain_type === 'gold_cord') {
        newState.chain_type = 'black_leather';
      }
    }
    
    // Clear second stone if switching away from Black Onyx to diamond
    if (settingId === 'first_stone' && optionId === 'diamond' && customizationState.first_stone === 'black_onyx') {
      // Reset to default emerald when switching from Black Onyx to Diamond
      newState.second_stone = 'emerald';
      
      // Auto-select default diamond size (small)
      newState.diamond_size = 'small_015ct';
      
      // Clear black onyx stone size selection if it was set
      delete newState.black_onyx_stone_size;
    }
    
    setCustomizationState(newState);
    onCustomizationChange?.(newState, totalPrice);
  };

  // Check if a setting's images are loaded - must have ALL option images loaded
  const isSettingImagesLoaded = (setting: CustomizationSetting) => {
    // Check each option's image loading state - ALL must be loaded (no error fallback)
    return setting.options.every(option => {
      const imageUrl = option.image || option.imageUrl;
      if (!imageUrl) return true; // No image means it's "loaded"
      
      const imageState = getImageState(imageUrl);
      return imageState.loaded; // Only consider actually loaded, not errors
    });
  };

  // Get settings to render (filtered by rules or original)
  const getSettingsToRender = () => {
    if (appliedRules?.filteredSettings) {
      // Transform rules engine format back to component format
      return appliedRules.filteredSettings.map(setting => ({
        ...setting,
        options: setting.options.map(option => ({
          id: option.id,
          name: option.option_name,
          image: option.image_url || undefined,
          imageUrl: option.image_url || undefined,
          color: option.color_gradient || undefined,
          colorGradient: option.color_gradient || undefined,
          price: option.price,
          priceLabGrown: option.price_lab_grown
        }))
      }));
    }
    return jewelryItem.settings;
  };

  // Get settings that are ready to be displayed (images loaded)
  const getLoadedSettings = () => {
    return getSettingsToRender().filter(setting => isSettingImagesLoaded(setting));
  };

  // Check if we have any settings ready to show (used for transition timing)
  const hasSettingsReady = getLoadedSettings().length > 0;
  
  // Only hide loading screen when we actually have settings ready to show
  const shouldShowLoadingScreen = !allImagesLoaded || !hasSettingsReady;

  // Calculate more accurate progress that considers both image loading and step readiness
  const totalSettings = getSettingsToRender().length;
  const loadedSettings = getLoadedSettings().length;
  const stepProgress = totalSettings > 0 ? (loadedSettings / totalSettings) * 100 : 0;
  
  // Combine image loading progress with step readiness for more accurate display
  const combinedProgress = Math.min(imageLoadingProgress, stepProgress);

  // Check if all required settings are selected
  const isComplete = useMemo(() => {
    const settingsToCheck = getSettingsToRender();
    
    return settingsToCheck
      .filter(setting => {        
        // Only check required settings that have visible options
        if (!setting.required) return false;
        
        // Apply conditional logic for context-dependent settings
        // Stone size settings are only required if the corresponding stone is selected
        if (setting.id === 'diamond_size') {
          return customizationState.first_stone === 'diamond';
        }
        if (setting.id === 'black_onyx_stone_size') {
          return customizationState.first_stone === 'black_onyx';
        }
        
        // Cord size is only required if it's actually visible for the jewelry type
        if (setting.id === 'cord_size') {
          // For now, include cord_size in validation since it appears in bracelet options
          // TODO: Add more specific logic based on chain type if needed
          return true;
        }
        
        return true;
      })
      .every(setting => customizationState[setting.id]);
  }, [customizationState, jewelryItem.settings, appliedRules]);

  // Generate customization summary for human reading
  const generateCustomizationSummary = () => {
    const parts: string[] = [];
    
    jewelryItem.settings.forEach(setting => {
      if (setting.id === 'engraving') {
        // Handle engraving text specially
        const engravingText = customizationState[setting.id];
        if (engravingText && typeof engravingText === 'string' && engravingText.trim()) {
          parts.push(`Engraving: "${engravingText.trim()}"`);
        }
      } else {
        const selectedOptionId = customizationState[setting.id];
        const selectedOption = setting.options.find(opt => opt.id === selectedOptionId);
        if (selectedOption) {
          parts.push(selectedOption.name);
        }
      }
    });
    
    return `${jewelryItem.name} - ${parts.join(', ')}`;
  };

  // Handle adding to cart
  const handleAddToCart = async () => {
    if (!isComplete) return;

    setAddingToCart(true);
    try {
      const diamondTypeText = selectedDiamondType === 'natural' ? 'Natural' : 'Lab Grown';
      const customizationSummary = generateCustomizationSummary() + ` - ${diamondTypeText} Diamonds`;
      
      await addCustomJewelryToCart({
        jewelry_type: jewelryItem.id as 'necklaces' | 'rings' | 'bracelets' | 'earrings',
        customization_data: { ...customizationState, diamondType: selectedDiamondType },
        customization_summary: customizationSummary,
        base_price: selectedDiamondType === 'lab_grown' && jewelryItem.basePriceLabGrown 
          ? jewelryItem.basePriceLabGrown 
          : jewelryItem.basePrice,
        total_price: totalPrice,
        preview_image_url: previewImageUrl || undefined
      });

      // Redirect to cart
      router.push('/cart');
    } catch (error) {
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  // Handle buy now (add to cart and go straight to checkout) - uses selected diamond type
  const handleBuyNow = async () => {
    if (!isComplete) return;

    setAddingToCart(true);
    try {
      const diamondTypeText = selectedDiamondType === 'natural' ? 'Natural' : 'Lab Grown';
      const customizationSummary = generateCustomizationSummary() + ` - ${diamondTypeText} Diamonds`;
      
      await addCustomJewelryToCart({
        jewelry_type: jewelryItem.id as 'necklaces' | 'rings' | 'bracelets' | 'earrings',
        customization_data: { ...customizationState, diamondType: selectedDiamondType },
        customization_summary: customizationSummary,
        base_price: selectedDiamondType === 'lab_grown' && jewelryItem.basePriceLabGrown 
          ? jewelryItem.basePriceLabGrown 
          : jewelryItem.basePrice,
        total_price: totalPrice,
        preview_image_url: previewImageUrl || undefined
      });

      // Go straight to checkout
      router.push('/checkout');
    } catch (error) {
      alert('Failed to proceed to checkout. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="min-h-screen jove-bg-primary">
      {/* Header */}
      <div className="text-center py-8 sm:py-12 px-4 sm:px-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-normal mb-1 sm:mb-2 tracking-wide text-black">
          CREATE YOUR OWN
        </h1>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-normal tracking-wide text-black uppercase">
          TOI ET MOI {jewelryItem.name}
        </h2>
        
        {/* Diamond Type Selector */}
        <div className="mt-6">
          <div className="flex justify-center">
            <div className="flex rounded-lg border border-gray-300 p-1 bg-white shadow-sm">
              <button
                onClick={() => setSelectedDiamondType('natural')}
                className={`px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                  selectedDiamondType === 'natural'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                } ${!isLabGrownAvailable ? 'rounded-r-md' : ''}`}
              >
                Natural Diamonds
              </button>
              {isLabGrownAvailable && (
                <button
                  onClick={() => setSelectedDiamondType('lab_grown')}
                  className={`px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                    selectedDiamondType === 'lab_grown'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Lab Grown Diamonds
                </button>
              )}
            </div>
          </div>
          
          {/* Show info message when Lab Grown is not available */}
          {!isLabGrownAvailable && (
            <div className="mt-2 text-center">
              <p className="text-sm text-gray-500">
                Black Onyx is only available with Natural diamonds
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout (Stacked) */}
      <div className="lg:hidden px-4 sm:px-6 pb-8 sm:pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Live Preview - Mobile */}
          <div className="mb-12 sm:mb-20">
            <div className="relative w-[320px] h-[320px] sm:w-72 sm:h-72 mx-auto">
              <JewelryPreview
                imageUrl={previewImageUrl}
                alt={`${jewelryItem.name} preview`}
                width={320}
                height={320}
                className="w-full h-full"
                enableZoom={false}
                priority={false} // Only prioritize desktop version
              />
              <RealLifeImageViewer 
                     jewelryType={jewelryItem.type as 'bracelet' | 'ring' | 'necklace'}
              />
            </div>
          </div>

          {/* Product Description - Mobile */}
          <div className="mb-8">
                   <ProductDescription productType={jewelryItem.type} customizationState={customizationState} />
          </div>

          {/* Customization Settings - Mobile */}
          <div className="space-y-12 sm:space-y-16">
            <AnimatePresence mode="wait">
              {shouldShowLoadingScreen ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ 
                    opacity: 0, 
                    y: -20,
                    scale: 0.95,
                    transition: { duration: 0.4, ease: "easeInOut" }
                  }}
                  className="py-16"
                >
                  <DiamondLoader 
                    size="lg"
                    text="Loading the Jové experience"
                    showText={true}
                  />
                  <div className="mt-6 text-center">
                    <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
                      <motion.div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${Math.round(combinedProgress)}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Loading customization options... {Math.round(combinedProgress)}%
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    ease: "easeOut",
                    delay: 0.2
                  }}
                  className="space-y-12 sm:space-y-16"
                >
                  <AnimatePresence>
                    {getLoadedSettings().map((setting, index) => (
                      <motion.div 
                        key={setting.id}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          duration: 0.6,
                          delay: 0.4 + (index * 0.1),
                          ease: "easeOut"
                        }}
                      >
                        <CustomizationSetting
                          setting={setting}
                          selectedValue={customizationState[setting.id] as string}
                          onSelect={(optionId) => handleOptionSelect(setting.id, optionId)}
                          customizationState={customizationState}
                          appliedRules={appliedRules}
                          rulesLoading={rulesLoading}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions - Mobile */}
          <div className="mt-16 sm:mt-20 px-4">
            <BuyNowButton
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              disabled={!isComplete}
              loading={addingToCart}
              price={totalPrice}
              showBothOptions={true}
              diamondType={selectedDiamondType}
            />
          </div>
        </div>
      </div>

      {/* Desktop Layout (Side by Side) */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="grid grid-cols-2 gap-16 min-h-[80vh]">
            {/* Left Column - Customization Settings */}
            <div className="flex flex-col">
              <div className="space-y-16 flex-1">
                <AnimatePresence mode="wait">
                  {shouldShowLoadingScreen ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ 
                        opacity: 0, 
                        y: -20,
                        scale: 0.95,
                        transition: { duration: 0.4, ease: "easeInOut" }
                      }}
                      className="py-16"
                    >
                      <DiamondLoader 
                        size="lg"
                        text="Loading the Jové experience"
                        showText={true}
                      />
                      <div className="mt-6 text-center">
                        <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
                          <motion.div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: `${Math.round(combinedProgress)}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Loading customization options... {Math.round(combinedProgress)}%
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.6, 
                        ease: "easeOut",
                        delay: 0.2
                      }}
                      className="space-y-16"
                    >
                      <AnimatePresence>
                        {getLoadedSettings().map((setting, index) => (
                          <motion.div 
                            key={setting.id}
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ 
                              duration: 0.6,
                              delay: 0.4 + (index * 0.1),
                              ease: "easeOut"
                            }}
                          >
                            <CustomizationSetting
                              setting={setting}
                              selectedValue={customizationState[setting.id] as string}
                              onSelect={(optionId) => handleOptionSelect(setting.id, optionId)}
                              customizationState={customizationState}
                              appliedRules={appliedRules}
                              rulesLoading={rulesLoading}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Mobile buttons only - Desktop has buttons under preview */}
              <div className="mt-16 pt-8 border-t border-gray-100 block lg:hidden">
                <BuyNowButton
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  disabled={!isComplete}
                  loading={addingToCart}
                  price={totalPrice}
                  showBothOptions={true}
                  diamondType={selectedDiamondType}
                />
              </div>
            </div>

            {/* Right Column - Live Preview */}
            <div className="sticky top-24 h-fit">
              <div className="flex flex-col items-center">
                {/* Preview Image */}
                <div className="relative mb-8 mx-auto">
                  <JewelryPreview
                    imageUrl={previewImageUrl}
                    alt={`${jewelryItem.name} preview`}
                    width={384}
                    height={384}
                    className="w-96 h-96"
                    enableZoom={true}
                    priority={true} // Prioritize desktop version
                  />
                  <RealLifeImageViewer 
                     jewelryType={jewelryItem.type as 'bracelet' | 'ring' | 'necklace'}
                  />
                </div>
                
                {/* Product Description - Desktop */}
                <div className="mb-8 w-full max-w-sm">
                   <ProductDescription productType={jewelryItem.type} customizationState={customizationState} />
                </div>
                
                {/* Desktop buttons (show on desktop only) */}
                <div className="hidden lg:block w-full max-w-sm">
                  <BuyNowButton
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    disabled={!isComplete}
                    loading={addingToCart}
                    price={totalPrice}
                    showBothOptions={true}
                    diamondType={selectedDiamondType}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Powered by Astry */}
      <PoweredByAstryCustomization />
    </div>
  );
}

// Individual Setting Component
interface CustomizationSettingProps {
  setting: CustomizationSetting;
  selectedValue?: string;
  onSelect: (optionId: string) => void;
  customizationState: CustomizationState;  // Add this to access other selections
  appliedRules: RulesEngineResult | null;  // Add rules engine results
  rulesLoading: boolean;  // Add rules loading state
}

function CustomizationSetting({ 
  setting, 
  selectedValue, 
  onSelect, 
  customizationState,
  appliedRules,
  rulesLoading
}: CustomizationSettingProps) {
  // Use specialized RingSizeSelector for ring size options
  if (setting.id === 'ring_size') {
    return (
      <RingSizeSelector
        options={setting.options}
        selectedValue={selectedValue}
        onSelect={onSelect}
        title={setting.title}
      />
    );
  }

  // Use specialized text input for engraving
  if (setting.id === 'engraving') {
    return (
      <div className="px-2 sm:px-0">
        <h3 className="text-base sm:text-lg font-normal text-center mb-6 sm:mb-8 text-black uppercase tracking-wider">
          {setting.title}
        </h3>
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <input
              type="text"
              placeholder="Enter engraving text (optional)"
              value={selectedValue || ''}
              onChange={(e) => onSelect(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
              maxLength={14}
            />
            <p className="text-xs text-gray-500 text-center mt-2">
              Max 14 characters. Leave blank for no engraving.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filter options based on rules engine results (replaces hardcoded logic)
  const getFilteredOptions = () => {
    // If rules engine results are available, use them
    if (appliedRules) {
      const filteredSetting = appliedRules.filteredSettings.find(s => s.id === setting.id);
      if (filteredSetting) {
        // Convert back to the CustomizationOption format
        return filteredSetting.options.map(option => ({
          id: option.option_id,
          name: option.option_name,
          price: option.price,
          priceLabGrown: option.price_lab_grown ?? undefined,
          image: option.image_url ?? undefined,
          imageUrl: option.image_url ?? undefined,
          color: option.color_gradient ?? undefined,
          colorGradient: option.color_gradient ?? undefined
        }));
      }
    }

    // Fallback to original options if no rules applied or rules engine not ready
    return setting.options;
  };

  const filteredOptions = getFilteredOptions();

  // Don't render the setting at all if no options are available
  if (filteredOptions.length === 0) {
    return null;
  }

  // Default rendering for other settings
  return (
    <div className="px-2 sm:px-0">
      <h3 className="text-base sm:text-lg font-normal text-center mb-6 sm:mb-8 text-black uppercase tracking-wider">
        {setting.title}
      </h3>
      
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
        {filteredOptions.map((option) => (
          <OptionButton
            key={option.id}
            option={option}
            isSelected={selectedValue === option.id}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Individual Option Button Component
interface OptionButtonProps {
  option: CustomizationOption;
  isSelected: boolean;
  onSelect: () => void;
}

function OptionButton({ option, isSelected, onSelect }: OptionButtonProps) {
  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center transition-all duration-200 hover:scale-105 min-w-0"
    >
      {/* Visual representation */}
      <div className="mb-2 sm:mb-3">
        {option.image ? (
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden transition-all duration-200 ${
            isSelected ? 'ring-2 ring-black ring-offset-2' : ''
          }`}>
            <img
              src={option.image}
              alt={option.name}
              className="w-full h-full object-cover"
              loading="lazy"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        ) : option.color ? (
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all duration-200 ${
              isSelected ? 'ring-2 ring-black ring-offset-2' : ''
            }`}
            style={{ background: option.color }}
          />
        ) : (
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 transition-all duration-200 ${
            isSelected ? 'ring-2 ring-black ring-offset-2' : ''
          }`} />
        )}
      </div>
      
      {/* Option name */}
      <span className={`text-xs sm:text-xs font-normal text-center leading-tight transition-colors duration-200 max-w-[80px] sm:max-w-none ${
        isSelected ? 'text-black font-medium' : 'text-gray-600'
      }`}>
        {option.name}
      </span>
    </button>
  );
}
