'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, RotateCcw, Layout, GripVertical, Eye, EyeOff, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Theme = 'original' | 'valentines';

interface SectionConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

interface LayoutSettings {
  // Hero Section
  heroHeight: 'small' | 'medium' | 'large' | 'full';
  heroOverlayOpacity: number;
  heroTextAlignment: 'left' | 'center' | 'right';
  
  // Product Grid
  productsPerRow: 2 | 3 | 4;
  productCardSize: 'small' | 'medium' | 'large';
  productImageAspect: 'square' | 'portrait' | 'landscape';
  showProductPrices: boolean;
  
  // Navigation
  navStyle: 'minimal' | 'standard' | 'centered';
  navSticky: boolean;
  
  // Spacing
  sectionSpacing: 'compact' | 'normal' | 'spacious';
  containerWidth: 'narrow' | 'normal' | 'wide' | 'full';
  
  // Footer
  footerStyle: 'minimal' | 'standard' | 'expanded';
  showSocialLinks: boolean;
  showNewsletter: boolean;
  
  // Sections Order & Visibility
  sections: SectionConfig[];
}

const defaultLayout: Record<Theme, LayoutSettings> = {
  original: {
    heroHeight: 'large',
    heroOverlayOpacity: 30,
    heroTextAlignment: 'center',
    productsPerRow: 3,
    productCardSize: 'medium',
    productImageAspect: 'square',
    showProductPrices: true,
    navStyle: 'standard',
    navSticky: true,
    sectionSpacing: 'normal',
    containerWidth: 'normal',
    footerStyle: 'standard',
    showSocialLinks: true,
    showNewsletter: true,
    sections: [
      { id: 'hero', name: 'Hero Carousel', enabled: true, order: 0 },
      { id: 'featured', name: 'Featured Products', enabled: true, order: 1 },
      { id: 'categories', name: 'Shop by Category', enabled: true, order: 2 },
      { id: 'about', name: 'About Section', enabled: true, order: 3 },
      { id: 'testimonials', name: 'Testimonials', enabled: false, order: 4 },
      { id: 'newsletter', name: 'Newsletter Signup', enabled: true, order: 5 },
    ],
  },
  valentines: {
    heroHeight: 'full',
    heroOverlayOpacity: 40,
    heroTextAlignment: 'center',
    productsPerRow: 3,
    productCardSize: 'medium',
    productImageAspect: 'portrait',
    showProductPrices: true,
    navStyle: 'centered',
    navSticky: true,
    sectionSpacing: 'spacious',
    containerWidth: 'normal',
    footerStyle: 'expanded',
    showSocialLinks: true,
    showNewsletter: true,
    sections: [
      { id: 'hero', name: 'Hero Carousel', enabled: true, order: 0 },
      { id: 'featured', name: 'Featured Products', enabled: true, order: 1 },
      { id: 'categories', name: 'Shop by Category', enabled: true, order: 2 },
      { id: 'about', name: 'About Section', enabled: true, order: 3 },
      { id: 'testimonials', name: 'Testimonials', enabled: true, order: 4 },
      { id: 'newsletter', name: 'Newsletter Signup', enabled: true, order: 5 },
    ],
  },
};

const themeLabels: Record<Theme, string> = {
  original: 'Original Theme',
  valentines: 'Valentine\'s Theme',
};

const themeIcons: Record<Theme, string> = {
  original: '🎨',
  valentines: '💝',
};

