'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Truck, Phone, MapPin } from 'lucide-react';

interface Order {
  id: string;
  customer_info: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  delivery_address: {
    address: string;
    city: string;
    area: string;
    building?: string;
    floor?: string;
    notes?: string;
  };
  items: Array<{
    jewelry_type: string;
    customization_summary: string;
    total_price: number;
    quantity: number;
    subtotal: number;
  }>;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = params.orderId as string;

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      setOrder(data);
          } catch (error: unknown) {
      console.error('Error fetching order:', error);
      setError('Order not found');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-3xl font-serif font-light text-zinc-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 text-lg">
            Thank you, {order.customer_info.first_name}! Your order has been received.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6 inline-block">
            <p className="text-sm font-medium text-green-800">
              Order ID: <span className="font-mono">{order.id.slice(0, 8).toUpperCase()}</span>
            </p>
            <p className="text-sm text-green-600">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Order Received</p>
                    <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">In Production</p>
                    <p className="text-sm text-gray-600">Your jewelry is being handcrafted (2-3 weeks)</p>
                  </div>
                </div>
                
                <div className="flex items-center opacity-50">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                    <Truck className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">Ready for Delivery</p>
                    <p className="text-sm text-gray-400">We'll contact you when ready</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium">{order.customer_info.phone}</p>
                    <p className="text-sm text-gray-600">{order.customer_info.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Delivery Address</h3>
              </div>
              <div className="text-gray-700">
                <p>{order.delivery_address.address}</p>
                <p>{order.delivery_address.area}, {order.delivery_address.city}</p>
                {order.delivery_address.building && (
                  <p>Building: {order.delivery_address.building}</p>
                )}
                {order.delivery_address.floor && (
                  <p>Floor: {order.delivery_address.floor}</p>
                )}
                {order.delivery_address.notes && (
                  <p className="mt-2 text-sm text-gray-600">
                    Notes: {order.delivery_address.notes}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {order.items.map((item, index) => (
                  <div key={index} className="pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 capitalize">
                          Custom {item.jewelry_type.slice(0, -1)} x{item.quantity}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.customization_summary}
                        </p>
                      </div>
                      <p className="font-medium text-zinc-900 ml-4">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Method */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Payment Method</span>
                  <span className="text-sm font-medium">Cash on Delivery</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Delivery</span>
                  <span className="text-sm font-medium text-green-600">Free</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-medium border-t border-gray-200 pt-4">
                <span>Total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <Button
                  onClick={() => router.push('/customize')}
                  className="w-full bg-black hover:bg-zinc-800 text-white py-3 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase"
                >
                  Create Another Piece
                </Button>
                
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="w-full border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white py-3 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none uppercase"
                >
                  Back to Home
                </Button>
              </div>

              {/* Support Note */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Need help?</strong> Contact us at support@jove.com or call us for any questions about your order.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
