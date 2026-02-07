'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import CustomizationComponent from '@/components/CustomizationComponent';
import { CustomizationService } from '@/services/customizationService';
import { JewelryItem, CustomizationState } from '@/types/customization';
import { getMarketClient } from '@/lib/market-client';
import type { Market } from '@/lib/market-client';
import { supabase } from '@/lib/supabase/client';

interface PresetDesign {
  id: string;
  jewelry_item_id: string;
  name: string;
  slug: string;
  customization_data: Record<string, string>;
}

export default function DynamicCustomizePage() {
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();
  const presetSlug = searchParams.get('preset');

  const [jewelryItem, setJewelryItem] = useState<JewelryItem | null>(null);
  const [initialPreset, setInitialPreset] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get market from URL or cookie
  const getMarket = (): Market => {
    const urlMarket = searchParams.get('market');
    if (urlMarket === 'au' || urlMarket === 'lb' || urlMarket === 'intl') {
      return urlMarket as Market;
    }
    return getMarketClient();
  };

  useEffect(() => {
    const fetchJewelryConfig = async () => {
      if (!slug) {
        setError('No product slug provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get the user's market from URL parameter or cookies
        const market = getMarket();
        console.log('🌍 Current market:', market);

        // Fetch config with market-specific pricing
        const config = await CustomizationService.getJewelryItemConfigBySlug(slug, market);

        if (config) {
          console.log('✅ Product config loaded:', {
            name: config.name,
            settingsCount: config.settings.length,
            settings: config.settings.map(s => ({ id: s.id, title: s.title, optionsCount: s.options.length }))
          });
          setJewelryItem(config);
          
          // If a preset slug is provided, fetch and apply the preset
          if (presetSlug) {
            console.log('🎨 Loading preset:', presetSlug);
            const { data: preset, error: presetError } = await supabase
              .from('preset_designs')
              .select('customization_data')
              .eq('slug', presetSlug)
              .eq('jewelry_item_id', config.id)
              .eq('is_active', true)
              .single();
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const presetData = preset as any;
            if (!presetError && presetData) {
              console.log('✅ Preset loaded:', presetData.customization_data);
              setInitialPreset(presetData.customization_data);
            } else {
              console.log('⚠️ Preset not found or inactive:', presetSlug);
            }
          }
        } else {
          console.error('❌ Product not found or not available in market:', market);
          setError('Product not found or not available in your region');
        }
      } catch (err) {
        console.error('Error fetching jewelry config:', err);
        setError('Error loading product customization');
      } finally {
        setLoading(false);
      }
    };

    fetchJewelryConfig();
  }, [slug, searchParams, presetSlug]);

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
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Available</h1>
          <p className="text-red-600 mb-6">
            {error || 'This product is not available for customization in your region'}
          </p>
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
      initialPreset={initialPreset || undefined}
    />
  );
}