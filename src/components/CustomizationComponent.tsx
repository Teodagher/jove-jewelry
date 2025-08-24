'use client';

import React, { useState, useMemo, useEffect } from 'react'
import { JewelryItem, CustomizationState, CustomizationOption, DiamondType } from '@/types/customization';
import type { CustomizationSetting } from '@/types/customization';
import { CustomizationService } from '@/services/customizationService';
import JewelryPreview from './JewelryPreview';
import RingSizeSelector from './RingSizeSelector';
import RealLifeImageViewer from './RealLifeImageViewer';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { BuyNowButton } from '@/components/ui/buy-now-button';

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
  const [selectedDiamondType, setSelectedDiamondType] = useState<DiamondType>('natural');
  const { addCustomJewelryToCart } = useCart();
  const router = useRouter();

  // Initialize with diamond selected for first stone and black leather for chain type by default
  useEffect(() => {
    const updates: { [key: string]: string } = {};
    
    // Auto-select diamond for first stone
    const firstStoneSetting = jewelryItem.settings.find(setting => setting.id === 'first_stone');
    if (firstStoneSetting && !customizationState.first_stone) {
      const diamondOption = firstStoneSetting.options.find(option => option.id === 'diamond');
      if (diamondOption) {
        updates.first_stone = 'diamond';
      }
    }
    
    // Auto-select chain type based on jewelry type
    const chainTypeSetting = jewelryItem.settings.find(setting => setting.id === 'chain_type');
    if (chainTypeSetting && !customizationState.chain_type) {
      if (jewelryItem.id === 'bracelet') {
        // For bracelets, default to black leather cord
        const blackLeatherOption = chainTypeSetting.options.find(option => option.id === 'black_leather');
        if (blackLeatherOption) {
          updates.chain_type = 'black_leather';
        }
      } else {
        // For other jewelry types, default to white gold chain
        const whiteGoldChainOption = chainTypeSetting.options.find(option => option.id === 'white_gold_chain');
        if (whiteGoldChainOption) {
          updates.chain_type = 'white_gold_chain';
        }
      }
    }
    
    // Auto-select metal based on chain type for better image matching
    const metalSetting = jewelryItem.settings.find(setting => setting.id === 'metal');
    if (metalSetting && !customizationState.metal) {
      // If yellow gold chain is selected, prefer yellow gold metal
      if (updates.chain_type === 'yellow_gold_chain_real') {
        const yellowGoldOption = metalSetting.options.find(option => option.id === 'yellow_gold');
        if (yellowGoldOption) {
          updates.metal = 'yellow_gold';
        }
      } else if (jewelryItem.id === 'bracelet' && updates.chain_type === 'black_leather') {
        // For bracelets with black leather, default to white gold
        const whiteGoldOption = metalSetting.options.find(option => option.id === 'white_gold');
        if (whiteGoldOption) {
          updates.metal = 'white_gold';
        }
      } else if (jewelryItem.id === 'bracelet' && updates.chain_type === 'gold_cord') {
        // For bracelets with gold cord, must use yellow gold
        const yellowGoldOption = metalSetting.options.find(option => option.id === 'yellow_gold');
        if (yellowGoldOption) {
          updates.metal = 'yellow_gold';
        }
      } else {
        // Default to white gold for other chain types
        const whiteGoldOption = metalSetting.options.find(option => option.id === 'white_gold');
        if (whiteGoldOption) {
          updates.metal = 'white_gold';
        }
      }
    }
    
    // Auto-select emerald for second stone (to show dynamic preview immediately)
    const secondStoneSetting = jewelryItem.settings.find(setting => setting.id === 'second_stone');
    if (secondStoneSetting && !customizationState.second_stone) {
      const emeraldOption = secondStoneSetting.options.find(option => option.id === 'emerald');
      if (emeraldOption) {
        updates.second_stone = 'emerald';
      }
    }
    
    if (Object.keys(updates).length > 0) {
      setCustomizationState(prev => ({
        ...prev,
        ...updates
      }));
    }
  }, [jewelryItem.settings, customizationState.first_stone, customizationState.chain_type, customizationState.metal, customizationState.second_stone]);

  // Aggressively preload common variant images for better performance
  useEffect(() => {
    const preloadWithRetry = (url: string, retries = 3) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      link.crossOrigin = 'anonymous';
      
      link.onload = () => {
        console.log('📦 Preloaded successfully:', url);
        document.head.removeChild(link);
      };
      
      link.onerror = () => {
        document.head.removeChild(link);
        if (retries > 0) {
          console.warn(`🔄 Preload retry (${4-retries}/3):`, url);
          setTimeout(() => preloadWithRetry(url, retries - 1), 1000);
        } else {
          console.error('❌ Preload failed after retries:', url);
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
    } else if (jewelryItem.id === 'necklace') {
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
    } else if (jewelryItem.id === 'ring') {
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
  }, [jewelryItem.id]);

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

  // Check if Lab Grown option should be available
  const isLabGrownAvailable = useMemo(() => {
    // Black Onyx is only available as Natural diamonds
    return customizationState.first_stone !== 'black_onyx';
  }, [customizationState.first_stone]);

  // Current selected price
  const totalPrice = selectedDiamondType === 'natural' ? totalPriceNatural : totalPriceLabGrown;

  // Generate preview image URL based on customization state
  const previewImageUrl = useMemo(() => {
    console.log('🔍 CustomizationComponent: Generating preview URL for:', {
      jewelryType: jewelryItem.id,
      customizationState,
      timestamp: new Date().toISOString()
    });

    const hasVariantStone = (customizationState.first_stone && customizationState.first_stone !== 'diamond') || customizationState.second_stone;
    
    if (jewelryItem.id === 'bracelet' && 
        customizationState.chain_type && customizationState.metal && hasVariantStone) {
      // Convert CustomizationState to string-only object for the service
      const stringCustomizations: { [key: string]: string } = {};
      Object.entries(customizationState).forEach(([key, value]) => {
        if (typeof value === 'string') {
          stringCustomizations[key] = value;
        }
      });
      const generatedUrl = CustomizationService.generateVariantImageUrl(jewelryItem.id, stringCustomizations);
      console.log('✅ Generated bracelet variant URL:', generatedUrl);
      return generatedUrl;
    }
    
    if (jewelryItem.id === 'ring' && 
        customizationState.metal && customizationState.second_stone) {
      // Convert CustomizationState to string-only object for the service
      const stringCustomizations: { [key: string]: string } = {};
      Object.entries(customizationState).forEach(([key, value]) => {
        if (typeof value === 'string') {
          stringCustomizations[key] = value;
        }
      });
      const generatedUrl = CustomizationService.generateVariantImageUrl(jewelryItem.id, stringCustomizations);
      return generatedUrl;
    }
    
    if (jewelryItem.id === 'necklace' && 
        customizationState.chain_type && customizationState.metal && hasVariantStone) {
      // Convert CustomizationState to string-only object for the service
      const stringCustomizations: { [key: string]: string } = {};
      Object.entries(customizationState).forEach(([key, value]) => {
        if (typeof value === 'string') {
          stringCustomizations[key] = value;
        }
      });
      const generatedUrl = CustomizationService.generateVariantImageUrl(jewelryItem.id, stringCustomizations);
      return generatedUrl;
    }
    
    // For other jewelry types, always use base image
    console.log('📋 Using base image:', jewelryItem.baseImage);
    return jewelryItem.baseImage;
  }, [customizationState, jewelryItem]);



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
      console.log('🖤 Auto-selected Black Onyx + Emerald combination for second stone');
      
      // Force natural diamond type for Black Onyx (Black Onyx only available as natural)
      setSelectedDiamondType('natural');
      console.log('💎 Forced Natural diamond type for Black Onyx selection');
      
      // Force black leather chain type for Black Onyx (only leather cords compatible)
      if (newState.chain_type === 'gold_cord') {
        newState.chain_type = 'black_leather';
        console.log('🖤 Switched to black leather cord for Black Onyx compatibility');
      }
    }
    
    // Clear second stone if switching away from Black Onyx to diamond
    if (settingId === 'first_stone' && optionId === 'diamond' && customizationState.first_stone === 'black_onyx') {
      // Reset to default emerald when switching from Black Onyx to Diamond
      newState.second_stone = 'emerald';
      console.log('💎 Switched to Diamond, reset second stone to emerald');
    }
    
    setCustomizationState(newState);
    onCustomizationChange?.(newState, totalPrice);
  };

  // Check if all required settings are selected
  const isComplete = useMemo(() => {
    return jewelryItem.settings
      .filter(setting => setting.required)
      .every(setting => customizationState[setting.id]);
  }, [customizationState, jewelryItem.settings]);

  // Generate customization summary for human reading
  const generateCustomizationSummary = () => {
    const parts: string[] = [];
    
    jewelryItem.settings.forEach(setting => {
      const selectedOptionId = customizationState[setting.id];
      const selectedOption = setting.options.find(opt => opt.id === selectedOptionId);
      if (selectedOption) {
        parts.push(selectedOption.name);
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
        preview_image_url: previewImageUrl
      });

      // Redirect to cart
      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
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
        preview_image_url: previewImageUrl
      });

      // Go straight to checkout
      router.push('/checkout');
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
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
                priority={true}
              />
              <RealLifeImageViewer 
                jewelryType={jewelryItem.id as 'bracelet' | 'ring' | 'necklace'}
              />
            </div>
          </div>

          {/* Customization Settings - Mobile */}
          <div className="space-y-12 sm:space-y-16">
            {jewelryItem.settings.map((setting, index) => (
              <CustomizationSetting
                key={setting.id}
                setting={setting}
                selectedValue={customizationState[setting.id] as string}
                onSelect={(optionId) => handleOptionSelect(setting.id, optionId)}
                stepNumber={index + 1}
                customizationState={customizationState}
              />
            ))}
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
                {jewelryItem.settings.map((setting, index) => (
                  <CustomizationSetting
                    key={setting.id}
                    setting={setting}
                    selectedValue={customizationState[setting.id] as string}
                    onSelect={(optionId) => handleOptionSelect(setting.id, optionId)}
                    stepNumber={index + 1}
                    customizationState={customizationState}
                  />
                ))}
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
                    priority={true}
                  />
                  <RealLifeImageViewer 
                    jewelryType={jewelryItem.id as 'bracelet' | 'ring' | 'necklace'}
                  />
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
    </div>
  );
}

