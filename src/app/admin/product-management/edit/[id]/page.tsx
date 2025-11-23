'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
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
import MarketSelector from '@/components/admin/MarketSelector';
import MarketPricingForm from '@/components/admin/MarketPricingForm';
import type { Market } from '@/lib/market-client';

interface JewelryItem {
  id: string;
  name: string;
  type: string;
  slug: string;
  product_type: 'simple' | 'customizable';
  base_price: number;
  base_price_lab_grown: number | null;
  base_price_gold: number | null;
  base_price_silver: number | null;
  black_onyx_base_price: number | null;
  black_onyx_base_price_lab_grown: number | null;
  black_onyx_base_price_gold: number | null;
  black_onyx_base_price_silver: number | null;
  // Australian market prices
  base_price_au: number | null;
  base_price_lab_grown_au: number | null;
  base_price_gold_au: number | null;
  base_price_silver_au: number | null;
  black_onyx_base_price_au: number | null;
  black_onyx_base_price_lab_grown_au: number | null;
  black_onyx_base_price_gold_au: number | null;
  black_onyx_base_price_silver_au: number | null;
  pricing_type: 'diamond_type' | 'metal_type';
  base_image_url: string | null;
  is_active: boolean;
  display_order: number;
  description: string | null;
  category_id: string | null;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

interface OptionSummary {
  id: string;
  option_id: string;
  option_name: string;
  price: number;
  price_lab_grown: number | null;
  price_gold: number | null;
  price_silver: number | null;
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
  price_gold: number | null;
  price_silver: number | null;
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
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'customization' | 'images' | 'logic'>('basic');
  const [imagesRefreshKey, setImagesRefreshKey] = useState(0);
  const [selectedMarket, setSelectedMarket] = useState<Market>('lb');

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
            price_gold: option.price_gold,
            price_silver: option.price_silver,
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

      const updateData = {
        name: product.name,
        slug: product.slug,
        product_type: product.product_type,
        base_price: product.base_price,
        base_price_lab_grown: product.base_price_lab_grown,
        base_price_gold: product.base_price_gold,
        base_price_silver: product.base_price_silver,
        black_onyx_base_price: product.black_onyx_base_price,
        black_onyx_base_price_lab_grown: product.black_onyx_base_price_lab_grown,
        black_onyx_base_price_gold: product.black_onyx_base_price_gold,
        black_onyx_base_price_silver: product.black_onyx_base_price_silver,
        base_image_url: product.base_image_url,
        is_active: product.is_active,
        display_order: product.display_order,
        description: product.description,
        category_id: product.category_id
      };

