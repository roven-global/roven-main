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

interface AppliedCoupon {
  coupon: {
    _id: string;
    code: string;
    name: string;
    description?: string;
    type: 'percentage' | 'fixed';
    value: number;
    maxDiscount?: number;
  };
  discountAmount: number;
  finalAmount: number;
}

interface AppliedWelcomeGift {
  reward: {
    _id: string;
    rewardTitle: string;
    rewardText: string;
    giftId: string;
  };
  discountAmount: number;
  type: 'discount' | 'shipping' | 'sample';
}

interface CartContextType {
  cartItems: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  appliedWelcomeGift: AppliedWelcomeGift | null;
  addToCart: (item: { productId: string; name: string; quantity?: number; variant?: { volume: string; sku: string } }) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  cartCount: number;
  fetchUserCart: () => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  applyCoupon: (couponCode: string, orderAmount: number, cartItems: any[]) => Promise<boolean>;
  removeCoupon: () => void;
  clearCoupon: () => void;
  applyWelcomeGift: (reward: any, discountAmount: number) => void;
  removeWelcomeGift: () => void;
  clearWelcomeGift: () => void;
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
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [appliedWelcomeGift, setAppliedWelcomeGift] = useState<AppliedWelcomeGift | null>(null);

  // Load applied coupon from localStorage on mount
  useEffect(() => {
    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) {
      try {
        setAppliedCoupon(JSON.parse(savedCoupon));
      } catch (error) {
        console.error('Error parsing saved coupon:', error);
        localStorage.removeItem('appliedCoupon');
      }
    }
  }, []);

  // Save applied coupon to localStorage whenever it changes
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  }, [appliedCoupon]);

  // Always clear cart on logout event
  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
    setAppliedWelcomeGift(null);
  }, []);

  // Listen for logout event to clear cart
  useEffect(() => {
    window.addEventListener('logoutStateChange', clearCart);
    return () => window.removeEventListener('logoutStateChange', clearCart);
  }, [clearCart]);

  // Fetch user cart from backend
  const fetchUserCart = useCallback(async () => {
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
  }, []);

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
      toast({ title: "Error", description: "Failed to update quantity." });
    }
  };

  const refreshCart = async () => {
    await fetchUserCart();
  };

  const applyCoupon = async (couponCode: string, orderAmount: number, cartItems: any[]): Promise<boolean> => {
    try {
      const response = await Axios.post(SummaryApi.validateCoupon.url, {
        code: couponCode.toUpperCase(),
        orderAmount,
        cartItems
      });

      if (response.data.success) {
        setAppliedCoupon(response.data.data);
        toast({
          title: "Coupon applied successfully!",
          description: `You saved ${response.data.data.discountAmount}₹`,
        });
        return true;
      }
      return false;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Invalid coupon code";
      toast({
        title: "Coupon error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast({
      title: "Coupon removed",
    });
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
  };

  const applyWelcomeGift = (reward: any, discountAmount: number) => {
    const rewardText = reward.rewardText.toLowerCase();
    let type: 'discount' | 'shipping' | 'sample' = 'discount';

    if (rewardText.includes('free shipping') || rewardText.includes('shipping')) {
      type = 'shipping';
    } else if (rewardText.includes('free sample') || rewardText.includes('sample')) {
      type = 'sample';
    }

    setAppliedWelcomeGift({
      reward: {
        _id: reward._id,
        rewardTitle: reward.rewardTitle,
        rewardText: reward.rewardText,
        giftId: reward.giftId
      },
      discountAmount,
      type
    });
  };

  const removeWelcomeGift = () => {
    setAppliedWelcomeGift(null);
  };

  const clearWelcomeGift = () => {
    setAppliedWelcomeGift(null);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      appliedCoupon,
      appliedWelcomeGift,
      addToCart,
      removeFromCart,
      updateQuantity,
      cartCount,
      fetchUserCart,
      clearCart,
      refreshCart,
      applyCoupon,
      removeCoupon,
      clearCoupon,
      applyWelcomeGift,
      removeWelcomeGift,
      clearWelcomeGift,
    }}>
      {children}
    </CartContext.Provider>
  );
};