export default function LayoutPage() {
  const [theme, setTheme] = useState<Theme>('original');
  const [layout, setLayout] = useState<LayoutSettings>(defaultLayout.original);
  const [originalLayout, setOriginalLayout] = useState<LayoutSettings>(defaultLayout.original);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [themeLoading, setThemeLoading] = useState(false);

  const supabase = createClient();

  // Fetch current theme on mount
  useEffect(() => {
    fetchCurrentTheme();
  }, []);

  // Load layout when theme changes
  useEffect(() => {
    if (!loading) {
      loadLayout();
    }
  }, [theme]);

  useEffect(() => {
    const changed = JSON.stringify(layout) !== JSON.stringify(originalLayout);
    setHasChanges(changed);
  }, [layout, originalLayout]);

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
      // Load layout after theme is set
      await loadLayout();
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

  const loadLayout = async () => {
    setLoading(true);
    try {
      const settingsKey = `layout_settings_${theme}`;
      const { data, error } = await supabase
        .from('site_settings' as any)
        .select('value')
        .eq('key', settingsKey)
        .single();

      if (!error && data && (data as { value: unknown }).value) {
        const value = (data as { value: unknown }).value;
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        // Merge with defaults to handle new fields
        const merged = { ...defaultLayout[theme], ...parsed };
        setLayout(merged);
        setOriginalLayout(merged);
      } else {
        // Use theme defaults if no saved settings
        const defaults = defaultLayout[theme];
        setLayout(defaults);
        setOriginalLayout(defaults);
      }
    } catch (e) {
      console.log(`No layout settings found for ${theme} theme, using defaults`);
      const defaults = defaultLayout[theme];
      setLayout(defaults);
      setOriginalLayout(defaults);
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = async () => {
    setSaving(true);
    setSaveMessage(null);
    
    try {
      const settingsKey = `layout_settings_${theme}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('site_settings')
        .upsert(
          { 
            key: settingsKey, 
            value: JSON.stringify(layout),
            updated_at: new Date().toISOString()
          },
          { onConflict: 'key' }
        );

      if (error) throw error;
      
      setOriginalLayout(layout);
      setSaveMessage(`Layout saved for ${themeLabels[theme]}!`);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      console.error('Error saving layout:', e);
      setSaveMessage('Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setLayout(defaultLayout[theme]);
  };

  const updateLayout = <K extends keyof LayoutSettings>(key: K, value: LayoutSettings[K]) => {
    setLayout(prev => ({ ...prev, [key]: value }));
  };

  const toggleSection = (sectionId: string) => {
    setLayout(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      )
    }));
  };

  const handleDragStart = (sectionId: string) => {
    setDraggedSection(sectionId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetId) return;
    
    const sections = [...layout.sections];
    const draggedIndex = sections.findIndex(s => s.id === draggedSection);
    const targetIndex = sections.findIndex(s => s.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const [removed] = sections.splice(draggedIndex, 1);
    sections.splice(targetIndex, 0, removed);
    
    // Update order
    const reordered = sections.map((s, i) => ({ ...s, order: i }));
    setLayout(prev => ({ ...prev, sections: reordered }));
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
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
              Page Layout
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Customize the layout and structure of your website
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
            onClick={saveLayout}
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
                You are currently editing layout for the <strong>{themeLabels[theme]}</strong>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Settings */}
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Layout className="w-5 h-5" />
              Hero Section
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large', 'full'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => updateLayout('heroHeight', size)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        layout.heroHeight === size
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overlay Opacity: {layout.heroOverlayOpacity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={layout.heroOverlayOpacity}
                  onChange={(e) => updateLayout('heroOverlayOpacity', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Text Alignment</label>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => updateLayout('heroTextAlignment', align)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        layout.heroTextAlignment === align
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Product Grid</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Products Per Row</label>
                <div className="flex gap-2">
                  {([2, 3, 4] as const).map((num) => (
                    <button
                      key={num}
                      onClick={() => updateLayout('productsPerRow', num)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        layout.productsPerRow === num
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Size</label>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => updateLayout('productCardSize', size)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        layout.productCardSize === size
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image Aspect Ratio</label>
                <div className="flex gap-2">
                  {(['square', 'portrait', 'landscape'] as const).map((aspect) => (
                    <button
                      key={aspect}
                      onClick={() => updateLayout('productImageAspect', aspect)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        layout.productImageAspect === aspect
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {aspect.charAt(0).toUpperCase() + aspect.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layout.showProductPrices}
                  onChange={(e) => updateLayout('showProductPrices', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Show prices on product cards</span>
              </label>
            </div>
          </div>

          {/* Spacing & Container */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Spacing & Container</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section Spacing</label>
                <div className="flex gap-2">
                  {(['compact', 'normal', 'spacious'] as const).map((spacing) => (
                    <button
                      key={spacing}
                      onClick={() => updateLayout('sectionSpacing', spacing)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        layout.sectionSpacing === spacing
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {spacing.charAt(0).toUpperCase() + spacing.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Container Width</label>
                <div className="flex gap-2 flex-wrap">
                  {(['narrow', 'normal', 'wide', 'full'] as const).map((width) => (
                    <button
                      key={width}
                      onClick={() => updateLayout('containerWidth', width)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        layout.containerWidth === width
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {width.charAt(0).toUpperCase() + width.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation & Footer */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Navigation & Footer</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Navigation Style</label>
                <div className="flex gap-2">
                  {(['minimal', 'standard', 'centered'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => updateLayout('navStyle', style)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        layout.navStyle === style
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layout.navSticky}
                  onChange={(e) => updateLayout('navSticky', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Sticky navigation (stays on scroll)</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Footer Style</label>
                <div className="flex gap-2">
                  {(['minimal', 'standard', 'expanded'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => updateLayout('footerStyle', style)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        layout.footerStyle === style
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layout.showSocialLinks}
                  onChange={(e) => updateLayout('showSocialLinks', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Show social media links in footer</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layout.showNewsletter}
                  onChange={(e) => updateLayout('showNewsletter', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Show newsletter signup in footer</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Section Order */}
        <div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Section Order & Visibility</h2>
            <p className="text-sm text-gray-600 mb-4">
              Editing for <strong>{themeLabels[theme]}</strong>. Drag to reorder sections. Click the eye icon to show/hide.
            </p>
            
            <div className="space-y-2">
              {layout.sections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={() => handleDragStart(section.id)}
                    onDragOver={(e) => handleDragOver(e, section.id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-move ${
                      draggedSection === section.id
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!section.enabled ? 'opacity-50' : ''}`}
                  >
                    <GripVertical className="w-5 h-5 text-gray-400" />
                    <span className={`flex-1 text-sm ${section.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                      {section.name}
                    </span>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        section.enabled 
                          ? 'text-gray-600 hover:bg-gray-100' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {section.enabled ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
            </div>

            {/* Visual Preview */}
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Preview ({themeLabels[theme]})</h3>
              <div className="bg-gray-100 rounded-lg p-4 space-y-2">
                <div className="bg-white rounded p-2 text-xs text-gray-500 text-center border border-gray-200">
                  Navigation
                </div>
                {layout.sections
                  .filter(s => s.enabled)
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                    <div
                      key={section.id}
                      className="bg-white rounded p-2 text-xs text-gray-600 text-center border border-gray-200"
                    >
                      {section.name}
                    </div>
                  ))}
                <div className="bg-gray-800 rounded p-2 text-xs text-gray-300 text-center">
                  Footer
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