      const { error } = await (supabase as any)
        .from('jewelry_items')
        .update(updateData)
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
              className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'basic'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'pricing'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Pricing
            </button>
            {product.product_type === 'customizable' && (
              <>
                <button
                  onClick={() => setActiveTab('customization')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'customization'
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
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'images'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <ImageIcon className="w-4 h-4 inline mr-2" />
                  Product Images
                </button>
                <button
                  onClick={() => setActiveTab('logic')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'logic'
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

        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <MarketSelector
              selectedMarket={selectedMarket}
              onMarketChange={setSelectedMarket}
            />

            <MarketPricingForm
              market={selectedMarket}
              priceFields={[
                {
                  label: 'Base Price',
                  key: selectedMarket === 'lb' ? 'base_price' : `base_price_${selectedMarket}`,
                  value: selectedMarket === 'lb'
                    ? product.base_price
                    : (product as any)[`base_price_${selectedMarket}`] || null
                },
                {
                  label: 'Lab Grown Diamond Base Price',
                  key: selectedMarket === 'lb' ? 'base_price_lab_grown' : `base_price_lab_grown_${selectedMarket}`,
                  value: selectedMarket === 'lb'
                    ? product.base_price_lab_grown
                    : (product as any)[`base_price_lab_grown_${selectedMarket}`] || null
                },
                {
                  label: 'Gold Base Price',
                  key: selectedMarket === 'lb' ? 'base_price_gold' : `base_price_gold_${selectedMarket}`,
                  value: selectedMarket === 'lb'
                    ? product.base_price_gold
                    : (product as any)[`base_price_gold_${selectedMarket}`] || null
                },
                {
                  label: 'Silver Base Price',
                  key: selectedMarket === 'lb' ? 'base_price_silver' : `base_price_silver_${selectedMarket}`,
                  value: selectedMarket === 'lb'
                    ? product.base_price_silver
                    : (product as any)[`base_price_silver_${selectedMarket}`] || null
                },
                {
                  label: 'Black Onyx Base Price',
                  key: selectedMarket === 'lb' ? 'black_onyx_base_price' : `black_onyx_base_price_${selectedMarket}`,
                  value: selectedMarket === 'lb'
                    ? product.black_onyx_base_price
                    : (product as any)[`black_onyx_base_price_${selectedMarket}`] || null
                },
                {
                  label: 'Black Onyx Lab Grown Price',
                  key: selectedMarket === 'lb' ? 'black_onyx_base_price_lab_grown' : `black_onyx_base_price_lab_grown_${selectedMarket}`,
                  value: selectedMarket === 'lb'
                    ? product.black_onyx_base_price_lab_grown
                    : (product as any)[`black_onyx_base_price_lab_grown_${selectedMarket}`] || null
                },
                {
                  label: 'Black Onyx Gold Price',
                  key: selectedMarket === 'lb' ? 'black_onyx_base_price_gold' : `black_onyx_base_price_gold_${selectedMarket}`,
                  value: selectedMarket === 'lb'
                    ? product.black_onyx_base_price_gold
                    : (product as any)[`black_onyx_base_price_gold_${selectedMarket}`] || null
                },
                {
                  label: 'Black Onyx Silver Price',
                  key: selectedMarket === 'lb' ? 'black_onyx_base_price_silver' : `black_onyx_base_price_silver_${selectedMarket}`,
                  value: selectedMarket === 'lb'
                    ? product.black_onyx_base_price_silver
                    : (product as any)[`black_onyx_base_price_silver_${selectedMarket}`] || null
                },
              ]}
              onSave={async (prices) => {
                try {
                  // Keys now match database columns directly, so no transformation needed
                  const { error } = await (supabase as any)
                    .from('jewelry_items')
                    .update(prices)
                    .eq('id', productId);

                  if (error) {
                    console.error('Error saving prices:', error);
                    return false;
                  }

                  // Refresh product data
                  await fetchProductData();
                  return true;
                } catch (error) {
                  console.error('Error saving prices:', error);
                  return false;
                }
              }}
              title="Base Prices"
              description="Set prices for this product in different markets"
            />
          </div>
        )}

        {activeTab === 'customization' && product.product_type === 'customizable' && (
          <CustomizationEditor
            settings={settings}
            onSettingsChange={setSettings}
            productId={productId}
            productSlug={product.slug}
            onOptionsChange={handleCustomizationChange}
            pricingType={product.pricing_type || 'diamond_type'}
            onPricingTypeChange={async (newPricingType) => {
              // Update pricing type in database
              const { error } = await (supabase as any)
                .from('jewelry_items')
                .update({ pricing_type: newPricingType })
                .eq('id', productId);

              if (!error) {
                setProduct({ ...product, pricing_type: newPricingType });
              }
            }}
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
            pricingType={product.pricing_type || 'diamond_type'}
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setCreatingCategory(true);
      const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-');

      const { data, error } = await (supabase as any)
        .from('product_categories')
        .insert({
          name: newCategoryName,
          slug: slug,
          display_order: categories.length
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        alert('Failed to create category. The name might already exist.');
        return;
      }

      // Refresh categories list
      await fetchCategories();

      // Select the new category
      handleInputChange('category_id', data.id);

      // Close modal and reset
      setShowNewCategoryModal(false);
      setNewCategoryName('');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category.');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleInputChange = (field: keyof JewelryItem, value: any) => {
    onProductChange({
      ...product,
      [field]: value
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Delete old image if it exists
      if (product.base_image_url) {
        try {
          const oldImagePath = product.base_image_url.split('/item-pictures/')[1];
          if (oldImagePath) {
            const { error: deleteError } = await supabase.storage
              .from('item-pictures')
              .remove([oldImagePath]);

            if (deleteError) {
              console.warn('Failed to delete old image:', deleteError);
              // Continue anyway - don't block the new upload
            }
          }
        } catch (err) {
          console.warn('Error parsing old image path:', err);
        }
      }

      setUploadProgress(25);

      // Import the compression utilities
      const { compressToTargetSize, generateOptimizedFileName } = await import('@/lib/imageCompression');

      // Compress the image
      const compressedBlob = await compressToTargetSize(file, 100, {
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'webp'
      });

      setUploadProgress(50);

      // Generate optimized filename
      const fileName = generateOptimizedFileName(file.name);
      const filePath = `products/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('item-pictures')
        .upload(filePath, compressedBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
        return;
      }

      setUploadProgress(75);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('item-pictures')
        .getPublicUrl(filePath);

      setUploadProgress(100);

      // Update product with new image URL
      handleInputChange('base_image_url', publicUrl);

      // Save to database immediately
      const { error: updateError } = await (supabase as any)
        .from('jewelry_items')
        .update({ base_image_url: publicUrl })
        .eq('id', product.id);

      if (updateError) {
        console.error('Error saving image to database:', updateError);
        alert('Image uploaded but failed to save to database. Please click Save Changes.');
      }

    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageDelete = async () => {
    if (!product.base_image_url) return;

    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      setUploading(true);

      // Delete from storage
      const imagePath = product.base_image_url.split('/item-pictures/')[1];
      if (imagePath) {
        const { error } = await supabase.storage
          .from('item-pictures')
          .remove([imagePath]);

        if (error) {
          console.error('Error deleting image:', error);
          alert('Failed to delete image. Please try again.');
          return;
        }
      }

      // Update product to remove image URL
      handleInputChange('base_image_url', null);

      // Save to database immediately
      const { error: updateError } = await (supabase as any)
        .from('jewelry_items')
        .update({ base_image_url: null })
        .eq('id', product.id);

      if (updateError) {
        console.error('Error updating database:', updateError);
        alert('Image deleted from storage but failed to update database. Please click Save Changes.');
      }

    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    } finally {
      setUploading(false);
    }
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
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 relative">
              {product.base_image_url ? (
                <img
                  src={product.base_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="text-white text-xs">{uploadProgress}%</div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="image-upload"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
                {product.base_image_url && (
                  <button
                    type="button"
                    onClick={handleImageDelete}
                    disabled={uploading}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Recommended: Square image, will be compressed to WebP
              </p>
            </div>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="flex space-x-2">
              <select
                value={product.category_id || ''}
                onChange={(e) => handleInputChange('category_id', e.target.value || null)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCategoryModal(true)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.pricing_type === 'metal_type' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gold Base Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={product.base_price_gold || ''}
                    onChange={(e) => handleInputChange('base_price_gold', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Silver Base Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={product.base_price_silver || ''}
                    onChange={(e) => handleInputChange('base_price_silver', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Natural Diamond Base Price ($)
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
              </>
            )}
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

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateCategory();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Bracelets, Rings, Necklaces"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  disabled={creatingCategory}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={creatingCategory || !newCategoryName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {creatingCategory ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

