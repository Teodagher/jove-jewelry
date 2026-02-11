'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  ArrowLeft,
  DollarSign,
  Percent,
  AlertCircle,
} from 'lucide-react';
import {
  getTemplates,
  getPricing,
  getPricingAddOns,
  upsertPricing,
  createPricingAddOn,
  updatePricingAddOn,
  deletePricingAddOn,
} from '@/lib/jove-lab-storage';
import type { JoveLabTemplate, JoveLabPricing, JoveLabPricingAddOn, JoveLabPricingMode } from '@/types/jove-lab';

const PRICING_MODES: { value: JoveLabPricingMode; label: string; description: string }[] = [
  { value: 'fixed', label: 'Fixed Price', description: 'Show exact price' },
  { value: 'starting_from', label: 'Starting From', description: 'Show minimum price with "from" prefix' },
  { value: 'estimated_range', label: 'Price Range', description: 'Show min-max price range' },
];

const ADDON_CATEGORIES = [
  { value: 'metal', label: 'Metal' },
  { value: 'stone_size', label: 'Stone Size' },
  { value: 'setting', label: 'Setting Style' },
  { value: 'finish', label: 'Finish' },
  { value: 'other', label: 'Other' },
];

export default function PricingPage() {
  const [templates, setTemplates] = useState<JoveLabTemplate[]>([]);
  const [pricing, setPricing] = useState<JoveLabPricing[]>([]);
  const [addons, setAddons] = useState<JoveLabPricingAddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'addons'>('templates');
  
  const [editingPricing, setEditingPricing] = useState<string | null>(null);
  const [editingAddon, setEditingAddon] = useState<JoveLabPricingAddOn | null>(null);
  const [showCreateAddonModal, setShowCreateAddonModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pricingFormData, setPricingFormData] = useState({
    base_price: 0,
    pricing_mode: 'fixed' as JoveLabPricingMode,
    min_price: 0,
    max_price: 0,
    currency: 'USD',
  });

  const [addonFormData, setAddonFormData] = useState({
    name: '',
    category: 'metal',
    option_value: '',
    price_adjustment: 0,
    is_percentage: false,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTemplates(getTemplates().filter(t => t.is_active));
    setPricing(getPricing());
    setAddons(getPricingAddOns());
    setLoading(false);
  };

  const getPricingForTemplate = (templateId: string): JoveLabPricing | null => {
    return pricing.find(p => p.template_id === templateId) || null;
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Template Pricing Handlers
  const openPricingEditor = (templateId: string) => {
    const existing = getPricingForTemplate(templateId);
    if (existing) {
      setPricingFormData({
        base_price: existing.base_price,
        pricing_mode: existing.pricing_mode,
        min_price: existing.min_price || 0,
        max_price: existing.max_price || 0,
        currency: existing.currency,
      });
    } else {
      setPricingFormData({
        base_price: 0,
        pricing_mode: 'fixed',
        min_price: 0,
        max_price: 0,
        currency: 'USD',
      });
    }
    setEditingPricing(templateId);
  };

  const handleSavePricing = () => {
    if (!editingPricing) return;

    setSaving(true);
    const saved = upsertPricing(editingPricing, pricingFormData);
    setPricing(prev => {
      const existing = prev.findIndex(p => p.template_id === editingPricing);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = saved;
        return updated;
      }
      return [...prev, saved];
    });
    setEditingPricing(null);
    setSaving(false);
  };

  // Add-on Handlers
  const resetAddonForm = () => {
    setAddonFormData({
      name: '',
      category: 'metal',
      option_value: '',
      price_adjustment: 0,
      is_percentage: false,
      is_active: true,
    });
  };

  const handleCreateAddon = () => {
    if (!addonFormData.name.trim()) {
      alert('Please enter an add-on name');
      return;
    }

    setSaving(true);
    const addon = createPricingAddOn(addonFormData);
    setAddons(prev => [...prev, addon]);
    setShowCreateAddonModal(false);
    resetAddonForm();
    setSaving(false);
  };

  const handleUpdateAddon = () => {
    if (!editingAddon) return;

    setSaving(true);
    const updated = updatePricingAddOn(editingAddon.id, addonFormData);
    if (updated) {
      setAddons(prev => prev.map(a => a.id === updated.id ? updated : a));
    }
    setEditingAddon(null);
    resetAddonForm();
    setSaving(false);
  };

  const handleDeleteAddon = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    deletePricingAddOn(id);
    setAddons(prev => prev.filter(a => a.id !== id));
  };

  const openEditAddonModal = (addon: JoveLabPricingAddOn) => {
    setAddonFormData({
      name: addon.name,
      category: addon.category,
      option_value: addon.option_value,
      price_adjustment: addon.price_adjustment,
      is_percentage: addon.is_percentage,
      is_active: addon.is_active,
    });
    setEditingAddon(addon);
  };

  const handleToggleAddonActive = (id: string) => {
    const addon = addons.find(a => a.id === id);
    if (!addon) return;
    const updated = updatePricingAddOn(id, { is_active: !addon.is_active });
    if (updated) {
      setAddons(prev => prev.map(a => a.id === updated.id ? updated : a));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/jove-lab"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-light text-gray-900 tracking-wide">
              Pricing Configuration
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Configure base prices and add-on pricing for JOVÉ LAB designs
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Isolated Pricing System</p>
          <p className="mt-1 text-blue-700">
            These prices are separate from the main store pricing. They are used only for 
            JOVÉ LAB bespoke design quotes and don't affect any existing products.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Template Base Prices
          </button>
          <button
            onClick={() => setActiveTab('addons')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'addons'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Add-on Pricing
          </button>
        </nav>
      </div>

      {/* Template Pricing Tab */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {templates.map((template) => {
                const templatePricing = getPricingForTemplate(template.id);
                return (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{template.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 capitalize">
                        {templatePricing?.pricing_mode.replace('_', ' ') || 'Not set'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {templatePricing ? (
                        <div className="text-gray-900">
                          {templatePricing.pricing_mode === 'fixed' && (
                            formatPrice(templatePricing.base_price, templatePricing.currency)
                          )}
                          {templatePricing.pricing_mode === 'starting_from' && (
                            <>From {formatPrice(templatePricing.min_price || templatePricing.base_price, templatePricing.currency)}</>
                          )}
                          {templatePricing.pricing_mode === 'estimated_range' && (
                            <>{formatPrice(templatePricing.min_price || 0, templatePricing.currency)} - {formatPrice(templatePricing.max_price || 0, templatePricing.currency)}</>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openPricingEditor(template.id)}
                        className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                      >
                        {templatePricing ? 'Edit' : 'Set Price'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add-ons Tab */}
      {activeTab === 'addons' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                resetAddonForm();
                setShowCreateAddonModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Pricing Add-on
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Option Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adjustment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {addons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No pricing add-ons configured yet
                    </td>
                  </tr>
                ) : (
                  addons.map((addon) => (
                    <tr key={addon.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{addon.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 capitalize">
                          {addon.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {addon.option_value || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {addon.is_percentage ? (
                            <>
                              <Percent className="h-4 w-4 text-gray-400" />
                              <span className={addon.price_adjustment >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {addon.price_adjustment >= 0 ? '+' : ''}{addon.price_adjustment}%
                              </span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className={addon.price_adjustment >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {addon.price_adjustment >= 0 ? '+' : ''}{formatPrice(addon.price_adjustment)}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleAddonActive(addon.id)}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            addon.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {addon.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditAddonModal(addon)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddon(addon.id, addon.name)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Template Pricing Modal */}
      {editingPricing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">
                Configure Pricing
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {templates.find(t => t.id === editingPricing)?.name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Pricing Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Mode
                </label>
                <div className="space-y-2">
                  {PRICING_MODES.map((mode) => (
                    <label
                      key={mode.value}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        pricingFormData.pricing_mode === mode.value
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pricing_mode"
                        value={mode.value}
                        checked={pricingFormData.pricing_mode === mode.value}
                        onChange={(e) => setPricingFormData(prev => ({ ...prev, pricing_mode: e.target.value as JoveLabPricingMode }))}
                        className="mt-0.5 h-4 w-4 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{mode.label}</p>
                        <p className="text-sm text-gray-500">{mode.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Base Price (for Fixed) */}
              {pricingFormData.pricing_mode === 'fixed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={pricingFormData.base_price}
                      onChange={(e) => setPricingFormData(prev => ({ ...prev, base_price: Number(e.target.value) }))}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>
              )}

              {/* Min Price (for Starting From) */}
              {pricingFormData.pricing_mode === 'starting_from' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={pricingFormData.min_price}
                      onChange={(e) => setPricingFormData(prev => ({ ...prev, min_price: Number(e.target.value) }))}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>
              )}

              {/* Price Range (for Estimated Range) */}
              {pricingFormData.pricing_mode === 'estimated_range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Price (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={pricingFormData.min_price}
                        onChange={(e) => setPricingFormData(prev => ({ ...prev, min_price: Number(e.target.value) }))}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Price (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={pricingFormData.max_price}
                        onChange={(e) => setPricingFormData(prev => ({ ...prev, max_price: Number(e.target.value) }))}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setEditingPricing(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePricing}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Add-on Modal */}
      {(showCreateAddonModal || editingAddon) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">
                {editingAddon ? 'Edit Add-on' : 'Create Add-on'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={addonFormData.name}
                  onChange={(e) => setAddonFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="e.g., Platinum Upgrade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={addonFormData.category}
                  onChange={(e) => setAddonFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  {ADDON_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Option Value
                </label>
                <input
                  type="text"
                  value={addonFormData.option_value}
                  onChange={(e) => setAddonFormData(prev => ({ ...prev, option_value: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="e.g., platinum, 2ct"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The value that triggers this adjustment
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Adjustment
                </label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {addonFormData.is_percentage ? '%' : '$'}
                    </span>
                    <input
                      type="number"
                      value={addonFormData.price_adjustment}
                      onChange={(e) => setAddonFormData(prev => ({ ...prev, price_adjustment: Number(e.target.value) }))}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAddonFormData(prev => ({ ...prev, is_percentage: false }))}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border ${
                        !addonFormData.is_percentage
                          ? 'bg-amber-100 border-amber-300 text-amber-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <DollarSign className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddonFormData(prev => ({ ...prev, is_percentage: true }))}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border ${
                        addonFormData.is_percentage
                          ? 'bg-amber-100 border-amber-300 text-amber-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Percent className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="addon_is_active"
                  checked={addonFormData.is_active}
                  onChange={(e) => setAddonFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="addon_is_active" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateAddonModal(false);
                  setEditingAddon(null);
                  resetAddonForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={editingAddon ? handleUpdateAddon : handleCreateAddon}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : editingAddon ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
