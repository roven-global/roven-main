import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Save,
  ShoppingBag,
  Trash2,
  X,
  Tag,
  Calendar,
  Percent,
  DollarSign,
  Gift,
  Truck,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { formatRupees } from "@/lib/currency";
import { useCart } from "@/contexts/CartContext";
import { useGuest } from "@/contexts/GuestContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserReward } from "@/contexts/UserRewardContext";
import { toast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WelcomeGiftReward from "@/components/WelcomeGiftReward";
import PriceSummary from "@/components/PriceSummary";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { useIndianStatesAndCities } from "@/lib/cities";

const Checkout = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    clearCart,
    applyCoupon,
    removeCoupon,
    orderQuote,
    isQuoteLoading,
  } = useCart();
  const { guestCart, clearGuestData } = useGuest();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { clearUserReward } = useUserReward();
  const { reactSelectData, getCitiesByState } = useIndianStatesAndCities();

  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: user?.email || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    saveForFuture: true,
  });
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const [scrollContainerRef, setScrollContainerRef] =
    useState<HTMLDivElement | null>(null);
  const [lifetimeSavings, setLifetimeSavings] = useState<number>(0);
  const [lifetimeSavingsLoading, setLifetimeSavingsLoading] = useState(false);

  const displayCartItems = isAuthenticated ? cartItems : guestCart;

  useEffect(() => {
    const initialize = async () => {
      if (isAuthenticated) {
        await loadSavedAddresses();
      } else {
        // For guest users, show the address form immediately
        setShowNewAddressForm(true);
      }
      setCartLoading(false);
    };
    if (!authLoading) {
      initialize();
    }
  }, [isAuthenticated, authLoading]); // Removed refreshCart from dependencies to prevent infinite loops

  // Fetch available coupons
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchAvailableCoupons = async () => {
      try {
        const response = await Axios.get(SummaryApi.getActiveCoupons.url);
        if (response.data.success) {
          setAvailableCoupons(response.data.data);
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

  useEffect(() => {
    if (!cartLoading && displayCartItems.length === 0) {
      navigate("/cart");
    }
  }, [displayCartItems.length, cartLoading]); // Remove navigate from dependencies as it's stable

  const loadSavedAddresses = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await Axios.get(SummaryApi.getUserAddresses.url);
      if (response.data.success) {
        const addresses = response.data.data;
        setSavedAddresses(addresses);

        // Only set default address if no address is currently selected
        if (!selectedAddressId) {
          const defaultAddress =
            addresses.find((addr: any) => addr.isDefault) || addresses[0];
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress._id);
          } else {
            setShowNewAddressForm(true);
          }
        }
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStateChange = (stateName: string) => {
    setFormData({ ...formData, state: stateName, city: "" });
    setAvailableCities([...getCitiesByState(stateName)]);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    try {
      const response = await Axios.post(SummaryApi.saveAddress.url, formData);
      if (response.data.success) {
        toast({ title: "Address saved successfully!" });
        // Force reload addresses and select the newly saved one
        const addressesResponse = await Axios.get(
          SummaryApi.getUserAddresses.url
        );
        if (addressesResponse.data.success) {
          const addresses = addressesResponse.data.data;
          setSavedAddresses(addresses);
          // Select the newly saved address (should be the last one)
          if (addresses.length > 0) {
            const newAddress = addresses[addresses.length - 1];
            setSelectedAddressId(newAddress._id);
          }
        }
        setShowNewAddressForm(false);
        setFormData({
          firstName: "",
          lastName: "",
          phone: "",
          email: user?.email || "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          saveForFuture: true,
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to save address",
        description: error.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setAddressLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    let shippingAddress;

    if (isAuthenticated) {
      if (!selectedAddressId) {
        toast({
          title: "Please select a shipping address.",
          variant: "destructive",
        });
        return;
      }
      shippingAddress = savedAddresses.find(
        (addr) => addr._id === selectedAddressId
      );
    } else {
      // Guest user: validate and use form data
      if (!formData.firstName || !formData.address || !formData.city || !formData.state || !formData.pincode || !formData.phone || !formData.email) {
          toast({ title: "Please fill out all required address fields.", variant: "destructive" });
          return;
      }
      shippingAddress = formData;
    }

    if (!shippingAddress) {
        toast({ title: "Could not determine shipping address.", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
      // Construct the payload based on the authoritative orderQuote
      const payload = {
        shippingAddress: shippingAddress,
        paymentMethod: "online",
        notes: "", // Add notes if you have a notes field
        couponCode: orderQuote?.appliedCoupon?.code,
        applyWelcomeGift: (orderQuote?.discounts?.welcomeGift ?? 0) > 0,
      };

      const orderResponse = await Axios.post(
        SummaryApi.createOrder.url,
        payload
      );

      if (orderResponse.data.success) {
        isAuthenticated ? clearCart() : clearGuestData(); // Keep this for immediate UI update
        if ((orderQuote?.discounts?.welcomeGift ?? 0) > 0) {
            clearUserReward();
        }
        navigate(`/payment?orderId=${orderResponse.data.data._id}`);
      }
    } catch (error: any) {
      toast({
        title: "Failed to create order",
        description: error.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const deleteUrl = SummaryApi.deleteAddress.url.replace(":id", addressId);
      const response = await Axios.delete(deleteUrl);

      if (response.data.success) {
        toast({
          title: "Address deleted successfully",
          description:
            "The address has been removed from your saved addresses.",
        });

        // Remove the address from local state
        setSavedAddresses((prev) =>
          prev.filter((addr) => addr._id !== addressId)
        );

        // If the deleted address was selected, clear the selection
        if (selectedAddressId === addressId) {
          setSelectedAddressId(null);

          // If there are other addresses, select the first one
          const remainingAddresses = savedAddresses.filter(
            (addr) => addr._id !== addressId
          );
          if (remainingAddresses.length > 0) {
            const defaultAddress =
              remainingAddresses.find((addr) => addr.isDefault) ||
              remainingAddresses[0];
            setSelectedAddressId(defaultAddress._id);
          } else {
            // No addresses left, show the form
            setShowNewAddressForm(true);
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Failed to delete address",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
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
      await applyCoupon(couponToApply);
      setCouponCode("");
    } catch (error: any) {
      setCouponError(error.response?.data?.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode("");
    setCouponError("");
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

  const subtotal = orderQuote?.subtotal ?? 0;
  const shippingCost = orderQuote?.shippingCost ?? 0;
  const discountAmount = orderQuote?.discounts?.coupon ?? 0;
  const welcomeGiftDiscount = orderQuote?.discounts?.welcomeGift ?? 0;
  const finalTotal = orderQuote?.finalTotal ?? 0;
  const totalSavings =
    (orderQuote?.discounts?.total ?? 0) +
    (shippingCost === 0 && subtotal > 0 ? 40 : 0);

  if (cartLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-sage"></div>
      </div>
    );
  }

  const isGuestFormValid = () => {
    if (isAuthenticated) return false;
    const { firstName, lastName, phone, email, address, city, state, pincode } = formData;
    return !!(firstName && lastName && phone && email && address && city && state && pincode);
  };

  return (
    <div className="min-h-screen bg-warm-cream">
      <Navigation />

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-sm text-forest">
            <Link to="/cart" className="hover:text-deep-forest">
              Cart
            </Link>
            <ArrowRight className="w-4 h-4" />
            <span>Address</span>
            <ArrowRight className="w-4 h-4" />
            <span className="text-warm-taupe">Payment</span>
          </div>
        </div>
      </div>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Address Section */}
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-deep-forest flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Shipping Address
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    {isAuthenticated && savedAddresses.length > 0 && (
                      <div className="space-y-3">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr._id}
                            onClick={() => {
                              setSelectedAddressId(addr._id);
                              setShowNewAddressForm(false);
                            }}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              selectedAddressId === addr._id
                                ? "border-orange-500 bg-orange-50"
                                : "border-gray-200 hover:border-orange-300"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-deep-forest">
                                  {addr.firstName} {addr.lastName}
                                </p>
                                <p className="text-forest text-sm">
                                  {addr.address}, {addr.city}, {addr.state} -{" "}
                                  {addr.pincode}
                                </p>
                                <p className="text-forest text-sm">
                                  {addr.phone}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedAddressId === addr._id && (
                                  <div className="text-orange-500">
                                    <svg
                                      className="w-5 h-5"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAddress(addr._id);
                                  }}
                                  className="h-8 w-8 text-warm-taupe hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show Add New Address button when no saved addresses */}
                    {isAuthenticated &&
                      savedAddresses.length === 0 &&
                      !showNewAddressForm && (
                        <div className="text-center py-4">
                          <p className="text-forest mb-4">
                            No saved addresses found.
                          </p>
                          <Button
                            onClick={() => setShowNewAddressForm(true)}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-md px-6 py-2"
                          >
                            Add New Address
                          </Button>
                        </div>
                      )}

                    {/* New Address Form */}
                    {showNewAddressForm && (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="font-semibold text-deep-forest mb-4">
                          {isAuthenticated
                            ? "Add New Address"
                            : "Enter Shipping Address"}
                        </h3>
                        <form
                          onSubmit={(e) => {
                            if (isAuthenticated) handleSaveAddress(e);
                            else e.preventDefault();
                          }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor="firstName"
                                className="text-sm font-medium text-deep-forest"
                              >
                                First Name
                              </Label>
                              <Input
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                required
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="lastName"
                                className="text-sm font-medium text-deep-forest"
                              >
                                Last Name
                              </Label>
                              <Input
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                required
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor="phone"
                                className="text-sm font-medium text-deep-forest"
                              >
                                Phone
                              </Label>
                              <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="email"
                                className="text-sm font-medium text-deep-forest"
                              >
                                Email
                              </Label>
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label
                              htmlFor="address"
                              className="text-sm font-medium text-deep-forest"
                            >
                              Address
                            </Label>
                            <Textarea
                              id="address"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              required
                              className="mt-1"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label
                                htmlFor="state"
                                className="text-sm font-medium text-deep-forest"
                              >
                                State
                              </Label>
                              <Select
                                value={formData.state}
                                onValueChange={handleStateChange}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                                <SelectContent>
                                  {reactSelectData.map((state) => (
                                    <SelectItem
                                      key={state.name}
                                      value={state.name}
                                    >
                                      {state.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label
                                htmlFor="city"
                                className="text-sm font-medium text-deep-forest"
                              >
                                City
                              </Label>
                              <Select
                                value={formData.city}
                                onValueChange={(city) =>
                                  setFormData({ ...formData, city })
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select city" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableCities.map((city) => (
                                    <SelectItem key={city} value={city}>
                                      {city}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label
                                htmlFor="pincode"
                                className="text-sm font-medium text-deep-forest"
                              >
                                Pincode
                              </Label>
                              <Input
                                id="pincode"
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleInputChange}
                                required
                                className="mt-1"
                              />
                            </div>
                          </div>
                          {isAuthenticated && (
                            <>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="saveForFuture"
                                  name="saveForFuture"
                                  checked={formData.saveForFuture}
                                  onCheckedChange={(checked) =>
                                    setFormData({
                                      ...formData,
                                      saveForFuture: checked as boolean,
                                    })
                                  }
                                />
                                <Label
                                  htmlFor="saveForFuture"
                                  className="text-sm text-deep-forest"
                                >
                                  Save this address for future orders
                                </Label>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="submit"
                                  disabled={addressLoading}
                                  className="bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                  {addressLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                  Save Address
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowNewAddressForm(false)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </>
                          )}
                        </form>
                      </div>
                    )}

                    {isAuthenticated && !showNewAddressForm && (
                      <Button
                        onClick={() => setShowNewAddressForm(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-md px-6 py-2"
                      >
                        Add New Address
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Price Summary */}
              <div className="space-y-6">
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
                <PriceSummary
                  isQuoteLoading={isQuoteLoading}
                  subtotal={subtotal}
                  couponDiscount={discountAmount}
                  welcomeGiftDiscount={welcomeGiftDiscount}
                  shippingCost={shippingCost}
                  finalTotal={finalTotal}
                  totalSavings={totalSavings}
                  isAuthenticated={isAuthenticated}
                  lifetimeSavings={lifetimeSavings}
                  lifetimeSavingsLoading={lifetimeSavingsLoading}
                >
                  <Button
                    onClick={handleProceedToPayment}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-md py-3 font-medium"
                    disabled={
                      loading ||
                      (isAuthenticated
                        ? !selectedAddressId
                        : !isGuestFormValid())
                    }
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      "Proceed to Payment"
                    )}
                  </Button>
                </PriceSummary>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Checkout;
