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
  validateAndApplyWelcomeGift: (
    gift: any,
    couponCode?: string
  ) => Promise<boolean>;
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
  serverHasUnusedReward: boolean;
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
  const [isValidatingGift, setIsValidatingGift] = useState(false);
  const [serverHasUnusedReward, setServerHasUnusedReward] = useState(false);

  //
  //
  // ======= CORE FUNCTIONS (useCallback) =======
  //
  //

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

    // After fetching cart, check for server-side rewards for logged-in users
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
      try {
        const response = await Axios.get(SummaryApi.checkRewardStatus.url);
        if (response.data.success && response.data.hasUnusedReward) {
          setServerHasUnusedReward(true);
          // Also, update localStorage to be in sync
          localStorage.setItem("rewardClaimed", "true");
          localStorage.setItem(
            "claimedRewardDetails",
            JSON.stringify(response.data.rewardDetails)
          );
        } else {
          setServerHasUnusedReward(false);
        }
      } catch (error) {
        console.error("Failed to check server reward status:", error);
        setServerHasUnusedReward(false);
      }
    }
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
    setAppliedWelcomeGift(null);
  }, []);

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

  const applyCoupon = useCallback(
    async (couponCode: string): Promise<boolean> => {
      try {
        const response = await Axios.post(SummaryApi.validateCoupon.url, {
          code: couponCode.toUpperCase(),
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
    [cartItems]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    toast({ title: "Coupon removed" });
  }, []);

  const clearCoupon = useCallback(() => setAppliedCoupon(null), []);

  const hasClaimedReward = useCallback((): boolean => {
    // Prefer server state when logged-in, otherwise fallback to localStorage
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) return serverHasUnusedReward;
    const details = localStorage.getItem("claimedRewardDetails");
    if (!details) return false;
    try {
      return !!JSON.parse(details)?.couponCode;
    } catch {
      return false;
    }
  }, [serverHasUnusedReward]);

  const getClaimedRewardDetails = useCallback(() => {
    try {
      const details = localStorage.getItem("claimedRewardDetails");
      return details ? JSON.parse(details) : null;
    } catch {
      return null;
    }
  }, []);

  const validateAndApplyWelcomeGift = useCallback(
    async (gift: any, couponCode?: string): Promise<boolean> => {
      if (isValidatingGift) {
        console.log(
          "CartContext: Gift validation already in progress, skipping"
        );
        return false;
      }

      const currentSubtotal = cartItems.reduce((total, item) => {
        const price = item.variant?.price || item.productId?.price || 0;
        return total + price * item.quantity;
      }, 0);

      try {
        setIsValidatingGift(true);

        const details =
          getClaimedRewardDetails() ||
          (hasClaimedReward() ? { couponCode: gift?.couponCode } : null);
        if (!details && !couponCode) {
          console.log("CartContext: No claimed reward details found");
          return false;
        }

        const codeToValidate = couponCode || details.couponCode;
        if (!codeToValidate) {
          console.log("CartContext: No coupon code in claimed reward details");
          return false;
        }

        const response = await Axios.post(
          SummaryApi.validateWelcomeGiftCoupon.url,
          {
            couponCode: codeToValidate,
            giftId: gift?._id || gift?.giftId,
            orderAmount: currentSubtotal,
            cartItems,
          }
        );

        if (response.data?.success && response.data?.data?.canApply) {
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
          setAppliedWelcomeGift(null);
          return false;
        }
      } catch (error) {
        const anyErr: any = error;
        if (
          anyErr?.response?.status === 400 &&
          anyErr?.response?.data?.code === "UNCLAIMED_REWARD"
        ) {
          console.log(
            "CartContext: Gift not found for user - this is expected after login/migration"
          );
        } else {
          console.error(
            "CartContext: Unexpected error validating welcome gift:",
            error
          );
        }
        setAppliedWelcomeGift(null);
        return false;
      } finally {
        setIsValidatingGift(false);
      }
    },
    [isValidatingGift, cartItems, getClaimedRewardDetails, hasClaimedReward]
  );

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

  //
  //
  // ======= MEMOIZED VALUES (useMemo) =======
  //
  //

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = item.variant?.price || item.productId?.price || 0;
      return total + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  // All welcome gift calculations are handled on the server

  const totalSavings = useMemo(() => {
    const couponSavings = appliedCoupon?.discountAmount || 0;
    const giftSavings = appliedWelcomeGift?.discountAmount || 0;
    return couponSavings + giftSavings;
  }, [appliedCoupon, appliedWelcomeGift]);

  const cartTotal = useMemo(() => {
    const total = subtotal - totalSavings;
    return Math.max(0, total);
  }, [subtotal, totalSavings]);

  //
  //
  // ======= SIDE EFFECTS (useEffect) =======
  //
  //

  // Backend source of truth: on cart changes, ask backend to validate current gift
  useEffect(() => {
    const giftDetails = getClaimedRewardDetails();
    if (!giftDetails) return;
    if (cartItems.length === 0) return;
    validateAndApplyWelcomeGift(giftDetails);
  }, [cartItems, getClaimedRewardDetails, validateAndApplyWelcomeGift]);

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

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem("appliedCoupon");
    }
  }, [appliedCoupon]);

  useEffect(() => {
    window.addEventListener("logoutStateChange", clearCart);
    return () => window.removeEventListener("logoutStateChange", clearCart);
  }, [clearCart]);

  useEffect(() => {
    const handleLogin = async () => {
      console.log("CartContext: Login event received, fetching cart...");
      await fetchUserCart();
      toast({
        title: "Restoring your welcome gift...",
        description: "Checking your account for any claimed gift",
      });
      // After login, if a reward exists on server, re-validate to populate UI
      const giftDetails = getClaimedRewardDetails();
      if (giftDetails) {
        validateAndApplyWelcomeGift(giftDetails);
      }
    };
    const handleMigrationComplete = () => {
      console.log(
        "CartContext: Migration complete event received, validating gift..."
      );
      // After migration, we need the gift details to re-validate
      const giftDetails = getClaimedRewardDetails();
      if (giftDetails) {
        validateAndApplyWelcomeGift(giftDetails);
      }
    };
    window.addEventListener("loginStateChange", handleLogin);
    window.addEventListener("migrationComplete", handleMigrationComplete);
    return () => {
      window.removeEventListener("loginStateChange", handleLogin);
      window.removeEventListener("migrationComplete", handleMigrationComplete);
    };
  }, [fetchUserCart, validateAndApplyWelcomeGift, getClaimedRewardDetails]);

  useEffect(() => {
    const hasReward = hasClaimedReward();
    if (
      hasReward &&
      cartItems.length > 0 &&
      !isValidatingGift &&
      !appliedWelcomeGift
    ) {
      console.log(
        "CartContext: Auto-validating welcome gift due to cart change"
      );
      const giftDetails = getClaimedRewardDetails();
      if (giftDetails) {
        validateAndApplyWelcomeGift(giftDetails);
      }
    }
  }, [
    cartItems.length,
    isValidatingGift,
    hasClaimedReward,
    validateAndApplyWelcomeGift,
    appliedWelcomeGift,
    getClaimedRewardDetails,
  ]);

  // Avoid revalidation loops: only re-validate when cart composition changes
  const appliedCouponCodeRef = useRef<string | null>(null);
  const lastCartKeyRef = useRef<string>("");

  useEffect(() => {
    appliedCouponCodeRef.current = appliedCoupon?.coupon.code || null;
  }, [appliedCoupon]);

  useEffect(() => {
    const cartKey = cartItems
      .map((i) => `${i._id}:${i.quantity}:${i.variant?.sku || ""}`)
      .join("|");
    if (cartKey === lastCartKeyRef.current) return;
    lastCartKeyRef.current = cartKey;

    if (appliedCouponCodeRef.current && cartItems.length > 0) {
      console.log("CartContext: Auto-validating coupon due to cart change");
      applyCoupon(appliedCouponCodeRef.current);
    }
  }, [cartItems, applyCoupon]);

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
        serverHasUnusedReward,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
