import React from 'react';
import { Button } from './button';
import { formatPrice as formatCurrencyPrice, type Currency } from '@/lib/currency';
import ValentinesGiftBox from '@/components/ValentinesGiftBox';

interface BuyNowButtonProps {
  onAddToCart?: () => void;
  onBuyNow?: () => void;
  disabled?: boolean;
  loading?: boolean;
  price?: number;
  currency?: Currency;
  className?: string;
  showBothOptions?: boolean;
  diamondType?: 'natural' | 'lab_grown';
  metalType?: 'gold' | 'silver';
  pricingType?: 'diamond_type' | 'metal_type';
}

export function BuyNowButton({
  onAddToCart,
  onBuyNow,
  disabled = false,
  loading = false,
  price,
  currency = 'USD',
  className = '',
  showBothOptions = true,
  diamondType = 'natural',
  metalType = 'gold',
  pricingType = 'diamond_type'
}: BuyNowButtonProps) {
  // Use the centralized currency formatter with conversion
  const formatPrice = (priceUSD: number) => {
    return formatCurrencyPrice(priceUSD, currency, true);
  };

  // Get button color and text based on pricing type
  let buttonColor: string;
  let typeText: string;

  if (pricingType === 'metal_type') {
    // Metal type pricing (Gold/Silver)
    buttonColor = metalType === 'silver'
      ? 'bg-gray-400 hover:bg-gray-500'
      : 'bg-amber-600 hover:bg-amber-700';
    typeText = metalType === 'silver' ? 'Silver' : 'Gold';
  } else {
    // Diamond type pricing (Natural/Lab Grown)
    buttonColor = diamondType === 'lab_grown'
      ? 'bg-emerald-600 hover:bg-emerald-700'
      : 'bg-black hover:bg-zinc-800';
    typeText = diamondType === 'lab_grown' ? 'Lab Grown' : 'Natural';
  }

  if (!showBothOptions) {
    // Single button mode - Buy Now only
    return (
      <Button
        onClick={onBuyNow}
        disabled={disabled || loading}
        className={`w-full ${buttonColor} text-white py-4 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase ${className}`}
        size="lg"
      >
        {loading ? 'Processing...' : `Buy Now ${typeText} ${price ? `— ${formatPrice(price)}` : ''}`}
      </Button>
    );
  }

  // Dual button mode
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Buy Now - Primary Action with dynamic color and text */}
      <Button
        onClick={onBuyNow}
        disabled={disabled || loading}
        className={`w-full ${buttonColor} text-white py-4 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase`}
        size="lg"
      >
        {loading ? 'Processing...' : `Buy Now ${typeText} ${price ? `— ${formatPrice(price)}` : ''}`}
      </Button>

      {/* Add to Cart - Secondary Action */}
      <Button
        onClick={onAddToCart}
        disabled={disabled || loading}
        variant="outline"
        className="w-full border border-zinc-400 text-zinc-700 hover:border-black hover:text-black py-4 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none bg-transparent uppercase"
        size="lg"
      >
        {loading ? 'Adding...' : 'Add to Cart'}
      </Button>

      {/* Valentine's Gift Box - shown during campaign */}
      <ValentinesGiftBox variant="product" />
    </div>
  );
}

// Quick Buy Now variant for urgent purchases
export function QuickBuyButton({
  onBuyNow,
  disabled = false,
  loading = false,
  price,
  currency = 'USD',
  className = ''
}: {
  onBuyNow?: () => void;
  disabled?: boolean;
  loading?: boolean;
  price?: number;
  currency?: Currency;
  className?: string;
}) {
  return (
    <BuyNowButton
      onBuyNow={onBuyNow}
      disabled={disabled}
      loading={loading}
      price={price}
      currency={currency}
      className={className}
      showBothOptions={false}
    />
  );
}
