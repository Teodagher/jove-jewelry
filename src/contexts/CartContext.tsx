'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // Check if we're on an admin page to avoid unnecessary loading
  const [isAdminPage, setIsAdminPage] = useState(false);
  
  useEffect(() => {
    setIsAdminPage(window.location.pathname.startsWith('/admin'));
  }, []);

  const loadCart = useCallback(async (user?: { id: string } | null) => {
    try {
      const supabase = createClient();
      let cartItems;
      
      if (user) {
        // Load user-specific cart
        const { data, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        cartItems = data;
      } else {
        // Load session-based cart for guests
        const sessionId = getSessionId();
        const { data, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('session_id', sessionId)
          .is('user_id', null);
        
        if (error) throw error;
        cartItems = data;
      }

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
      console.error('Error loading cart:', {
        message: (error as Error)?.message || 'Unknown error',
        details: error,
        timestamp: new Date().toISOString()
      });
      // Don't throw the error, just log it and continue with empty cart
      setItems([]);
    }
  }, []);

  // Migrate guest cart to user cart when user logs in
  const migrateGuestCartToUser = useCallback(async (userId: string) => {
    try {
      const sessionId = getSessionId();
      const supabase = createClient();
      
      // Get current guest cart items
      const { data: guestItems, error: guestError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('session_id', sessionId)
        .is('user_id', null);
      
      if (guestError) throw guestError;
      
      if (guestItems && guestItems.length > 0) {
        // Update guest cart items to be associated with the user
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ user_id: userId })
          .eq('session_id', sessionId)
          .is('user_id', null);
        
        if (updateError) throw updateError;
        
        console.log(`✅ Migrated ${guestItems.length} items from guest cart to user cart`);
      }
      
      // Load the user's cart (now including migrated items)
      await loadCart({ id: userId });
    } catch (error) {
      console.error('Error migrating guest cart to user:', error);
      // Still load user cart even if migration fails
      await loadCart({ id: userId });
    }
  }, [loadCart]);

  // Listen for auth changes and load appropriate cart
  useEffect(() => {
    // Skip cart loading on admin pages
    if (isAdminPage) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const supabase = createClient();
    
    const initialize = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        const user = session?.user || null;
        setCurrentUser(user);
        await loadCart(user);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing cart:', error);
        setItems([]);
        setLoading(false);
      }
    };

    // Initialize cart
    initialize();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      const newUser = session?.user || null;
      setCurrentUser(newUser);
      
      try {
        // Handle user login/logout cart migration
        if (event === 'SIGNED_IN' && newUser) {
          // User just logged in - migrate guest cart to user cart
          await migrateGuestCartToUser(newUser.id);
        } else if (event === 'SIGNED_OUT') {
          // User logged out - load guest cart
          await loadCart(null);
        } else {
          // Other auth state changes - just reload cart
          await loadCart(newUser);
        }
      } catch (error) {
        console.error('Error handling auth change:', error);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isAdminPage, loadCart, migrateGuestCartToUser]);

  const addCustomJewelryToCart = async (jewelryData: CustomJewelryData, quantity = 1) => {
    try {
      const supabase = createClient();
      
      // Prepare cart item data
      const cartItemData: Record<string, unknown> = {
        jewelry_type: jewelryData.jewelry_type,
        customization_data: jewelryData.customization_data,
        base_price: jewelryData.base_price,
        total_price: jewelryData.total_price,
        preview_image_url: jewelryData.preview_image_url,
        quantity,
      };
      
      // Add user_id if user is logged in, otherwise use session_id
      if (currentUser) {
        cartItemData.user_id = currentUser.id;
      } else {
        cartItemData.session_id = getSessionId();
      }

      // Add new custom jewelry item to cart
      const { data, error } = await supabase
        .from('cart_items')
        .insert(cartItemData)
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
      const supabase = createClient();

      if (currentUser) {
        // Clear user-specific cart
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', currentUser.id);
        
        if (error) throw error;
      } else {
        // Clear session-based cart
        const sessionId = getSessionId();
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('session_id', sessionId)
          .is('user_id', null);
        
        if (error) throw error;
      }

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
