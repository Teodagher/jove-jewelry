'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Crown, DollarSign, Package, Sparkles, TrendingUp, TrendingDown, AlertCircle, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface JewelryItem {
  id: string;
  name: string;
  base_price: number | null;
  base_price_lab_grown: number | null;
  base_price_gold: number | null;
  base_price_silver: number | null;
  base_price_gold_au: number | null;
  base_price_silver_au: number | null;
}

const jewelryTypes = [
  {
    name: 'Necklaces',
    href: '/admin/pricing/necklaces',
    icon: Crown,
    description: 'Manage pricing for custom necklaces',
    color: 'bg-blue-500',
    items: ''
  },
  {
    name: 'Rings',
    href: '/admin/pricing/rings',
    icon: Sparkles,
    description: 'Manage pricing for rings and wedding bands',
    color: 'bg-purple-500',
    items: ''
  },
  {
    name: 'Bracelets',
    href: '/admin/pricing/bracelets',
    icon: Package,
    description: 'Manage pricing for custom bracelets',
    color: 'bg-green-500',
    items: ''
  },
  {
    name: 'Earrings',
    href: '/admin/pricing/earrings',
    icon: DollarSign,
    description: 'Manage pricing for custom earrings',
    color: 'bg-orange-500',
    items: ''
  },
];

