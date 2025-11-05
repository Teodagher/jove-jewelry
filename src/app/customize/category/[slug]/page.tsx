'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';

interface JewelryItem {
  id: string;
  name: string;
  type: string;
  slug: string;
  description: string | null;
  base_image_url: string | null;
  base_price: number;
  product_type: 'simple' | 'customizable';
  display_order: number;
  category_id: string | null;
  is_active: boolean;
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

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.slug as string;

  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [products, setProducts] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const handleBackToCategories = () => {
    // Store scroll intent in sessionStorage
    sessionStorage.setItem('scrollToCustomize', 'true');
    router.push('/');
  };

  useEffect(() => {
    fetchCategoryAndProducts();
  }, [categorySlug]);

  // Scroll to top when navigating to this page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [categorySlug]);

  const fetchCategoryAndProducts = async () => {
    try {
      // Fetch category
      const { data: categoryData, error: categoryError } = await supabase
        .from('product_categories')
        .select('*')
        .eq('slug', categorySlug)
        .eq('is_active', true)
        .single<ProductCategory>();

      if (categoryError || !categoryData) {
        console.error('Error fetching category:', categoryError);
        setLoading(false);
        return;
      }

      setCategory(categoryData);

      // Fetch products in this category
      const { data: productsData, error: productsError } = await supabase
        .from('jewelry_items')
        .select('*')
        .eq('category_id', categoryData.id)
        .eq('is_active', true)
        .eq('product_type', 'customizable')
        .order('display_order', { ascending: true });

      if (productsError) {
        console.error('Error fetching products:', productsError);
        setLoading(false);
        return;
      }

      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light text-zinc-900 mb-4">Category not found</h1>
          <Link href="/" className="text-amber-600 hover:text-amber-700">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-zinc-800 text-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* Back button */}
          <button
            onClick={handleBackToCategories}
            className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all categories
          </button>

          <div className="text-center">
            {/* Category Image */}
            {category.image_url && (
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-amber-300 shadow-lg">
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 sm:mb-6 tracking-wide">
              {category.name}
            </h1>

            {category.description && (
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {category.description}
              </p>
            )}

            <div className="mt-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                {products.length} {products.length === 1 ? 'Product' : 'Products'} Available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products available in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {products.map((product) => (
              <Link key={product.id} href={`/customize/${product.slug}`} className="group">
                <div className="relative overflow-hidden bg-white border border-amber-100 hover:border-amber-300 transition-all duration-300 group-hover:shadow-xl rounded-lg">
                  {/* Subtle accent line */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-100 via-amber-300 to-amber-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                  {/* Image Container */}
                  <div className="relative h-64 sm:h-72 lg:h-80 bg-orange-50 overflow-hidden">
                    {product.base_image_url ? (
                      <Image
                        src={product.base_image_url}
                        alt={product.name}
                        fill
                        className="object-contain p-4 sm:p-6 lg:p-8 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6 lg:p-8">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-light mb-2 sm:mb-3 lg:mb-4 tracking-wide text-gray-900 group-hover:text-black transition-colors">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="hidden sm:block text-sm lg:text-base text-gray-600 leading-relaxed mb-4 lg:mb-6">
                        {product.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-lg font-medium text-gray-900">
                        Starting at ${product.base_price}
                      </span>
                    </div>

                    {/* Mobile: Show simplified CTA */}
                    <div className="sm:hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 tracking-wide">Customize</span>
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Tablet+: Show full CTA */}
                    <div className="hidden sm:flex items-center text-gray-900 font-medium group-hover:translate-x-1 transition-transform duration-300">
                      <span className="text-sm tracking-wide">Customize Now</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
