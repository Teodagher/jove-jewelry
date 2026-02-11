'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, RotateCcw, Palette, Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Theme = 'original' | 'valentines';

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

const defaultColors: Record<Theme, ColorSettings> = {
  original: {
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
  },
  valentines: {
    primaryColor: '#BE185D',
    secondaryColor: '#831843',
    accentColor: '#F472B6',
    backgroundColor: '#FFF1F2',
    textColor: '#881337',
    headingColor: '#9D174D',
    buttonColor: '#BE185D',
    buttonTextColor: '#FFFFFF',
    navBackground: '#FFF1F2',
    navTextColor: '#9D174D',
    footerBackground: '#9D174D',
    footerTextColor: '#FFF1F2',
    cardBackground: '#FFFFFF',
    borderColor: '#FECDD3',
  },
};

const colorPresets: Record<Theme, Array<{ name: string; colors: ColorSettings }>> = {
  original: [
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
  ],
  valentines: [
    {
      name: 'Classic Valentine',
      colors: {
        primaryColor: '#BE185D',
        secondaryColor: '#831843',
        accentColor: '#F472B6',
        backgroundColor: '#FFF1F2',
        textColor: '#881337',
        headingColor: '#9D174D',
        buttonColor: '#BE185D',
        buttonTextColor: '#FFFFFF',
        navBackground: '#FFF1F2',
        navTextColor: '#9D174D',
        footerBackground: '#9D174D',
        footerTextColor: '#FFF1F2',
        cardBackground: '#FFFFFF',
        borderColor: '#FECDD3',
      }
    },
    {
      name: 'Deep Rose',
      colors: {
        primaryColor: '#9D174D',
        secondaryColor: '#BE185D',
        accentColor: '#FB7185',
        backgroundColor: '#FFE4E6',
        textColor: '#881337',
        headingColor: '#881337',
        buttonColor: '#9D174D',
        buttonTextColor: '#FFFFFF',
        navBackground: '#FFE4E6',
        navTextColor: '#881337',
        footerBackground: '#881337',
        footerTextColor: '#FFE4E6',
        cardBackground: '#FFFFFF',
        borderColor: '#FECDD3',
      }
    },
    {
      name: 'Sweet Pink',
      colors: {
        primaryColor: '#EC4899',
        secondaryColor: '#DB2777',
        accentColor: '#F9A8D4',
        backgroundColor: '#FDF2F8',
        textColor: '#831843',
        headingColor: '#BE185D',
        buttonColor: '#EC4899',
        buttonTextColor: '#FFFFFF',
        navBackground: '#FDF2F8',
        navTextColor: '#BE185D',
        footerBackground: '#BE185D',
        footerTextColor: '#FDF2F8',
        cardBackground: '#FFFFFF',
        borderColor: '#FBCFE8',
      }
    },
    {
      name: 'Romantic Red',
      colors: {
        primaryColor: '#DC2626',
        secondaryColor: '#B91C1C',
        accentColor: '#FCA5A5',
        backgroundColor: '#FEF2F2',
        textColor: '#7F1D1D',
        headingColor: '#991B1B',
        buttonColor: '#DC2626',
        buttonTextColor: '#FFFFFF',
        navBackground: '#FEF2F2',
        navTextColor: '#991B1B',
        footerBackground: '#991B1B',
        footerTextColor: '#FEF2F2',
        cardBackground: '#FFFFFF',
        borderColor: '#FECACA',
      }
    },
    {
      name: 'Elegant Wine',
      colors: {
        primaryColor: '#7C2D12',
        secondaryColor: '#9A3412',
        accentColor: '#FDBA74',
        backgroundColor: '#FFF7ED',
        textColor: '#431407',
        headingColor: '#7C2D12',
        buttonColor: '#7C2D12',
        buttonTextColor: '#FFFFFF',
        navBackground: '#FFF7ED',
        navTextColor: '#7C2D12',
        footerBackground: '#431407',
        footerTextColor: '#FFF7ED',
        cardBackground: '#FFFFFF',
        borderColor: '#FED7AA',
      }
    },
    {
      name: 'Soft Blush',
      colors: {
        primaryColor: '#F472B6',
        secondaryColor: '#EC4899',
        accentColor: '#FBCFE8',
        backgroundColor: '#FDF2F8',
        textColor: '#831843',
        headingColor: '#9D174D',
        buttonColor: '#F472B6',
        buttonTextColor: '#FFFFFF',
        navBackground: '#FDF2F8',
        navTextColor: '#9D174D',
        footerBackground: '#9D174D',
        footerTextColor: '#FDF2F8',
        cardBackground: '#FFFFFF',
        borderColor: '#FBCFE8',
      }
    },
  ],
};

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