export default function PricingPage() {
  const [naturalPercentage, setNaturalPercentage] = useState<string>('0');
  const [labGrownPercentage, setLabGrownPercentage] = useState<string>('0');
  const [goldPercentage, setGoldPercentage] = useState<string>('0');
  const [silverPercentage, setSilverPercentage] = useState<string>('0');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [products, setProducts] = useState<JewelryItem[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<'natural' | 'lab_grown' | 'gold' | 'silver' | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('jewelry_items')
      .select('id, name, base_price, base_price_lab_grown, base_price_gold, base_price_silver, base_price_gold_au, base_price_silver_au')
      .eq('is_active', true);
    
    if (!error && data) {
      setProducts(data);
    }
  };

  const calculateNewPrices = (type: 'natural' | 'lab_grown' | 'gold' | 'silver') => {
    const percentage = type === 'natural' ? parseFloat(naturalPercentage) :
                      type === 'lab_grown' ? parseFloat(labGrownPercentage) :
                      type === 'gold' ? parseFloat(goldPercentage) : parseFloat(silverPercentage);
    const multiplier = 1 + (percentage / 100);
    
    return products
      .filter(p => {
        if (type === 'natural') return p.base_price;
        if (type === 'lab_grown') return p.base_price_lab_grown;
        if (type === 'gold') return (p.base_price_gold || p.base_price_gold_au);
        return (p.base_price_silver || p.base_price_silver_au);
      })
      .map(p => {
        const currentUSD = type === 'natural' ? p.base_price :
                          type === 'lab_grown' ? p.base_price_lab_grown :
                          type === 'gold' ? p.base_price_gold : p.base_price_silver;
        const currentAU = type === 'gold' ? p.base_price_gold_au : p.base_price_silver_au;
        return {
          name: p.name,
          currentUSD,
          currentAU,
          newUSD: currentUSD ? Math.round(currentUSD * multiplier) : null,
          newAU: currentAU ? Math.round(currentAU * multiplier) : null,
        };
      });
  };

  const handleUpdatePrices = async (type: 'natural' | 'lab_grown' | 'gold' | 'silver') => {
    const percentage = type === 'natural' ? parseFloat(naturalPercentage) :
                      type === 'lab_grown' ? parseFloat(labGrownPercentage) :
                      type === 'gold' ? parseFloat(goldPercentage) : parseFloat(silverPercentage);
    
    if (percentage === 0) {
      setMessage({ type: 'error', text: 'Please enter a non-zero percentage' });
      return;
    }

    setPendingUpdate(type);
    setShowConfirm(true);
  };

  const confirmUpdate = async () => {
    if (!pendingUpdate) return;
    
    setShowConfirm(false);
    setIsUpdating(true);
    setMessage(null);

    const type = pendingUpdate;
    const percentage = type === 'natural' ? parseFloat(naturalPercentage) :
                      type === 'lab_grown' ? parseFloat(labGrownPercentage) :
                      type === 'gold' ? parseFloat(goldPercentage) : parseFloat(silverPercentage);
    const multiplier = 1 + (percentage / 100);

    try {
      // Update all products
      const updates = products.map(async (product) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {};
        
        if (type === 'natural') {
          if (product.base_price) {
            updateData.base_price = Math.round(product.base_price * multiplier);
          }
        } else if (type === 'lab_grown') {
          if (product.base_price_lab_grown) {
            updateData.base_price_lab_grown = Math.round(product.base_price_lab_grown * multiplier);
          }
        } else if (type === 'gold') {
          if (product.base_price_gold) {
            updateData.base_price_gold = Math.round(product.base_price_gold * multiplier);
          }
          if (product.base_price_gold_au) {
            updateData.base_price_gold_au = Math.round(product.base_price_gold_au * multiplier);
          }
        } else {
          if (product.base_price_silver) {
            updateData.base_price_silver = Math.round(product.base_price_silver * multiplier);
          }
          if (product.base_price_silver_au) {
            updateData.base_price_silver_au = Math.round(product.base_price_silver_au * multiplier);
          }
        }

        if (Object.keys(updateData).length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase as any)
            .from('jewelry_items')
            .update(updateData)
            .eq('id', product.id);
          
          if (error) throw error;
        }
      });

      await Promise.all(updates);

      const direction = percentage > 0 ? 'increased' : 'decreased';
      const typeLabel = type === 'natural' ? 'Natural Diamond' : 
                       type === 'lab_grown' ? 'Lab Grown Diamond' :
                       type === 'gold' ? 'Gold' : 'Silver';
      setMessage({ 
        type: 'success', 
        text: `Successfully ${direction} all ${typeLabel} prices by ${Math.abs(percentage)}%` 
      });

      // Reset the percentage and refresh products
      if (type === 'natural') setNaturalPercentage('0');
      else if (type === 'lab_grown') setLabGrownPercentage('0');
      else if (type === 'gold') setGoldPercentage('0');
      else setSilverPercentage('0');
      
      await fetchProducts();
    } catch (error) {
      console.error('Error updating prices:', error);
      setMessage({ type: 'error', text: 'Failed to update prices. Please try again.' });
    } finally {
      setIsUpdating(false);
      setPendingUpdate(null);
    }
  };

  const naturalPreview = calculateNewPrices('natural');
  const labGrownPreview = calculateNewPrices('lab_grown');
  const goldPreview = calculateNewPrices('gold');
  const silverPreview = calculateNewPrices('silver');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">Pricing Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage base prices and customization options for all jewelry categories
        </p>
      </div>

      {/* Bulk Price Adjustment Section */}
      <div className="bg-gradient-to-r from-amber-50 to-gray-50 rounded-xl p-6 border border-amber-200">
        <h2 className="text-xl font-medium text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          Bulk Price Adjustment
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Adjust the base price of all products at once by percentage. Positive values increase prices, negative values decrease them.
        </p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Natural Diamond Pricing */}
          <div className="bg-white rounded-lg p-5 border border-blue-300 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Natural Diamonds</h3>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <input
                type="number"
                value={naturalPercentage}
                onChange={(e) => setNaturalPercentage(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                step="0.5"
              />
              <span className="text-gray-600 font-medium">%</span>
              <button
                onClick={() => handleUpdatePrices('natural')}
                disabled={isUpdating || parseFloat(naturalPercentage) === 0}
                className="ml-auto px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {parseFloat(naturalPercentage) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                Apply
              </button>
            </div>

            {parseFloat(naturalPercentage) !== 0 && naturalPreview.length > 0 && (
              <div className="mt-4 bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-800 font-medium mb-2">Preview:</p>
                <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                  {naturalPreview.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex justify-between text-gray-700">
                      <span className="truncate mr-2">{item.name}</span>
                      <span>
                        {item.currentUSD && <span className="line-through text-gray-400">${item.currentUSD}</span>}
                        {item.newUSD && <span className="text-blue-700 ml-1">${item.newUSD}</span>}
                      </span>
                    </div>
                  ))}
                  {naturalPreview.length > 5 && (
                    <p className="text-blue-600 italic">...and {naturalPreview.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Lab Grown Diamond Pricing */}
          <div className="bg-white rounded-lg p-5 border border-teal-300 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Lab Grown Diamonds</h3>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <input
                type="number"
                value={labGrownPercentage}
                onChange={(e) => setLabGrownPercentage(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="0"
                step="0.5"
              />
              <span className="text-gray-600 font-medium">%</span>
              <button
                onClick={() => handleUpdatePrices('lab_grown')}
                disabled={isUpdating || parseFloat(labGrownPercentage) === 0}
                className="ml-auto px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {parseFloat(labGrownPercentage) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                Apply
              </button>
            </div>

            {parseFloat(labGrownPercentage) !== 0 && labGrownPreview.length > 0 && (
              <div className="mt-4 bg-teal-50 rounded-lg p-3">
                <p className="text-xs text-teal-800 font-medium mb-2">Preview:</p>
                <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                  {labGrownPreview.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex justify-between text-gray-700">
                      <span className="truncate mr-2">{item.name}</span>
                      <span>
                        {item.currentUSD && <span className="line-through text-gray-400">${item.currentUSD}</span>}
                        {item.newUSD && <span className="text-teal-700 ml-1">${item.newUSD}</span>}
                      </span>
                    </div>
                  ))}
                  {labGrownPreview.length > 5 && (
                    <p className="text-teal-600 italic">...and {labGrownPreview.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Gold Pricing */}
          <div className="bg-white rounded-lg p-5 border border-amber-300 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full" />
              <h3 className="font-semibold text-gray-900">Gold Products</h3>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <input
                type="number"
                value={goldPercentage}
                onChange={(e) => setGoldPercentage(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="0"
                step="0.5"
              />
              <span className="text-gray-600 font-medium">%</span>
              <button
                onClick={() => handleUpdatePrices('gold')}
                disabled={isUpdating || parseFloat(goldPercentage) === 0}
                className="ml-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {parseFloat(goldPercentage) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                Apply
              </button>
            </div>

            {parseFloat(goldPercentage) !== 0 && goldPreview.length > 0 && (
              <div className="mt-4 bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-800 font-medium mb-2">Preview (USD / AUD):</p>
                <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                  {goldPreview.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex justify-between text-gray-700">
                      <span className="truncate mr-2">{item.name}</span>
                      <span>
                        {item.currentUSD && <span className="line-through text-gray-400">${item.currentUSD}</span>}
                        {item.newUSD && <span className="text-amber-700 ml-1">${item.newUSD}</span>}
                        {item.currentAU && <span className="ml-2 line-through text-gray-400">A${item.currentAU}</span>}
                        {item.newAU && <span className="text-amber-700 ml-1">A${item.newAU}</span>}
                      </span>
                    </div>
                  ))}
                  {goldPreview.length > 5 && (
                    <p className="text-amber-600 italic">...and {goldPreview.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Silver Pricing */}
          <div className="bg-white rounded-lg p-5 border border-gray-300 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full" />
              <h3 className="font-semibold text-gray-900">Silver Products</h3>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <input
                type="number"
                value={silverPercentage}
                onChange={(e) => setSilverPercentage(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-medium focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                placeholder="0"
                step="0.5"
              />
              <span className="text-gray-600 font-medium">%</span>
              <button
                onClick={() => handleUpdatePrices('silver')}
                disabled={isUpdating || parseFloat(silverPercentage) === 0}
                className="ml-auto px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {parseFloat(silverPercentage) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                Apply
              </button>
            </div>

            {parseFloat(silverPercentage) !== 0 && silverPreview.length > 0 && (
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-700 font-medium mb-2">Preview (USD / AUD):</p>
                <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                  {silverPreview.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex justify-between text-gray-700">
                      <span className="truncate mr-2">{item.name}</span>
                      <span>
                        {item.currentUSD && <span className="line-through text-gray-400">${item.currentUSD}</span>}
                        {item.newUSD && <span className="text-gray-700 ml-1">${item.newUSD}</span>}
                        {item.currentAU && <span className="ml-2 line-through text-gray-400">A${item.currentAU}</span>}
                        {item.newAU && <span className="text-gray-700 ml-1">A${item.newAU}</span>}
                      </span>
                    </div>
                  ))}
                  {silverPreview.length > 5 && (
                    <p className="text-gray-500 italic">...and {silverPreview.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Price Update</h3>
            <p className="text-gray-600 mb-4">
              You are about to {parseFloat(
                pendingUpdate === 'natural' ? naturalPercentage :
                pendingUpdate === 'lab_grown' ? labGrownPercentage :
                pendingUpdate === 'gold' ? goldPercentage : silverPercentage
              ) > 0 ? 'increase' : 'decrease'} all{' '}
              <span className="font-semibold">
                {pendingUpdate === 'natural' ? 'Natural Diamond' :
                 pendingUpdate === 'lab_grown' ? 'Lab Grown Diamond' :
                 pendingUpdate === 'gold' ? 'Gold' : 'Silver'}
              </span> product prices by{' '}
              <span className="font-semibold">
                {Math.abs(parseFloat(
                  pendingUpdate === 'natural' ? naturalPercentage :
                  pendingUpdate === 'lab_grown' ? labGrownPercentage :
                  pendingUpdate === 'gold' ? goldPercentage : silverPercentage
                ))}%
              </span>.
            </p>
            <p className="text-sm text-amber-600 mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              This action will affect all products immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setPendingUpdate(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpdate}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Jewelry Type Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {jewelryTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Link
              key={type.name}
              href={type.href}
              className="group relative bg-white p-6 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start space-x-4">
                <div className={`inline-flex p-3 rounded-lg ${type.color} text-white`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-medium text-gray-900 group-hover:text-gray-700 font-serif">
                    {type.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">{type.description}</p>
                </div>
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors duration-200">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
