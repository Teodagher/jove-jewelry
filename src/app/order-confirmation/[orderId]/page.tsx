'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, User, Package } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { getMarketClient } from '@/lib/market-client';
import { getCurrency, formatPrice as formatCurrencyPrice } from '@/lib/currency';

interface Order {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_email: string;
  total: number;
  created_at: string;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [cartCleared, setCartCleared] = useState(false);

  const orderId = params.orderId as string;

  const fetchOrder = useCallback(async () => {
    try {
      // If orderId looks like a Stripe session ID, search by notes field
      // Otherwise, search by order ID
      const isStripeSession = orderId.startsWith('cs_');

      let query = supabase.from('orders').select('*');

      if (isStripeSession) {
        // Search for order with this Stripe session ID
        query = query.eq('stripe_session_id', orderId);
      } else {
        query = query.eq('id', orderId);
      }

      const { data, error } = await query.single();

      if (error) throw error;

      // Map the data to match our interface
      const mappedOrder = {
        id: (data as any).id,
        order_number: (data as any).order_number,
        customer_name: (data as any).customer_name,
        customer_email: (data as any).customer_email,
        total: (data as any).total,
        created_at: (data as any).created_at
      };

      setOrder(mappedOrder);
      setLoading(false);

      // Clear cart after successful order (only once)
      if (!cartCleared) {
        await clearCart();
        setCartCleared(true);
      }
    } catch (error: unknown) {
      console.error('Error fetching order:', error);

      // If it's a Stripe session and we haven't retried too many times, retry
      const isStripeSession = orderId.startsWith('cs_');
      if (isStripeSession && retryCount < 10) {
        // Retry after 2 seconds (webhook might still be processing)
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 2000);
      } else {
        setError('Order not found');
        setLoading(false);
      }
    }
  }, [orderId, retryCount, clearCart, cartCleared]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder, retryCount]);

  // Get market and currency for formatting
  const market = getMarketClient();
  const currency = getCurrency(market);
  
  // Use centralized currency formatter with conversion
  const formatPrice = (priceUSD: number) => {
    return formatCurrencyPrice(priceUSD, currency, true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center jove-bg-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center jove-bg-primary">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-serif font-light text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-8">The order you're looking for doesn't exist or has been removed.</p>
          <Button 
            onClick={() => router.push('/')}
            className="bg-black hover:bg-zinc-800 text-white px-8 py-3 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen jove-bg-primary">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        {/* Success Icon and Jové Branding */}
        <div className="text-center mb-12">
          {/* Jové Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-serif font-light text-zinc-900 tracking-[0.2em] mb-2">
              JOVÉ
            </h1>
            <div className="w-24 h-px bg-amber-400 mx-auto mb-8"></div>
          </div>

          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          {/* Success Message */}
          <h2 className="text-2xl sm:text-3xl font-serif font-light text-zinc-900 mb-3">
            Order Successful
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for choosing Jové. Your bespoke jewelry is now being crafted with the finest materials.
          </p>

          {/* Order Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Order Number</p>
                <p className="text-lg font-mono font-medium text-zinc-900">
                  #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="text-2xl font-light text-zinc-900">
                  {formatPrice(order.total)}
                </p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Customer</p>
                <p className="text-base text-zinc-900">{order.customer_name}</p>
                <p className="text-sm text-gray-600">{order.customer_email}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Order Date</p>
                <p className="text-base text-zinc-900">{formatDate(order.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <h3 className="font-serif font-medium text-zinc-900 mb-2">What happens next?</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Your custom jewelry will be handcrafted by our skilled artisans within <strong>5-10 business days</strong>. 
              We'll send you email updates and contact you when your piece is ready for delivery.
            </p>
          </div>

          {/* Account Prompt for Guest Users */}
          {!user && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <User className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-serif font-medium text-zinc-900 mb-1">Create an Account</h3>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    Sign up to track your orders, save your details for faster checkout, and get exclusive access to new collections.
                  </p>
                  <Button
                    onClick={() => router.push('/auth/signup')}
                    className="bg-black hover:bg-zinc-800 text-white py-2 px-6 text-xs font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase"
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={() => window.open(`/api/invoice/${order.id}`, '_blank')}
              className="w-full bg-maison-gold hover:bg-maison-gold-muted text-maison-black py-4 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Download Invoice
            </Button>

            {user && (
              <Button
                onClick={() => router.push('/account/orders')}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-4 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase flex items-center justify-center gap-2"
              >
                <Package size={16} />
                View Your Orders
              </Button>
            )}

            <Button
              onClick={() => router.push('/customize')}
              className={`w-full ${user ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-black hover:bg-zinc-800'} text-white py-4 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase`}
            >
              Create Another Piece
            </Button>

            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white py-4 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none uppercase"
            >
              Back to Home
            </Button>
          </div>

          {/* Contact Support */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Questions about your order? <br/>
              <a href="mailto:support@maisonjove.com" className="text-amber-600 hover:text-amber-700 font-medium">
                support@maisonjove.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
