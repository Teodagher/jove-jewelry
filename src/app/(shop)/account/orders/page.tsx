'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { ChevronDown, ShoppingBag } from 'lucide-react';
import type { Database } from '@/types/database.types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      const sb = createClient();
      // Find orders by auth_user_id OR by matching email
      const { data, error } = await sb
        .from('orders')
        .select('*')
        .or(`auth_user_id.eq.${user.id}${user.email ? `,customer_email.eq.${user.email}` : ''}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [user]);

  const toggleOrder = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }

    setExpandedOrder(orderId);

    // Fetch order items if not already loaded
    if (!orderItems[orderId]) {
      const sb = createClient();
      const { data } = await sb
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (data) {
        setOrderItems((prev) => ({ ...prev, [orderId]: data }));
      }
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount == null) return '-';
    return `$${amount.toFixed(2)}`;
  };

  const statusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'text-green-700 bg-green-50';
      case 'processing':
      case 'confirmed':
        return 'text-amber-700 bg-amber-50';
      case 'cancelled':
        return 'text-red-700 bg-red-50';
      default:
        return 'text-maison-graphite bg-maison-cream';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maison-gold"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-serif font-light text-maison-charcoal tracking-wider mb-6">
        My Orders
      </h2>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={48} strokeWidth={1} className="mx-auto text-maison-warm mb-4" />
          <p className="text-maison-graphite/60 font-light mb-6">
            You haven&apos;t placed any orders yet.
          </p>
          <Link
            href="/customize"
            className="inline-block bg-black hover:bg-zinc-800 text-white py-3 px-8 text-sm font-light tracking-[0.15em] transition-all duration-500 uppercase"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-maison-warm/50">
              {/* Order Header */}
              <button
                onClick={() => toggleOrder(order.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-maison-cream/30 transition-colors duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                  <span className="text-sm font-light text-maison-charcoal">
                    {order.order_number || order.id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-maison-graphite/60">
                    {formatDate(order.created_at)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 inline-block w-fit ${statusColor(order.status)}`}>
                    {order.status || 'Pending'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-light text-maison-charcoal">
                    {formatCurrency(order.total_amount ?? order.total)}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.5}
                    className={`text-maison-graphite transition-transform duration-300 ${
                      expandedOrder === order.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Expanded Order Details */}
              {expandedOrder === order.id && (
                <div className="border-t border-maison-warm/50 p-5 bg-maison-cream/20">
                  {!orderItems[order.id] ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-maison-gold"></div>
                    </div>
                  ) : orderItems[order.id].length === 0 ? (
                    <p className="text-sm text-maison-graphite/60 font-light">No items found.</p>
                  ) : (
                    <div className="space-y-3">
                      {orderItems[order.id].map((item) => (
                        <div key={item.id} className="flex items-start gap-4">
                          {item.preview_image_url && (
                            <img
                              src={item.preview_image_url}
                              alt={item.product_name || 'Order item'}
                              className="w-16 h-16 object-cover border border-maison-warm/50"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-light text-maison-charcoal">
                              {item.product_name || item.jewelry_type}
                            </p>
                            {item.customization_summary && (
                              <p className="text-xs text-maison-graphite/60 mt-1">
                                {item.customization_summary}
                              </p>
                            )}
                            <p className="text-xs text-maison-graphite/60 mt-1">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-light text-maison-charcoal">
                            {formatCurrency(item.total_price)}
                          </p>
                        </div>
                      ))}

                      {/* Order summary */}
                      <div className="border-t border-maison-warm/30 pt-3 mt-3 space-y-1">
                        <div className="flex justify-between text-xs text-maison-graphite/60">
                          <span>Subtotal</span>
                          <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.delivery_fee != null && order.delivery_fee > 0 && (
                          <div className="flex justify-between text-xs text-maison-graphite/60">
                            <span>Delivery</span>
                            <span>{formatCurrency(order.delivery_fee)}</span>
                          </div>
                        )}
                        {order.discount_amount != null && order.discount_amount > 0 && (
                          <div className="flex justify-between text-xs text-green-600">
                            <span>Discount{order.discount_code ? ` (${order.discount_code})` : ''}</span>
                            <span>-{formatCurrency(order.discount_amount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-light text-maison-charcoal pt-1">
                          <span>Total</span>
                          <span>{formatCurrency(order.total_amount ?? order.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
