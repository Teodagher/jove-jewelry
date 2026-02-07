'use client';

import { useState, useEffect } from 'react';
import { CustomizationService } from '@/services/customizationService';

interface PricingData {
  id: string;
  name: string;
  type: string;
  base_price: number;
  base_price_lab_grown?: number;
  base_price_gold?: number | null;
  base_price_silver?: number | null;
  base_price_gold_au?: number | null;
  base_price_silver_au?: number | null;
  pricing_type?: 'diamond_type' | 'metal_type';
  customization_options: Array<{
    id: string;
    setting_id: string;
    setting_title: string;
    option_id: string;
    option_name: string;
    price: number;
    price_lab_grown?: number;
    price_gold?: number | null;
    price_silver?: number | null;
    display_order: number;
  }>;
}

type PricingMode = 'diamond_type' | 'metal_type';
type MetalVariant = 'natural' | 'gold' | 'silver';

export default function RingsPricingPage() {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedDiamondType, setSelectedDiamondType] = useState<'natural' | 'lab_grown'>('natural');
  const [pricingMode, setPricingMode] = useState<PricingMode>('diamond_type');
  const [selectedMetal, setSelectedMetal] = useState<MetalVariant>('natural');

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      const data = await CustomizationService.getAllPricingData('ring');
      setPricingData(data);
      // Set pricing mode based on data
      if (data && (data as PricingData).pricing_type) {
        setPricingMode((data as PricingData).pricing_type as PricingMode);
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      setMessage({ type: 'error', text: 'Failed to load pricing data' });
    } finally {
      setLoading(false);
    }
  };

  const updateBasePrice = async (newPrice: number) => {
    try {
      setSaving(true);
      const success = await CustomizationService.updateBasePrice('ring', newPrice);
      
      if (success) {
        setMessage({ type: 'success', text: 'Natural diamond base price updated successfully' });
        fetchPricingData();
      } else {
        setMessage({ type: 'error', text: 'Failed to update base price' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating base price' });
    } finally {
      setSaving(false);
    }
  };

  const updateBasePriceLabGrown = async (newPrice: number) => {
    try {
      setSaving(true);
      const success = await CustomizationService.updateBasePriceLabGrown('ring', newPrice);
      
      if (success) {
        setMessage({ type: 'success', text: 'Lab grown base price updated successfully' });
        fetchPricingData();
      } else {
        setMessage({ type: 'error', text: 'Failed to update lab grown base price' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating lab grown base price' });
    } finally {
      setSaving(false);
    }
  };

  const updateBasePriceGold = async (newPrice: number) => {
    try {
      setSaving(true);
      const success = await CustomizationService.updateBasePriceGold('ring', newPrice);
      
      if (success) {
        setMessage({ type: 'success', text: 'Gold base price updated successfully' });
        fetchPricingData();
      } else {
        setMessage({ type: 'error', text: 'Failed to update gold base price' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating gold base price' });
    } finally {
      setSaving(false);
    }
  };

  const updateBasePriceSilver = async (newPrice: number) => {
    try {
      setSaving(true);
      const success = await CustomizationService.updateBasePriceSilver('ring', newPrice);
      
      if (success) {
        setMessage({ type: 'success', text: 'Silver base price updated successfully' });
        fetchPricingData();
      } else {
        setMessage({ type: 'error', text: 'Failed to update silver base price' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating silver base price' });
    } finally {
      setSaving(false);
    }
  };

  const updateOptionPrice = async (settingId: string, optionId: string, newPrice: number) => {
    try {
      setSaving(true);
      const success = await CustomizationService.updateOptionPrice('ring', settingId, optionId, newPrice);
      
      if (success) {
        setMessage({ type: 'success', text: 'Natural diamond option price updated successfully' });
        fetchPricingData();
      } else {
        setMessage({ type: 'error', text: 'Failed to update option price' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating option price' });
    } finally {
      setSaving(false);
    }
  };

  const updateOptionPriceLabGrown = async (settingId: string, optionId: string, newPrice: number) => {
    try {
      setSaving(true);
      const success = await CustomizationService.updateOptionPriceLabGrown('ring', settingId, optionId, newPrice);
      
      if (success) {
        setMessage({ type: 'success', text: 'Lab grown option price updated successfully' });
        fetchPricingData();
      } else {
        setMessage({ type: 'error', text: 'Failed to update lab grown option price' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating lab grown option price' });
    } finally {
      setSaving(false);
    }
  };

  const updateOptionPriceGold = async (settingId: string, optionId: string, newPrice: number) => {
    try {
      setSaving(true);
      const success = await CustomizationService.updateOptionPriceGold('ring', settingId, optionId, newPrice);
      
      if (success) {
        setMessage({ type: 'success', text: 'Gold option price updated successfully' });
        fetchPricingData();
      } else {
        setMessage({ type: 'error', text: 'Failed to update gold option price' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating gold option price' });
    } finally {
      setSaving(false);
    }
  };

  const updateOptionPriceSilver = async (settingId: string, optionId: string, newPrice: number) => {
    try {
      setSaving(true);
      const success = await CustomizationService.updateOptionPriceSilver('ring', settingId, optionId, newPrice);
      
      if (success) {
        setMessage({ type: 'success', text: 'Silver option price updated successfully' });
        fetchPricingData();
      } else {
        setMessage({ type: 'error', text: 'Failed to update silver option price' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating silver option price' });
    } finally {
      setSaving(false);
    }
  };

  const getCurrentBasePrice = () => {
    if (!pricingData) return 0;
    if (pricingMode === 'metal_type') {
      if (selectedMetal === 'gold') return pricingData.base_price_gold || 0;
      if (selectedMetal === 'silver') return pricingData.base_price_silver || 0;
    }
    return selectedDiamondType === 'natural' ? pricingData.base_price : (pricingData.base_price_lab_grown || 0);
  };

  const getCurrentOptionPrice = (option: PricingData['customization_options'][0]) => {
    if (pricingMode === 'metal_type') {
      if (selectedMetal === 'gold') return option.price_gold ?? option.price;
      if (selectedMetal === 'silver') return option.price_silver ?? option.price;
    }
    return selectedDiamondType === 'natural' ? option.price : (option.price_lab_grown ?? option.price);
  };

  const handleBasePriceUpdate = async (newPrice: number) => {
    if (pricingMode === 'metal_type') {
      if (selectedMetal === 'gold') {
        await updateBasePriceGold(newPrice);
      } else if (selectedMetal === 'silver') {
        await updateBasePriceSilver(newPrice);
      } else {
        await updateBasePrice(newPrice);
      }
    } else {
      if (selectedDiamondType === 'natural') {
        await updateBasePrice(newPrice);
      } else {
        await updateBasePriceLabGrown(newPrice);
      }
    }
  };

  const handleOptionPriceUpdate = async (settingId: string, optionId: string, newPrice: number) => {
    if (pricingMode === 'metal_type') {
      if (selectedMetal === 'gold') {
        await updateOptionPriceGold(settingId, optionId, newPrice);
      } else if (selectedMetal === 'silver') {
        await updateOptionPriceSilver(settingId, optionId, newPrice);
      } else {
        await updateOptionPrice(settingId, optionId, newPrice);
      }
    } else {
      if (selectedDiamondType === 'natural') {
        await updateOptionPrice(settingId, optionId, newPrice);
      } else {
        await updateOptionPriceLabGrown(settingId, optionId, newPrice);
      }
    }
  };

  const getPricingLabel = () => {
    if (pricingMode === 'metal_type') {
      if (selectedMetal === 'gold') return 'Gold';
      if (selectedMetal === 'silver') return 'Silver';
      return 'Natural Diamonds';
    }
    return selectedDiamondType === 'natural' ? 'Natural Diamonds' : 'Lab Grown Diamonds';
  };

  const groupedOptions = pricingData?.customization_options.reduce((acc, option) => {
    if (!acc[option.setting_id]) {
      acc[option.setting_id] = {
        title: option.setting_title,
        options: []
      };
    }
    acc[option.setting_id].options.push(option);
    return acc;
  }, {} as Record<string, { title: string; options: Array<{ id: string; setting_id: string; setting_title: string; option_id: string; option_name: string; price: number; price_lab_grown?: number; price_gold?: number | null; price_silver?: number | null; display_order: number; }> }>) || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">Rings Pricing</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage base prices and customization options for rings
        </p>
        
        {/* Pricing Mode Toggle */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Pricing Mode:</span>
            <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-50">
              <button
                onClick={() => { setPricingMode('diamond_type'); setSelectedMetal('natural'); }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  pricingMode === 'diamond_type'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Diamond Type
              </button>
              <button
                onClick={() => { setPricingMode('metal_type'); setSelectedDiamondType('natural'); }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  pricingMode === 'metal_type'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Metal Type
              </button>
            </div>
          </div>

          {pricingMode === 'diamond_type' ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Diamond Type:</span>
              <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-50">
                <button
                  onClick={() => setSelectedDiamondType('natural')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedDiamondType === 'natural'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Natural
                </button>
                <button
                  onClick={() => setSelectedDiamondType('lab_grown')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedDiamondType === 'lab_grown'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Lab Grown
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Metal:</span>
              <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-50">
                <button
                  onClick={() => setSelectedMetal('natural')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedMetal === 'natural'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Natural
                </button>
                <button
                  onClick={() => setSelectedMetal('gold')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                    selectedMetal === 'gold'
                      ? 'bg-amber-100 text-amber-900 shadow-sm border border-amber-300'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="w-3 h-3 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full" />
                  Gold
                </button>
                <button
                  onClick={() => setSelectedMetal('silver')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                    selectedMetal === 'silver'
                      ? 'bg-gray-200 text-gray-900 shadow-sm border border-gray-400'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="w-3 h-3 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full" />
                  Silver
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {pricingData ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-8">
            {/* Base Price */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Base Price - {getPricingLabel()}
              </h2>
              <div className="flex items-center space-x-4">
                <label className="text-gray-700 font-medium">
                  {getPricingLabel()} Base Price ($):
                </label>
                <input
                  type="number"
                  step="0.01"
                  key={`${pricingMode}-${selectedDiamondType}-${selectedMetal}`}
                  defaultValue={getCurrentBasePrice()}
                  className="border border-gray-300 rounded px-3 py-2 w-32"
                  onBlur={(e) => {
                    const newPrice = parseFloat(e.target.value);
                    const currentPrice = getCurrentBasePrice();
                    if (newPrice !== currentPrice && newPrice > 0) {
                      handleBasePriceUpdate(newPrice);
                    }
                  }}
                />
                {pricingMode === 'metal_type' && selectedMetal === 'gold' && !pricingData.base_price_gold && (
                  <span className="text-sm text-amber-600">
                    (Gold pricing not set - will use natural pricing as fallback)
                  </span>
                )}
                {pricingMode === 'metal_type' && selectedMetal === 'silver' && !pricingData.base_price_silver && (
                  <span className="text-sm text-gray-500">
                    (Silver pricing not set - will use natural pricing as fallback)
                  </span>
                )}
                {pricingMode === 'diamond_type' && selectedDiamondType === 'lab_grown' && !pricingData.base_price_lab_grown && (
                  <span className="text-sm text-amber-600">
                    (Lab grown pricing not set - will use natural pricing as fallback)
                  </span>
                )}
              </div>
            </div>

            {/* Customization Options */}
            {Object.entries(groupedOptions).map(([settingId, setting]) => (
              <div key={settingId} className="border-b pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {setting.title} - {getPricingLabel()}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {setting.options
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((option) => (
                      <div key={option.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">{option.option_name}</h3>
                          <p className="text-sm text-gray-600">{settingId}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-700">$</span>
                          <input
                            type="number"
                            step="0.01"
                            key={`${option.id}-${pricingMode}-${selectedDiamondType}-${selectedMetal}`}
                            defaultValue={getCurrentOptionPrice(option)}
                            className="border border-gray-300 rounded px-3 py-2 w-24 text-right"
                            onBlur={(e) => {
                              const newPrice = parseFloat(e.target.value);
                              const currentPrice = getCurrentOptionPrice(option);
                              if (newPrice !== currentPrice) {
                                handleOptionPriceUpdate(settingId, option.option_id, newPrice);
                              }
                            }}
                          />
                          {pricingMode === 'metal_type' && selectedMetal === 'gold' && option.price_gold === undefined && (
                            <span className="text-xs text-amber-600 ml-2">
                              (Using natural price)
                            </span>
                          )}
                          {pricingMode === 'metal_type' && selectedMetal === 'silver' && option.price_silver === undefined && (
                            <span className="text-xs text-gray-500 ml-2">
                              (Using natural price)
                            </span>
                          )}
                          {pricingMode === 'diamond_type' && selectedDiamondType === 'lab_grown' && option.price_lab_grown === undefined && (
                            <span className="text-xs text-amber-600 ml-2">
                              (Using natural price)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center text-gray-500">
            <p>No ring pricing data available. Set up your ring customization options first.</p>
          </div>
        </div>
      )}

      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
            <span>Updating prices...</span>
          </div>
        </div>
      )}
    </div>
  );
}
