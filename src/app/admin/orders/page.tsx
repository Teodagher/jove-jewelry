'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Package,
  Search,
  Filter,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  Tag,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ManualOrderForm from '@/components/admin/ManualOrderForm';

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
  delivery_address: string;
  delivery_city: string;
  delivery_notes?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  subtotal: number;
  total: number;
  status: string;
  payment_method: string;
  notes?: string;
  discount_type?: 'percentage' | 'fixed_amount';
  discount_value?: number;
  discount_amount?: number;
  discount_code?: string;
  created_at: string;
  updated_at: string;
  customer_info?: Record<string, unknown>;
  delivery_address_json?: Record<string, unknown>;
  items?: OrderItem[];
  order_items?: OrderItem[];
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_production: 'bg-purple-100 text-purple-800',
  ready_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
} as const;

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_production', label: 'In Production' },
  { value: 'ready_for_delivery', label: 'Ready for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showManualOrderForm, setShowManualOrderForm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);


  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch orders with their items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            jewelry_type,
            customization_data,
            customization_summary,
            base_price,
            total_price,
            quantity,
            subtotal,
            preview_image_url
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      setOrders(ordersData || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);

      const { error } = await (supabase
        .from('orders') as any)
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));

    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteClick = (orderId: string, orderNumber: string) => {
    setDeleteConfirmation({ orderId, orderNumber });
    setShowSecondConfirm(false);
  };

  const handleFirstConfirm = () => {
    setShowSecondConfirm(true);
  };

  const handleSecondConfirm = async () => {
    if (!deleteConfirmation) return;

    try {
      setDeleting(true);
      setError(null);

      // Delete order items first (foreign key constraint)
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', deleteConfirmation.orderId);

      if (itemsError) throw itemsError;

      // Delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', deleteConfirmation.orderId);

      if (orderError) throw orderError;

      // Cache busting - revalidate orders
      await fetch('/api/revalidate?path=/admin/orders', {
        method: 'POST',
      });

      // Update local state
      setOrders(prev => prev.filter(order => order.id !== deleteConfirmation.orderId));

      // Close modal
      setDeleteConfirmation(null);
      setShowSecondConfirm(false);

    } catch (err) {
      console.error('Error deleting order:', err);
      setError('Failed to delete order. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation(null);
    setShowSecondConfirm(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">Orders</h1>
          <p className="mt-2 text-sm text-gray-600">Loading orders...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">Orders</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
        <div className="text-center">
          <Button onClick={fetchOrders} className="bg-black hover:bg-zinc-800">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">Orders</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage customer orders and track production status
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowManualOrderForm(true)}
              className="bg-black hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Manual Order
            </Button>
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <Package className="h-4 w-4" />
              <span>{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="jove-bg-card rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order number, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 bg-white"
              >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Order Form */}
      {showManualOrderForm && (
        <div className="jove-bg-card rounded-lg shadow-sm">
          <ManualOrderForm
            onSuccess={() => {
              setShowManualOrderForm(false);
              fetchOrders();
            }}
            onCancel={() => setShowManualOrderForm(false)}
          />
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="jove-bg-card rounded-lg shadow-sm p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Orders will appear here once customers start placing them.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="jove-bg-card rounded-lg shadow-sm">
              {/* Order Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Order #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(order.total)}
                      </p>
                      {order.discount_amount && order.discount_amount > 0 && (
                        <p className="text-sm text-green-600">
                          -{formatPrice(order.discount_amount)} discount
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      {expandedOrder === order.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Customer Info */}
                <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{order.customer_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{order.customer_email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{order.delivery_city}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Order Details */}
              {expandedOrder === order.id && (
                <div className="p-6 space-y-6">
                  {/* Customer & Delivery Info */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Customer Information */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{order.customer_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a href={`mailto:${order.customer_email}`} className="text-blue-600 hover:text-blue-800">
                            {order.customer_email}
                          </a>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:text-blue-800">
                            {order.customer_phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Information */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Delivery Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <p>{order.delivery_address}</p>
                            <p className="text-gray-600">{order.delivery_city}</p>
                            {(order.delivery_address_json as { area?: string })?.area && (
                              <p className="text-gray-600">{String((order.delivery_address_json as { area?: string }).area)}</p>
                            )}
                            {order.delivery_latitude && order.delivery_longitude && (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-green-600 font-medium">📍 GPS Location Available</p>
                                <p className="text-xs text-gray-500">
                                  {order.delivery_latitude.toFixed(6)}, {order.delivery_longitude.toFixed(6)}
                                </p>
                                <a
                                  href={`https://maps.google.com/maps?q=${order.delivery_latitude},${order.delivery_longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Open in Google Maps
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        {order.delivery_notes && (
                          <div className="flex items-start space-x-2">
                            <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                            <p className="text-gray-600">{order.delivery_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Discount Information */}
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Discount Applied</h4>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Tag className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {order.discount_type === 'percentage' 
                              ? `${order.discount_value}% Off` 
                              : `${formatPrice(order.discount_value || 0)} Off`}
                          </span>
                        </div>
                        <div className="text-sm text-green-700">
                          <p>Discount Amount: {formatPrice(order.discount_amount)}</p>
                          {order.discount_code && (
                            <p>Code: <span className="font-mono font-medium">{order.discount_code}</span></p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            {item.preview_image_url ? (
                              <img 
                                src={item.preview_image_url} 
                                alt="Custom jewelry"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium text-gray-900">
                              Custom {formatJewelryType(item.jewelry_type)} x{item.quantity}
                            </h5>
                            {item.customization_summary && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {item.customization_summary}
                              </p>
                            )}
                            {/* Show engraving as an Extra */}
                            {(item.customization_data?.engraving as string) && (
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs font-medium text-amber-800">EXTRA:</span>
                                  <span className="text-xs text-amber-700">Engraving Requested</span>
                                </div>
                                <p className="text-xs text-amber-800 font-mono mt-1">
                                  "{String(item.customization_data.engraving)}"
                                </p>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-sm text-gray-600">
                                Base: {formatPrice(item.base_price)} + Options: {formatPrice(item.total_price - item.base_price)}
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {formatPrice(item.subtotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">Status:</label>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          disabled={updatingStatus === order.id}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-zinc-500"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {updatingStatus === order.id && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-900"></div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/order-confirmation/${order.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(order.id, order.order_number || order.id.slice(0, 8).toUpperCase())}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Double Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {showSecondConfirm ? 'Final Confirmation' : 'Delete Order'}
              </h3>
            </div>

            {!showSecondConfirm ? (
              <>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete order <span className="font-semibold">#{deleteConfirmation.orderNumber}</span>?
                  <br /><br />
                  This will permanently remove the order and all its items from the database.
                </p>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleCancelDelete}
                    variant="outline"
                    className="flex-1"
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleFirstConfirm}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    disabled={deleting}
                  >
                    Continue
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-red-800 mb-2">
                      ⚠️ Warning: This action cannot be undone
                    </p>
                    <p className="text-sm text-red-700">
                      You are about to permanently delete order <span className="font-semibold">#{deleteConfirmation.orderNumber}</span> and all associated data.
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Click <span className="font-semibold">"Delete Permanently"</span> to confirm deletion.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleCancelDelete}
                    variant="outline"
                    className="flex-1"
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSecondConfirm}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      'Delete Permanently'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
