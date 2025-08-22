'use client';

import { useState, useEffect } from 'react';
import { CustomizationService } from '@/services/customizationService';

interface PricingData {
  id: string;
  name: string;
  type: string;
  base_price: number;
  base_price_lab_grown?: number;
  customization_options: Array<{
    id: string;
    setting_id: string;
    setting_title: string;
    option_id: string;
    option_name: string;
    price: number;
    price_lab_grown?: number;
    display_order: number;
  }>;
}

export default function NecklacesPricingPage() {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedDiamondType, setSelectedDiamondType] = useState<'natural' | 'lab_grown'>('natural');

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      const data = await CustomizationService.getAllPricingData('necklace');
      setPricingData(data);
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
      const success = await CustomizationService.updateBasePrice('necklace', newPrice);
      
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
      const success = await CustomizationService.updateBasePriceLabGrown('necklace', newPrice);
      
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

  const updateOptionPrice = async (settingId: string, optionId: string, newPrice: number) => {
    try {
      setSaving(true);
      const success = await CustomizationService.updateOptionPrice('necklace', settingId, optionId, newPrice);
      
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
      const success = await CustomizationService.updateOptionPriceLabGrown('necklace', settingId, optionId, newPrice);
      
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

  const groupedOptions = pricingData?.customization_options.reduce((acc, option) => {
    if (!acc[option.setting_id]) {
      acc[option.setting_id] = {
        title: option.setting_title,
        options: []
      };
    }
    acc[option.setting_id].options.push(option);
    return acc;
  }, {} as Record<string, { title: string; options: Array<{ id: string; setting_id: string; setting_title: string; option_id: string; option_name: string; price: number; price_lab_grown?: number; display_order: number; }> }>) || {};

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
        <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">Necklaces Pricing</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage base prices and customization options for necklaces
        </p>
        
        {/* Diamond Type Toggle */}
        <div className="mt-4 flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Pricing Type:</span>
          <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-50">
            <button
              onClick={() => setSelectedDiamondType('natural')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedDiamondType === 'natural'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Natural Diamonds
            </button>
            <button
              onClick={() => setSelectedDiamondType('lab_grown')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedDiamondType === 'lab_grown'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Lab Grown Diamonds
            </button>
          </div>
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
                Base Price - {selectedDiamondType === 'natural' ? 'Natural Diamonds' : 'Lab Grown Diamonds'}
              </h2>
              <div className="flex items-center space-x-4">
                <label className="text-gray-700 font-medium">
                  {selectedDiamondType === 'natural' ? 'Natural' : 'Lab Grown'} Base Price ($):
                </label>
                <input
                  type="number"
                  step="0.01"
                  key={selectedDiamondType} // Force re-render when type changes
                  defaultValue={selectedDiamondType === 'natural' ? pricingData.base_price : (pricingData.base_price_lab_grown || 0)}
                  className="border border-gray-300 rounded px-3 py-2 w-32"
                  onBlur={(e) => {
                    const newPrice = parseFloat(e.target.value);
                    const currentPrice = selectedDiamondType === 'natural' ? pricingData.base_price : (pricingData.base_price_lab_grown || 0);
                    if (newPrice !== currentPrice && newPrice > 0) {
                      if (selectedDiamondType === 'natural') {
                        updateBasePrice(newPrice);
                      } else {
                        updateBasePriceLabGrown(newPrice);
                      }
                    }
                  }}
                />
                {selectedDiamondType === 'lab_grown' && !pricingData.base_price_lab_grown && (
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
                  {setting.title} - {selectedDiamondType === 'natural' ? 'Natural Diamonds' : 'Lab Grown Diamonds'}
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
                            key={`${option.id}-${selectedDiamondType}`} // Force re-render when type changes
                            defaultValue={
                              selectedDiamondType === 'natural' 
                                ? option.price 
                                : (option.price_lab_grown ?? option.price)
                            }
                            className="border border-gray-300 rounded px-3 py-2 w-24 text-right"
                            onBlur={(e) => {
                              const newPrice = parseFloat(e.target.value);
                              const currentPrice = selectedDiamondType === 'natural' 
                                ? option.price 
                                : (option.price_lab_grown ?? option.price);
                              if (newPrice !== currentPrice) {
                                if (selectedDiamondType === 'natural') {
                                  updateOptionPrice(settingId, option.option_id, newPrice);
                                } else {
                                  updateOptionPriceLabGrown(settingId, option.option_id, newPrice);
                                }
                              }
                            }}
                          />
                          {selectedDiamondType === 'lab_grown' && option.price_lab_grown === undefined && (
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
            <p>No necklace pricing data available. Set up your necklace customization options first.</p>
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