const themeLabels: Record<Theme, string> = {
  original: 'Original Theme',
  valentines: 'Valentine\'s Theme',
};

const themeIcons: Record<Theme, string> = {
  original: '🎨',
  valentines: '💝',
};

export default function ColorsPage() {
  const [theme, setTheme] = useState<Theme>('original');
  const [colors, setColors] = useState<ColorSettings>(defaultColors.original);
  const [originalColors, setOriginalColors] = useState<ColorSettings>(defaultColors.original);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [themeLoading, setThemeLoading] = useState(false);

  const supabase = createClient();

  // Fetch current theme on mount
  useEffect(() => {
    fetchCurrentTheme();
  }, []);

  // Load colors when theme changes
  useEffect(() => {
    if (!loading) {
      loadColors();
    }
  }, [theme]);

  useEffect(() => {
    const changed = JSON.stringify(colors) !== JSON.stringify(originalColors);
    setHasChanges(changed);
  }, [colors, originalColors]);

  const fetchCurrentTheme = async () => {
    try {
      const response = await fetch('/api/admin/site-style');
      if (response.ok) {
        const data = await response.json();
        if (data.style && ['original', 'valentines'].includes(data.style)) {
          setTheme(data.style as Theme);
        }
      }
    } catch (e) {
      console.error('Error fetching theme:', e);
    } finally {
      // Load colors after theme is set
      await loadColors();
    }
  };

  const switchTheme = async (newTheme: Theme) => {
    if (newTheme === theme) return;
    
    setThemeLoading(true);
    try {
      const response = await fetch('/api/admin/site-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style: newTheme }),
      });

      if (response.ok) {
        setTheme(newTheme);
        setSaveMessage(`Switched to ${themeLabels[newTheme]}`);
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error('Failed to switch theme');
      }
    } catch (e) {
      console.error('Error switching theme:', e);
      setSaveMessage('Failed to switch theme');
    } finally {
      setThemeLoading(false);
    }
  };

  const loadColors = async () => {
    setLoading(true);
    try {
      const settingsKey = `color_settings_${theme}`;
      const { data, error } = await supabase
        .from('site_settings' as any)
        .select('value')
        .eq('key', settingsKey)
        .single();

      if (!error && data && (data as { value: unknown }).value) {
        const value = (data as { value: unknown }).value;
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        setColors(parsed);
        setOriginalColors(parsed);
      } else {
        // Use theme defaults if no saved settings
        const defaults = defaultColors[theme];
        setColors(defaults);
        setOriginalColors(defaults);
      }
    } catch (e) {
      console.log(`No color settings found for ${theme} theme, using defaults`);
      const defaults = defaultColors[theme];
      setColors(defaults);
      setOriginalColors(defaults);
    } finally {
      setLoading(false);
    }
  };

  const saveColors = async () => {
    setSaving(true);
    setSaveMessage(null);
    
    try {
      const settingsKey = `color_settings_${theme}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('site_settings')
        .upsert(
          { 
            key: settingsKey, 
            value: JSON.stringify(colors),
            updated_at: new Date().toISOString()
          },
          { onConflict: 'key' }
        );

      if (error) throw error;
      
      setOriginalColors(colors);
      setSaveMessage(`Colors saved for ${themeLabels[theme]}!`);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      console.error('Error saving colors:', e);
      setSaveMessage('Failed to save colors');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: { name: string; colors: ColorSettings }) => {
    setColors(preset.colors);
  };

  const resetToDefaults = () => {
    setColors(defaultColors[theme]);
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

      {/* Theme Selector */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Sparkles className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Active Theme</h2>
              <p className="text-sm text-gray-600">
                You are currently editing colors for the <strong>{themeLabels[theme]}</strong>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 mr-2">Switch theme:</span>
            {(['original', 'valentines'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTheme(t)}
                disabled={themeLoading}
                className={`px-4 py-2 text-sm rounded-lg border transition-all flex items-center gap-2 ${
                  theme === t
                    ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300 hover:bg-pink-50'
                } ${themeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>{themeIcons[t]}</span>
                {t === 'original' ? 'Original' : 'Valentine\'s'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-lg ${saveMessage.includes('success') || saveMessage.includes('Switched') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {saveMessage}
        </div>
      )}

      {/* Color Presets */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Color Presets for {themeLabels[theme]}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Quick-apply a preset theme, then customize individual colors below.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {colorPresets[theme].map((preset) => {
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
        <h2 className="text-lg font-medium text-gray-900 mb-6">Custom Colors for {themeLabels[theme]}</h2>
        
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
        <h2 className="text-lg font-medium text-gray-900 mb-4">Live Preview ({themeLabels[theme]})</h2>
        
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
