import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  isCartOpen: boolean;
  toggleCart: () => void;
  cartCount: number;
  fetchUserCart: () => Promise<void>;
  clearCart: () => void;
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
  const [isCartOpen, setIsCartOpen] = useState(false);

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
        const serverCart = response.data.data.map((item: any) => ({
          id: item.productId._id,
          name: item.productId.name,
          price: item.productId.price,
          quantity: item.quantity,
          image: item.productId.images[0]?.url || '',
        }));
        setCartItems(serverCart);
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
  }, []);

  const toggleCart = () => setIsCartOpen(prev => !prev);

  const addToCart = async (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    try {
      await Axios.post(SummaryApi.addToCart.url, {
        productId: item.id,
        quantity: item.quantity || 1,
      });
      toast({ title: "Added to cart", description: `${item.name} has been added or updated.` });
      await fetchUserCart();
      if (!isCartOpen) {
        toggleCart();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add item to cart." });
    }
  };

  const removeFromCart = async (id: string) => {
    try {
      await Axios.delete(`${SummaryApi.deleteFromCart.url}/${id}`);
      toast({ title: "Item Removed", description: "The item has been removed from your cart." });
      await fetchUserCart();
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove item from cart." });
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    try {
      await Axios.put(`${SummaryApi.updateCart.url}/${id}`, { quantity });
      await fetchUserCart();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update item quantity." });
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        isCartOpen,
        toggleCart,
        cartCount,
        fetchUserCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};