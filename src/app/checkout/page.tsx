'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MapPin, CreditCard, Truck, Clock } from 'lucide-react';
import PaymentMethodCard from '@/components/ui/payment-method-card';
import { useToast } from '@/contexts/ToastContext';
import GoogleMapsModal from '@/components/GoogleMapsModal';
import HandcraftedBanner from '@/components/HandcraftedBanner';

interface OrderFormData {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  building: string;
  floor: string;
  notes: string;
  latitude?: number;
  longitude?: number;
}

export default function CheckoutPage() {
  const { items, itemCount, subtotal, clearCart, loading: cartLoading } = useCart();
  const { error: showError, success: showSuccess, luxury: showLuxury } = useToast();
  const [formData, setFormData] = useState<OrderFormData>({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+961',
    phone: '',
    address: '',
    city: '',
    area: '',
    building: '',
    floor: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const router = useRouter();

  // Redirect if cart is empty (but not if we just completed an order)
  useEffect(() => {
    if (!cartLoading && items.length === 0 && !orderCompleted) {
      router.push('/customize');
    }
  }, [items.length, cartLoading, orderCompleted, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number; address: string }) => {
    setFormData(prev => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address
    }));
    setShowMapModal(false);
    showLuxury(
      'Delivery Location Confirmed',
      'Your precious jewelry will be delivered to the selected address with care.'
    );
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

  // Country codes for phone number
  const countryCodes = [
    { code: '+961', country: 'Lebanon' },
    { code: '+1', country: 'US/Canada' },
    { code: '+33', country: 'France' },
    { code: '+44', country: 'UK' },
    { code: '+49', country: 'Germany' },
    { code: '+39', country: 'Italy' },
    { code: '+34', country: 'Spain' },
    { code: '+971', country: 'UAE' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+20', country: 'Egypt' },
    { code: '+90', country: 'Turkey' },
    { code: '+91', country: 'India' },
    { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' },
    { code: '+82', country: 'South Korea' },
    { code: '+41', country: 'Switzerland' },
    { code: '+43', country: 'Austria' },
    { code: '+31', country: 'Netherlands' },
    { code: '+32', country: 'Belgium' },
    { code: '+46', country: 'Sweden' },
    { code: '+47', country: 'Norway' },
    { code: '+45', country: 'Denmark' },
    { code: '+358', country: 'Finland' },
    { code: '+351', country: 'Portugal' },
    { code: '+30', country: 'Greece' },
    { code: '+420', country: 'Czech Republic' },
    { code: '+48', country: 'Poland' },
    { code: '+36', country: 'Hungary' },
    { code: '+385', country: 'Croatia' },
    { code: '+381', country: 'Serbia' },
    { code: '+55', country: 'Brazil' },
    { code: '+54', country: 'Argentina' },
    { code: '+52', country: 'Mexico' },
    { code: '+61', country: 'Australia' },
    { code: '+64', country: 'New Zealand' },
    { code: '+27', country: 'South Africa' },
    { code: '+7', country: 'Russia' },
    { code: '+380', country: 'Ukraine' },
    { code: '+98', country: 'Iran' },
    { code: '+972', country: 'Israel' },
    { code: '+962', country: 'Jordan' },
    { code: '+963', country: 'Syria' },
    { code: '+964', country: 'Iraq' },
    { code: '+965', country: 'Kuwait' },
    { code: '+973', country: 'Bahrain' },
    { code: '+974', country: 'Qatar' },
    { code: '+968', country: 'Oman' },
    { code: '+967', country: 'Yemen' },
  ];

  const generateCustomizationText = (customizationData: Record<string, unknown>) => {
    const parts: string[] = [];
    Object.entries(customizationData).forEach(([key, value]) => {
      if (value) {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const formattedValue = typeof value === 'string' 
          ? value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          : value;
        parts.push(`${formattedKey}: ${formattedValue}`);
      }
    });
    return parts.join(' • ');
  };

  const validateForm = () => {
    const requiredFields = [
      { field: 'firstName', label: 'First name', minLength: 1 },
      { field: 'lastName', label: 'Last name', minLength: 1 },
      { field: 'email', label: 'Email address', minLength: 5 },
      { field: 'phone', label: 'Phone number', minLength: 6 },
      { field: 'city', label: 'City', minLength: 2 },
      { field: 'area', label: 'Area', minLength: 2 },
      { field: 'address', label: 'Street address', minLength: 5 },
    ];

    // Check required fields
    for (const { field, label, minLength } of requiredFields) {
      const value = formData[field as keyof OrderFormData];
      if (!value || (typeof value === 'string' && !value.trim())) {
        showError(
          'Please Complete Your Information',
          `Your ${label.toLowerCase()} is required to craft your bespoke jewelry order.`
        );
        // Focus the missing field if possible
        const element = document.getElementById(field);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      }
      
      // Check minimum length
      if (typeof value === 'string' && value.trim().length < minLength) {
        showError(
          'Please Provide Complete Details',
          `Your ${label.toLowerCase()} needs at least ${minLength} character${minLength > 1 ? 's' : ''} for your jewelry order.`
        );
        const element = document.getElementById(field);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      }
    }

    // Email validation with better error message
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      showError(
        'Please Verify Your Email',
        'We need a valid email address to send you updates about your custom jewelry creation.'
      );
      const emailElement = document.getElementById('email');
      if (emailElement) {
        emailElement.focus();
        emailElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    // Phone validation with better feedback
    const phoneNumber = formData.phone.replace(/\D/g, ''); // Remove non-digits
    if (phoneNumber.length < 6) {
      showError(
        'Please Verify Your Phone Number',
        'We need a valid phone number to coordinate the delivery of your precious jewelry.'
      );
      const phoneElement = document.getElementById('phone');
      if (phoneElement) {
        phoneElement.focus();
        phoneElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    // Check if cart has items
    if (!items || items.length === 0) {
      showError(
        'Empty Cart',
        'Your cart is empty. Please add some jewelry items before placing an order.'
      );
      return false;
    }

    // Check if cart total is valid
    if (!subtotal || subtotal <= 0) {
      showError(
        'Invalid Order Total',
        'Your order total appears to be invalid. Please refresh the page and try again.'
      );
      return false;
    }

    return true;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    console.log('✅ Form validation passed, proceeding with order creation...');
    setSubmitting(true);

    try {
      const supabase = createClient();

      console.log('🛒 Starting order creation...', {
        itemCount: items.length,
        subtotal,
        formData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          area: formData.area,
          address: formData.address
        }
      });

      // Validate and sanitize data before creating order
      const sanitizedFormData = {
        firstName: formData.firstName?.trim() || '',
        lastName: formData.lastName?.trim() || '',
        email: formData.email?.trim().toLowerCase() || '',
        phone: formData.phone?.trim() || '',
        countryCode: formData.countryCode?.trim() || '+961',
        address: formData.address?.trim() || '',
        city: formData.city?.trim() || '',
        area: formData.area?.trim() || '',
        building: formData.building?.trim() || '',
        floor: formData.floor?.trim() || '',
        notes: formData.notes?.trim() || '',
        latitude: formData.latitude || null,
        longitude: formData.longitude || null
      };

      // Validate required fields
      const requiredFields = {
        firstName: sanitizedFormData.firstName,
        lastName: sanitizedFormData.lastName,
        email: sanitizedFormData.email,
        phone: sanitizedFormData.phone,
        address: sanitizedFormData.address,
        city: sanitizedFormData.city,
        area: sanitizedFormData.area
      };

      for (const [field, value] of Object.entries(requiredFields)) {
        if (!value || value.length === 0) {
          throw new Error(`Required field '${field}' is missing or empty`);
        }
      }

      // Validate subtotal
      if (!subtotal || subtotal <= 0) {
        throw new Error('Invalid order total amount');
      }

      // Create the order with both old and new structure for compatibility
      const orderData = {
        // New JSON structure for enhanced features
        customer_info: {
          first_name: sanitizedFormData.firstName,
          last_name: sanitizedFormData.lastName,
          email: sanitizedFormData.email,
          phone: `${sanitizedFormData.countryCode} ${sanitizedFormData.phone}`
        },
        delivery_address_json: {
          address: sanitizedFormData.address,
          city: sanitizedFormData.city,
          area: sanitizedFormData.area,
          building: sanitizedFormData.building,
          floor: sanitizedFormData.floor,
          notes: sanitizedFormData.notes,
          latitude: sanitizedFormData.latitude,
          longitude: sanitizedFormData.longitude
        },
        items: items.map(item => ({
          jewelry_type: item.jewelry_type || 'necklace',
          customization_data: item.customization_data || {},
          customization_summary: generateCustomizationText(item.customization_data || {}),
          base_price: Number(item.base_price) || 0,
          total_price: Number(item.total_price) || 0,
          quantity: Number(item.quantity) || 1,
          subtotal: Number(item.subtotal) || 0,
          preview_image_url: item.preview_image_url || null
        })),
        total_amount: Number(subtotal),
        
        // Existing table structure for backward compatibility - all required fields
        customer_name: `${sanitizedFormData.firstName} ${sanitizedFormData.lastName}`,
        customer_email: sanitizedFormData.email,
        customer_phone: `${sanitizedFormData.countryCode} ${sanitizedFormData.phone}`,
        delivery_address: sanitizedFormData.address,
        delivery_city: sanitizedFormData.city,
        delivery_postal_code: null, // Explicitly set nullable field
        delivery_notes: sanitizedFormData.notes || null,
        delivery_latitude: sanitizedFormData.latitude, // 📍 New dedicated coordinate column
        delivery_longitude: sanitizedFormData.longitude, // 📍 New dedicated coordinate column
        subtotal: Number(subtotal),
        total: Number(subtotal),
        payment_method: 'cash_on_delivery',
        status: 'pending',
        notes: sanitizedFormData.notes || null,
        order_notes: sanitizedFormData.notes || null
      };

      console.log('📋 Order data prepared:', {
        keys: Object.keys(orderData),
        hasCustomerInfo: !!orderData.customer_info,
        hasDeliveryAddress: !!orderData.delivery_address_json,
        itemsCount: orderData.items?.length || 0,
        customerName: orderData.customer_name,
        customerEmail: orderData.customer_email,
        subtotal: orderData.subtotal,
        total: orderData.total
      });

      console.log('📤 Attempting to insert order data...');
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select('id, order_number')
        .single();

      if (orderError) {
        console.error('❌ Order creation failed:', orderError);
        console.error('❌ Order error details:', {
          message: orderError.message,
          code: orderError.code,
          details: orderError.details,
          hint: orderError.hint
        });
        throw orderError;
      }

      console.log('✅ Order created successfully:', order);

      // Create individual order items
      const orderItemsData = items.map(item => {
        // Ensure all required fields are present and valid
        const itemData = {
          order_id: order.id,
          jewelry_type: item.jewelry_type || 'necklace', // Default fallback
          customization_data: item.customization_data || {},
          customization_summary: generateCustomizationText(item.customization_data || {}),
          base_price: Number(item.base_price) || 0,
          total_price: Number(item.total_price) || 0,
          quantity: Number(item.quantity) || 1,
          subtotal: Number(item.subtotal) || 0,
          preview_image_url: item.preview_image_url || null
        };
        
        console.log('🔍 Processing item:', {
          id: item.id,
          jewelry_type: itemData.jewelry_type,
          base_price: itemData.base_price,
          total_price: itemData.total_price,
          quantity: itemData.quantity,
          subtotal: itemData.subtotal
        });
        
        return itemData;
      });

      console.log('📦 Creating order items:', {
        count: orderItemsData.length,
        orderId: order.id,
        firstItem: orderItemsData[0] || null
      });

      console.log('📦 Attempting to insert order items...');
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) {
        console.error('❌ Order items creation failed:', itemsError);
        console.error('❌ Order items error details:', {
          message: itemsError.message,
          code: itemsError.code,
          details: itemsError.details,
          hint: itemsError.hint
        });
        throw itemsError;
      }

      console.log('✅ Order items created successfully');

      // Show luxury success message with Jové branding
      const orderNumber = order.order_number || order.id.slice(0, 8).toUpperCase();
      showLuxury(
        'Your Bespoke Order Has Been Crafted',
        `Order #${orderNumber} is now being handcrafted with the finest materials. You'll receive updates on your personalized jewelry journey.`
      );

      // Mark order as completed to prevent redirect back to customize
      setOrderCompleted(true);

      // Clear the cart after successful order (with error handling)
      try {
        console.log('🧹 Clearing cart...');
        await clearCart();
        console.log('✅ Cart cleared successfully');
      } catch (cartError) {
        console.error('⚠️ Cart clearing failed, but order was successful:', cartError);
        console.error('⚠️ Cart error details:', {
          message: cartError?.message,
          type: typeof cartError,
          constructor: cartError?.constructor?.name
        });
        // Don't let cart clearing failure prevent redirect
      }

      // Redirect to order confirmation
      console.log('🚀 Redirecting to order confirmation:', `/order-confirmation/${order.id}`);
      
      // Try Next.js router first
      try {
        router.push(`/order-confirmation/${order.id}`);
        console.log('✅ Router.push executed successfully');
      } catch (routerError) {
        console.error('❌ Router.push failed, using window.location:', routerError);
        // Fallback to window.location if router fails
        window.location.href = `/order-confirmation/${order.id}`;
      }
      
      // Note: Don't set setSubmitting(false) here as we're navigating away
    } catch (error: unknown) {
      console.error('Error creating order:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error keys:', error ? Object.keys(error) : 'no keys');
      
      // More robust error extraction
      let errorMessage = '';
      let errorCode = '';
      
      if (error && typeof error === 'object') {
        // Handle Supabase errors
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
        if ('code' in error && typeof error.code === 'string') {
          errorCode = error.code;
        }
        // Handle PostgreSQL errors
        if ('details' in error && typeof error.details === 'string') {
          errorMessage = errorMessage || error.details;
        }
        // Handle network errors
        if ('status' in error) {
          errorCode = errorCode || String(error.status);
        }
      }
      
      // Fallback for completely unknown errors
      if (!errorMessage && !errorCode) {
        errorMessage = error ? String(error) : 'Unknown error occurred';
        console.error('Fallback error message:', errorMessage);
      }
      
      // Network/Connection errors
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorCode === 'NETWORK_ERROR') {
        showError(
          'Connection Error',
          'Unable to connect to our servers. Please check your internet connection and try again.'
        );
      }
      // Authentication errors
      else if (errorCode === '401' || errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
        showError(
          'Authentication Error',
          'Your session has expired. Please refresh the page and try again.'
        );
      }
      // Validation/Data errors
      else if (errorCode === '23502' || errorMessage.includes('null value') || errorMessage.includes('required')) {
        showError(
          'Missing Information',
          'Please make sure all required fields are filled out correctly and try again.'
        );
      }
      // Database constraint errors
      else if (errorCode === '23505' || errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        showError(
          'Duplicate Order',
          'An order with this information already exists. Please contact support if this is an error.'
        );
      }
      // Permission errors
      else if (errorCode === '42501' || errorMessage.includes('permission') || errorMessage.includes('policy')) {
        showError(
          'Permission Error',
          'Unable to process your order due to security restrictions. Please contact support.'
        );
      }
      // Cart or item errors
      else if (errorMessage.includes('cart') || errorMessage.includes('item')) {
        showError(
          'Cart Error',
          'There was an issue with your cart items. Please refresh the page and try again.'
        );
      }
      // Payment errors
      else if (errorMessage.includes('payment') || errorMessage.includes('billing')) {
        showError(
          'Payment Error',
          'There was an issue processing your payment information. Please verify your details and try again.'
        );
      }
      // Server errors
      else if (errorCode === '500' || errorMessage.includes('internal') || errorMessage.includes('server')) {
        showError(
          'Server Error',
          'Our servers are experiencing issues. Please try again in a few minutes or contact support.'
        );
      }
      // Generic fallback with more helpful info
      else {
        // Try to provide more specific error details in development
        const isDevelopment = process.env.NODE_ENV === 'development';
        const detailedMessage = isDevelopment 
          ? `Error: ${errorMessage}${errorCode ? ` (Code: ${errorCode})` : ''}`
          : 'There was an unexpected error placing your order. Please try again or contact support.';
        
        showError(
          'Order Failed',
          detailedMessage
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen jove-bg-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-light text-zinc-900 mb-2">
            Checkout
          </h1>
          <p className="text-gray-600">
            Complete your order for {itemCount} custom jewelry item{itemCount > 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Order Form */}
          <div className="space-y-4 lg:space-y-6">
            {/* Payment Method */}
            <div className="jove-bg-card rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-5">
                <CreditCard className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
              </div>
              <PaymentMethodCard
                title="Cash on Delivery"
                subtitle="Pay when your jewelry is delivered"
                selected
              />
            </div>

            {/* Customer Information */}
            <div className="jove-bg-card rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
              
              <form onSubmit={handleSubmitOrder} className="space-y-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleInputChange}
                      className="w-full sm:w-auto sm:min-w-[140px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors bg-white"
                    >
                      {countryCodes.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.code} {country.country}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
                      placeholder="XX XXX XXX"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Delivery Address */}
            <div className="jove-bg-card rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Truck className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Delivery Address</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
                      placeholder="Beirut"
                    />
                  </div>
                  <div>
                    <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                      Area *
                    </label>
                    <input
                      type="text"
                      id="area"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
                      placeholder="Hamra"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
                    placeholder="Street name and number"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="building" className="block text-sm font-medium text-gray-700 mb-1">
                      Building
                    </label>
                    <input
                      type="text"
                      id="building"
                      name="building"
                      value={formData.building}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
                      placeholder="Building name/number"
                    />
                  </div>
                  <div>
                    <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-1">
                      Floor/Apartment
                    </label>
                    <input
                      type="text"
                      id="floor"
                      name="floor"
                      value={formData.floor}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
                      placeholder="Floor 3, Apt 2B"
                    />
                  </div>
                </div>

                {/* Google Maps Integration */}
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Pin your exact location (Optional)</p>
                  {formData.latitude && formData.longitude && (
                    <p className="text-xs text-green-600 mb-3">
                      ✓ Location saved: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="text-sm"
                    onClick={() => setShowMapModal(true)}
                  >
                    {formData.latitude ? 'Update' : 'Add'} Location on Map
                  </Button>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
                    placeholder="Any special delivery instructions..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="jove-bg-card rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3 pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.preview_image_url ? (
                        <img 
                          src={item.preview_image_url} 
                          alt="Custom jewelry"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">
                        Custom {formatJewelryType(item.jewelry_type)} x{item.quantity}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {generateCustomizationText(item.customization_data)}
                      </p>
                      <p className="text-sm font-medium text-zinc-900 mt-2">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="space-y-3 pb-4 mb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({itemCount} item{itemCount > 1 ? 's' : ''})</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Delivery</span>
                  <span>Free</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-medium mb-6">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {/* Handcrafted Banner */}
              <div className="mb-6">
                <HandcraftedBanner />
              </div>

              {/* Place Order Button */}
              <Button
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="w-full bg-black hover:bg-zinc-800 text-white py-4 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Placing Order...
                  </div>
                ) : (
                  `Place Order — ${formatPrice(subtotal)}`
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-3">
                By placing this order, you agree to our terms of service
              </p>
            </div>
          </div>
        </div>

        {/* Google Maps Modal */}
        <GoogleMapsModal
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
          onLocationSelect={handleLocationSelect}
          initialAddress={`${formData.address}, ${formData.area}, ${formData.city}`.replace(/^,\s*|,\s*$/g, '')}
        />
      </div>
    </div>
  );
}
