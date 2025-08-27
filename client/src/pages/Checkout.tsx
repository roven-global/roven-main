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
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear the error for the field being edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleStateChange = (stateName: string) => {
    setFormData({ ...formData, state: stateName, city: "" });
    setAvailableCities([...getCitiesByState(stateName)]);
    if (errors.state) {
      setErrors({ ...errors, state: "", city: "" });
    }
  };

  const validateFormData = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim() || formData.firstName.length < 2)
      newErrors.firstName = "First name must be at least 2 characters.";
    if (!/^[a-zA-Z\s]+$/.test(formData.firstName))
      newErrors.firstName = "First name can only contain letters.";
    if (!formData.lastName.trim() || formData.lastName.length < 2)
      newErrors.lastName = "Last name must be at least 2 characters.";
    if (!/^[a-zA-Z\s]+$/.test(formData.lastName))
      newErrors.lastName = "Last name can only contain letters.";
    if (!/^[0-9]{10}$/.test(formData.phone))
      newErrors.phone = "Phone number must be exactly 10 digits.";
    if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)
    )
      newErrors.email = "Please enter a valid email address.";
    if (formData.address.trim().length < 10)
      newErrors.address = "Address must be at least 10 characters long.";
    if (!formData.state) newErrors.state = "Please select a state.";
    if (!formData.city) newErrors.city = "Please select a city.";
    if (!/^[0-9]{6}$/.test(formData.pincode))
      newErrors.pincode = "Pincode must be exactly 6 digits.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFormData()) {
      toast({
        title: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    setAddressLoading(true);
    try {
      const response = await Axios.post(SummaryApi.saveAddress.url, formData);
      if (response.data.success) {
        toast({ title: "Address saved successfully!" });
        await loadSavedAddresses(); // Reload addresses
        setSelectedAddressId(response.data.data._id); // Select the new address
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
        setErrors({}); // Clear errors
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        toast({
          title: "Validation failed",
          description: "Please check the form for errors.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to save address",
          description:
            error.response?.data?.message || "An unknown error occurred.",
          variant: "destructive",
        });
      }
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
      if (!validateFormData()) {
        toast({
          title: "Please fill out the address form correctly.",
          variant: "destructive",
        });
        return;
      }
      shippingAddress = formData;
    }

    if (!shippingAddress) {
      toast({
        title: "Could not determine shipping address.",
        variant: "destructive",
      });
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
    const { firstName, lastName, phone, email, address, city, state, pincode } =
      formData;
    return !!(
      firstName &&
      lastName &&
      phone &&
      email &&
      address &&
      city &&
      state &&
      pincode
    );
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
              {/* Shipping Address Section - First on mobile, second on desktop */}
              <div className="lg:col-span-2 space-y-6 order-1 lg:order-1">
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
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
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
                                  <div className="text-primary">
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
                                  className="h-8 w-8 text-warm-taupe hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show Add New Address button or form */}
                    {isAuthenticated && !showNewAddressForm ? (
                      <div
                        className={
                          savedAddresses.length === 0 ? "text-center py-4" : ""
                        }
                      >
                        {savedAddresses.length === 0 && (
                          <p className="text-forest mb-4">
                            No saved addresses found.
                          </p>
                        )}
                        <Button
                          onClick={() => setShowNewAddressForm(true)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-6 py-2"
                        >
                          Add New Address
                        </Button>
                      </div>
                    ) : null}

                    {/* New Address Form */}
                    {showNewAddressForm && (
                      <div className="border border-border rounded-lg p-4 bg-muted/20">
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              {errors.firstName && (
                                <p className="text-destructive text-xs mt-1">
                                  {errors.firstName}
                                </p>
                              )}
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
                              {errors.lastName && (
                                <p className="text-destructive text-xs mt-1">
                                  {errors.lastName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              {errors.phone && (
                                <p className="text-destructive text-xs mt-1">
                                  {errors.phone}
                                </p>
                              )}
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
                              {errors.email && (
                                <p className="text-destructive text-xs mt-1">
                                  {errors.email}
                                </p>
                              )}
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
                            {errors.address && (
                              <p className="text-destructive text-xs mt-1">
                                {errors.address}
                              </p>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                              {errors.state && (
                                <p className="text-destructive text-xs mt-1">
                                  {errors.state}
                                </p>
                              )}
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
                              {errors.city && (
                                <p className="text-destructive text-xs mt-1">
                                  {errors.city}
                                </p>
                              )}
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
                              {errors.pincode && (
                                <p className="text-destructive text-xs mt-1">
                                  {errors.pincode}
                                </p>
                              )}
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
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                  {addressLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                  <span className="hidden sm:inline ml-2">
                                    Save Address
                                  </span>
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
                  </div>
                </div>
              </div>

              {/* Right Column - Price Summary - Second on mobile, first on desktop */}
              <div className="space-y-6 lg:col-span-1 order-2 lg:order-2">
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold text-deep-forest flex items-center gap-2">
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
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-3 font-medium"
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
