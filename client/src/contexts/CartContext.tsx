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

interface Coupon {
  _id: string;
  code: string;
  name: string;
  description?: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  validTo?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  orderQuote: OrderQuote | null;
  isQuoteLoading: boolean;
  cartCount: number;
  availableCoupons: Coupon[];
  addToCart: (item: any) => Promise<void>;
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

/**
 * Optimistically calculates the order quote on the client-side.
 * This provides an instant summary update to the user.
 * The calculation logic mirrors the server's `calculateOrderTotals` function.
 */
const calculateLocalQuote = (
  cartItems: CartItem[],
  appliedCouponCode: string | null,
  availableCoupons: Coupon[],
  userReward: any | null
): OrderQuote | null => {
  if (cartItems.length === 0) {
    return null;
  }

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.variant?.price || item.productId.price;
    return acc + price * item.quantity;
  }, 0);

  let couponDiscount = 0;
  let appliedCoupon: OrderQuote["appliedCoupon"] = null;

  if (appliedCouponCode) {
    const coupon = availableCoupons.find((c) => c.code === appliedCouponCode);
    if (coupon && subtotal >= coupon.minOrderAmount) {
      couponDiscount =
        coupon.type === "percentage"
          ? (subtotal * coupon.value) / 100
          : coupon.value;
      couponDiscount = Math.min(couponDiscount, subtotal);
      appliedCoupon = {
        _id: coupon._id,
        code: coupon.code,
        name: coupon.name,
      };
    }
  }

  let welcomeGiftDiscount = 0;
  let freeShippingByReward = false;
  const shouldApplyWelcomeGift =
    userReward && subtotal >= userReward.minOrderAmount;

  if (shouldApplyWelcomeGift) {
    if (userReward.giftId?.rewardType === "free_shipping") {
      freeShippingByReward = true;
    } else if (userReward.giftId?.rewardType === "discount") {
      welcomeGiftDiscount = userReward.giftId.value || 0;
    }
  }

  const shippingCost = freeShippingByReward || subtotal > 499 ? 0 : 40;
  const totalDiscount = couponDiscount + welcomeGiftDiscount;
  const finalTotal = Math.max(0, subtotal + shippingCost - totalDiscount);

  return {
    items: cartItems,
    subtotal,
    shippingCost,
    discounts: {
      coupon: couponDiscount,
      welcomeGift: welcomeGiftDiscount,
      total: totalDiscount,
    },
    appliedCoupon,
    finalTotal,
  };
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderQuote, setOrderQuote] = useState<OrderQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const { userReward } = useUserReward();

  const fetchUserCart = useCallback(async () => {
    try {
      const response = await Axios.get(SummaryApi.getCart.url);
      const items = response.data.success ? response.data.data || [] : [];
      setCartItems(items);
    } catch (error) {
      console.error("Failed to fetch user cart:", error);
      setCartItems([]);
    }
  }, []);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await Axios.get(SummaryApi.getActiveCoupons.url);
        if (response.data.success) {
          setAvailableCoupons(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch coupons:", error);
      }
    };
    fetchCoupons();
  }, []);

  useEffect(() => {
    const localQuote = calculateLocalQuote(
      cartItems,
      appliedCouponCode,
      availableCoupons,
      userReward
    );
    setOrderQuote(localQuote);

    const fetchAuthoritativeQuote = async () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!isLoggedIn || cartItems.length === 0) {
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
          cartItems: cartItems,
          couponCode: appliedCouponCode,
          applyWelcomeGift: shouldApplyWelcomeGift,
        });

        if (response.data?.success) {
          setOrderQuote(response.data.data);
          const serverCouponCode = response.data.data.appliedCoupon?.code || null;
          if (appliedCouponCode !== serverCouponCode) {
            setAppliedCouponCode(serverCouponCode);
          }
        }
      } catch (error: any) {
        console.error("Error fetching authoritative quote:", error);
      } finally {
        setIsQuoteLoading(false);
      }
    };
    
    fetchAuthoritativeQuote();
  }, [cartItems, appliedCouponCode, availableCoupons, userReward]);


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
    const originalCartItems = [...cartItems];
    const updatedCartItems = cartItems.filter((item) => item._id !== cartItemId);
    setCartItems(updatedCartItems);

    try {
      await Axios.delete(SummaryApi.deleteFromCart.url.replace(":cartItemId", cartItemId));
    } catch (error) {
      setCartItems(originalCartItems);
      toast({
        title: "Error removing item",
        description: "Failed to remove item from cart. Please try again.",
        variant: "destructive",
      });
    }
  }, [cartItems]);

  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    const originalCartItems = [...cartItems];
    const itemIndex = cartItems.findIndex((item) => item._id === cartItemId);
    if (itemIndex === -1) return;

    const updatedCartItems = [...cartItems];
    updatedCartItems[itemIndex] = {
      ...updatedCartItems[itemIndex],
      quantity: quantity,
    };
    setCartItems(updatedCartItems);

    try {
      await Axios.put(
        SummaryApi.updateCart.url.replace(":cartItemId", cartItemId),
        { quantity }
      );
    } catch (error) {
      setCartItems(originalCartItems);
      toast({
        title: "Error updating quantity",
        description: "Failed to update item quantity. Please try again.",
        variant: "destructive",
      });
    }
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const value: CartContextType = {
    cartItems,
    orderQuote,
    isQuoteLoading,
    cartCount,
    availableCoupons,
    addToCart,
    removeFromCart,
    updateQuantity,
    fetchUserCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    hasClaimedReward: () => !!userReward,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
