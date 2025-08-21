import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { toast } from "@/hooks/use-toast";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { useDebounce } from "@/hooks/use-debounce";
import { useUserReward } from "./UserRewardContext";

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

interface OrderQuote {
  items: any[];
  subtotal: number;
  shippingCost: number;
  discounts: { coupon: number; welcomeGift: number; total: number };
  appliedCoupon: {
    _id: string;
    code: string;
    name: string;
  } | null;
  finalTotal: number;
}

interface CartContextType {
  cartItems: CartItem[];
  orderQuote: OrderQuote | null;
  isQuoteLoading: boolean;
  cartCount: number;
  addToCart: (item: {
    productId: string;
    name: string;
    quantity?: number;
    variant?: { volume: string; sku: string };
  }) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  fetchUserCart: () => Promise<void>;
  clearCart: () => void;
  applyCoupon: (couponCode: string) => void;
  removeCoupon: () => void;
  hasClaimedReward: () => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderQuote, setOrderQuote] = useState<OrderQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const { userReward } = useUserReward();

  const debouncedCartItems = useDebounce(cartItems, 500);

  const fetchUserCart = useCallback(async () => {
    try {
      const response = await Axios.get(SummaryApi.getCart.url);
      setCartItems(response.data.success ? response.data.data || [] : []);
    } catch (error) {
      console.error("Failed to fetch user cart:", error);
      setCartItems([]);
    }
  }, []);


  const fetchOrderQuote = useCallback(async () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn || cartItems.length === 0) {
      setOrderQuote(null);
      return;
    }
    setIsQuoteLoading(true);
    try {
      const subtotal = cartItems.reduce((acc, item) => {
        const price = item.variant?.price || item.productId.price;
        return acc + price * item.quantity;
      }, 0);

      const shouldApplyWelcomeGift = userReward && subtotal >= userReward.minOrderAmount;

      const response = await Axios.post(SummaryApi.getOrderQuote.url, {
        cartItems,
        couponCode: appliedCouponCode,
        applyWelcomeGift: shouldApplyWelcomeGift,
      });
      if (response.data?.success) {
        setOrderQuote(response.data.data);
        if (response.data.data.coupon) {
          setAppliedCouponCode(response.data.data.coupon.code);
        } else if (!appliedCouponCode) {
          setAppliedCouponCode(null);
        }
      } else {
        setOrderQuote(null);
        toast({ title: "Error calculating totals", description: response.data.message, variant: "destructive" });
      }
    } catch (error: any) {
      setOrderQuote(null);
      toast({ title: "Error calculating totals", description: error.response?.data?.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsQuoteLoading(false);
    }
  }, [cartItems, appliedCouponCode, userReward]);
  
  useEffect(() => {
    fetchOrderQuote();
  }, [debouncedCartItems, appliedCouponCode, userReward, fetchOrderQuote]);

  const applyCoupon = useCallback((code: string) => {
    setAppliedCouponCode(code);
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCouponCode(null);
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setOrderQuote(null);
    setAppliedCouponCode(null);
  }, []);

  const addToCart = useCallback(async (item: any) => {
    await Axios.post(SummaryApi.addToCart.url, { ...item });
    await fetchUserCart();
  }, [fetchUserCart]);

  const removeFromCart = useCallback(async (cartItemId: string) => {
    await Axios.delete(SummaryApi.deleteFromCart.url.replace(":cartItemId", cartItemId));
    await fetchUserCart();
  }, [fetchUserCart]);

  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    await Axios.put(SummaryApi.updateCart.url.replace(":cartItemId", cartItemId), { quantity });
    await fetchUserCart();
  }, [fetchUserCart]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const value: CartContextType = {
    cartItems,
    orderQuote,
    isQuoteLoading,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    fetchUserCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    hasClaimedReward: () => !!userReward,
  };

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
};
