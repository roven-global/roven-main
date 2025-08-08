import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, ShoppingBag, Trash2, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

import { formatRupees } from '@/lib/currency';
import { useCart } from '@/contexts/CartContext';
import { useGuest } from '@/contexts/GuestContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
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
        applyCoupon,
        removeCoupon,
        clearCoupon
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
                await loadSavedAddresses();
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

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setCouponLoading(true);
        setCouponError('');

        try {
            const subtotal = displayCartItems.reduce((acc, item: any) => acc + (isAuthenticated ? (item.variant?.price || item.productId?.price) : item.price) * item.quantity, 0);
            const success = await applyCoupon(couponCode, subtotal, displayCartItems);
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

    const subtotal = displayCartItems.reduce((acc, item: any) => acc + (isAuthenticated ? (item.variant?.price || item.productId?.price) : item.price) * item.quantity, 0);
    const shippingCost = subtotal > 499 ? 0 : 50;
    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const finalTotal = subtotal + shippingCost - discountAmount;

    if (cartLoading) {
        return (
            <div className="min-h-screen bg-warm-cream flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-sage" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-warm-cream">
            <Navigation />
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left side: Shipping Details */}
                    <div>
                        <h1 className="font-playfair text-3xl font-bold text-deep-forest mb-6">Shipping Information</h1>
                        {isAuthenticated && savedAddresses.length > 0 && (
                            <Card className="bg-white rounded-lg shadow-md mb-6">
                                <CardHeader>
                                    <CardTitle className="text-deep-forest">Select a saved address</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {savedAddresses.map((addr) => (
                                        <div
                                            key={addr._id}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log('Clicking address:', addr._id, 'Current selected:', selectedAddressId);
                                                setSelectedAddressId(addr._id);
                                                setShowNewAddressForm(false);
                                                console.log('Address selected:', addr._id); // Debug log
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                            }}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 select-none ${selectedAddressId === addr._id
                                                ? 'border-sage bg-sage/10 shadow-md'
                                                : 'border-warm-taupe/50 hover:border-sage/50 hover:bg-sage/5'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-deep-forest">{addr.firstName} {addr.lastName}</p>
                                                    <p className="text-forest text-sm">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                                                    <p className="text-forest text-sm">{addr.phone}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {selectedAddressId === addr._id && (
                                                        <div className="text-sage">
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleDeleteAddress(addr._id);
                                                        }}
                                                        className="h-8 w-8 text-warm-taupe hover:text-destructive hover:bg-red-50 rounded-full"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* New Address Form */}
                        {showNewAddressForm && (
                            <Card className="bg-white rounded-lg shadow-md mb-6">
                                <CardHeader>
                                    <CardTitle className="text-deep-forest">Add New Address</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSaveAddress} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="firstName">First Name</Label>
                                                <Input
                                                    id="firstName"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="lastName">Last Name</Label>
                                                <Input
                                                    id="lastName"
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="phone">Phone</Label>
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="address">Address</Label>
                                            <Textarea
                                                id="address"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <Label htmlFor="state">State</Label>
                                                <Select value={formData.state} onValueChange={handleStateChange}>
                                                    <SelectTrigger>
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
                                                <Label htmlFor="city">City</Label>
                                                <Select value={formData.city} onValueChange={(city) => setFormData({ ...formData, city })}>
                                                    <SelectTrigger>
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
                                                <Label htmlFor="pincode">Pincode</Label>
                                                <Input
                                                    id="pincode"
                                                    name="pincode"
                                                    value={formData.pincode}
                                                    onChange={handleInputChange}
                                                    required
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
                                            <Label htmlFor="saveForFuture">Save this address for future orders</Label>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" disabled={addressLoading} className="bg-sage hover:bg-forest text-white">
                                                {addressLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Save Address
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setShowNewAddressForm(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {!showNewAddressForm && (
                            <Button onClick={() => setShowNewAddressForm(true)} className="bg-sage hover:bg-forest text-white">
                                Add New Address
                            </Button>
                        )}
                    </div>

                    {/* Right side: Order Summary */}
                    <div>
                        <h1 className="font-playfair text-3xl font-bold text-deep-forest mb-6">Order Summary</h1>
                        <Card className="bg-white rounded-lg shadow-md">
                            <CardHeader>
                                <CardTitle className="text-deep-forest">Items</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {displayCartItems.map((item: any) => (
                                    <div key={item._id || item.id} className="flex items-center gap-3">
                                        <img
                                            src={isAuthenticated ? item.productId?.images?.[0]?.url : item.image}
                                            alt={isAuthenticated ? item.productId?.name : item.name}
                                            className="w-12 h-12 object-cover rounded-md"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-deep-forest">{isAuthenticated ? item.productId?.name : item.name}</p>
                                            <p className="text-sm text-forest">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-semibold text-deep-forest">
                                            {formatRupees((isAuthenticated ? (item.variant?.price || item.productId?.price) : item.price) * item.quantity)}
                                        </p>
                                    </div>
                                ))}
                                <Separator />

                                {/* Coupon Section */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-deep-forest">Apply Coupon</h3>
                                    {appliedCoupon ? (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-green-800">{appliedCoupon.coupon.code}</p>
                                                    <p className="text-sm text-green-600">{appliedCoupon.coupon.name}</p>
                                                    <p className="text-xs text-green-500">Discount: {formatRupees(appliedCoupon.discountAmount)}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleRemoveCoupon}
                                                    className="text-green-600 hover:text-green-700"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Enter coupon code"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    onClick={handleApplyCoupon}
                                                    disabled={couponLoading || !couponCode.trim()}
                                                    className="bg-sage hover:bg-forest text-white"
                                                >
                                                    {couponLoading ? 'Applying...' : 'Apply'}
                                                </Button>
                                            </div>
                                            {couponError && (
                                                <p className="text-sm text-red-600">{couponError}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Price Summary */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>{formatRupees(subtotal)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Coupon Discount</span>
                                            <span>-{formatRupees(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>Shipping</span>
                                        <span>{shippingCost === 0 ? 'Free' : formatRupees(shippingCost)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>{formatRupees(finalTotal)}</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleProceedToPayment}
                                    disabled={loading || !selectedAddressId}
                                    className="w-full bg-sage hover:bg-forest text-white"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Proceed to Payment'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Checkout; 