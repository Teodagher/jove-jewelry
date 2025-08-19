'use client';

import { useState, useEffect } from 'react';
import { CustomizationService } from '@/services/customizationService';

interface PricingData {
  id: string;
  name: string;
  type: string;
  base_price: number;
  customization_options: Array<{
    id: string;
    setting_id: string;
    setting_title: string;
    option_id: string;
    option_name: string;
    price: number;
    display_order: number;
  }>;
}

export default function BraceletsPricingPage() {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      const data = await CustomizationService.getAllPricingData('bracelet');
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
      const success = await CustomizationService.updateBasePrice('bracelet', newPrice);
      
      if (success) {
        setMessage({ type: 'success', text: 'Base price updated successfully' });
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

  const updateOptionPrice = async (settingId: string, optionId: string, newPrice: number) => {
    try {
      setSaving(true);
      const success = await CustomizationService.updateOptionPrice('bracelet', settingId, optionId, newPrice);
      
      if (success) {
        setMessage({ type: 'success', text: 'Option price updated successfully' });
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

  const groupedOptions = pricingData?.customization_options.reduce((acc, option) => {
    if (!acc[option.setting_id]) {
      acc[option.setting_id] = {
        title: option.setting_title,
        options: []
      };
    }
    acc[option.setting_id].options.push(option);
    return acc;
  }, {} as Record<string, { title: string; options: Array<{ id: string; setting_id: string; setting_title: string; option_id: string; option_name: string; price: number; display_order: number; }> }>) || {};

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
        <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">Bracelets Pricing</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage base prices and customization options for bracelets
        </p>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Base Price</h2>
              <div className="flex items-center space-x-4">
                <label className="text-gray-700 font-medium">Base Price ($):</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={pricingData.base_price}
                  className="border border-gray-300 rounded px-3 py-2 w-32"
                  onBlur={(e) => {
                    const newPrice = parseFloat(e.target.value);
                    if (newPrice !== pricingData.base_price && newPrice > 0) {
                      updateBasePrice(newPrice);
                    }
                  }}
                />
              </div>
            </div>

            {/* Customization Options */}
            {Object.entries(groupedOptions).map(([settingId, setting]) => (
              <div key={settingId} className="border-b pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{setting.title}</h2>
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
                            defaultValue={option.price}
                            className="border border-gray-300 rounded px-3 py-2 w-24 text-right"
                            onBlur={(e) => {
                              const newPrice = parseFloat(e.target.value);
                              if (newPrice !== option.price) {
                                updateOptionPrice(settingId, option.option_id, newPrice);
                              }
                            }}
                          />
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
            <p>No bracelet pricing data available. Set up your bracelet customization options first.</p>
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