// Individual Setting Component
interface CustomizationSettingProps {
  setting: CustomizationSetting;
  selectedValue?: string;
  onSelect: (optionId: string) => void;
  stepNumber: number;
  customizationState: CustomizationState;  // Add this to access other selections
}

function CustomizationSetting({ 
  setting, 
  selectedValue, 
  onSelect, 
  stepNumber,
  customizationState 
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

  // Filter options based on selection context
  const getFilteredOptions = () => {
    // For chain type options, filter based on first stone selection for bracelets
    if (setting.id === 'chain_type' && customizationState.first_stone === 'black_onyx') {
      // If Black Onyx is selected as first stone, only show leather cord options (no gold cord)
      return setting.options.filter(option => 
        option.id === 'black_leather' || option.id.includes('leather')
      );
    }
    
    // For second stone options, filter based on first stone selection
    if (setting.id === 'second_stone') {
      const firstStone = customizationState.first_stone;
      
      // If Black Onyx is selected as first stone, only show Black Onyx + Emerald combination
      if (firstStone === 'black_onyx') {
        return setting.options.filter(option => option.id === 'black_onyx_emerald');
      }
      
      // If Diamond is selected as first stone, show all normal second stones (excluding Black Onyx combinations)
      if (firstStone === 'diamond') {
        return setting.options.filter(option => 
          !option.id.includes('black_onyx') && option.id !== 'black_onyx_emerald'
        );
      }
    }
    
    return setting.options;
  };

  const filteredOptions = getFilteredOptions();

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
