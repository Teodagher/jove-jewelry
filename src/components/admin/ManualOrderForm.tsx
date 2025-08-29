'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Plus, 
  Minus, 
  X, 
  Calculator,
  ShoppingCart,
  User,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Percent,
  Tag,
  Settings
} from 'lucide-react';
import type { Order, OrderItem } from '@/types/ecommerce';
import { CustomizationService } from '@/services/customizationService';
import type { JewelryItem, CustomizationState, DiamondType } from '@/types/customization';

interface ManualOrderItem {
  jewelry_type: 'necklaces' | 'rings' | 'bracelets' | 'earrings';
  customization_data: CustomizationState;
  customization_summary: string;
  base_price: number;
  total_price: number;
  quantity: number;
  preview_image_url?: string;
  diamond_type: DiamondType;
}

interface ManualOrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ManualOrderForm({ onSuccess, onCancel }: ManualOrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jewelryConfigs, setJewelryConfigs] = useState<Record<string, JewelryItem>>({});
  
  // Customer form data
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [notes, setNotes] = useState('');
  
  // Order items
  const [orderItems, setOrderItems] = useState<ManualOrderItem[]>([]);
  
  // Discount
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  
  // Pricing calculations
  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(50); // Default delivery fee
  const [total, setTotal] = useState(0);

  const supabase = createClient();

  const calculatePricing = useCallback(() => {
    const newSubtotal = orderItems.reduce((sum, item) => sum + (item.total_price * item.quantity), 0);
    setSubtotal(newSubtotal);

    let newDiscountAmount = 0;
    if (discountValue > 0) {
      if (discountType === 'percentage') {
        newDiscountAmount = (newSubtotal * discountValue) / 100;
      } else {
        newDiscountAmount = Math.min(discountValue, newSubtotal);
      }
    }
    setDiscountAmount(newDiscountAmount);

    const newTotal = newSubtotal - newDiscountAmount + deliveryFee;
    setTotal(Math.max(0, newTotal));
  }, [orderItems, discountType, discountValue, deliveryFee]);

  const fetchJewelryConfigs = async () => {
    try {
      const types = ['necklace', 'ring', 'bracelet', 'earring'];
      const configs: Record<string, JewelryItem> = {};
      
      for (const type of types) {
        const config = await CustomizationService.getJewelryItemConfig(type);
        if (config) {
          configs[type] = config;
        }
      }
      
      setJewelryConfigs(configs);
    } catch (err) {
      console.error('Error fetching jewelry configs:', err);
      setError('Failed to load jewelry configurations');
    }
  };

  useEffect(() => {
    fetchJewelryConfigs();
  }, []);

  useEffect(() => {
    calculatePricing();
  }, [calculatePricing]);

  const addOrderItem = () => {
    const newItem: ManualOrderItem = {
      jewelry_type: 'necklaces',
      customization_data: {},
      customization_summary: 'Custom item',
      base_price: jewelryConfigs.necklace?.basePrice || 100,
      total_price: jewelryConfigs.necklace?.basePrice || 100,
      quantity: 1,
      diamond_type: 'natural',
    };
    setOrderItems([...orderItems, newItem]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: keyof ManualOrderItem, value: string | number) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // If jewelry type changed, reset customization and update pricing
    if (field === 'jewelry_type' && typeof value === 'string') {
      const jewelryType = value === 'necklaces' ? 'necklace' : 
                          value === 'rings' ? 'ring' : 
                          value === 'bracelets' ? 'bracelet' : 'earring';
      const config = jewelryConfigs[jewelryType];
      
      if (config) {
        updatedItems[index].customization_data = {};
        updatedItems[index].base_price = config.basePrice;
        updatedItems[index].total_price = config.basePrice;
        updatedItems[index].customization_summary = `Custom ${value.slice(0, -1)}`;
      }
    }
    
    setOrderItems(updatedItems);
  };

  const updateItemCustomization = (index: number, settingId: string, optionId: string) => {
    const updatedItems = [...orderItems];
    const item = updatedItems[index];
    
    // Update customization data
    item.customization_data = {
      ...item.customization_data,
      [settingId]: optionId
    };
    
    // Recalculate pricing
    const jewelryType = item.jewelry_type === 'necklaces' ? 'necklace' : 
                       item.jewelry_type === 'rings' ? 'ring' : 
                       item.jewelry_type === 'bracelets' ? 'bracelet' : 'earring';
    const config = jewelryConfigs[jewelryType];
    
    if (config) {
      // Convert CustomizationState to the format expected by calculateTotalPrice
      const customizationRecord: { [key: string]: string } = {};
      Object.entries(item.customization_data).forEach(([key, value]) => {
        if (typeof value === 'string') {
          customizationRecord[key] = value;
        }
      });
      
      const totalPrice = CustomizationService.calculateTotalPrice(config, customizationRecord, item.diamond_type);
      item.total_price = totalPrice;
      
      // Generate customization summary
      const summary = generateCustomizationSummary(config, item.customization_data);
      item.customization_summary = summary;
    }
    
    setOrderItems(updatedItems);
  };

  const updateItemDiamondType = (index: number, diamondType: DiamondType) => {
    const updatedItems = [...orderItems];
    const item = updatedItems[index];
    item.diamond_type = diamondType;
    
    // Recalculate pricing
    const jewelryType = item.jewelry_type === 'necklaces' ? 'necklace' : 
                       item.jewelry_type === 'rings' ? 'ring' : 
                       item.jewelry_type === 'bracelets' ? 'bracelet' : 'earring';
    const config = jewelryConfigs[jewelryType];
    
    if (config) {
      // Convert CustomizationState to the format expected by calculateTotalPrice
      const customizationRecord: { [key: string]: string } = {};
      Object.entries(item.customization_data).forEach(([key, value]) => {
        if (typeof value === 'string') {
          customizationRecord[key] = value;
        }
      });
      
      const totalPrice = CustomizationService.calculateTotalPrice(config, customizationRecord, diamondType);
      item.total_price = totalPrice;
      item.base_price = diamondType === 'lab_grown' && config.basePriceLabGrown 
        ? config.basePriceLabGrown 
        : config.basePrice;
    }
    
    setOrderItems(updatedItems);
  };

  const generateCustomizationSummary = (config: JewelryItem, customizations: CustomizationState): string => {
    const parts: string[] = [];
    
    config.settings.forEach(setting => {
      const selectedValue = customizations[setting.id];
      if (selectedValue && typeof selectedValue === 'string') {
        const selectedOption = setting.options.find(option => option.id === selectedValue);
        if (selectedOption) {
          parts.push(`${setting.title}: ${selectedOption.name}`);
        }
      }
    });
    
    return parts.length > 0 ? parts.join(', ') : `Custom ${config.name}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone || !deliveryAddress || !deliveryCity) {
      setError('Please fill in all required customer fields');
      return;
    }

    if (orderItems.length === 0) {
      setError('Please add at least one order item');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create the order
      const orderData = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        delivery_city: deliveryCity,
        delivery_postal_code: deliveryPostalCode || null,
        delivery_notes: deliveryNotes || null,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: 'pending',
        payment_method: paymentMethod,
        notes: notes || null,
        discount_type: discountValue > 0 ? discountType : null,
        discount_value: discountValue > 0 ? discountValue : null,
        discount_amount: discountAmount > 0 ? discountAmount : null,
        discount_code: discountCode || null,
        customer_info: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        delivery_address_json: {
          address: deliveryAddress,
          city: deliveryCity,
          postal_code: deliveryPostalCode,
          notes: deliveryNotes,
        },
      };

      const { data: order, error: orderError } = await (supabase
        .from('orders') as any)
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsData = orderItems.map(item => ({
        order_id: order.id,
        jewelry_type: item.jewelry_type,
        customization_data: {
          ...item.customization_data,
          diamond_type: item.diamond_type,
        },
        customization_summary: item.customization_summary,
        base_price: item.base_price,
        total_price: item.total_price,
        quantity: item.quantity,
        subtotal: item.total_price * item.quantity,
        preview_image_url: item.preview_image_url,
      }));

      const { error: itemsError } = await (supabase
        .from('order_items') as any)
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      onSuccess();
    } catch (err) {
      console.error('Error creating manual order:', err);
      setError('Failed to create order. Please try again.');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-gray-900 font-serif">Create Manual Order</h2>
          <p className="text-sm text-gray-600 mt-1">Add a new order manually with custom items and discounts</p>
        </div>
        <Button
          variant="outline"
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-800"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Information */}
        <div className="jove-bg-card rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
              >
                <option value="cash_on_delivery">Cash on Delivery</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="jove-bg-card rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Delivery Information</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address *
              </label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={deliveryCity}
                onChange={(e) => setDeliveryCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                value={deliveryPostalCode}
                onChange={(e) => setDeliveryPostalCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Notes
              </label>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                placeholder="Special delivery instructions..."
              />
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="jove-bg-card rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
            </div>
            <Button
              type="button"
              onClick={addOrderItem}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {orderItems.map((item, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Item #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeOrderItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Basic Item Info */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jewelry Type
                      </label>
                      <select
                        value={item.jewelry_type}
                        onChange={(e) => updateOrderItem(index, 'jewelry_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                      >
                        <option value="necklaces">Necklace</option>
                        <option value="rings">Ring</option>
                        <option value="bracelets">Bracelet</option>
                        <option value="earrings">Earrings</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Diamond Type
                      </label>
                      <select
                        value={item.diamond_type}
                        onChange={(e) => updateItemDiamondType(index, e.target.value as DiamondType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                      >
                        <option value="natural">Natural Diamonds</option>
                        <option value="lab_grown">Lab Grown Diamonds</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Customization Options */}
                  {(() => {
                    const jewelryType = item.jewelry_type === 'necklaces' ? 'necklace' : 
                                       item.jewelry_type === 'rings' ? 'ring' : 
                                       item.jewelry_type === 'bracelets' ? 'bracelet' : 'earring';
                    const config = jewelryConfigs[jewelryType];
                    
                    if (!config || config.settings.length === 0) {
                      return (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">No customization options available for this jewelry type.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Settings className="h-4 w-4 text-gray-400" />
                          <h5 className="text-sm font-medium text-gray-900">Customization Options</h5>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          {config.settings.map(setting => (
                            <div key={setting.id}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {setting.title} {setting.required && '*'}
                              </label>
                              <select
                                value={item.customization_data[setting.id] || ''}
                                onChange={(e) => updateItemCustomization(index, setting.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                              >
                                <option value="">Select {setting.title}</option>
                                {setting.options.map(option => (
                                  <option key={option.id} value={option.id}>
                                    {option.name} {option.price && option.price > 0 && `(+$${option.price})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Pricing Display */}
                  <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Price
                      </label>
                      <div className="text-lg font-medium text-gray-900">
                        {formatPrice(item.base_price)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Price (incl. options)
                      </label>
                      <div className="text-lg font-medium text-gray-900">
                        {formatPrice(item.total_price)}
                      </div>
                    </div>
                  </div>

                  {/* Customization Summary */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customization Summary
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                      {item.customization_summary}
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    Subtotal: {formatPrice(item.total_price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}

            {orderItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No items added yet. Click "Add Item" to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Discount & Pricing */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Discount */}
          <div className="jove-bg-card rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Tag className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Discount</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed_amount')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed_amount">Fixed Amount ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                    min="0"
                    step={discountType === 'percentage' ? '1' : '0.01'}
                    max={discountType === 'percentage' ? '100' : undefined}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {discountType === 'percentage' ? (
                      <Percent className="h-4 w-4 text-gray-400" />
                    ) : (
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Code (Optional)
                </label>
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                  placeholder="Enter discount code..."
                />
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="jove-bg-card rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calculator className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Pricing Summary</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">
                    Discount ({discountType === 'percentage' ? `${discountValue}%` : formatPrice(discountValue)}):
                  </span>
                  <span className="text-green-600">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-medium text-lg">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="jove-bg-card rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
            placeholder="Any additional notes about this order..."
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || orderItems.length === 0}
            className="bg-black hover:bg-zinc-800"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <ShoppingCart className="h-4 w-4 mr-2" />
            )}
            Create Order
          </Button>
        </div>
      </form>
    </div>
  );
}
