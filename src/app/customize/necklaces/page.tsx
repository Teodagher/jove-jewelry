'use client';

import { useState, useEffect } from 'react';
import CustomizationComponent from '@/components/CustomizationComponent';
import { CustomizationService } from '@/services/customizationService';
import { CustomizationState, JewelryItem } from '@/types/customization';

export default function NecklaceCustomizePage() {
  const [jewelryItem, setJewelryItem] = useState<JewelryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNecklaceConfig = async () => {
      try {
        setLoading(true);
        const config = await CustomizationService.getJewelryItemConfig('necklace');
        
        if (config) {
          setJewelryItem(config);
        } else {
          setError('Failed to load necklace configuration');
        }
      } catch (err) {
        console.error('Error fetching necklace config:', err);
        setError('Failed to load necklace configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchNecklaceConfig();
  }, []);

  const handleCustomizationChange = (state: CustomizationState, totalPrice: number) => {
    // Handle customization changes (e.g., save to local storage, update URL params, etc.)
    console.log('Customization state:', state);
    console.log('Total price:', totalPrice);
  };

  if (loading) {
    return (
      <div className="min-h-screen jove-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customization options...</p>
        </div>
      </div>
    );
  }

  if (error || !jewelryItem) {
    return (
      <div className="min-h-screen jove-bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load configuration'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-zinc-800 text-white hover:bg-zinc-900 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <CustomizationComponent
      jewelryItem={jewelryItem}
      onCustomizationChange={handleCustomizationChange}
    />
  );
}
