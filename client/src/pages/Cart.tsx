import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Gift,
  ShieldCheck,
  Truck,
  X,
  Tag,
  Calendar,
  Percent,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useGuest } from "@/contexts/GuestContext";
import { Link, useNavigate } from "react-router-dom";
import { formatRupees } from "@/lib/currency";
import { toast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WelcomeGiftReward from "@/components/WelcomeGiftReward";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { useRewardPopup } from "@/hooks/useRewardPopup";

const Cart = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    fetchUserCart,
    applyCoupon,
    removeCoupon,
    removeWelcomeGift,
    orderQuote,
    isQuoteLoading,
  } = useCart();
  const { guestCart, removeFromGuestCart, updateGuestCartQuantity } =
    useGuest();
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [scrollContainerRef, setScrollContainerRef] =
    useState<HTMLDivElement | null>(null);
  const [removingCouponId, setRemovingCouponId] = useState<string | null>(null);
  const [lifetimeSavings, setLifetimeSavings] = useState<number>(0);
  const [lifetimeSavingsLoading, setLifetimeSavingsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserCart().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchUserCart]);

  // Fetch lifetime savings
  useEffect(() => {
    const fetchLifetimeSavings = async () => {
      if (!isAuthenticated) return;
      setLifetimeSavingsLoading(true);
      try {
        const response = await Axios.get(SummaryApi.getLifetimeSavings.url);
        if (response.data.success) {
          setLifetimeSavings(response.data.data.totalSavings);
        }
      } catch (error) {
        console.error("Error loading lifetime savings:", error);
      } finally {
        setLifetimeSavingsLoading(false);
      }
    };

    fetchLifetimeSavings();
  }, [isAuthenticated]);

  // Listen to cart changes to ensure price summary updates
  useEffect(() => {
    // This effect is minimal now; the context handles most logic.
    // It's kept to ensure re-renders on cart/guestCart changes if needed.
    console.log("Cart: Cart items changed, triggering re-render");
  }, [cartItems, guestCart]);


  // Fetch available coupons
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchAvailableCoupons = async () => {
      try {
        const response = await Axios.get(SummaryApi.getActiveCoupons.url);
        if (response.data.success) {
          setAvailableCoupons(response.data.data);
          console.log("Available coupons loaded:", response.data.data);
        }
      } catch (error) {
        console.error("Error fetching available coupons:", error);
      }
    };

    // Debounce the API call to prevent rapid successive requests
    timeoutId = setTimeout(() => {
      fetchAvailableCoupons();
    }, 300);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Debug log for applied coupon
  useEffect(() => {
    console.log("Applied coupon state:", appliedCoupon);
  }, [appliedCoupon]);

  // Server-side coupon validation for welcome gift
  const handleValidateWelcomeGift = async (gift: any, couponCode?: string) => {
    setIsLoading(true);
    try {
      const success = await validateAndApplyWelcomeGift(gift, couponCode);
      if (success) {
        toast({
          title: "Welcome Gift Applied!",
          description: "Your welcome gift has been applied to this order.",
        });
      } else {
        toast({
          title: "Cannot Apply Gift",
          description: "Your gift is not applicable to the current cart.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to validate welcome gift",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuantity = async (
    cartItemId: string,
    newQuantity: number,
    variant?: { volume: string; sku: string }
  ) => {
    if (newQuantity < 1) return;

    console.log("Cart: Updating quantity:", {
      cartItemId,
      newQuantity,
      variant,
      isAuthenticated,
    });

    try {
      if (isAuthenticated) {
        await updateQuantity(cartItemId, newQuantity);
        console.log("Cart: Quantity updated for authenticated user");
      } else {
        updateGuestCartQuantity(cartItemId, newQuantity, variant);
        console.log("Cart: Quantity updated for guest user");
      }

      // Force a re-render to update price summary
      // The useEffect listening to cart changes should handle this automatically
    } catch (error) {
      console.error("Cart: Error updating quantity:", error);
      toast({
        title: "Error updating quantity",
        description: "Failed to update item quantity. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (
    cartItemId: string,
    variant?: { volume: string; sku: string }
  ) => {
    setRemovingId(cartItemId);
    try {
      if (isAuthenticated) {
        await removeFromCart(cartItemId);
      } else {
        removeFromGuestCart(cartItemId, variant);
      }
      toast({
        title: "Item removed from cart",
      });
    } catch (error) {
      toast({
        title: "Error removing item",
        variant: "destructive",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleApplyCoupon = async (code?: string) => {
    const couponToApply = code || couponCode.trim();
    if (!couponToApply) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const displayCartItems = isAuthenticated ? cartItems : guestCart;
      const subtotal = isAuthenticated
        ? cartItems.reduce(
            (acc, item) =>
              acc +
              (item.variant?.price || item.productId?.price || 0) *
                item.quantity,
            0
          )
        : guestCart.reduce((acc, item) => acc + item.price * item.quantity, 0);

      console.log("Applying coupon:", couponToApply);
      console.log("Subtotal:", subtotal);
      console.log("Cart items:", displayCartItems);

      const success = await applyCoupon(couponToApply);
      console.log("Coupon application result:", success);

      if (success) {
        setCouponCode("");
        console.log("Coupon applied successfully, clearing input");
      }
    } catch (error: any) {
      console.error("Error applying coupon:", error);
      const errorMessage =
        error.response?.data?.message || "Invalid coupon code";
      setCouponError(errorMessage);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponError("");
  };

  const handleRemoveIndividualCoupon = async (couponCode: string) => {
    setRemovingCouponId(couponCode);
    try {
      // Remove the coupon from the applied coupons list
      removeCoupon();

      toast({
        title: "Coupon removed successfully",
        description: "The coupon has been removed from your order",
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Error removing coupon";
      toast({
        title: "Error removing coupon",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setRemovingCouponId(null);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef) {
      scrollContainerRef.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef) {
      scrollContainerRef.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const displayCartItems = isAuthenticated ? cartItems : guestCart;

  const totalUniqueItems = displayCartItems.length;
  const totalQuantity = displayCartItems.reduce((acc, item) => acc + item.quantity, 0);
  
  // Use authoritative quote from context. Fallback to 0 for guest users or when quote is null.
  const subtotal = orderQuote?.subtotal ?? 0;
  const shippingCost = orderQuote?.shippingCost ?? 0;
  const couponDiscount = orderQuote?.discounts?.coupon ?? 0;
  const welcomeGiftDiscount = orderQuote?.discounts?.welcomeGift ?? 0;
  const finalTotal = orderQuote?.finalTotal ?? 0;
  const totalSavings = (orderQuote?.discounts?.total ?? 0) + (orderQuote?.shippingCost === 0 && subtotal > 0 ? 40 : 0);

  // Debug: Log price summary calculations
  console.log("Cart: Price summary recalculated:", {
    subtotal,
    totalQuantity,
    finalTotal,
    totalSavings,
    cartItemsCount: cartItems?.length || 0,
    guestCartCount: guestCart?.length || 0,
    isAuthenticated,
    // Add detailed welcome gift debugging
    appliedWelcomeGift: appliedWelcomeGift
      ? {
          type: appliedWelcomeGift.type,
          isValid: appliedWelcomeGift.isValid,
          discountAmount: appliedWelcomeGift.discountAmount,
          validationMessage: appliedWelcomeGift.validationMessage,
          rewardType: appliedWelcomeGift.reward?.rewardType,
        }
      : null,
  });

  // Handle checkout navigation
  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { redirectTo: "/checkout" } });
      toast({
        title: "Login required",
        description: "Please login to continue to checkout.",
      });
      return;
    }

    // Navigate to checkout. The cart context will preserve the applied gift state.
    navigate("/checkout");
  };

  if (loading || authLoading) {
    // Check both loading states
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-cream">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-sage"></div>
      </div>
    );
  }

  // Debug: Log cart items being passed to WelcomeGiftReward
  console.log("Cart: About to render with displayCartItems:", {
    isAuthenticated,
    cartItemsCount: cartItems?.length || 0,
    guestCartCount: guestCart?.length || 0,
    displayCartItemsCount: displayCartItems?.length || 0,
    displayCartItems: displayCartItems,
  });

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Show loading spinner while authentication is being checked */}
      {authLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-forest">Checking authentication...</p>
          </div>
        </div>
      )}

      {/* Show main content only when authentication check is complete */}
      {!authLoading && (
        <>
          {/* Breadcrumb Navigation */}
          <div className="bg-white border-b">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-center gap-2 text-sm text-forest">
                <span>Cart</span>
                <ArrowRight className="w-4 h-4" />
                <span className="text-warm-taupe">Address</span>
                <ArrowRight className="w-4 h-4" />
                <span className="text-warm-taupe">Payment</span>
              </div>
            </div>
          </div>

          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="max-w-7xl mx-auto">
                {displayCartItems.length === 0 ? (
                  <div className="text-center py-32 bg-white rounded-lg shadow-sm max-w-lg mx-auto">
                    <div className="bg-sage/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8">
                      <ShoppingBag className="h-12 w-12 text-warm-taupe" />
                    </div>
                    <h2 className="text-2xl font-semibold text-deep-forest mb-4">
                      Your cart is empty
                    </h2>
                    <p className="text-forest mb-8">
                      Looks like you haven't added anything to your cart yet.
                    </p>
                    <Button
                      asChild
                      size="lg"
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-md px-8"
                    >
                      <Link to="/shop">Continue Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Coupon Input Section */}
                      <div className="bg-white rounded-lg border shadow-sm">
                        <div className="p-4 border-b">
                          <div className="flex items-center gap-3">
                            <Tag className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-deep-forest">
                              Apply Coupon Code
                            </span>
                          </div>
                          <p className="text-sm text-forest mt-1">
                            Enter your coupon code to get additional discounts
                          </p>
                        </div>
                        <div className="p-4 space-y-4">
                          {/* Coupon Input */}
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Enter coupon code"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              className="flex-1"
                              disabled={couponLoading}
                            />
                            <Button
                              onClick={() => handleApplyCoupon()}
                              disabled={couponLoading || !couponCode.trim()}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              {couponLoading ? "Applying..." : "Apply"}
                            </Button>
                          </div>

                          {/* Coupon Error */}
                          {couponError && (
                            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                              {couponError}
                            </div>
                          )}

                          {/* Applied Coupon Display */}
                          {appliedCoupon && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Tag className="w-4 h-4 text-green-600" />
                                  <div>
                                    <p className="text-sm font-medium text-green-700">
                                      Coupon Applied:{" "}
                                      {appliedCoupon.coupon.code}
                                    </p>
                                    <p className="text-xs text-green-600">
                                      {appliedCoupon.coupon.name} -{" "}
                                      {formatRupees(
                                        appliedCoupon.discountAmount
                                      )}{" "}
                                      off
                                      {appliedCoupon.isValid === false && (
                                        <span className="text-orange-600 ml-1">
                                          (Inactive)
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleRemoveCoupon}
                                  className="text-red-600 hover:text-red-700 h-auto p-1 text-xs"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Available Offers Section */}
                      {availableCoupons.length > 0 && (
                        <div className="bg-white rounded-lg border shadow-sm">
                          <div className="p-4 border-b">
                            <div className="flex items-center gap-3">
                              <Tag className="w-5 h-5 text-green-600" />
                              <span className="font-semibold text-deep-forest">
                                Available offers for you (
                                {availableCoupons.length})
                              </span>
                            </div>
                            <p className="text-sm text-forest mt-1">
                              All coupons are applicable on this order
                            </p>
                          </div>
                          <div className="p-4 space-y-4">
                            {/* Coupons Horizontal Scroll */}
                            <div className="relative">
                              {/* Scroll Left Button */}
                              <button
                                onClick={scrollLeft}
                                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
                                style={{ marginLeft: "-8px" }}
                              >
                                <ChevronLeft className="w-4 h-4 text-forest" />
                              </button>

                              {/* Scroll Right Button */}
                              <button
                                onClick={scrollRight}
                                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
                                style={{ marginRight: "-8px" }}
                              >
                                <ChevronRight className="w-4 h-4 text-forest" />
                              </button>

                              <div
                                ref={setScrollContainerRef}
                                className="flex gap-4 overflow-x-auto pb-2 px-4"
                                style={{
                                  scrollbarWidth: "none",
                                  msOverflowStyle: "none",
                                }}
                              >
                                {availableCoupons.map((coupon) => {
                                  const isApplied =
                                    appliedCoupon?.coupon?.code === coupon.code;
                                  const isRemoving =
                                    removingCouponId === coupon.code;

                                  return (
                                    <div
                                      key={coupon._id}
                                      className={`border rounded-lg p-4 min-w-[280px] flex-shrink-0 ${
                                        isRemoving ? "opacity-50" : ""
                                      }`}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <h3 className="text-sm font-semibold text-deep-forest mb-1">
                                            {coupon.name}
                                          </h3>
                                          {coupon.description && (
                                            <p className="text-xs text-forest mb-1">
                                              {coupon.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                              {coupon.type === "percentage"
                                                ? `${coupon.value}% OFF`
                                                : `${formatRupees(
                                                    coupon.value
                                                  )} OFF`}
                                            </span>
                                            <span className="text-xs text-warm-taupe">
                                              Min:{" "}
                                              {formatRupees(
                                                coupon.minOrderAmount
                                              )}
                                            </span>
                                          </div>
                                          <p className="text-xs text-green-600">
                                            Valid till{" "}
                                            {new Date(
                                              coupon.validTo
                                            ).toLocaleDateString()}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 w-20 justify-end">
                                          {isApplied ? (
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-green-600 font-medium">
                                                Applied
                                              </span>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleRemoveIndividualCoupon(
                                                    coupon.code
                                                  )
                                                }
                                                disabled={isRemoving}
                                                className="text-xs text-red-600 hover:text-red-700 font-medium h-auto p-1"
                                              >
                                                {isRemoving
                                                  ? "Removing..."
                                                  : "Remove"}
                                              </Button>
                                            </div>
                                          ) : (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                handleApplyCoupon(coupon.code)
                                              }
                                              disabled={couponLoading}
                                              className="text-xs text-orange-600 hover:text-orange-700 font-medium h-auto p-1"
                                            >
                                              {couponLoading
                                                ? "Applying..."
                                                : "Use"}
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cart Details Section */}
                      <div className="bg-white rounded-lg border shadow-sm">
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-deep-forest flex items-center gap-2">
                              <ShoppingBag className="w-5 h-5" />
                              Cart details
                            </span>
                            <div className="text-sm text-forest hidden sm:block">
                              <span className="font-medium">Cart Summary:</span>
                              <span className="ml-2">
                                Items - {totalUniqueItems}
                              </span>
                              <span className="mx-2">|</span>
                              <span>Quantity - {totalQuantity}</span>
                              <span className="mx-2">|</span>
                              <span className="font-semibold">
                                Total - {formatRupees(totalAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Mobile Cart Summary */}
                        <div className="p-3 bg-sage/10 border-b sm:hidden">
                          <div className="text-sm text-forest text-center">
                            <span className="font-medium">Cart Summary:</span>
                            <span className="ml-2">
                              Items - {totalUniqueItems}
                            </span>
                            <span className="mx-2">|</span>
                            <span>Quantity - {totalQuantity}</span>
                            <span className="mx-2">|</span>
                            <span className="font-semibold">
                              Total - {formatRupees(totalAmount)}
                            </span>
                          </div>
                        </div>

                        <div className="divide-y">
                          {displayCartItems.map((item: any) => (
                            <div
                              key={
                                item._id ||
                                `${item.id}-${JSON.stringify(item.variant)}`
                              }
                              className={`p-4 ${
                                removingId === (item._id || item.id)
                                  ? "opacity-50"
                                  : ""
                              }`}
                            >
                              <div className="flex gap-4">
                                <img
                                  src={
                                    isAuthenticated
                                      ? item.productId?.images?.[0]?.url
                                      : item.image
                                  }
                                  alt={
                                    isAuthenticated
                                      ? item.productId?.name
                                      : item.name
                                  }
                                  className="w-16 h-16 object-cover rounded-lg border"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-1">
                                    <h3 className="font-medium text-deep-forest text-sm line-clamp-2 flex-1">
                                      {isAuthenticated
                                        ? item.productId?.name
                                        : item.name}
                                    </h3>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleRemoveItem(
                                          item._id || item.id,
                                          item.variant
                                        )
                                      }
                                      disabled={
                                        removingId === (item._id || item.id)
                                      }
                                      className="h-8 w-8 p-0 text-warm-taupe hover:text-red-600 hover:bg-red-50 ml-2"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {item.variant && (
                                    <p className="text-xs text-forest mb-2">
                                      {item.variant.volume}
                                    </p>
                                  )}
                                  <p className="text-sm font-bold text-deep-forest mb-2">
                                    {formatRupees(
                                      isAuthenticated
                                        ? item.variant?.price ||
                                            item.productId?.price
                                        : item.price
                                    )}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded border"
                                        onClick={() =>
                                          handleUpdateQuantity(
                                            item._id || item.id,
                                            item.quantity - 1,
                                            item.variant
                                          )
                                        }
                                        disabled={item.quantity === 1}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="text-sm font-medium w-8 text-center border-t border-b py-1">
                                        {item.quantity}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded border"
                                        onClick={() =>
                                          handleUpdateQuantity(
                                            item._id || item.id,
                                            item.quantity + 1,
                                            item.variant
                                          )
                                        }
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-deep-forest text-sm">
                                        {formatRupees(
                                          (isAuthenticated
                                            ? item.variant?.price ||
                                              item.productId?.price
                                            : item.price) * item.quantity
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Price Summary */}
                    <div className="space-y-6">
                      {/* Welcome Gift Reward */}
                      <div className="bg-white rounded-lg border shadow-sm">
                        <div className="p-4 border-b">
                          <h3 className="text-lg font-semibold text-deep-forest flex items-center gap-2">
                            <Gift className="w-5 h-5 text-orange-600" />
                            Welcome Gift
                          </h3>
                        </div>
                        <div className="p-4">
                          <WelcomeGiftReward />
                        </div>
                      </div>

                      {/* Removed local warning logic; rely on backend validation results */}

                      <div className="bg-white rounded-lg border shadow-sm sticky top-4">
                        <div className="p-4 border-b">
                          <span className="font-semibold text-deep-forest flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5" />
                            Price Summary
                          </span>
                        </div>
                        <div className="p-4 space-y-3">
                          {isQuoteLoading ? (
                            <div className="space-y-4">
                              <div className="flex justify-between">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-4 w-1/4" />
                              </div>
                              <div className="flex justify-between">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-1/4" />
                              </div>
                              <Separator />
                              <div className="flex justify-between">
                                <Skeleton className="h-6 w-1/4" />
                                <Skeleton className="h-6 w-1/3" />
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-forest">Order Total</span>
                                <span className="text-deep-forest font-bold">
                                  {formatRupees(subtotal)}
                                </span>
                              </div>
                              {couponDiscount > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-forest">Coupon Discount</span>
                                  <span className="text-green-600 font-bold">
                                    -{formatRupees(couponDiscount)}
                                  </span>
                                </div>
                              )}
                              {welcomeGiftDiscount > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-forest">Welcome Gift</span>
                                  <span className="text-green-600 font-bold">
                                    -{formatRupees(welcomeGiftDiscount)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm">
                                <span className="text-forest">Shipping</span>
                                <div className="text-right">
                                  {shippingCost === 0 && subtotal > 0 ? (
                                    <span className="text-green-600 font-bold">Free</span>
                                  ) : (
                                    <span className="text-deep-forest font-bold">
                                      {formatRupees(shippingCost)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Separator />
                              <div className="flex justify-between font-bold text-lg">
                                <span className="text-deep-forest">To Pay</span>
                                <span className="text-deep-forest">
                                  {formatRupees(finalTotal)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="p-4 border-t">
                          {totalSavings > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                              <span className="text-blue-600">✓</span>
                              <p className="text-sm text-blue-700 font-medium">
                                You are saving {formatRupees(totalSavings)} on
                                this order
                              </p>
                            </div>
                          )}

                          {/* Lifetime Savings Section */}
                          {isAuthenticated && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                              <span className="text-green-600">🏆</span>
                              <div className="flex-1">
                                <p className="text-sm text-green-700 font-medium">
                                  Your lifetime savings with Roven Beauty
                                </p>
                                {lifetimeSavingsLoading ? (
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                                    <span className="text-xs text-green-600">
                                      Calculating...
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-lg font-bold text-green-800 mt-1">
                                    {formatRupees(lifetimeSavings)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          <Button
                            onClick={handleCheckout}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-md py-3 font-medium"
                            disabled={displayCartItems.length === 0}
                          >
                            {appliedWelcomeGift
                              ? "Proceed with Welcome Gift"
                              : "Proceed to Checkout"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
          <Footer />
        </>
      )}
    </div>
  );
};

export default Cart;
