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
  const { error: showError, success: showSuccess } = useToast();
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
  const router = useRouter();

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && items.length === 0) {
      router.push('/customize');
    }
  }, [items.length, cartLoading, router]);

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
    showSuccess(
      'Location Selected',
      'Your delivery location has been updated successfully.'
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
    { code: '+33', country: 'France' },
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
      { field: 'firstName', label: 'First name' },
      { field: 'lastName', label: 'Last name' },
      { field: 'email', label: 'Email address' },
      { field: 'phone', label: 'Phone number' },
      { field: 'city', label: 'City' },
      { field: 'area', label: 'Area' },
      { field: 'address', label: 'Street address' },
    ];

    for (const { field, label } of requiredFields) {
      const value = formData[field as keyof OrderFormData];
      if (!value || (typeof value === 'string' && !value.trim())) {
        showError(
          'Missing Information',
          `Please enter your ${label.toLowerCase()} to continue with your order.`
        );
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showError(
        'Invalid Email',
        'Please enter a valid email address.'
      );
      return false;
    }

    // Phone validation (basic)
    if (formData.phone.length < 6) {
      showError(
        'Invalid Phone Number',
        'Please enter a valid phone number.'
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

    setSubmitting(true);

    try {
      const supabase = createClient();

      // Create the order
      const orderData = {
        customer_info: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: `${formData.countryCode} ${formData.phone}`
        },
        delivery_address: {
          address: formData.address,
          city: formData.city,
          area: formData.area,
          building: formData.building,
          floor: formData.floor,
          notes: formData.notes,
          latitude: formData.latitude,
          longitude: formData.longitude
        },
        items: items.map(item => ({
          jewelry_type: item.jewelry_type,
          customization_data: item.customization_data,
          customization_summary: generateCustomizationText(item.customization_data),
          base_price: item.base_price,
          total_price: item.total_price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          preview_image_url: item.preview_image_url
        })),
        total_amount: subtotal,
        payment_method: 'cash_on_delivery',
        status: 'pending',
        order_notes: formData.notes
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select('id')
        .single();

      if (orderError) throw orderError;

      // Show success message
      showSuccess(
        'Order Placed Successfully!',
        `Your order #${order.id.slice(0, 8).toUpperCase()} has been confirmed. You'll receive updates via email.`
      );

      // Clear the cart after successful order
      await clearCart();

      // Redirect to order confirmation
      router.push(`/order-confirmation/${order.id}`);
    } catch (error: unknown) {
      console.error('Error creating order:', error);
      
      if ((error as Error).message?.includes('network')) {
        showError(
          'Connection Error',
          'Please check your internet connection and try again.'
        );
      } else if ((error as Error).message?.includes('validation')) {
        showError(
          'Invalid Information',
          'Please check your information and try again.'
        );
      } else {
        showError(
          'Order Failed',
          'There was an error placing your order. Please try again or contact support.'
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
    <div className="min-h-screen bg-gray-50">
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
            <div className="bg-white rounded-lg shadow-sm p-6">
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
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
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
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
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
            <div className="bg-white rounded-lg shadow-sm p-6">
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

              {/* Delivery Info */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-zinc-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-800">Handcrafted to Order</p>
                    <p className="text-xs text-zinc-600">Your jewelry will be ready in 2-3 weeks</p>
                  </div>
                </div>
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
