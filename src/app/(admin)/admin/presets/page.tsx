'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Plus, Edit, Trash2, Eye, Save, X, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface JewelryItem {
  id: string;
  name: string;
  type: string;
}

interface PresetDesign {
  id: string;
  jewelry_item_id: string;
  name: string;
  description: string | null;
  slug: string;
  customization_data: Record<string, string>;
  preview_image_url: string | null;
  display_order: number;
  is_active: boolean;
  badge_text: string | null;
  badge_color: string | null;
  created_at: string;
  jewelry_item?: JewelryItem;
}

const BADGE_COLORS = [
  { value: 'gold', label: 'Gold', bg: 'bg-amber-100 text-amber-800' },
  { value: 'green', label: 'Green', bg: 'bg-emerald-100 text-emerald-800' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-100 text-blue-800' },
  { value: 'red', label: 'Red', bg: 'bg-red-100 text-red-800' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-100 text-purple-800' },
];

const STONE_OPTIONS = [
  { id: 'emerald', name: 'Emerald' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'blue_sapphire', name: 'Blue Sapphire' },
  { id: 'pink_sapphire', name: 'Pink Sapphire' },
];

const METAL_OPTIONS = [
  { id: 'yellow_gold', name: 'Yellow Gold' },
  { id: 'white_gold', name: 'White Gold' },
];

const CHAIN_OPTIONS = [
  { id: 'gold_cord', name: 'Gold Cord' },
  { id: 'black_leather', name: 'Black Leather' },
  { id: 'yellow_gold_chain_real', name: 'Yellow Gold Chain' },
  { id: 'white_gold_chain', name: 'White Gold Chain' },
];

export default function PresetsPage() {
  const [presets, setPresets] = useState<PresetDesign[]>([]);
  const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PresetDesign | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [seedingPresets, setSeedingPresets] = useState(false);
  
  const [newPreset, setNewPreset] = useState({
    jewelry_item_id: '',
    name: '',
    description: '',
    slug: '',
    badge_text: '',
    badge_color: 'gold',
    second_stone: 'emerald',
    metal: 'yellow_gold',
    chain_type: 'gold_cord',
    display_order: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch jewelry items
      const { data: items, error: itemsError } = await supabase
        .from('jewelry_items')
        .select('id, name, type')
        .eq('is_active', true)
        .order('display_order');

      if (itemsError) {
        console.error('Error fetching jewelry items:', itemsError);
      } else {
        setJewelryItems(items || []);
      }

      // Try to fetch presets
      const { data: presetsData, error: presetsError } = await supabase
        .from('preset_designs')
        .select('*')
        .order('display_order');

      if (presetsError) {
        if (presetsError.message.includes('does not exist')) {
          setTableExists(false);
        } else {
          console.error('Error fetching presets:', presetsError);
        }
      } else {
        setPresets(presetsData || []);
        setTableExists(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultPresets = async () => {
    try {
      setSeedingPresets(true);
      const response = await fetch('/api/admin/db-migrate', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        await fetchData();
        alert(`Created ${result.data?.length || 0} preset designs!`);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error seeding presets:', error);
      alert('Failed to seed presets');
    } finally {
      setSeedingPresets(false);
    }
  };

  const handleCreatePreset = async () => {
    if (!newPreset.jewelry_item_id || !newPreset.name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      const item = jewelryItems.find(i => i.id === newPreset.jewelry_item_id);
      const slug = newPreset.slug || newPreset.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const customizationData = {
        first_stone: 'diamond',
        second_stone: newPreset.second_stone,
        metal: newPreset.metal,
        chain_type: newPreset.chain_type,
        diamond_size: 'small_015ct'
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('preset_designs')
        .insert({
          jewelry_item_id: newPreset.jewelry_item_id,
          name: newPreset.name,
          description: newPreset.description || null,
          slug,
          customization_data: customizationData,
          badge_text: newPreset.badge_text || null,
          badge_color: newPreset.badge_color || null,
          display_order: newPreset.display_order
        });

      if (error) {
        console.error('Error creating preset:', error);
        alert('Failed to create preset: ' + error.message);
        return;
      }

      await fetchData();
      setShowCreateModal(false);
      setNewPreset({
        jewelry_item_id: '',
        name: '',
        description: '',
        slug: '',
        badge_text: '',
        badge_color: 'gold',
        second_stone: 'emerald',
        metal: 'yellow_gold',
        chain_type: 'gold_cord',
        display_order: 0
      });
    } catch (error) {
      console.error('Error creating preset:', error);
      alert('Failed to create preset');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePreset = async (preset: PresetDesign) => {
    try {
      setSaving(true);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('preset_designs')
        .update({
          name: preset.name,
          description: preset.description,
          badge_text: preset.badge_text,
          badge_color: preset.badge_color,
          display_order: preset.display_order,
          is_active: preset.is_active,
          customization_data: preset.customization_data
        })
        .eq('id', preset.id);

      if (error) {
        console.error('Error updating preset:', error);
        alert('Failed to update preset');
        return;
      }

      await fetchData();
      setEditingPreset(null);
    } catch (error) {
      console.error('Error updating preset:', error);
      alert('Failed to update preset');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) return;

    try {
      const { error } = await supabase
        .from('preset_designs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting preset:', error);
        alert('Failed to delete preset');
        return;
      }

      await fetchData();
    } catch (error) {
      console.error('Error deleting preset:', error);
      alert('Failed to delete preset');
    }
  };

  const getItemName = (itemId: string) => {
    return jewelryItems.find(i => i.id === itemId)?.name || 'Unknown';
  };

  const getBadgeColorClass = (color: string | null) => {
    return BADGE_COLORS.find(c => c.value === color)?.bg || 'bg-gray-100 text-gray-800';
  };

  const filteredPresets = filter === 'all' 
    ? presets 
    : presets.filter(p => {
        const item = jewelryItems.find(i => i.id === p.jewelry_item_id);
        return item?.type === filter;
      });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-600"></div>
      </div>
    );
  }

  if (!tableExists) {
    return (
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-amber-900">Database Setup Required</h3>
              <p className="text-amber-700 mt-1">
                The preset_designs table doesn't exist yet. Please run this SQL in your Supabase Dashboard → SQL Editor:
              </p>
              <pre className="mt-4 p-4 bg-amber-100 rounded-lg text-sm overflow-x-auto text-amber-900">
{`CREATE TABLE preset_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jewelry_item_id UUID NOT NULL REFERENCES jewelry_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    customization_data JSONB NOT NULL,
    preview_image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    badge_text TEXT,
    badge_color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(jewelry_item_id, slug)
);

ALTER TABLE preset_designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "preset_designs_public_all" ON preset_designs FOR ALL USING (true);`}
              </pre>
              <button
                onClick={() => fetchData()}
                className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Refresh After Creating Table
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-light text-zinc-900 tracking-wide">Preset Designs</h1>
          <p className="text-zinc-600 mt-1">Pre-configured customization options for quick selection</p>
        </div>
        <div className="flex gap-3">
          {presets.length === 0 && (
            <button
              onClick={seedDefaultPresets}
              disabled={seedingPresets}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {seedingPresets ? 'Creating...' : 'Create Default Presets'}
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Preset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filter === 'all' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          All ({presets.length})
        </button>
        <button
          onClick={() => setFilter('necklace')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filter === 'necklace' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          Necklaces
        </button>
        <button
          onClick={() => setFilter('bracelet')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filter === 'bracelet' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          Bracelets
        </button>
        <button
          onClick={() => setFilter('ring')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filter === 'ring' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          Rings
        </button>
      </div>

      {/* Presets Grid */}
      {filteredPresets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Sparkles className="w-16 h-16 mx-auto text-zinc-400 mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-2">No presets found</h3>
          <p className="text-zinc-600 mb-6">
            Create preset designs so customers can quickly select popular configurations
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Preset
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Configuration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badge</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPresets.map((preset) => (
                <tr key={preset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{preset.name}</div>
                    <div className="text-sm text-gray-500">{preset.description || 'No description'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {getItemName(preset.jewelry_item_id)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Stone: <span className="font-medium">{preset.customization_data.second_stone}</span></div>
                      <div>Metal: <span className="font-medium">{preset.customization_data.metal}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {preset.badge_text && (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getBadgeColorClass(preset.badge_color)}`}>
                        {preset.badge_text}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      preset.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {preset.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => setEditingPreset(preset)}
                      className="text-zinc-600 hover:text-zinc-900"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Preset Design</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
                <select
                  value={newPreset.jewelry_item_id}
                  onChange={(e) => setNewPreset({ ...newPreset, jewelry_item_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a product</option>
                  {jewelryItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preset Name *</label>
                <input
                  type="text"
                  value={newPreset.name}
                  onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., The Emerald Edition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newPreset.description}
                  onChange={(e) => setNewPreset({ ...newPreset, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Classic elegance with vibrant green stones"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Second Stone</label>
                  <select
                    value={newPreset.second_stone}
                    onChange={(e) => setNewPreset({ ...newPreset, second_stone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {STONE_OPTIONS.map(stone => (
                      <option key={stone.id} value={stone.id}>{stone.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Metal</label>
                  <select
                    value={newPreset.metal}
                    onChange={(e) => setNewPreset({ ...newPreset, metal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {METAL_OPTIONS.map(metal => (
                      <option key={metal.id} value={metal.id}>{metal.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chain/Cord Type</label>
                <select
                  value={newPreset.chain_type}
                  onChange={(e) => setNewPreset({ ...newPreset, chain_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {CHAIN_OPTIONS.map(chain => (
                    <option key={chain.id} value={chain.id}>{chain.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Badge Text</label>
                  <input
                    type="text"
                    value={newPreset.badge_text}
                    onChange={(e) => setNewPreset({ ...newPreset, badge_text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Bestseller"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Badge Color</label>
                  <select
                    value={newPreset.badge_color}
                    onChange={(e) => setNewPreset({ ...newPreset, badge_color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {BADGE_COLORS.map(color => (
                      <option key={color.value} value={color.value}>{color.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePreset}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Preset'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPreset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Preset Design</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preset Name</label>
                <input
                  type="text"
                  value={editingPreset.name}
                  onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editingPreset.description || ''}
                  onChange={(e) => setEditingPreset({ ...editingPreset, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Second Stone</label>
                  <select
                    value={editingPreset.customization_data.second_stone || 'emerald'}
                    onChange={(e) => setEditingPreset({
                      ...editingPreset,
                      customization_data: { ...editingPreset.customization_data, second_stone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {STONE_OPTIONS.map(stone => (
                      <option key={stone.id} value={stone.id}>{stone.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Metal</label>
                  <select
                    value={editingPreset.customization_data.metal || 'yellow_gold'}
                    onChange={(e) => setEditingPreset({
                      ...editingPreset,
                      customization_data: { ...editingPreset.customization_data, metal: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {METAL_OPTIONS.map(metal => (
                      <option key={metal.id} value={metal.id}>{metal.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Badge Text</label>
                  <input
                    type="text"
                    value={editingPreset.badge_text || ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, badge_text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Badge Color</label>
                  <select
                    value={editingPreset.badge_color || 'gold'}
                    onChange={(e) => setEditingPreset({ ...editingPreset, badge_color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {BADGE_COLORS.map(color => (
                      <option key={color.value} value={color.value}>{color.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingPreset.is_active}
                    onChange={(e) => setEditingPreset({ ...editingPreset, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setEditingPreset(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdatePreset(editingPreset)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
