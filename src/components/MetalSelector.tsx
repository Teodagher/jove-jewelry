'use client';

import React from 'react';
import { METAL_GRADIENTS } from '@/constants/metalColors';

interface MetalOption {
  id: string;
  name: string;
  price: number;
  color?: string;
}

interface MetalSelectorProps {
  options: MetalOption[];
  selectedValue?: string;
  onSelect: (optionId: string) => void;
  title?: string;
}

export default function MetalSelector({ 
  options, 
  selectedValue, 
  onSelect, 
  title = "Choose Metal" 
}: MetalSelectorProps) {
  return (
    <div className="px-2 sm:px-0">
      <h3 className="text-base sm:text-lg font-normal text-center mb-6 sm:mb-8 text-black uppercase tracking-wider">
        {title}
      </h3>
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
        {options.map((option) => {
          const isSelected = selectedValue === option.id;
          // Use predefined gradients for metals, fallback to option.color
          const metalGradient = METAL_GRADIENTS[option.id as keyof typeof METAL_GRADIENTS] || option.color;
          
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className="flex flex-col items-center transition-all duration-200 hover:scale-105 min-w-0"
            >
              <div className="mb-2 sm:mb-3">
                <div 
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all duration-200 ${
                    isSelected ? 'ring-2 ring-black ring-offset-2' : ''
                  }`}
                  style={{ background: metalGradient }}
                />
              </div>
              <span className={`text-xs sm:text-xs font-normal text-center leading-tight transition-colors duration-200 max-w-[80px] sm:max-w-none ${
                isSelected ? 'text-black font-medium' : 'text-gray-600'
              }`}>
                {option.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
