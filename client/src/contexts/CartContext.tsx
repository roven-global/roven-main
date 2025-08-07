import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';

interface CartItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    price: number;
    images: Array<{ public_id: string; url: string }>;
    description: string;
    variants?: Array<{
      sku: string;
      volume: string;
      price: number;
      stock: number;
    }>;
  };
  quantity: number;
  variant?: {
    sku: string;
    volume: string;
    price: number;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: { productId: string; name: string; quantity?: number; variant?: { volume: string; sku: string } }) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  cartCount: number;
  fetchUserCart: () => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Always clear cart on logout event
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Listen for logout event to clear cart
  useEffect(() => {
    window.addEventListener('logoutStateChange', clearCart);
    return () => window.removeEventListener('logoutStateChange', clearCart);
  }, [clearCart]);

  // Fetch user cart from backend
  const fetchUserCart = async () => {
    try {
      const response = await Axios.get(SummaryApi.getCart.url);
      if (response.data.success) {
        setCartItems(response.data.data || []);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Failed to fetch user cart:", error);
      setCartItems([]);
    }
  };

  // Listen for login event to fetch user cart
  useEffect(() => {
    const handleLogin = async () => {
      await fetchUserCart();
    };
    window.addEventListener('loginStateChange', handleLogin);
    return () => window.removeEventListener('loginStateChange', handleLogin);
  }, [fetchUserCart]);

  const addToCart = async (item: { productId: string; name: string; quantity?: number; variant?: { volume: string; sku: string } }) => {
    try {
      await Axios.post(SummaryApi.addToCart.url, {
        productId: item.productId,
        quantity: item.quantity || 1,
        variant: item.variant,
      });
      toast({ title: "Added to cart", description: `${item.name} has been added or updated.` });
      await fetchUserCart();
      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (error) {
      toast({ title: "Error", description: "Failed to add item to cart." });
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      await Axios.delete(SummaryApi.deleteFromCart.url.replace(':cartItemId', cartItemId));
      toast({ title: "Item Removed", description: "The item has been removed from your cart." });
      await fetchUserCart();
      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove item from cart." });
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      await Axios.put(SummaryApi.updateCart.url.replace(':cartItemId', cartItemId), { quantity });
      await fetchUserCart();
      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (error) {
      toast({ title: "Error", description: "Failed to update item quantity." });
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Refresh cart function that can be called to ensure cart is up to date
  const refreshCart = async () => {
    await fetchUserCart();
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartCount,
        fetchUserCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};