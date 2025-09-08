'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Save, 
  X, 
  Upload, 
  Plus, 
  GripVertical, 
  Trash2, 
  Eye,
  Settings,
  ImageIcon,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import CustomizationEditor from '@/components/admin/CustomizationEditor';
import ProductImages from '@/components/admin/ProductImages';
import LogicRulesEditor from '@/components/admin/LogicRulesEditor';
import { ToastProvider } from '@/components/ui/toast-provider';

interface JewelryItem {
  id: string;
  name: string;
  type: string;
  slug: string;
  product_type: 'simple' | 'customizable';
  base_price: number;
  base_price_lab_grown: number | null;
  black_onyx_base_price: number | null;
  black_onyx_base_price_lab_grown: number | null;
  base_image_url: string | null;
  is_active: boolean;
  display_order: number;
  description: string | null;
}

interface OptionSummary {
  id: string;
  option_id: string;
  option_name: string;
  price: number;
  price_lab_grown: number | null;
  image_url: string | null;
  color_gradient: string | null;
  display_order: number;
  is_active: boolean;
}

interface CustomizationSetting {
  setting_id: string;
  setting_title: string;
  setting_display_order: number;
  setting_description: string | null;
  required: boolean;
  affects_image_variant: boolean;
  options: OptionSummary[];
}

interface CustomizationOption {
  id: string;
  jewelry_item_id: string | null;
  setting_id: string;
  setting_title: string;
  setting_description: string | null;
  setting_display_order: number | null;
  required: boolean | null;
  affects_image_variant: boolean | null;
  option_id: string;
  option_name: string;
  price: number;
  price_lab_grown: number | null;
  image_url: string | null;
  color_gradient: string | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<JewelryItem | null>(null);
  const [settings, setSettings] = useState<CustomizationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'customization' | 'images' | 'logic'>('basic');
  const [imagesRefreshKey, setImagesRefreshKey] = useState(0);

  // Callback when customization options change
  const handleCustomizationChange = () => {
    console.log('🔄 Customization options changed, refreshing images. Previous key:', imagesRefreshKey);
    setImagesRefreshKey(prev => {
      const newKey = prev + 1;
      console.log('🔄 New images refresh key:', newKey);
      return newKey;
    });
  };


  useEffect(() => {
    fetchProductData();
  }, [productId]);

