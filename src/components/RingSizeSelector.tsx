'use client';

import React from 'react';

interface RingSizeOption {
  id: string;
  name: string;
  price?: number;
  image?: string;
  color?: string;
}

interface RingSizeSelectorProps {
  options: RingSizeOption[];
  selectedValue?: string;
  onSelect: (optionId: string) => void;
  title?: string;
}

export default function RingSizeSelector({ 
  options, 
  selectedValue, 
  onSelect, 
  title = "Choose ring size" 
}: RingSizeSelectorProps) {
  return (
    <div className="px-2 sm:px-0">
      <h3 className="text-base sm:text-lg font-normal text-center mb-6 sm:mb-8 text-black uppercase tracking-wider">
        {title}
      </h3>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-md mx-auto">
        {options.map((option) => {
          const isSelected = selectedValue === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`
                px-4 py-2 text-sm font-medium transition-all duration-200 
                border-2 rounded-lg min-w-[50px] hover:scale-105
                ${isSelected 
                  ? 'border-black bg-black text-white' 
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }
              `}
            >
              {option.name}
            </button>
          );
        })}
      </div>
      <div className="text-center mt-4">
        <p className="text-xs text-gray-500">
          Ring sizes are in European sizing
        </p>
      </div>
    </div>
  );
}
