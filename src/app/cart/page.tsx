'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

import HandcraftedBanner from '@/components/HandcraftedBanner';

export default function CartPage() {
  const { items, itemCount, subtotal, removeFromCart, updateQuantity, loading } = useCart();
  const [removingItems, setRemovingItems] = useState<string[]>([]);
  const router = useRouter();

  const handleRemoveItem = async (cartItemId: string) => {
    setRemovingItems(prev => [...prev, cartItemId]);
    try {
      await removeFromCart(cartItemId);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setRemovingItems(prev => prev.filter(id => id !== cartItemId));
    }
  };

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(cartItemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatJewelryType = (type: string) => {
    const map: Record<string, string> = {
      necklaces: 'Necklace',
      rings: 'Ring',
      bracelets: 'Bracelet',
      earrings: 'Earring',
    };
    const lower = type.toLowerCase();
    return map[lower] || (lower.charAt(0).toUpperCase() + lower.slice(1));
  };

  const generateCustomizationText = (customizationData: Record<string, unknown>, jewelryType: string) => {
    const parts: string[] = [];
    
    // Convert customization data to readable text
    Object.entries(customizationData).forEach(([key, value]) => {
      if (value) {
        // Format the key to be more readable
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const formattedValue = typeof value === 'string' 
          ? value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          : value;
        parts.push(`${formattedKey}: ${formattedValue}`);
      }
    });
    
    return parts.join(' • ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen jove-bg-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-light text-zinc-900 mb-2">
            Shopping Cart
          </h1>
          <p className="text-gray-600">
            {itemCount === 0 ? 'Your cart is empty' : `${itemCount} custom jewelry item${itemCount > 1 ? 's' : ''}`}
          </p>
        </div>

        {items.length === 0 ? (
          /* Empty Cart */
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Start creating your perfect piece of jewelry</p>
            <div className="space-x-4">
              <Button 
                onClick={() => router.push('/customize/necklaces')}
                className="bg-zinc-900 hover:bg-zinc-800 text-white"
              >
                Customize Necklace
              </Button>
              <Button 
                onClick={() => router.push('/customize/rings')}
                variant="outline"
                className="border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white"
              >
                Customize Ring
              </Button>
            </div>
          </div>
        ) : (
          /* Cart Items */
          <div className="space-y-6">
            {/* Cart Items List */}
            <div className="jove-bg-card rounded-lg shadow-sm">
              {items.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 border-b border-gray-200 last:border-b-0">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    {/* Preview Image or Placeholder */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.preview_image_url ? (
                        <img 
                          src={item.preview_image_url} 
                          alt="Custom jewelry preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900">
                        Custom {formatJewelryType(item.jewelry_type)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {generateCustomizationText(item.customization_data, item.jewelry_type)}
                      </p>
                      <div className="mt-2">
                        <span className="text-base sm:text-lg font-semibold text-zinc-900">
                          {formatPrice(item.total_price)}
                        </span>
                        {item.base_price !== item.total_price && (
                          <span className="text-sm text-gray-500 ml-2">
                            (Base: {formatPrice(item.base_price)})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between sm:justify-start sm:space-x-3 mt-2 sm:mt-0">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="p-3 sm:p-2 hover:bg-gray-100 rounded-l-lg"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-4 py-2 border-x border-gray-300 bg-gray-50 min-w-[3rem] text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-3 sm:p-2 hover:bg-gray-100 rounded-r-lg"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Remove Button (desktop) */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={removingItems.includes(item.id)}
                        className="hidden sm:inline-flex p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>

                      {/* Remove Link (mobile) */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={removingItems.includes(item.id)}
                        className="sm:hidden text-sm text-red-600 underline underline-offset-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary & Account Creation */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Cart Summary */}
              <div className="jove-bg-card rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal ({itemCount} item{itemCount > 1 ? 's' : ''})</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    {/* Handcrafted Banner */}
                    <div className="mb-6">
                      <HandcraftedBanner />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Cash on Delivery Available
                      </p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Free Delivery in Lebanon
                      </p>
                    </div>
                    
                    {/* Checkout Button */}
                    <Button 
                      onClick={() => router.push('/checkout')}
                      className="w-full bg-black hover:bg-zinc-800 text-white py-3 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase mb-4"
                    >
                      Proceed to Checkout — {formatPrice(subtotal)}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Account Creation - Coming Soon */}
              <div className="jove-bg-card rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Your Jové Account <span className="text-sm font-normal text-gray-500">(Coming Soon)</span></h3>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Account Creation Coming Soon</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    We're working on bringing you an enhanced account experience. For now, you can continue with guest checkout.
                  </p>
                  <Button 
                    onClick={() => router.push('/checkout')}
                    className="bg-black hover:bg-zinc-800 text-white py-2 px-6 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase"
                  >
                    Continue as Guest
                  </Button>
                </div>
              </div>
            </div>

            {/* Continue Shopping */}
            <div className="text-center mt-8">
              <Button 
                onClick={() => router.push('/customize')}
                variant="outline"
                className="border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white py-3 px-8"
                size="lg"
              >
                Continue Customizing
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