  const fetchProductData = async () => {
    try {
      setLoading(true);

      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from('jewelry_items')
        .select('*')
        .eq('id', productId)
        .single() as { data: JewelryItem | null; error: any };

      if (productError || !productData) {
        console.error('Error fetching product:', productError);
        return;
      }

      setProduct(productData);

      // Fetch customization settings and options
      if (productData.product_type === 'customizable') {
        const { data: optionsData, error: optionsError } = await supabase
          .from('customization_options')
          .select('*')
          .eq('jewelry_item_id', productId)
          .order('setting_display_order')
          .order('display_order') as { data: CustomizationOption[] | null; error: any };

        if (optionsError) {
          console.error('Error fetching options:', optionsError);
          return;
        }

        // Group options by setting
        const settingsMap = new Map<string, CustomizationSetting>();
        
        optionsData?.forEach((option) => {
          if (!settingsMap.has(option.setting_id)) {
            settingsMap.set(option.setting_id, {
              setting_id: option.setting_id,
              setting_title: option.setting_title,
              setting_display_order: option.setting_display_order ?? 0,
              setting_description: option.setting_description,
              required: option.required ?? true,
              affects_image_variant: option.affects_image_variant ?? true,
              options: []
            });
          }

          const setting = settingsMap.get(option.setting_id)!;
          setting.options.push({
            id: option.id,
            option_id: option.option_id,
            option_name: option.option_name,
            price: option.price,
            price_lab_grown: option.price_lab_grown,
            image_url: option.image_url,
            color_gradient: option.color_gradient,
            display_order: option.display_order ?? 0,
            is_active: option.is_active ?? true
          });
        });

        // Sort settings and options
        const sortedSettings = Array.from(settingsMap.values())
          .sort((a, b) => a.setting_display_order - b.setting_display_order);

        sortedSettings.forEach(setting => {
          setting.options.sort((a, b) => a.display_order - b.display_order);
        });

        setSettings(sortedSettings);
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!product) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('jewelry_items')
        .update({
          name: product.name,
          slug: product.slug,
          product_type: product.product_type,
          base_price: product.base_price,
          base_price_lab_grown: product.base_price_lab_grown,
          black_onyx_base_price: product.black_onyx_base_price,
          black_onyx_base_price_lab_grown: product.black_onyx_base_price_lab_grown,
          base_image_url: product.base_image_url,
          is_active: product.is_active,
          display_order: product.display_order,
          description: product.description
        })
        .eq('id', productId);

      if (error) {
        console.error('Error saving product:', error);
        return;
      }

      // Show success message or redirect
      router.push('/admin/product-management');
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-medium text-gray-900 mb-4">Product Not Found</h1>
        <Link
          href="/admin/product-management"
          className="text-blue-600 hover:text-blue-800"
        >
          Return to Product Management
        </Link>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/product-management"
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-light text-zinc-900 tracking-wide">
              Edit {product.name}
            </h1>
            <p className="text-zinc-600 mt-1">
              {product.product_type === 'customizable' ? 'Customizable Product' : 'Simple Product'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {product.slug && (
            <Link
              href={`/customize/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Link>
          )}
          <button
            onClick={handleSaveProduct}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('basic')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'basic'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Basic Information
          </button>
          {product.product_type === 'customizable' && (
            <>
              <button
                onClick={() => setActiveTab('customization')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'customization'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Customization Options ({settings.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('images');
                  // Force refresh images when switching from customization tab
                  if (activeTab === 'customization') {
                    setImagesRefreshKey(prev => prev + 1);
                  }
                }}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'images'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Product Images
              </button>
              <button
                onClick={() => setActiveTab('logic')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'logic'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Logic Rules
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'basic' && (
        <BasicInfoEditor 
          product={product} 
          onProductChange={setProduct} 
        />
      )}

      {activeTab === 'customization' && product.product_type === 'customizable' && (
        <CustomizationEditor 
          settings={settings}
          onSettingsChange={setSettings}
          productId={productId}
          productSlug={product.slug}
          onOptionsChange={handleCustomizationChange}
        />
      )}

      {activeTab === 'images' && product.product_type === 'customizable' && (
        <ProductImages
          key={imagesRefreshKey}
          productId={productId}
          productType={product.type}
          productSlug={product.slug}
          refreshTrigger={imagesRefreshKey}
        />
      )}

      {activeTab === 'logic' && product.product_type === 'customizable' && (
        <LogicRulesEditor
          productId={productId}
          settings={settings}
        />
      )}
      </div>
    </ToastProvider>
  );
}

// Basic Info Editor Component
function BasicInfoEditor({ 
  product, 
  onProductChange 
}: { 
  product: JewelryItem; 
  onProductChange: (product: JewelryItem) => void;
}) {
  const handleInputChange = (field: keyof JewelryItem, value: any) => {
    onProductChange({
      ...product,
      [field]: value
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-6">
        {/* Product Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Image
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              {product.base_image_url ? (
                <img
                  src={product.base_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </button>
          </div>
        </div>

        {/* Basic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={product.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug
            </label>
            <input
              type="text"
              value={product.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL: /customize/{product.slug}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type
            </label>
            <select
              value={product.product_type}
              onChange={(e) => handleInputChange('product_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="simple">Simple Product</option>
              <option value="customizable">Customizable Product</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={product.display_order}
              onChange={(e) => handleInputChange('display_order', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={product.base_price}
                onChange={(e) => handleInputChange('base_price', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lab Grown Base Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={product.base_price_lab_grown || ''}
                onChange={(e) => handleInputChange('base_price_lab_grown', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            rows={4}
            value={product.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Product description..."
          />
        </div>

        {/* Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={product.is_active}
            onChange={(e) => handleInputChange('is_active', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Product is active and visible to customers
          </label>
        </div>
      </div>
    </div>
  );
}

