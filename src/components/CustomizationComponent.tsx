'use client';

import React, { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { JewelryItem, CustomizationState, CustomizationOption } from '@/types/customization';
import type { CustomizationSetting } from '@/types/customization';
import { CustomizationService } from '@/services/customizationService';
import RingSizeSelector from './RingSizeSelector';

interface CustomizationComponentProps {
  jewelryItem: JewelryItem;
  onCustomizationChange?: (state: CustomizationState, totalPrice: number) => void;
}

export default function CustomizationComponent({ 
  jewelryItem, 
  onCustomizationChange 
}: CustomizationComponentProps) {
  const [customizationState, setCustomizationState] = useState<CustomizationState>({});
  const [imageLoading, setImageLoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

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
    
    // Auto-select black leather for chain type (since we only have black leather variants)
    const chainTypeSetting = jewelryItem.settings.find(setting => setting.id === 'chain_type');
    if (chainTypeSetting && !customizationState.chain_type) {
      const blackLeatherOption = chainTypeSetting.options.find(option => option.id === 'black_leather');
      if (blackLeatherOption) {
        updates.chain_type = 'black_leather';
      }
    }
    
    // Auto-select white gold for metal (to show dynamic preview immediately)
    const metalSetting = jewelryItem.settings.find(setting => setting.id === 'metal');
    if (metalSetting && !customizationState.metal) {
      const whiteGoldOption = metalSetting.options.find(option => option.id === 'white_gold');
      if (whiteGoldOption) {
        updates.metal = 'white_gold';
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

  // Calculate total price based on selections
  const totalPrice = useMemo(() => {
    let price = jewelryItem.basePrice;
    
    jewelryItem.settings.forEach(setting => {
      const selectedValue = customizationState[setting.id];
      if (selectedValue && typeof selectedValue === 'string') {
        const selectedOption = setting.options.find(option => option.id === selectedValue);
        if (selectedOption?.price) {
          price += selectedOption.price;
        }
      }
    });
    
    return price;
  }, [customizationState, jewelryItem]);

  // Generate dynamic preview image URL based on current selections
  const previewImageUrl = useMemo(() => {
    // Debug removed - dynamic preview is working
    
    // For bracelets, use dynamic variant images if all required selections are made
    // Diamond is always present, so we need chain_type, metal, and a second stone (or non-diamond first stone)
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
      return generatedUrl;
    }
    // Fallback to base image
    return jewelryItem.baseImage;
  }, [customizationState, jewelryItem]);

  // Handle image URL changes with crossfade effect
  useEffect(() => {
    if (previewImageUrl !== currentImageUrl) {
      setImageLoading(true);
    }
  }, [previewImageUrl, currentImageUrl]);

  // Initialize current image URL
  useEffect(() => {
    if (!currentImageUrl && previewImageUrl) {
      setCurrentImageUrl(previewImageUrl);
    }
  }, [previewImageUrl, currentImageUrl]);

  // Handle option selection
  const handleOptionSelect = (settingId: string, optionId: string) => {
    const newState = {
      ...customizationState,
      [settingId]: optionId
    };
    setCustomizationState(newState);
    onCustomizationChange?.(newState, totalPrice);
  };

  // Check if all required settings are selected
  const isComplete = useMemo(() => {
    return jewelryItem.settings
      .filter(setting => setting.required)
      .every(setting => customizationState[setting.id]);
  }, [customizationState, jewelryItem.settings]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="text-center py-8 sm:py-12 px-4 sm:px-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-normal mb-1 sm:mb-2 tracking-wide text-black">
          CREATE YOUR OWN
        </h1>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-normal tracking-wide text-black uppercase">
          TOI ET MOI {jewelryItem.name}
        </h2>
      </div>

      {/* Mobile Layout (Stacked) */}
      <div className="lg:hidden px-4 sm:px-6 pb-8 sm:pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Live Preview - Mobile */}
          <div className="flex justify-center mb-12 sm:mb-20">
            <div className="relative w-60 h-60 sm:w-72 sm:h-72 flex items-center justify-center overflow-hidden">
              {/* Current Image */}
              {currentImageUrl && (
                <Image
                  src={currentImageUrl}
                  alt={`${jewelryItem.name} preview`}
                  width={280}
                  height={280}
                  className={`absolute inset-0 object-contain w-full h-full transition-opacity duration-500 ease-in-out ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              )}
              {/* New Image (loading) */}
              {imageLoading && previewImageUrl !== currentImageUrl && (
                <Image
                  src={previewImageUrl}
                  alt={`${jewelryItem.name} preview loading`}
                  width={280}
                  height={280}
                  className="absolute inset-0 object-contain w-full h-full transition-opacity duration-500 ease-in-out opacity-0"
                  onLoad={() => {
                    setCurrentImageUrl(previewImageUrl);
                    setTimeout(() => setImageLoading(false), 100);
                  }}
                />
              )}
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
              />
            ))}
          </div>

          {/* Price and Add to Cart - Mobile */}
          <div className="mt-16 sm:mt-20 text-center px-4">
            <div className="mb-6 sm:mb-8">
              <span className="text-xl sm:text-2xl font-normal text-black">
                ${totalPrice.toLocaleString()}
              </span>
            </div>
            <button
              className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3 text-sm sm:text-base font-normal tracking-wide transition-all duration-300 border ${
                isComplete
                  ? 'bg-black text-white border-black hover:bg-gray-800'
                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
              disabled={!isComplete}
            >
              ADD TO CART
            </button>
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
                  />
                ))}
              </div>
              
              {/* Price and Add to Cart - Desktop */}
              <div className="mt-16 pt-8 border-t border-gray-100">
                <div className="mb-8">
                  <span className="text-3xl font-normal text-black">
                    ${totalPrice.toLocaleString()}
                  </span>
                </div>
                <button
                  className={`w-full px-8 py-4 text-base font-normal tracking-wide transition-all duration-300 border ${
                    isComplete
                      ? 'bg-black text-white border-black hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                  disabled={!isComplete}
                >
                  ADD TO CART
                </button>
              </div>
            </div>

            {/* Right Column - Live Preview */}
            <div className="flex items-center justify-center sticky top-24 h-fit">
              <div className="relative w-96 h-96 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                {/* Current Image */}
                {currentImageUrl && (
                  <Image
                    src={currentImageUrl}
                    alt={`${jewelryItem.name} preview`}
                    width={400}
                    height={400}
                    className={`absolute inset-0 object-contain w-full h-full p-8 transition-opacity duration-500 ease-in-out ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                )}
                {/* New Image (loading) */}
                {imageLoading && previewImageUrl !== currentImageUrl && (
                  <Image
                    src={previewImageUrl}
                    alt={`${jewelryItem.name} preview loading`}
                    width={400}
                    height={400}
                    className="absolute inset-0 object-contain w-full h-full p-8 transition-opacity duration-500 ease-in-out opacity-0"
                    onLoad={() => {
                      setCurrentImageUrl(previewImageUrl);
                      setTimeout(() => setImageLoading(false), 100);
                    }}
                  />
                )}
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
}

function CustomizationSetting({ 
  setting, 
  selectedValue, 
  onSelect, 
  stepNumber 
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

  // Default rendering for other settings
  return (
    <div className="px-2 sm:px-0">
      <h3 className="text-base sm:text-lg font-normal text-center mb-6 sm:mb-8 text-black uppercase tracking-wider">
        {setting.title}
      </h3>
      
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
        {setting.options.map((option) => (
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
            <Image
              src={option.image}
              alt={option.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
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
