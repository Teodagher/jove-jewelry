'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, RotateCcw, Palette, Check } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ColorSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingColor: string;
  buttonColor: string;
  buttonTextColor: string;
  navBackground: string;
  navTextColor: string;
  footerBackground: string;
  footerTextColor: string;
  cardBackground: string;
  borderColor: string;
}

const defaultColors: ColorSettings = {
  primaryColor: '#000000',
  secondaryColor: '#4B5563',
  accentColor: '#D4AF37',
  backgroundColor: '#FFFFFF',
  textColor: '#374151',
  headingColor: '#111827',
  buttonColor: '#000000',
  buttonTextColor: '#FFFFFF',
  navBackground: '#FFFFFF',
  navTextColor: '#111827',
  footerBackground: '#111827',
  footerTextColor: '#F9FAFB',
  cardBackground: '#F9FAFB',
  borderColor: '#E5E7EB',
};

const colorPresets = [
  {
    name: 'Classic Black & Gold',
    colors: {
      primaryColor: '#000000',
      secondaryColor: '#4B5563',
      accentColor: '#D4AF37',
      backgroundColor: '#FFFFFF',
      textColor: '#374151',
      headingColor: '#111827',
      buttonColor: '#000000',
      buttonTextColor: '#FFFFFF',
      navBackground: '#FFFFFF',
      navTextColor: '#111827',
      footerBackground: '#111827',
      footerTextColor: '#F9FAFB',
      cardBackground: '#F9FAFB',
      borderColor: '#E5E7EB',
    }
  },
  {
    name: 'Rose Gold Romance',
    colors: {
      primaryColor: '#B76E79',
      secondaryColor: '#8B5A62',
      accentColor: '#E8B4BC',
      backgroundColor: '#FDF8F8',
      textColor: '#5C4A4D',
      headingColor: '#4A3538',
      buttonColor: '#B76E79',
      buttonTextColor: '#FFFFFF',
      navBackground: '#FFFFFF',
      navTextColor: '#4A3538',
      footerBackground: '#4A3538',
      footerTextColor: '#FDF8F8',
      cardBackground: '#FFFFFF',
      borderColor: '#E8D5D8',
    }
  },
  {
    name: 'Royal Navy',
    colors: {
      primaryColor: '#1E3A5F',
      secondaryColor: '#4A6FA5',
      accentColor: '#C9A962',
      backgroundColor: '#FAFBFC',
      textColor: '#3D4852',
      headingColor: '#1E3A5F',
      buttonColor: '#1E3A5F',
      buttonTextColor: '#FFFFFF',
      navBackground: '#FFFFFF',
      navTextColor: '#1E3A5F',
      footerBackground: '#1E3A5F',
      footerTextColor: '#FAFBFC',
      cardBackground: '#FFFFFF',
      borderColor: '#D1D9E0',
    }
  },
  {
    name: 'Emerald Luxury',
    colors: {
      primaryColor: '#064E3B',
      secondaryColor: '#047857',
      accentColor: '#D4AF37',
      backgroundColor: '#F0FDF4',
      textColor: '#374151',
      headingColor: '#064E3B',
      buttonColor: '#064E3B',
      buttonTextColor: '#FFFFFF',
      navBackground: '#FFFFFF',
      navTextColor: '#064E3B',
      footerBackground: '#064E3B',
      footerTextColor: '#F0FDF4',
      cardBackground: '#FFFFFF',
      borderColor: '#D1E7DD',
    }
  },
  {
    name: 'Champagne Elegance',
    colors: {
      primaryColor: '#7C6F5B',
      secondaryColor: '#A69B8A',
      accentColor: '#C9A962',
      backgroundColor: '#FAF8F5',
      textColor: '#5C5347',
      headingColor: '#4A4036',
      buttonColor: '#7C6F5B',
      buttonTextColor: '#FFFFFF',
      navBackground: '#FFFFFF',
      navTextColor: '#4A4036',
      footerBackground: '#4A4036',
      footerTextColor: '#FAF8F5',
      cardBackground: '#FFFFFF',
      borderColor: '#E5E0D8',
    }
  },
  {
    name: 'Modern Minimalist',
    colors: {
      primaryColor: '#18181B',
      secondaryColor: '#71717A',
      accentColor: '#18181B',
      backgroundColor: '#FFFFFF',
      textColor: '#52525B',
      headingColor: '#18181B',
      buttonColor: '#18181B',
      buttonTextColor: '#FFFFFF',
      navBackground: '#FFFFFF',
      navTextColor: '#18181B',
      footerBackground: '#18181B',
      footerTextColor: '#FAFAFA',
      cardBackground: '#FAFAFA',
      borderColor: '#E4E4E7',
    }
  },
];

const colorFields = [
  { key: 'primaryColor', label: 'Primary Color', description: 'Main brand color used throughout' },
  { key: 'secondaryColor', label: 'Secondary Color', description: 'Supporting color for accents' },
  { key: 'accentColor', label: 'Accent Color', description: 'Highlights and special elements' },
  { key: 'backgroundColor', label: 'Background', description: 'Main page background' },
  { key: 'textColor', label: 'Body Text', description: 'Default paragraph text' },
  { key: 'headingColor', label: 'Headings', description: 'Titles and headings' },
  { key: 'buttonColor', label: 'Button Background', description: 'Primary button color' },
  { key: 'buttonTextColor', label: 'Button Text', description: 'Text on buttons' },
  { key: 'navBackground', label: 'Navigation Background', description: 'Header/nav background' },
  { key: 'navTextColor', label: 'Navigation Text', description: 'Header/nav text' },
  { key: 'footerBackground', label: 'Footer Background', description: 'Footer area background' },
  { key: 'footerTextColor', label: 'Footer Text', description: 'Footer text color' },
  { key: 'cardBackground', label: 'Card Background', description: 'Product cards, sections' },
  { key: 'borderColor', label: 'Borders', description: 'Dividers and borders' },
];

