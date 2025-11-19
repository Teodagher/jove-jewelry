import { useState } from 'react';
import { getStripe } from '@/lib/stripe/client';
import { useToast } from '@/contexts/ToastContext';
import type { Market } from '@/lib/market-client';
import { getCurrency } from '@/lib/currency';

interface CartItem {
  jewelry_type: string;
  customization_data: Record<string, any>;
  base_price: number;
  total_price: number;
  quantity: number;
  subtotal: number;
  preview_image_url?: string | null;
}

interface CustomerInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface DeliveryAddress {
  address: string;
  city: string;
  area: string;
  building?: string;
  floor?: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface UseStripeCheckoutOptions {
  market: Market;
}

export function useStripeCheckout({ market }: UseStripeCheckoutOptions) {
  const [loading, setLoading] = useState(false);
  const { error: showError } = useToast();

  const createCheckoutSession = async (
    cartItems: CartItem[],
    customerInfo: CustomerInfo,
    deliveryAddress: DeliveryAddress
  ) => {
    setLoading(true);

    try {
      const currency = getCurrency(market);

      // Create checkout session via Next.js API route
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems,
          customerInfo,
          deliveryAddress,
          market,
          currency,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId, url } = await response.json();

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
        return { success: true, sessionId };
      }

      throw new Error('No checkout URL returned from server');

    } catch (error: any) {
      console.error('Stripe checkout error:', error);
      showError(
        'Payment Setup Failed',
        error.message || 'Unable to proceed to payment. Please try again.'
      );
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    loading,
  };
}
