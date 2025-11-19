'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { CartItem, CartItemInsert, CartItemUpdate } from '@/types/ecommerce';

interface CustomJewelryData {
  jewelry_type: 'necklaces' | 'rings' | 'bracelets' | 'earrings';
  product_name?: string;
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
  getSessionId: () => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Generate a persistent session ID
const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Skip cart on admin pages
  const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  // Load cart items for current session
  const loadCart = useCallback(async () => {
    if (isAdminPage) {
      setLoading(false);
      return;
    }

    try {
      const sessionId = getSessionId();
      
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const formattedItems: CartItem[] = (data || []).map((item: any) => ({
        id: item.id as string,
        session_id: item.session_id as string,
        jewelry_type: item.jewelry_type as 'necklaces' | 'rings' | 'bracelets' | 'earrings',
        product_name: item.product_name as string | undefined,
        customization_data: item.customization_data as Record<string, unknown>,
        base_price: item.base_price as number,
        total_price: item.total_price as number,
        preview_image_url: item.preview_image_url as string | undefined,
        quantity: item.quantity as number,
        subtotal: (item.quantity as number) * (item.total_price as number),
        created_at: item.created_at as string,
        updated_at: item.updated_at as string
      }));

      setItems(formattedItems);
    } catch (error) {
      console.error('Error loading cart:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAdminPage]);

  // Associate session cart with user when they log in
  const associateCartWithUser = useCallback(async () => {
    if (!user) return;

    try {
      const sessionId = getSessionId();
      
      // Update cart items to include user_id
      const updateData: CartItemUpdate = { user_id: user.id };
      const { error } = await (supabase
        .from('cart_items') as any)
        .update(updateData)
        .eq('session_id', sessionId)
        .is('user_id', null);
        
      if (error) throw error;
      
      console.log('✅ Cart associated with user');
    } catch (error) {
      console.error('Error associating cart with user:', error);
    }
  }, [user]);

  // Initialize cart
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Associate cart with user when they log in
  useEffect(() => {
    if (user) {
      associateCartWithUser();
    }
  }, [user, associateCartWithUser]);

  const addCustomJewelryToCart = async (jewelryData: CustomJewelryData, quantity = 1) => {
    try {
      const sessionId = getSessionId();
      
      const cartItemData: CartItemInsert = {
        session_id: sessionId,
        user_id: user?.id || null,
        jewelry_type: jewelryData.jewelry_type,
        product_name: jewelryData.product_name,
        customization_data: jewelryData.customization_data,
        base_price: jewelryData.base_price,
        total_price: jewelryData.total_price,
        preview_image_url: jewelryData.preview_image_url,
        quantity,
      };

      const { data, error } = await (supabase
        .from('cart_items') as any)
        .insert(cartItemData)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const dataItem = data as any;
      const newItem: CartItem = {
        id: dataItem.id as string,
        session_id: dataItem.session_id as string,
        jewelry_type: dataItem.jewelry_type as 'necklaces' | 'rings' | 'bracelets' | 'earrings',
        product_name: dataItem.product_name as string | undefined,
        customization_data: dataItem.customization_data as Record<string, unknown>,
        base_price: dataItem.base_price as number,
        total_price: dataItem.total_price as number,
        preview_image_url: dataItem.preview_image_url as string | undefined,
        quantity: dataItem.quantity as number,
        subtotal: (dataItem.quantity as number) * (dataItem.total_price as number),
        created_at: dataItem.created_at as string,
        updated_at: dataItem.updated_at as string
      };

      setItems(prev => [newItem, ...prev]);
    } catch (error) {
      console.error('Error adding custom jewelry to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {

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

      const updateData: CartItemUpdate = { quantity };
      const { error } = await (supabase
        .from('cart_items') as any)
        .update(updateData)
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
      loading,
      getSessionId
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