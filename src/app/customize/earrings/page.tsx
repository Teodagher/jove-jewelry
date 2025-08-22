'use client';

import { useState, useEffect } from 'react';
import CustomizationComponent from '@/components/CustomizationComponent';
import { CustomizationService } from '@/services/customizationService';
import { JewelryItem, CustomizationState } from '@/types/customization';

export default function EarringCustomizePage() {
  const [jewelryItem, setJewelryItem] = useState<JewelryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEarringsConfig = async () => {
      try {
        setLoading(true);
        const config = await CustomizationService.getJewelryItemConfig('earrings');
        
        if (config) {
          setJewelryItem(config);
        } else {
          setError('Failed to load earrings configuration');
        }
      } catch (err) {
        console.error('Error fetching earrings config:', err);
        setError('Error loading earrings customization');
      } finally {
        setLoading(false);
      }
    };

    fetchEarringsConfig();
  }, []);

  const handleCustomizationChange = (state: CustomizationState, totalPrice: number) => {
    console.log('Earring customization state:', state);
    console.log('Total price:', totalPrice);
  };

  if (loading) {
    return (
      <div className="min-h-screen jove-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earrings customization...</p>
        </div>
      </div>
    );
  }

  if (error || !jewelryItem) {
    return (
      <div className="min-h-screen jove-bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Earrings configuration not found'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-900"
          >
            Try Again
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
