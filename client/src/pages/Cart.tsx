import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Gift,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import PriceSummary from "@/components/PriceSummary";

const Cart = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    orderQuote,
    isQuoteLoading,
    availableCoupons,
  } = useCart();
  const {
    guestCart,
    removeFromGuestCart,
    updateGuestCartQuantity,
    guestCartSubtotal,
  } = useGuest();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [scrollContainerRef, setScrollContainerRef] =
    useState<HTMLDivElement | null>(null);
  const [removingCouponId, setRemovingCouponId] = useState<string | null>(null);
  const [lifetimeSavings, setLifetimeSavings] = useState<number>(0);
  const [lifetimeSavingsLoading, setLifetimeSavingsLoading] = useState(false);

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

  const handleUpdateQuantity = (
    cartItemId: string,
    newQuantity: number,
    variant?: { volume: string; sku: string }
  ) => {
    if (newQuantity < 1) return;

    if (isAuthenticated) {
      updateQuantity(cartItemId, newQuantity);
    } else {
      updateGuestCartQuantity(cartItemId, newQuantity, variant);
    }
  };

  const handleRemoveItem = (
    cartItemId: string,
    variant?: { volume: string; sku: string }
  ) => {
    setRemovingId(cartItemId);
    if (isAuthenticated) {
      removeFromCart(cartItemId);
    } else {
      removeFromGuestCart(cartItemId, variant);
    }
    toast({
      title: "Item removed from cart",
    });
    setRemovingId(null);
  };

  const handleApplyCoupon = (code: string) => {
    if (!code) {
      return;
    }
    applyCoupon(code);
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
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
  const totalQuantity = displayCartItems.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  const subtotal = isAuthenticated
    ? orderQuote?.subtotal ?? 0
    : guestCartSubtotal;
  const shippingCost = isAuthenticated ? orderQuote?.shippingCost ?? 0 : 0;
  const couponDiscount = isAuthenticated
    ? orderQuote?.discounts?.coupon ?? 0
    : 0;
  const welcomeGiftDiscount = isAuthenticated
    ? orderQuote?.discounts?.welcomeGift ?? 0
    : 0;
  const finalTotal = isAuthenticated
    ? orderQuote?.finalTotal ?? 0
    : guestCartSubtotal;
  const totalSavings = isAuthenticated
    ? (orderQuote?.discounts?.total ?? 0) +
      (orderQuote?.shippingCost === 0 && subtotal > 0 ? 40 : 0)
    : 0;

  const handleCheckout = () => {
    if (displayCartItems.length === 0) {
      toast({
        title: "Your cart is empty",
        description: "Please add items before proceeding.",
        variant: "destructive",
      });
      return;
    }

    if (isAuthenticated) {
      navigate("/checkout");
    } else {
      toast({
        title: "Login Required",
        description: "Please login to continue with your checkout.",
        variant: "destructive",
      });
      navigate("/login");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-cream">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-cream">
      <Navigation />
      {!authLoading && (
        <>
          <div className="bg-white border-b">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-brown">
                <span>Cart</span>
                <ArrowRight className="w-4 h-4" />
                <span className="text-muted-brown opacity-75">Address</span>
                <ArrowRight className="w-4 h-4" />
                <span className="text-muted-brown opacity-75">Payment</span>
              </div>
            </div>
          </div>

          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="max-w-7xl mx-auto">
                {displayCartItems.length === 0 ? (
                  <div className="text-center py-32 bg-white rounded-lg shadow-sm max-w-lg mx-auto">
                    <div className="bg-primary/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8">
                      <ShoppingBag className="h-12 w-12 text-border" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">
                      Your cart is empty
                    </h2>
                    <p className="text-muted-brown mb-8">
                      Looks like you haven't added anything to your cart yet.
                    </p>
                    <Button
                      asChild
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-8"
                    >
                      <Link to="/shop">Continue Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
                    <div className="lg:col-span-2 space-y-4 lg:space-y-6 order-1 lg:order-1">
                      {availableCoupons.length > 0 && (
                        <div className="bg-white rounded-lg border shadow-sm">
                          <div className="p-4 border-b">
                            <div className="flex items-center gap-3">
                              <Tag className="w-5 h-5 text-primary" />
                              <span className="font-semibold text-foreground">
                                Available Coupons ({availableCoupons.length})
                              </span>
                            </div>
                            <p className="text-sm text-muted-brown mt-1">
                              Select a coupon to apply to your order
                            </p>
                          </div>
                          <div className="p-4 space-y-4">
                            {orderQuote?.appliedCoupon && (
                              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-primary-20" />
                                    <div>
                                      <p className="text-sm font-medium text-primary">
                                        Coupon Applied:{" "}
                                        {orderQuote.appliedCoupon.code}
                                      </p>
                                      <p className="text-sm text-muted-brown">
                                        {orderQuote.appliedCoupon.name} -{" "}
                                        {formatRupees(
                                          orderQuote.discounts.coupon
                                        )}{" "}
                                        off
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveCoupon}
                                    className="text-destructive hover:text-destructive/90 h-auto p-1 text-xs"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            )}
                            <div className="relative">
                              <button
                                onClick={scrollLeft}
                                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-background border rounded-full p-2 shadow-md hover:bg-muted transition-colors"
                                style={{ marginLeft: "-8px" }}
                              >
                                <ChevronLeft className="w-4 h-4 text-muted-brown" />
                              </button>

                              <button
                                onClick={scrollRight}
                                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-background border rounded-full p-2 shadow-md hover:bg-muted transition-colors"
                                style={{ marginRight: "-8px" }}
                              >
                                <ChevronRight className="w-4 h-4 text-muted-brown" />
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
                                    orderQuote?.appliedCoupon?.code ===
                                    coupon.code;
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
                                          <h3 className="text-sm font-semibold text-foreground mb-1">
                                            {coupon.name}
                                          </h3>
                                          {coupon.description && (
                                            <p className="text-xs text-muted-brown mb-1">
                                              {coupon.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs bg-primary/10 text-primary-10 px-2 py-1 rounded">
                                              {coupon.type === "percentage"
                                                ? `${coupon.value}% OFF`
                                                : `${formatRupees(
                                                    coupon.value
                                                  )} OFF`}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              Min:{" "}
                                              {formatRupees(
                                                coupon.minOrderAmount
                                              )}
                                            </span>
                                          </div>
                                          <p className="text-xs text-muted-brown">
                                            Valid till{" "}
                                            {new Date(
                                              coupon.validTo
                                            ).toLocaleDateString()}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 w-20 justify-end">
                                          {isApplied ? (
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-primary font-medium">
                                                Applied
                                              </span>
                                            </div>
                                          ) : (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                handleApplyCoupon(coupon.code)
                                              }
                                              className="text-xs text-primary hover:text-primary/90 hover:bg-primary/10 font-medium h-auto p-1 rounded"
                                            >
                                              Use
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

                      <div className="bg-white rounded-lg border shadow-sm">
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground flex items-center gap-2">
                              <ShoppingBag className="w-5 h-5" />
                              Cart details
                            </span>
                            <div className="text-sm text-muted-brown hidden lg:block">
                              <span className="font-medium">Cart Summary:</span>
                              <span className="ml-2">
                                Items - {totalUniqueItems}
                              </span>
                              <span className="mx-2">|</span>
                              <span>Quantity - {totalQuantity}</span>
                              <span className="mx-2">|</span>
                              <span className="font-semibold">
                                Total - {formatRupees(subtotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-primary/10 border-b lg:hidden">
                          <div className="text-sm text-muted-brown text-center">
                            <span className="font-medium">Cart Summary:</span>
                            <span className="ml-2">
                                Items - {totalUniqueItems}
                            </span>
                            <span className="mx-2">|</span>
                            <span>Quantity - {totalQuantity}</span>
                            <span className="mx-2">|</span>
                            <span className="font-semibold">
                              Total - {formatRupees(subtotal)}
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
                                    <h3 className="font-medium text-foreground text-sm line-clamp-2 flex-1">
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
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-2"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {item.variant && (
                                    <p className="text-xs text-muted-brown mb-2">
                                      {item.variant.volume}
                                    </p>
                                  )}
                                  <p className="text-sm font-bold text-foreground mb-2">
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
                                      <p className="font-bold text-foreground text-sm">
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

                    <div className="space-y-4 lg:space-y-6 lg:col-span-1 order-2 lg:order-2">
                      <div className="bg-white rounded-lg border shadow-sm">
                        <div className="p-4 border-b">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Gift className="w-5 h-5 text-primary" />
                            Welcome Gift
                          </h3>
                        </div>
                        <div className="p-4">
                          <WelcomeGiftReward />
                        </div>
                      </div>

                      <PriceSummary
                        isQuoteLoading={isQuoteLoading}
                        subtotal={subtotal}
                        couponDiscount={couponDiscount}
                        welcomeGiftDiscount={welcomeGiftDiscount}
                        shippingCost={shippingCost}
                        finalTotal={finalTotal}
                        totalSavings={totalSavings}
                        isAuthenticated={isAuthenticated}
                        lifetimeSavings={lifetimeSavings}
                        lifetimeSavingsLoading={lifetimeSavingsLoading}
                      >
                        <Button
                          onClick={handleCheckout}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-3 font-medium"
                        >
                          Proceed to Checkout
                        </Button>
                      </PriceSummary>
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
