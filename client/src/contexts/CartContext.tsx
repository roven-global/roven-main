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

interface CartContextType {
  cartItems: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  appliedWelcomeGift: AppliedWelcomeGift | null;
  cartCount: number;
  cartTotal: number;
  subtotal: number;
  totalSavings: number;
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
  refreshCart: () => Promise<void>;
  applyCoupon: (couponCode: string) => Promise<boolean>;
  removeCoupon: () => void;
  clearCoupon: () => void;
  validateAndApplyWelcomeGift: () => Promise<boolean>;
  applyWelcomeGift: (
    reward: AppliedWelcomeGift["reward"] | any,
    discountAmount: number,
    additionalData?: {
      rewardType?: string;
      reason?: string;
      shippingDiscount?: number;
      productDiscount?: number;
      finalAmount?: number;
    }
  ) => void;
  removeWelcomeGift: () => void;
  clearWelcomeGift: () => void;
  migrateAnonymousGift: () => Promise<boolean>;
  markRewardAsUsed: () => Promise<boolean>;
  hasClaimedReward: () => boolean;
  getClaimedRewardDetails: () => any;
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
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null
  );
  const [appliedWelcomeGift, setAppliedWelcomeGift] =
    useState<AppliedWelcomeGift | null>(null);

  // Calculate subtotal
  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = item.variant?.price || item.productId?.price || 0;
      return total + price * item.quantity;
    }, 0);
  }, [cartItems]);

  // Calculate cart count
  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  // Helper: Calculate BOGO discount client-side (used to keep UI in sync on cart changes)
  const calculateBogoDiscount = useCallback((items: CartItem[]): number => {
    if (!Array.isArray(items) || items.length === 0) return 0;

    // Normalize into { productId, price, quantity }
    const normalized = items.map((item) => {
      const productId = item.productId?._id as string;
      const price = item.variant?.price ?? item.productId?.price ?? 0;
      const quantity = Number.isFinite(item.quantity) ? item.quantity : 1;
      return { productId, price, quantity };
    });

    // Group by product and count pairs
    const groups: Record<string, { price: number; quantity: number }> = {};
    normalized.forEach((it) => {
      if (!groups[it.productId])
        groups[it.productId] = { price: it.price, quantity: 0 };
      groups[it.productId].quantity += it.quantity;
      // Keep highest seen price for safety
      if (it.price > groups[it.productId].price)
        groups[it.productId].price = it.price;
    });

    let totalDiscount = 0;
    Object.values(groups).forEach((group) => {
      const pairs = Math.floor(group.quantity / 2);
      totalDiscount += pairs * group.price;
    });
    return Math.max(0, Math.round(totalDiscount * 100) / 100);
  }, []);

  // Calculate total savings
  const totalSavings = useMemo(() => {
    const couponSavings = appliedCoupon?.discountAmount || 0;
    const giftSavings = appliedWelcomeGift?.discountAmount || 0;
    return couponSavings + giftSavings;
  }, [appliedCoupon, appliedWelcomeGift]);

  // Calculate final cart total
  const cartTotal = useMemo(() => {
    const total = subtotal - totalSavings;
    return Math.max(0, total);
  }, [subtotal, totalSavings]);

  // Keep applied welcome gift (especially BOGO) in sync when cart changes
  useEffect(() => {
    if (!appliedWelcomeGift) return;

    // Only handle BOGO client-side recalculation. Other types stay as validated.
    if (appliedWelcomeGift.type === "sample") {
      const totalItems = cartItems.reduce(
        (sum, it) => sum + (Number.isFinite(it.quantity) ? it.quantity : 1),
        0
      );
      const isValid = totalItems >= 2;
      const discount = isValid ? calculateBogoDiscount(cartItems) : 0;

      setAppliedWelcomeGift((prev) => {
        if (!prev) return prev;
        // Avoid unnecessary state updates
        if (prev.discountAmount === discount && prev.isValid === isValid)
          return prev;
        return {
          ...prev,
          discountAmount: discount,
          isValid,
          validationMessage: isValid
            ? undefined
            : "Add at least 2 items to activate BOGO offer",
        };
      });
    }
  }, [cartItems, appliedWelcomeGift?.type, calculateBogoDiscount]);

  // Load applied coupon from localStorage on mount
  useEffect(() => {
    const savedCoupon = localStorage.getItem("appliedCoupon");
    if (savedCoupon) {
      try {
        const parsedCoupon = JSON.parse(savedCoupon);
        setAppliedCoupon(parsedCoupon);
      } catch (error) {
        localStorage.removeItem("appliedCoupon");
      }
    }
  }, []);

  // Save applied coupon to localStorage
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem("appliedCoupon");
    }
  }, [appliedCoupon]);

  // Clear cart on logout
  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
    setAppliedWelcomeGift(null);
  }, []);

  // Listen for logout event
  useEffect(() => {
    window.addEventListener("logoutStateChange", clearCart);
    return () => window.removeEventListener("logoutStateChange", clearCart);
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

  // Listen for login event and migrate gifts
  useEffect(() => {
    const handleLogin = async () => {
      await fetchUserCart();
      await migrateAnonymousGift();
      await validateAndApplyWelcomeGift();
    };
    window.addEventListener("loginStateChange", handleLogin);
    return () => window.removeEventListener("loginStateChange", handleLogin);
  }, [fetchUserCart]);

  // Cart CRUD operations
  const addToCart = useCallback(
    async (item: {
      productId: string;
      name: string;
      quantity?: number;
      variant?: { volume: string; sku: string };
    }) => {
      try {
        await Axios.post(SummaryApi.addToCart.url, {
          productId: item.productId,
          quantity: item.quantity || 1,
          variant: item.variant,
        });
        toast({
          title: "Added to cart",
          description: `${item.name} has been added or updated.`,
        });
        await fetchUserCart();
      } catch (error) {
        toast({ title: "Error", description: "Failed to add item to cart." });
      }
    },
    [fetchUserCart]
  );

  const removeFromCart = useCallback(
    async (cartItemId: string) => {
      try {
        await Axios.delete(
          SummaryApi.deleteFromCart.url.replace(":cartItemId", cartItemId)
        );
        await fetchUserCart();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to remove item from cart.",
        });
      }
    },
    [fetchUserCart]
  );

  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      try {
        await Axios.put(
          SummaryApi.updateCart.url.replace(":cartItemId", cartItemId),
          { quantity }
        );
        await fetchUserCart();
      } catch (error) {
        toast({ title: "Error", description: "Failed to update quantity." });
      }
    },
    [fetchUserCart]
  );

  const refreshCart = useCallback(async () => {
    await fetchUserCart();
  }, [fetchUserCart]);

  // Coupon management
  const applyCoupon = useCallback(
    async (couponCode: string): Promise<boolean> => {
      try {
        const response = await Axios.post(SummaryApi.validateCoupon.url, {
          code: couponCode.toUpperCase(),
          orderAmount: subtotal,
          cartItems,
        });

        if (response.data.success) {
          setAppliedCoupon(response.data.data);
          toast({
            title: "Coupon applied successfully!",
            description: `You saved ₹${response.data.data.discountAmount}`,
          });
          return true;
        }
        return false;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Invalid coupon code";
        toast({
          title: "Coupon error",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }
    },
    [subtotal, cartItems]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    toast({ title: "Coupon removed" });
  }, []);

  const clearCoupon = useCallback(() => setAppliedCoupon(null), []);

  // Welcome gift management
  const validateAndApplyWelcomeGift =
    useCallback(async (): Promise<boolean> => {
      try {
        const saved = localStorage.getItem("claimedRewardDetails");
        if (!saved) return false;

        const details = JSON.parse(saved);
        if (!details?.couponCode) return false;

        // Debug: log outgoing validation payload (redacted where needed)
        try {
          console.log(
            "[CartContext] validateWelcomeGiftCoupon: sending request",
            {
              couponCode: details.couponCode,
              orderAmount: subtotal,
              cartItems: cartItems?.map((i: any) => ({
                id: i?._id || i?.id || i?.productId?._id || i?.productId,
                quantity: i?.quantity,
                price: i?.variant?.price || i?.productId?.price || i?.price,
                hasVariant: !!i?.variant,
              })),
              cartItemsCount: cartItems?.length,
            }
          );
        } catch {}

        const response = await Axios.post(
          SummaryApi.validateWelcomeGiftCoupon.url,
          {
            couponCode: details.couponCode,
            orderAmount: subtotal,
            cartItems,
            anonymousId: localStorage.getItem('anonymousId') || undefined,
          }
        );

        if (response.data?.success && response.data?.data?.canApply) {
          console.log(
            "[CartContext] validateWelcomeGiftCoupon: success",
            response.data?.data
          );
          const giftData = response.data.data;
          setAppliedWelcomeGift({
            reward: giftData.gift,
            discountAmount: giftData.discountAmount,
            type:
              giftData.gift.rewardType === "buy_one_get_one"
                ? "sample"
                : giftData.gift.rewardType === "free_shipping"
                ? "shipping"
                : "discount",
            reason: giftData.reason,
            shippingDiscount: giftData.shippingDiscount,
            productDiscount: giftData.productDiscount,
            isValid: true,
            serverValidated: true,
          });
          return true;
        } else {
          console.warn(
            "[CartContext] validateWelcomeGiftCoupon: cannot apply",
            response.data
          );
          // Remove invalid gift
          setAppliedWelcomeGift(null);
          return false;
        }
      } catch (error) {
        // Detailed debug output for easier diagnostics
        try {
          const anyErr: any = error;
          console.error("[CartContext] validateWelcomeGiftCoupon: error", {
            message: anyErr?.message,
            status: anyErr?.response?.status,
            statusText: anyErr?.response?.statusText,
            data: anyErr?.response?.data,
            headers: anyErr?.response?.headers,
            request: {
              url: anyErr?.config?.url,
              method: anyErr?.config?.method,
              timeout: anyErr?.config?.timeout,
            },
          });
        } catch {}
        // Special handling for unclaimed reward case (400 from server)
        const anyErr: any = error;
        if (
          anyErr?.response?.status === 400 &&
          anyErr?.response?.data?.code === "UNCLAIMED_REWARD"
        ) {
          // Attempt a one-time migration and retry validation
          try {
            const anonymousId = localStorage.getItem("anonymousId");
            if (anonymousId) {
              const migrateRes = await Axios.post(
                SummaryApi.migrateAnonymousGift.url,
                { anonymousId }
              );
              const migrated = !!migrateRes?.data?.data?.migrated;
              if (migrated) {
                // Retry once after successful migration
                try {
                  const retryRes = await Axios.post(
                    SummaryApi.validateWelcomeGiftCoupon.url,
                    {
                      couponCode: details.couponCode,
                      orderAmount: subtotal,
                      cartItems,
                      anonymousId: localStorage.getItem('anonymousId') || undefined,
                    }
                  );
                  if (retryRes.data?.success && retryRes.data?.data?.canApply) {
                    const giftData = retryRes.data.data;
                    setAppliedWelcomeGift({
                      reward: giftData.gift,
                      discountAmount: giftData.discountAmount,
                      type:
                        giftData.gift.rewardType === "buy_one_get_one"
                          ? "sample"
                          : giftData.gift.rewardType === "free_shipping"
                          ? "shipping"
                          : "discount",
                      reason: giftData.reason,
                      shippingDiscount: giftData.shippingDiscount,
                      productDiscount: giftData.productDiscount,
                      isValid: true,
                      serverValidated: true,
                    });
                    return true;
                  }
                } catch (retryErr) {
                  // fall through to toast below
                }
              }
            }
          } catch {}

          toast({
            title: "Welcome gift not claimed",
            description:
              "Please claim a welcome gift first to use this coupon.",
            variant: "destructive",
          });
        }
        console.error("Error validating welcome gift:", error);
        setAppliedWelcomeGift(null);
        return false;
      }
    }, [subtotal, cartItems]);

  // Apply welcome gift (client-side), useful for guest users where server validation is not available
  const applyWelcomeGift = useCallback(
    (
      reward: AppliedWelcomeGift["reward"] | any,
      discountAmount: number,
      additionalData?: {
        rewardType?: string;
        reason?: string;
        shippingDiscount?: number;
        productDiscount?: number;
        finalAmount?: number;
      }
    ) => {
      if (!reward || !Number.isFinite(discountAmount)) {
        return;
      }
      const rewardType = additionalData?.rewardType || reward?.rewardType;
      const mappedType: AppliedWelcomeGift["type"] =
        rewardType === "buy_one_get_one"
          ? "sample"
          : rewardType === "free_shipping"
          ? "shipping"
          : "discount";

      setAppliedWelcomeGift({
        reward: {
          _id: reward._id,
          title: reward.title,
          description: reward.description,
          icon: reward.icon,
          color: reward.color,
          bgColor: reward.bgColor,
          reward: reward.reward,
          couponCode: reward.couponCode,
          rewardType: rewardType,
          rewardValue: reward.rewardValue,
          maxDiscount: reward.maxDiscount,
          minOrderAmount: reward.minOrderAmount,
        },
        discountAmount: Math.max(0, discountAmount || 0),
        type: mappedType,
        reason: additionalData?.reason,
        shippingDiscount: additionalData?.shippingDiscount,
        productDiscount: additionalData?.productDiscount,
        finalAmount: additionalData?.finalAmount,
        isValid: true,
      });
    },
    []
  );

  const removeWelcomeGift = useCallback(() => {
    setAppliedWelcomeGift(null);
    toast({ title: "Welcome gift removed" });
  }, []);

  const clearWelcomeGift = useCallback(() => setAppliedWelcomeGift(null), []);

  // Migrate anonymous gift to logged-in user
  const migrateAnonymousGift = useCallback(async (): Promise<boolean> => {
    try {
      const anonymousId = localStorage.getItem("anonymousId");
      if (!anonymousId) return false;

      const response = await Axios.post(SummaryApi.migrateAnonymousGift.url, {
        anonymousId,
      });

      if (response.data?.success && response.data?.data?.migrated) {
        toast({
          title: "Welcome gift migrated",
          description: "Your welcome gift has been applied to your account!",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error migrating anonymous gift:", error);
      return false;
    }
  }, []);

  // Mark reward as used (call during checkout)
  const markRewardAsUsed = useCallback(async (): Promise<boolean> => {
    try {
      const response = await Axios.post(SummaryApi.markRewardAsUsed.url);
      if (response.data?.success) {
        setAppliedWelcomeGift(null);
        localStorage.removeItem("claimedRewardDetails");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error marking reward as used:", error);
      return false;
    }
  }, []);

  // Helper functions
  const hasClaimedReward = useCallback((): boolean => {
    const details = localStorage.getItem("claimedRewardDetails");
    if (!details) return false;

    try {
      const parsed = JSON.parse(details);
      return !!parsed.couponCode;
    } catch {
      return false;
    }
  }, []);

  const getClaimedRewardDetails = useCallback(() => {
    try {
      const details = localStorage.getItem("claimedRewardDetails");
      return details ? JSON.parse(details) : null;
    } catch {
      return null;
    }
  }, []);

  // Auto-validate welcome gift when cart changes
  useEffect(() => {
    if (hasClaimedReward() && cartItems.length > 0) {
      validateAndApplyWelcomeGift();
    }
  }, [cartItems.length, validateAndApplyWelcomeGift, hasClaimedReward]);

  // Auto-validate coupon when cart changes
  useEffect(() => {
    if (appliedCoupon && cartItems.length > 0) {
      // Recalculate coupon discount based on new cart total
      applyCoupon(appliedCoupon.coupon.code);
    }
  }, [cartItems.length]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        appliedCoupon,
        appliedWelcomeGift,
        cartCount,
        cartTotal,
        subtotal,
        totalSavings,
        addToCart,
        removeFromCart,
        updateQuantity,
        fetchUserCart,
        clearCart,
        refreshCart,
        applyCoupon,
        removeCoupon,
        clearCoupon,
        validateAndApplyWelcomeGift,
        applyWelcomeGift,
        removeWelcomeGift,
        clearWelcomeGift,
        migrateAnonymousGift,
        markRewardAsUsed,
        hasClaimedReward,
        getClaimedRewardDetails,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
