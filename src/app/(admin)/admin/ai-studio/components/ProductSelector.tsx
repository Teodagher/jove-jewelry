'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, Package, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  type: string;
  slug: string;
  base_image_url: string | null;
}

interface ProductSelectorProps {
  selectedProductId: string | null;
  onSelect: (product: Product | null) => void;
}

export default function ProductSelector({ selectedProductId, onSelect }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/ai-studio/products');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch products');
        }

        setProducts(data.products);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSelect = (product: Product) => {
    onSelect(product);
    setIsOpen(false);
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 border border-red-200 shadow-sm">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-4 h-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-zinc-900">Select Product</h3>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-left flex items-center justify-between hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading products...
            </span>
          ) : selectedProduct ? (
            <span className="text-zinc-900">{selectedProduct.name}</span>
          ) : (
            <span className="text-zinc-500">Select a product...</span>
          )}
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && !isLoading && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {products.length === 0 ? (
              <div className="px-4 py-3 text-sm text-zinc-500">
                No customizable products found
              </div>
            ) : (
              products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-amber-50 transition-colors flex items-center gap-3 ${
                    selectedProductId === product.id ? 'bg-amber-50 text-amber-700' : 'text-zinc-700'
                  }`}
                >
                  {product.base_image_url && (
                    <img
                      src={product.base_image_url}
                      alt={product.name}
                      className="w-8 h-8 object-contain rounded"
                    />
                  )}
                  <span>{product.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {selectedProduct && (
        <p className="mt-3 text-xs text-zinc-500">
          Type: {selectedProduct.type} • Slug: {selectedProduct.slug}
        </p>
      )}
    </div>
  );
}
