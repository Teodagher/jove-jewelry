'use client';

import { useState, useEffect } from 'react';
import { Market, getMarketInfo } from '@/lib/market-client';
import { getCurrency } from '@/lib/currency';

interface PriceField {
  label: string;
  key: string;
  value: number | null;
}

interface MarketPricingFormProps {
  market: Market;
  priceFields: PriceField[];
  onSave: (prices: Record<string, number | null>) => Promise<boolean>;
  title?: string;
  description?: string;
}

export default function MarketPricingForm({
  market,
  priceFields,
  onSave,
  title = 'Pricing',
  description,
}: MarketPricingFormProps) {
  const [prices, setPrices] = useState<Record<string, number | null>>(() => {
    const initial: Record<string, number | null> = {};
    priceFields.forEach(field => {
      initial[field.key] = field.value;
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update prices when market changes
  useEffect(() => {
    const newPrices: Record<string, number | null> = {};
    priceFields.forEach(field => {
      newPrices[field.key] = field.value;
    });
    setPrices(newPrices);
    setSuccess(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market]);

  const marketInfo = getMarketInfo(market);
  const currency = getCurrency(market);

  const handlePriceChange = (key: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setPrices(prev => ({ ...prev, [key]: numValue }));
    setSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const result = await onSave(prices);

      if (result) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to save prices');
      }
    } catch (err) {
      console.error('Error saving prices:', err);
      setError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{marketInfo.flag}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title} - {marketInfo.name}
            </h3>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Currency: <span className="font-medium">{currency}</span>
        </div>
      </div>

      {/* Price Fields */}
      <div className="space-y-4">
        {priceFields.map((field) => {
          const priceValue = prices[field.key];

          return (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {currency === 'USD' ? '$' : 'A$'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceValue ?? ''}
                  onChange={(e) => handlePriceChange(field.key, e.target.value)}
                  placeholder="Not available in this market"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {priceValue === null && (
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to make this unavailable in {marketInfo.name}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600">Prices saved successfully!</p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
            saving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-zinc-900 hover:bg-zinc-800'
          }`}
        >
          {saving ? 'Saving...' : 'Save Prices'}
        </button>
      </div>
    </div>
  );
}
