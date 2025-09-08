'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CustomizationComponent from '@/components/CustomizationComponent';
import { CustomizationService } from '@/services/customizationService';
import { JewelryItem, CustomizationState } from '@/types/customization';

export default function DynamicCustomizePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [jewelryItem, setJewelryItem] = useState<JewelryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJewelryConfig = async () => {
      if (!slug) {
        setError('No product slug provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const config = await CustomizationService.getJewelryItemConfigBySlug(slug);
        
        if (config) {
          setJewelryItem(config);
        } else {
          setError('Product not found or not available for customization');
        }
      } catch (err) {
        console.error('Error fetching jewelry config:', err);
        setError('Error loading product customization');
      } finally {
        setLoading(false);
      }
    };

    fetchJewelryConfig();
  }, [slug]);

  const handleCustomizationChange = (state: CustomizationState, totalPrice: number) => {
    console.log(`${jewelryItem?.name} customization state:`, state);
    console.log('Total price:', totalPrice);
  };

  if (loading) {
    return (
      <div className="min-h-screen jove-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customization...</p>
        </div>
      </div>
    );
  }

  if (error || !jewelryItem) {
    return (
      <div className="min-h-screen jove-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-red-600 mb-6">{error || 'This product is not available for customization'}</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.history.back()} 
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
            <button 
              onClick={() => window.location.href = '/customize'} 
              className="px-6 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-900 transition-colors"
            >
              Browse All Products
            </button>
          </div>
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