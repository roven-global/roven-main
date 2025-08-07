import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Info, Loader2, Save } from 'lucide-react';
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
    const { cartItems, clearCart, fetchUserCart, refreshCart } = useCart();
    const { guestCart } = useGuest();
    const { isAuthenticated, user } = useAuth();

    // Add this hook to get states and cities data
    const { reactSelectData, getCitiesByState } = useIndianStatesAndCities();

    const [loading, setLoading] = useState(false);
    const [addressLoading, setAddressLoading] = useState(false);
    const [cartLoading, setCartLoading] = useState(true);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [addressSaved, setAddressSaved] = useState(false);
    const [availableCities, setAvailableCities] = useState<string[]>([]);

    const displayCartItems = isAuthenticated ? cartItems : guestCart;

    // Fetch cart data when component mounts
    useEffect(() => {
        const initializeCart = async () => {
            if (isAuthenticated) {
                try {
                    await refreshCart(); // Use refreshCart to ensure cart is up to date
                } catch (error) {
                    console.error('Error fetching cart:', error);
                }
            }
            setCartLoading(false);
        };

        initializeCart();
    }, [isAuthenticated, refreshCart]);

    // Redirect to cart if empty (only after cart is loaded)
    useEffect(() => {
        if (!cartLoading && displayCartItems.length === 0) {
            navigate('/cart');
        }
    }, [displayCartItems.length, navigate, cartLoading]);

    // Load saved addresses if user is authenticated
    useEffect(() => {
        if (isAuthenticated) {
            loadSavedAddresses();
        }
    }, [isAuthenticated]);

    const loadSavedAddresses = async () => {
        try {
            const response = await Axios({
                method: SummaryApi.getUserAddresses.method,
                url: SummaryApi.getUserAddresses.url,
            });
            if (response.data.success) {
                setSavedAddresses(response.data.data);
                // Set default address if available
                const defaultAddress = response.data.data.find(addr => addr.isDefault);
                if (defaultAddress) {
                    setSelectedAddress(defaultAddress);
                    setFormData({
                        firstName: defaultAddress.firstName,
                        lastName: defaultAddress.lastName,
                        phone: defaultAddress.phone,
                        email: defaultAddress.email,
                        address: defaultAddress.address,
                        city: defaultAddress.city,
                        state: defaultAddress.state,
                        pincode: defaultAddress.pincode,
                        country: defaultAddress.country
                    });

                    // Update available cities for the default state using utility
                    const cities = getCitiesByState(defaultAddress.state);
                    setAvailableCities([...cities]);

                    // Mark address as saved when default address is loaded
                    setAddressSaved(true);
                }
            }
        } catch (error) {
            console.error('Error loading addresses:', error);
        }
    };

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData({
            ...formData,
            [id]: value
        });

        // Clear validation error for this field when user starts typing
        if (validationErrors[id]) {
            setValidationErrors(prev => ({
                ...prev,
                [id]: ''
            }));
        }

        // Reset address saved status when user modifies the form
        if (addressSaved) {
            setAddressSaved(false);
        }
    };

    const handleStateChange = (stateName: string) => {
        setFormData({
            ...formData,
            state: stateName,
            city: '' // Reset city when state changes
        });

        // Update available cities for the selected state using the utility
        const cities = getCitiesByState(stateName);
        setAvailableCities([...cities]); // Convert readonly array to regular array

        // Clear validation errors
        if (validationErrors.state) {
            setValidationErrors(prev => ({
                ...prev,
                state: ''
            }));
        }
        if (validationErrors.city) {
            setValidationErrors(prev => ({
                ...prev,
                city: ''
            }));
        }

        // Reset address saved status
        if (addressSaved) {
            setAddressSaved(false);
        }
    };

    const handleCityChange = (cityName: string) => {
        setFormData({
            ...formData,
            city: cityName
        });

        // Clear validation error
        if (validationErrors.city) {
            setValidationErrors(prev => ({
                ...prev,
                city: ''
            }));
        }

        // Reset address saved status
        if (addressSaved) {
            setAddressSaved(false);
        }
    };

    const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        // Only allow numbers and limit to 6 digits
        const numericValue = value.replace(/\D/g, '').slice(0, 6);

        setFormData({
            ...formData,
            pincode: numericValue
        });

        // Clear validation error
        if (validationErrors.pincode) {
            setValidationErrors(prev => ({
                ...prev,
                pincode: ''
            }));
        }

        // Reset address saved status
        if (addressSaved) {
            setAddressSaved(false);
        }
    };

    const handleAddressSelect = (address) => {
        setSelectedAddress(address);
        setFormData({
            firstName: address.firstName,
            lastName: address.lastName,
            phone: address.phone,
            email: address.email,
            address: address.address,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country
        });

        // Update available cities for the selected state using utility
        const cities = getCitiesByState(address.state);
        setAvailableCities([...cities]);

        // Mark address as saved when selecting a saved address
        setAddressSaved(true);
        // Clear any validation errors
        setValidationErrors({});
    };

    const handleSaveAddress = async () => {
        // Clear previous validation errors
        setValidationErrors({});

        // Validate form data
        if (!formData.firstName || !formData.lastName || !formData.phone ||
            !formData.email || !formData.address || !formData.city ||
            !formData.state || !formData.pincode) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        setAddressLoading(true);

        try {
            const saveForFuture = (document.getElementById('saveAddress') as HTMLInputElement)?.checked;

            await Axios({
                method: SummaryApi.saveAddress.method,
                url: SummaryApi.saveAddress.url,
                data: {
                    ...formData,
                    saveForFuture: saveForFuture ? "true" : "false"
                }
            });

            setAddressSaved(true);
            toast({
                title: "Success",
                description: "Address saved successfully!",
            });

            // Reload saved addresses to show the new one
            await loadSavedAddresses();

        } catch (error: any) {
            console.error('Error saving address:', error);

            // Handle validation errors from address save
            if (error.response?.data?.errors) {
                setValidationErrors(error.response.data.errors);
            } else {
                toast({
                    title: "Error",
                    description: error.response?.data?.message || "Failed to save address",
                    variant: "destructive",
                });
            }
        } finally {
            setAddressLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check if user is authenticated
        if (!isAuthenticated) {
            // Redirect to home page
            navigate('/');
            return;
        }

        // Refresh cart before proceeding to ensure we have the latest data
        try {
            await refreshCart();
        } catch (error) {
            console.error('Error refreshing cart:', error);
        }

        // Check if cart is still empty after refresh
        if (cartItems.length === 0) {
            toast({
                title: "Error",
                description: "Your cart is empty. Please add items before proceeding.",
                variant: "destructive",
            });
            navigate('/cart');
            return;
        }

        // Validate form data
        if (!formData.firstName || !formData.lastName || !formData.phone ||
            !formData.email || !formData.address || !formData.city ||
            !formData.state || !formData.pincode) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            // Create order
            const orderResponse = await Axios({
                method: SummaryApi.createOrder.method,
                url: SummaryApi.createOrder.url,
                data: {
                    shippingAddress: formData,
                    paymentMethod: "online",
                    notes: ""
                }
            });

            if (orderResponse.data.success) {
                // Clear cart after successful order creation
                clearCart();

                toast({
                    title: "Success",
                    description: "Order created successfully!",
                });

                // Navigate to payment page with order ID
                navigate(`/payment?orderId=${orderResponse.data.data._id}`);
            }
        } catch (error: any) {
            console.error('Error creating order:', error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create order",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals from cart data
    const orderTotal = isAuthenticated
        ? cartItems.reduce((acc, item) => acc + (item.productId.price * item.quantity), 0)
        : guestCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingCost = orderTotal > 500 ? 0 : 40;
    const onlinePaymentDiscount = orderTotal * 0.05;
    const finalTotal = orderTotal + shippingCost - onlinePaymentDiscount;

    // Show loading state while cart is being fetched
    if (cartLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-gray-600">Loading your cart...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            {/* Header Navigation */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center h-16">
                        <div className="flex items-center space-x-8">
                            <Link to="/cart" className="text-sm text-gray-500 hover:text-primary">
                                Cart
                            </Link>
                            <span className="text-sm font-medium text-primary border-b-2 border-primary pb-1">
                                Address
                            </span>
                            <span className="text-sm text-gray-500">Payment</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/cart">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-800 font-playfair">Shipping Address</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Address Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Saved Addresses */}
                        {isAuthenticated && savedAddresses.length > 0 && (
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                                    <CardTitle className="text-lg font-semibold text-gray-800">Saved Addresses</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {savedAddresses.map((address) => (
                                            <div
                                                key={address._id}
                                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedAddress?._id === address._id
                                                    ? 'border-orange-500 bg-orange-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                onClick={() => handleAddressSelect(address)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">
                                                            {address.firstName} {address.lastName}
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            {address.phone}
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            {address.address}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            {address.city}, {address.state} {address.pincode}
                                                        </div>
                                                    </div>
                                                    {address.isDefault && (
                                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50 border-b">
                                <CardTitle className="text-lg font-semibold text-gray-800">
                                    {isAuthenticated && savedAddresses.length > 0 ? 'New Delivery Address' : 'Delivery Address'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                                            <Input
                                                id="firstName"
                                                placeholder="Enter first name"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className={`border-gray-300 focus:border-orange-500 ${validationErrors.firstName ? 'border-red-500' : ''}`}
                                                required
                                            />
                                            {validationErrors.firstName && <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Enter last name"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className={`border-gray-300 focus:border-orange-500 ${validationErrors.lastName ? 'border-red-500' : ''}`}
                                                required
                                            />
                                            {validationErrors.lastName && <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="Enter phone number"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className={`border-gray-300 focus:border-orange-500 ${validationErrors.phone ? 'border-red-500' : ''}`}
                                            required
                                        />
                                        {validationErrors.phone && <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter email address"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`border-gray-300 focus:border-orange-500 ${validationErrors.email ? 'border-red-500' : ''}`}
                                            required
                                        />
                                        {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="address" className="text-sm font-medium text-gray-700">Street Address</Label>
                                        <Textarea
                                            id="address"
                                            placeholder="Enter your street address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className={`border-gray-300 focus:border-orange-500 ${validationErrors.address ? 'border-red-500' : ''}`}
                                            required
                                        />
                                        {validationErrors.address && <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
                                            <Select onValueChange={handleCityChange} defaultValue={formData.city} value={formData.city}>
                                                <SelectTrigger className="border-gray-300 focus:border-orange-500">
                                                    <SelectValue placeholder="Select a city" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableCities.map(city => (
                                                        <SelectItem key={city} value={city}>{city}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {validationErrors.city && <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor="state" className="text-sm font-medium text-gray-700">State</Label>
                                            <Select onValueChange={handleStateChange} defaultValue={formData.state} value={formData.state}>
                                                <SelectTrigger className="border-gray-300 focus:border-orange-500">
                                                    <SelectValue placeholder="Select a state" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {reactSelectData.map(state => (
                                                        <SelectItem key={state.name} value={state.name}>{state.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {validationErrors.state && <p className="text-red-500 text-xs mt-1">{validationErrors.state}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="pincode" className="text-sm font-medium text-gray-700">Pincode</Label>
                                            <Input
                                                id="pincode"
                                                placeholder="Enter 6-digit pincode"
                                                value={formData.pincode}
                                                onChange={handlePincodeChange}
                                                className={`border-gray-300 focus:border-orange-500 ${validationErrors.pincode ? 'border-red-500' : ''}`}
                                                required
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Enter your 6-digit postal code</p>
                                            {validationErrors.pincode && <p className="text-red-500 text-xs mt-1">{validationErrors.pincode}</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor="country" className="text-sm font-medium text-gray-700">Country</Label>
                                            <Select onValueChange={(value) => setFormData({ ...formData, country: value })} defaultValue={formData.country} value={formData.country}>
                                                <SelectTrigger className="border-gray-300 focus:border-orange-500">
                                                    <SelectValue placeholder="Select country" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="India">India</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {validationErrors.country && <p className="text-red-500 text-xs mt-1">{validationErrors.country}</p>}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-4">
                                        <input type="checkbox" id="saveAddress" className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                                        <Label htmlFor="saveAddress" className="text-sm text-gray-700">
                                            Save this address for future orders
                                        </Label>
                                    </div>

                                    {/* Address Saved Indicator */}
                                    {addressSaved && (
                                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-green-700 font-medium">
                                                {selectedAddress ?
                                                    "Address selected! You can now proceed to payment." :
                                                    "Address saved successfully! You can now proceed to payment."
                                                }
                                            </span>
                                        </div>
                                    )}

                                    {/* Save Address Button */}
                                    <Button
                                        type="button"
                                        onClick={handleSaveAddress}
                                        size="lg"
                                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                        disabled={addressLoading}
                                    >
                                        {addressLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving Address...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Address
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Delivery Info */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50 border-b">
                                <CardTitle className="text-lg font-semibold text-gray-800">Delivery Information</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">Free Delivery</p>
                                        <p className="text-sm text-gray-600">Standard delivery within 3-5 business days</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">Easy Returns</p>
                                        <p className="text-sm text-gray-600">30-day return policy for unused items</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">Secure Payment</p>
                                        <p className="text-sm text-gray-600">100% secure payment processing</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-8 border-0 shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50 border-b">
                                <CardTitle className="text-lg font-semibold text-gray-800">Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700">Order Total</span>
                                        <span className="font-semibold text-gray-800">{formatRupees(orderTotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-700">Shipping</span>
                                            <Info className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-green-600 font-semibold">Free</span>
                                            <span className="text-gray-400 line-through ml-1">₹40</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-green-600">
                                        <span>5% online payment discount</span>
                                        <span>-{formatRupees(onlinePaymentDiscount)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex justify-between items-center text-lg font-bold text-gray-800">
                                            <span>To Pay</span>
                                            <span>{formatRupees(finalTotal)}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSubmit}
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loading || !addressSaved}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : !addressSaved ? (
                                        "Please Save Address First"
                                    ) : (
                                        "Proceed to Payment"
                                    )}
                                </Button>

                                {!addressSaved && (
                                    <p className="text-sm text-gray-500 text-center mt-2">
                                        Please save your address before proceeding to payment
                                    </p>
                                )}
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