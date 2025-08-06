import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Info } from 'lucide-react';
import { formatRupees } from '@/lib/currency';
import { useCart } from '@/contexts/CartContext';
import { useGuest } from '@/contexts/GuestContext';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Checkout = () => {
    const navigate = useNavigate();
    const { cartItems } = useCart();
    const { guestCart } = useGuest();
    const { isAuthenticated } = useAuth();

    const displayCartItems = isAuthenticated ? cartItems : guestCart;

    // Redirect to cart if empty
    React.useEffect(() => {
        if (displayCartItems.length === 0) {
            navigate('/cart');
        }
    }, [displayCartItems.length, navigate]);
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
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Check if user is authenticated
        if (!isAuthenticated) {
            // Redirect to login page
            navigate('/login');
            return;
        }

        // Here you would typically save the address and proceed to payment
        navigate('/payment');
    };

    // Calculate totals from cart data
    const orderTotal = isAuthenticated
        ? cartItems.reduce((acc, item) => acc + (item.productId.price * item.quantity), 0)
        : guestCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingCost = orderTotal > 500 ? 0 : 40;
    const onlinePaymentDiscount = orderTotal * 0.05;
    const finalTotal = orderTotal + shippingCost - onlinePaymentDiscount;

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
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50 border-b">
                                <CardTitle className="text-lg font-semibold text-gray-800">Delivery Address</CardTitle>
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
                                                className="border-gray-300 focus:border-orange-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Enter last name"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className="border-gray-300 focus:border-orange-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="Enter phone number"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="border-gray-300 focus:border-orange-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter email address"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="border-gray-300 focus:border-orange-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="address" className="text-sm font-medium text-gray-700">Street Address</Label>
                                        <Textarea
                                            id="address"
                                            placeholder="Enter your street address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className="border-gray-300 focus:border-orange-500"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
                                            <Input
                                                id="city"
                                                placeholder="Enter city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className="border-gray-300 focus:border-orange-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="state" className="text-sm font-medium text-gray-700">State</Label>
                                            <Input
                                                id="state"
                                                placeholder="Enter state"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                className="border-gray-300 focus:border-orange-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="pincode" className="text-sm font-medium text-gray-700">Pincode</Label>
                                            <Input
                                                id="pincode"
                                                placeholder="Enter pincode"
                                                value={formData.pincode}
                                                onChange={handleInputChange}
                                                className="border-gray-300 focus:border-orange-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="country" className="text-sm font-medium text-gray-700">Country</Label>
                                            <Input
                                                id="country"
                                                placeholder="Enter country"
                                                value={formData.country}
                                                onChange={handleInputChange}
                                                className="border-gray-300 focus:border-orange-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-4">
                                        <input type="checkbox" id="saveAddress" className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                                        <Label htmlFor="saveAddress" className="text-sm text-gray-700">
                                            Save this address for future orders
                                        </Label>
                                    </div>
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
                                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    Proceed to Payment
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