export default function ColorsPage() {
  const [colors, setColors] = useState<ColorSettings>(defaultColors);
  const [originalColors, setOriginalColors] = useState<ColorSettings>(defaultColors);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadColors();
  }, []);

  useEffect(() => {
    const changed = JSON.stringify(colors) !== JSON.stringify(originalColors);
    setHasChanges(changed);
  }, [colors, originalColors]);

  const loadColors = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings' as any)
        .select('value')
        .eq('key', 'color_settings')
        .single();

      if (!error && data && (data as { value: unknown }).value) {
        const value = (data as { value: unknown }).value;
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        setColors(parsed);
        setOriginalColors(parsed);
      }
    } catch (e) {
      console.log('No color settings found, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const saveColors = async () => {
    setSaving(true);
    setSaveMessage(null);
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('site_settings')
        .upsert(
          { 
            key: 'color_settings', 
            value: JSON.stringify(colors),
            updated_at: new Date().toISOString()
          },
          { onConflict: 'key' }
        );

      if (error) throw error;
      
      setOriginalColors(colors);
      setSaveMessage('Colors saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      console.error('Error saving colors:', e);
      setSaveMessage('Failed to save colors');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setColors(preset.colors as ColorSettings);
  };

  const resetToDefaults = () => {
    setColors(defaultColors);
  };

  const updateColor = (key: keyof ColorSettings, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-5">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/website-customization" 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">
              Website Colors
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Customize the color scheme of your website
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={saveColors}
            disabled={!hasChanges || saving}
            className={`px-4 py-2 text-sm text-white rounded-lg transition-colors flex items-center gap-2 ${
              hasChanges 
                ? 'bg-black hover:bg-gray-800' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-lg ${saveMessage.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {saveMessage}
        </div>
      )}

      {/* Color Presets */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Color Presets
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Quick-apply a preset theme, then customize individual colors below.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {colorPresets.map((preset) => {
            const isActive = JSON.stringify(colors) === JSON.stringify(preset.colors);
            return (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`relative p-3 rounded-lg border-2 transition-all ${
                  isActive 
                    ? 'border-black ring-2 ring-black ring-offset-2' 
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {/* Color Preview */}
                <div className="flex gap-1 mb-2">
                  <div 
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: preset.colors.primaryColor }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: preset.colors.accentColor }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: preset.colors.backgroundColor }}
                  />
                </div>
                <p className="text-xs font-medium text-gray-900 text-left">{preset.name}</p>
                {isActive && (
                  <div className="absolute top-1 right-1 bg-black text-white rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Individual Color Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Custom Colors</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colorFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
              </label>
              <p className="text-xs text-gray-500">{field.description}</p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors[field.key as keyof ColorSettings]}
                  onChange={(e) => updateColor(field.key as keyof ColorSettings, e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                />
                <input
                  type="text"
                  value={colors[field.key as keyof ColorSettings]}
                  onChange={(e) => updateColor(field.key as keyof ColorSettings, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Live Preview</h2>
        
        <div 
          className="rounded-lg overflow-hidden border border-gray-200"
          style={{ backgroundColor: colors.backgroundColor }}
        >
          {/* Mock Navigation */}
          <div 
            className="px-6 py-4 flex items-center justify-between border-b"
            style={{ 
              backgroundColor: colors.navBackground, 
              borderColor: colors.borderColor 
            }}
          >
            <span 
              className="font-serif text-lg"
              style={{ color: colors.navTextColor }}
            >
              MAISON JOVÉ
            </span>
            <div className="flex gap-6 text-sm" style={{ color: colors.navTextColor }}>
              <span>Shop</span>
              <span>About</span>
              <span>Contact</span>
            </div>
          </div>
          
          {/* Mock Content */}
          <div className="p-8">
            <h3 
              className="text-2xl font-serif mb-2"
              style={{ color: colors.headingColor }}
            >
              Luxury Crafted Jewelry
            </h3>
            <p 
              className="mb-6"
              style={{ color: colors.textColor }}
            >
              Discover our collection of handcrafted pieces, designed with elegance and precision.
            </p>
            
            {/* Mock Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: colors.cardBackground, 
                    borderColor: colors.borderColor 
                  }}
                >
                  <div className="w-full h-24 bg-gray-200 rounded mb-3" />
                  <p className="text-sm font-medium" style={{ color: colors.headingColor }}>
                    Ring Collection {i}
                  </p>
                  <p className="text-xs" style={{ color: colors.secondaryColor }}>
                    Starting from $1,200
                  </p>
                </div>
              ))}
            </div>
            
            <button
              className="px-6 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
              style={{ 
                backgroundColor: colors.buttonColor, 
                color: colors.buttonTextColor 
              }}
            >
              View Collection
            </button>
          </div>
          
          {/* Mock Footer */}
          <div 
            className="px-6 py-4 text-sm"
            style={{ 
              backgroundColor: colors.footerBackground, 
              color: colors.footerTextColor 
            }}
          >
            © 2026 Maison Jové. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
