'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@/lib/adminUtils';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Crown,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Clock,
  Package,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  XCircle,
  Truck,
  Tag,
  MoreVertical
} from 'lucide-react';

interface OrderItem {
  id: string;
  jewelry_type: string;
  customization_data: Record<string, unknown>;
  customization_summary: string;
  base_price: number;
  total_price: number;
  quantity: number;
  subtotal: number;
  preview_image_url?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_city: string;
  subtotal: number;
  total: number;
  status: string;
  payment_method: string;
  discount_amount?: number;
  discount_type?: string;
  discount_value?: number;
  discount_code?: string;
  created_at: string;
  order_items?: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_production: 'bg-purple-100 text-purple-800',
  ready_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_production: 'In Production',
  ready_for_delivery: 'Ready for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchUserAndOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user and orders via API route (uses service_role, bypasses RLS)
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch user details');
      }

      setUser(data.user);
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserAndOrders();
  }, [fetchUserAndOrders]);

  const handleRoleUpdate = async (action: 'promote' | 'demote') => {
    if (action === 'demote') {
      const confirmed = window.confirm('Are you sure you want to remove admin access from this user?');
      if (!confirmed) return;
    }

    try {
      setUpdatingRole(true);
      const res = await fetch('/api/admin/users/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');

      setUser(prev => prev ? { ...prev, roles: data.roles } : null);
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setUpdatingRole(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'in_production': return <Package className="h-4 w-4" />;
      case 'ready_for_delivery': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">User Details</h1>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-8">
        <div className="border-b border-gray-200 pb-5">
          <Link href="/admin/users" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Users
          </Link>
          <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">User Not Found</h1>
          <p className="mt-2 text-sm text-red-600">{error || 'This user does not exist.'}</p>
        </div>
      </div>
    );
  }

  const isAdmin = user.roles?.includes('admin');
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
  const lastOrder = orders.length > 0 ? orders[0] : null;

  return (
    <div className="space-y-8">
      {/* Back link + Header */}
      <div className="border-b border-gray-200 pb-5">
        <Link href="/admin/users" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Users
        </Link>
        <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">User Details</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-2xl font-medium text-zinc-600 flex-shrink-0">
            {(user.full_name || user.email)?.[0]?.toUpperCase() || '?'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-medium text-gray-900">{user.full_name || 'No name'}</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.country && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{user.country}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Member since {formatDate(user.created_at)}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                  <Crown className="h-3 w-3" />
                  Admin
                </span>
              ) : (
                <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                  Customer
                </span>
              )}
            </div>
          </div>

          {/* Role Action */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              {updatingRole ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-600"></div>
              ) : (
                <MoreVertical className="h-5 w-5" />
              )}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-zinc-200 z-20 py-1">
                  <p className="px-4 py-1 text-xs text-gray-400 uppercase tracking-wider">Change Role</p>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (!isAdmin) return;
                      handleRoleUpdate('demote');
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      !isAdmin
                        ? 'text-gray-900 bg-gray-50 font-medium cursor-default'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Customer {!isAdmin && <span className="text-xs text-gray-400 ml-1">(current)</span>}
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (isAdmin) return;
                      handleRoleUpdate('promote');
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      isAdmin
                        ? 'text-gray-900 bg-gray-50 font-medium cursor-default'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Admin {isAdmin && <span className="text-xs text-gray-400 ml-1">(current)</span>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center space-x-3">
            <ShoppingBag className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-semibold text-zinc-900">{orders.length}</p>
              <p className="text-xs text-zinc-500">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-semibold text-zinc-900">{formatPrice(totalSpent)}</p>
              <p className="text-xs text-zinc-500">Total Spent</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-2xl font-semibold text-zinc-900">{formatPrice(avgOrderValue)}</p>
              <p className="text-xs text-zinc-500">Avg Order Value</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-2xl font-semibold text-zinc-900">
                {lastOrder ? formatDate(lastOrder.created_at) : '—'}
              </p>
              <p className="text-xs text-zinc-500">Last Order</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Order History</h3>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-900">No orders yet</p>
            <p className="text-sm text-gray-500 mt-1">This user has not placed any orders.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border border-zinc-200">
                {/* Order Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Order #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">{formatDateTime(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(order.status)}
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatPrice(order.total)}</p>
                      <p className="text-xs text-gray-500">
                        {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {expandedOrder === order.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                    {/* Discount */}
                    {order.discount_amount && order.discount_amount > 0 && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {order.discount_type === 'percentage'
                              ? `${order.discount_value}% Off`
                              : `${formatPrice(order.discount_value || 0)} Off`}
                          </span>
                          {order.discount_code && (
                            <span className="text-xs font-mono text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                              {order.discount_code}
                            </span>
                          )}
                          <span className="text-sm text-green-700 ml-auto">-{formatPrice(order.discount_amount)}</span>
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.preview_image_url ? (
                            <img
                              src={item.preview_image_url}
                              alt="Custom jewelry"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            Custom {formatJewelryType(item.jewelry_type)} x{item.quantity}
                          </p>
                          {item.customization_summary && (
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                              {item.customization_summary}
                            </p>
                          )}
                          {(item.customization_data?.engraving as string) && (
                            <div className="mt-1.5 p-1.5 bg-amber-50 border border-amber-200 rounded">
                              <span className="text-xs font-medium text-amber-800">Engraving: </span>
                              <span className="text-xs text-amber-700 font-mono">
                                &quot;{String(item.customization_data.engraving)}&quot;
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 flex-shrink-0">
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    ))}

                    {/* Link to order page */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => window.open(`/order-confirmation/${order.id}`, '_blank')}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Full Order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
