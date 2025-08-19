'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CartItem } from '@/types/ecommerce';

interface CustomJewelryData {
  jewelry_type: 'necklaces' | 'rings' | 'bracelets' | 'earrings';
  customization_data: Record<string, unknown>;
  customization_summary: string;
  base_price: number;
  total_price: number;
  preview_image_url?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addCustomJewelryToCart: (jewelryData: CustomJewelryData, quantity?: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Generate a session ID for guest cart
const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cart from database on mount
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const sessionId = getSessionId();
      const supabase = createClient();
      
      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;

      const formattedItems: CartItem[] = (cartItems || []).map(item => ({
        id: item.id,
        session_id: item.session_id,
        jewelry_type: item.jewelry_type,
        customization_data: item.customization_data,
        base_price: item.base_price,
        total_price: item.total_price,
        preview_image_url: item.preview_image_url,
        quantity: item.quantity,
        subtotal: item.quantity * item.total_price,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setItems(formattedItems);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCustomJewelryToCart = async (jewelryData: CustomJewelryData, quantity = 1) => {
    try {
      const sessionId = getSessionId();
      const supabase = createClient();

      // Add new custom jewelry item to cart
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          session_id: sessionId,
          jewelry_type: jewelryData.jewelry_type,
          customization_data: jewelryData.customization_data,
          base_price: jewelryData.base_price,
          total_price: jewelryData.total_price,
          preview_image_url: jewelryData.preview_image_url,
          quantity
        })
        .select('*')
        .single();

      if (error) throw error;

      const newItem: CartItem = {
        id: data.id,
        session_id: data.session_id,
        jewelry_type: data.jewelry_type,
        customization_data: data.customization_data,
        base_price: data.base_price,
        total_price: data.total_price,
        preview_image_url: data.preview_image_url,
        quantity: data.quantity,
        subtotal: data.quantity * data.total_price,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setItems(prev => [...prev, newItem]);
    } catch (error) {
      console.error('Error adding custom jewelry to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== cartItemId));
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;

      setItems(prev => 
        prev.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity, subtotal: quantity * item.total_price }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const clearCart = async () => {
    try {
      const sessionId = getSessionId();
      const supabase = createClient();

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;

      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <CartContext.Provider value={{
      items,
      itemCount,
      subtotal,
      addCustomJewelryToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      loading
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
