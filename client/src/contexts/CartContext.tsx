import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { toast } from "@/hooks/use-toast";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { useDebounce } from "@/hooks/use-debounce";

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
    type: "percentage" | "fixed";
    value: number;
    maxDiscount?: number;
    minOrderAmount?: number;
    minCartItems?: number;
  };
  discountAmount: number;
  finalAmount: number;
  isValid?: boolean;
  validationMessage?: string;
}

interface AppliedWelcomeGift {
  reward: {
    _id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
    reward: string;
    couponCode: string;
    rewardType: string;
    rewardValue: number;
    maxDiscount?: number;
    minOrderAmount: number;
  };
  discountAmount: number;
  type: "discount" | "shipping" | "sample";
  reason?: string;
  finalAmount?: number;
  shippingDiscount?: number;
  productDiscount?: number;
  isValid?: boolean;
  validationMessage?: string;
  serverValidated?: boolean;
}

interface OrderQuote {
  items: any[];
  subtotal: number;
  shippingCost: number;
  discounts: { coupon: number; welcomeGift: number; total: number };
  coupon?: any;
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
  applyWelcomeGift: () => void;
  removeWelcomeGift: () => void;
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
  const [shouldApplyWelcomeGift, setShouldApplyWelcomeGift] = useState(false);

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

  const hasClaimedReward = useCallback((): boolean => {
    const details = localStorage.getItem("claimedRewardDetails");
    if (!details) return false;
    try {
      return !!JSON.parse(details)?.couponCode;
    } catch {
      return false;
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
      const response = await Axios.post(SummaryApi.getOrderQuote.url, {
        cartItems,
        couponCode: appliedCouponCode,
        applyWelcomeGift: shouldApplyWelcomeGift || hasClaimedReward(),
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
  }, [cartItems, appliedCouponCode, shouldApplyWelcomeGift, hasClaimedReward]);
  
  useEffect(() => {
    fetchOrderQuote();
  }, [debouncedCartItems, appliedCouponCode, shouldApplyWelcomeGift, fetchOrderQuote]);

  const applyCoupon = useCallback((code: string) => {
    setAppliedCouponCode(code);
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCouponCode(null);
  }, []);
  
  const applyWelcomeGift = useCallback(() => {
    setShouldApplyWelcomeGift(true);
  }, []);
  
  const removeWelcomeGift = useCallback(() => {
    setShouldApplyWelcomeGift(false);
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setOrderQuote(null);
    setAppliedCouponCode(null);
    setShouldApplyWelcomeGift(false);
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
    applyWelcomeGift,
    removeWelcomeGift,
    hasClaimedReward,
  };

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
};
