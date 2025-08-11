import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, ShoppingBag, Trash2, X, Tag, Calendar, Percent, DollarSign, Gift, Truck, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

import { formatRupees } from '@/lib/currency';
import { useCart } from '@/contexts/CartContext';
import { useGuest } from '@/contexts/GuestContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import WelcomeGiftReward from '@/components/WelcomeGiftReward';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { useIndianStatesAndCities } from '@/lib/cities';

const Checkout = () => {
    const navigate = useNavigate();
    const {
        cartItems,
        clearCart,
        refreshCart,
        appliedCoupon,
        appliedWelcomeGift,
        applyCoupon,
        removeCoupon,
        clearCoupon,
        applyWelcomeGift,
        removeWelcomeGift
    } = useCart();
    const { guestCart, clearGuestData } = useGuest();
    const { isAuthenticated, user } = useAuth();
    const { reactSelectData, getCitiesByState } = useIndianStatesAndCities();

    const [loading, setLoading] = useState(false);
    const [addressLoading, setAddressLoading] = useState(false);
    const [cartLoading, setCartLoading] = useState(true);
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', phone: '', email: user?.email || '', address: '',
        city: '', state: '', pincode: '', country: 'India', saveForFuture: true
    });
    const [availableCities, setAvailableCities] = useState<string[]>([]);

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
    const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
    const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null);
    const [lifetimeSavings, setLifetimeSavings] = useState<number>(0);
    const [lifetimeSavingsLoading, setLifetimeSavingsLoading] = useState(false);

    const displayCartItems = isAuthenticated ? cartItems : guestCart;

    useEffect(() => {
        const initialize = async () => {
            if (isAuthenticated) {
                await loadSavedAddresses();
            }
            setCartLoading(false);
        };
        initialize();
    }, [isAuthenticated]); // Removed refreshCart from dependencies to prevent infinite loops

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
                console.error('Error fetching available coupons:', error);
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

    // Separate useEffect for cart refresh
    useEffect(() => {
        if (isAuthenticated) {
            refreshCart();
        }
    }, [isAuthenticated, refreshCart]);

    useEffect(() => {
        if (!cartLoading && displayCartItems.length === 0) {
            navigate('/cart');
        }
    }, [displayCartItems.length, navigate, cartLoading]);

    const loadSavedAddresses = async () => {
        if (!isAuthenticated) return;
        try {
            const response = await Axios.get(SummaryApi.getUserAddresses.url);
            if (response.data.success) {
                const addresses = response.data.data;
                console.log('Loaded addresses:', addresses); // Debug log
                setSavedAddresses(addresses);

                // Only set default address if no address is currently selected
                if (!selectedAddressId) {
                    const defaultAddress = addresses.find((addr: any) => addr.isDefault) || addresses[0];
                    if (defaultAddress) {
                        setSelectedAddressId(defaultAddress._id);
                        console.log('Selected default address:', defaultAddress._id); // Debug log
                    } else {
                        setShowNewAddressForm(true);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading addresses:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleStateChange = (stateName: string) => {
        setFormData({ ...formData, state: stateName, city: '' });
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
                const addressesResponse = await Axios.get(SummaryApi.getUserAddresses.url);
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
                    firstName: '', lastName: '', phone: '', email: user?.email || '', address: '',
                    city: '', state: '', pincode: '', country: 'India', saveForFuture: true
                });
            }
        } catch (error: any) {
            toast({ title: "Failed to save address", description: error.response?.data?.message, variant: "destructive" });
        } finally {
            setAddressLoading(false);
        }
    };

    const handleProceedToPayment = async () => {
        if (!selectedAddressId) {
            toast({ title: "Please select a shipping address.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const selectedAddr = savedAddresses.find(addr => addr._id === selectedAddressId);
            const orderResponse = await Axios.post(SummaryApi.createOrder.url, {
                shippingAddress: selectedAddr,
                paymentMethod: "online",
                couponCode: appliedCoupon ? appliedCoupon.coupon.code : undefined,
                appliedWelcomeGift: appliedWelcomeGift ? {
                    rewardId: appliedWelcomeGift.reward._id,
                    discountAmount: appliedWelcomeGift.discountAmount
                } : undefined,
            });

            if (orderResponse.data.success) {
                isAuthenticated ? clearCart() : clearGuestData();
                clearCoupon(); // Clear coupon after successful order
                navigate(`/payment?orderId=${orderResponse.data.data._id}`);
            }
        } catch (error: any) {
            toast({ title: "Failed to create order", description: error.response?.data?.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAddress = async (addressId: string) => {
        console.log('Deleting address with ID:', addressId);
        try {
            const deleteUrl = SummaryApi.deleteAddress.url.replace(':id', addressId);
            console.log('Delete URL:', deleteUrl);
            const response = await Axios.delete(deleteUrl);

            if (response.data.success) {
                toast({
                    title: "Address deleted successfully",
                    description: "The address has been removed from your saved addresses."
                });

                // Remove the address from local state
                setSavedAddresses(prev => prev.filter(addr => addr._id !== addressId));

                // If the deleted address was selected, clear the selection
                if (selectedAddressId === addressId) {
                    setSelectedAddressId(null);

                    // If there are other addresses, select the first one
                    const remainingAddresses = savedAddresses.filter(addr => addr._id !== addressId);
                    if (remainingAddresses.length > 0) {
                        const defaultAddress = remainingAddresses.find(addr => addr.isDefault) || remainingAddresses[0];
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
                variant: "destructive"
            });
        }
    };

    const handleApplyCoupon = async (code?: string) => {
        const couponToApply = code || couponCode.trim();
        if (!couponToApply) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setCouponLoading(true);
        setCouponError('');

        try {
            const subtotal = displayCartItems.reduce((acc, item: any) => acc + (isAuthenticated ? (item.variant?.price || item.productId?.price) : item.price) * item.quantity, 0);
            const success = await applyCoupon(couponToApply, subtotal, displayCartItems);
            if (success) {
                setCouponCode('');
            }
        } catch (error: any) {
            setCouponError(error.response?.data?.message || 'Invalid coupon code');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        removeCoupon();
        setCouponCode('');
        setCouponError('');
    };

    const scrollLeft = () => {
        if (scrollContainerRef) {
            scrollContainerRef.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef) {
            scrollContainerRef.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    const subtotal = displayCartItems.reduce((acc, item: any) => acc + (isAuthenticated ? (item.variant?.price || item.productId?.price) : item.price) * item.quantity, 0);
    const shippingCost = subtotal > 499 ? 0 : 40;
    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const welcomeGiftDiscount = appliedWelcomeGift ? appliedWelcomeGift.discountAmount : 0;
    const finalTotal = subtotal + shippingCost - discountAmount - welcomeGiftDiscount;

    // Calculate total savings
    const originalShippingCost = 40; // Original shipping cost before free shipping
    const shippingSavings = subtotal > 499 ? originalShippingCost : 0;
    const totalSavings = discountAmount + welcomeGiftDiscount + shippingSavings;

    if (cartLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-warm-cream">
                <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-sage"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-warm-cream">
            <Navigation />

            {/* Breadcrumb Navigation */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Link to="/cart" className="hover:text-gray-900">Cart</Link>
                        <ArrowRight className="w-4 h-4" />
                        <span>Address</span>
                        <ArrowRight className="w-4 h-4" />
                        <span className="text-gray-400">Payment</span>
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
                                            <span className="font-semibold text-gray-900 flex items-center gap-2">
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
                                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${selectedAddressId === addr._id
                                                            ? 'border-orange-500 bg-orange-50'
                                                            : 'border-gray-200 hover:border-orange-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <p className="font-semibold text-gray-900">{addr.firstName} {addr.lastName}</p>
                                                                <p className="text-gray-600 text-sm">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                                                                <p className="text-gray-600 text-sm">{addr.phone}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {selectedAddressId === addr._id && (
                                                                    <div className="text-orange-500">
                                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
                                                                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
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
                                        {isAuthenticated && savedAddresses.length === 0 && !showNewAddressForm && (
                                            <div className="text-center py-4">
                                                <p className="text-gray-600 mb-4">No saved addresses found.</p>
                                                <Button onClick={() => setShowNewAddressForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-md px-6 py-2">
                                                    Add New Address
                                                </Button>
                                            </div>
                                        )}

                                        {/* New Address Form */}
                                        {showNewAddressForm && (
                                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <h3 className="font-semibold text-gray-900 mb-4">Add New Address</h3>
                                                <form onSubmit={handleSaveAddress} className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
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
                                                            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
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
                                                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone</Label>
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
                                                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
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
                                                        <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address</Label>
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
                                                            <Label htmlFor="state" className="text-sm font-medium text-gray-700">State</Label>
                                                            <Select value={formData.state} onValueChange={handleStateChange}>
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue placeholder="Select state" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {reactSelectData.map((state) => (
                                                                        <SelectItem key={state.name} value={state.name}>
                                                                            {state.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
                                                            <Select value={formData.city} onValueChange={(city) => setFormData({ ...formData, city })}>
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
                                                            <Label htmlFor="pincode" className="text-sm font-medium text-gray-700">Pincode</Label>
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
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="saveForFuture"
                                                            name="saveForFuture"
                                                            checked={formData.saveForFuture}
                                                            onCheckedChange={(checked) => setFormData({ ...formData, saveForFuture: checked as boolean })}
                                                        />
                                                        <Label htmlFor="saveForFuture" className="text-sm text-gray-700">Save this address for future orders</Label>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button type="submit" disabled={addressLoading} className="bg-orange-500 hover:bg-orange-600 text-white">
                                                            {addressLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                            Save Address
                                                        </Button>
                                                        <Button type="button" variant="outline" onClick={() => setShowNewAddressForm(false)}>
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}

                                        {!showNewAddressForm && (
                                            <Button onClick={() => setShowNewAddressForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-md px-6 py-2">
                                                Add New Address
                                            </Button>
                                        )}
                                    </div>
                                </div>


                            </div>

                            {/* Right Column - Price Summary */}
                            <div className="space-y-6">
                                {/* Welcome Gift Reward */}
                                <WelcomeGiftReward
                                    subtotal={subtotal}
                                    shippingCost={40}
                                    onRewardApplied={applyWelcomeGift}
                                    onRewardRemoved={removeWelcomeGift}
                                    appliedReward={appliedWelcomeGift?.reward}
                                    isCheckout={true}
                                />

                                <div className="bg-white rounded-lg border shadow-sm sticky top-4">
                                    <div className="p-4 border-b">
                                        <span className="font-semibold text-gray-900 flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5" />
                                            Price Summary
                                        </span>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Order Total</span>
                                            <span className="text-gray-900 font-bold">{formatRupees(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Coupon Discount</span>
                                                <span className="text-green-600 font-bold">-{formatRupees(discountAmount)}</span>
                                            </div>
                                        )}
                                        {welcomeGiftDiscount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Welcome Gift</span>
                                                <span className="text-green-600 font-bold">-{formatRupees(welcomeGiftDiscount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Shipping <span className="text-xs text-gray-400">ⓘ</span></span>
                                            <div className="text-right">
                                                <span className="text-green-600 font-bold">Free</span>
                                                <div className="text-xs text-gray-500 line-through">₹40</div>
                                            </div>
                                        </div>

                                        <Separator />
                                        <div className="flex justify-between font-bold text-lg">
                                            <span className="text-gray-900">To Pay</span>
                                            <span className="text-gray-900">{formatRupees(finalTotal)}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 border-t">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                                            <span className="text-blue-600">✓</span>
                                            <p className="text-sm text-blue-700 font-medium">
                                                You are saving {formatRupees(totalSavings)} on this order
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleProceedToPayment}
                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-md py-3 font-medium"
                                            disabled={loading || !selectedAddressId}
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Processing...
                                                </div>
                                            ) : (
                                                'Proceed to Payment'
                                            )}
                                        </Button>
                                    </div>
                                </div>
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