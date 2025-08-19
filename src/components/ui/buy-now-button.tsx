import React from 'react';
import { Button } from './button';

interface BuyNowButtonProps {
  onAddToCart?: () => void;
  onBuyNow?: () => void;
  disabled?: boolean;
  loading?: boolean;
  price?: number;
  className?: string;
  showBothOptions?: boolean;
}

export function BuyNowButton({
  onAddToCart,
  onBuyNow,
  disabled = false,
  loading = false,
  price,
  className = '',
  showBothOptions = true
}: BuyNowButtonProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!showBothOptions) {
    // Single button mode - Buy Now only
    return (
      <Button
        onClick={onBuyNow}
        disabled={disabled || loading}
        className={`w-full bg-black hover:bg-zinc-800 text-white py-4 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase ${className}`}
        size="lg"
      >
        {loading ? 'Processing...' : `Buy Now ${price ? `— ${formatPrice(price)}` : ''}`}
      </Button>
    );
  }

  // Dual button mode
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Buy Now - Primary Action */}
      <Button
        onClick={onBuyNow}
        disabled={disabled || loading}
        className="w-full bg-black hover:bg-zinc-800 text-white py-4 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase"
        size="lg"
      >
        {loading ? 'Processing...' : `Buy Now ${price ? `— ${formatPrice(price)}` : ''}`}
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
    </div>
  );
}

// Quick Buy Now variant for urgent purchases
export function QuickBuyButton({
  onBuyNow,
  disabled = false,
  loading = false,
  price,
  className = ''
}: {
  onBuyNow?: () => void;
  disabled?: boolean;
  loading?: boolean;
  price?: number;
  className?: string;
}) {
  return (
    <BuyNowButton
      onBuyNow={onBuyNow}
      disabled={disabled}
      loading={loading}
      price={price}
      className={className}
      showBothOptions={false}
    />
  );
}
