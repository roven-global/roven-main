import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, Info, Check, ArrowRight, Trees, Shield, Leaf, MessageCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { Link, useNavigate } from 'react-router-dom';
import { formatRupees } from '@/lib/currency';
import { toast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface Offer {
    id: string;
    title: string;
    code: string;
    description: string;
    savings: string;
    type: 'bogo' | 'discount';
    minItems?: number;
}

const Cart = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { cartItems, updateQuantity, removeFromCart, fetchUserCart } = useCart();
    const { guestCart, removeFromGuestCart, updateGuestCartQuantity } = useGuest();
    const [loading, setLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);

    // Mock offers data - in real app, this would come from backend
    const availableOffers: Offer[] = [
        {
            id: '1',
            title: 'Buy 1 Get 1 Free : Sale is Live',
            code: 'OMG',
            description: 'Add 2 or more eligible items to avail this offer.',
            savings: 'Free Product',
            type: 'bogo',
            minItems: 2
        },
        {
            id: '2',
            title: 'Flat 10% Off + 5% Prepaid Off',
            code: 'REDEEM15',
            description: 'Save ₹39 with this offer',
            savings: '₹39',
            type: 'discount'
        }
    ];

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserCart().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, fetchUserCart]);

    const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        if (isAuthenticated) {
            await updateQuantity(productId, newQuantity);
        } else {
            updateGuestCartQuantity(productId, newQuantity);
        }
    };

    const handleRemoveItem = async (productId: string) => {
        setRemovingId(productId);
        try {
            if (isAuthenticated) {
                await removeFromCart(productId);
            } else {
                removeFromGuestCart(productId);
            }
            toast({
                title: "Success",
                description: "Item removed from cart",
            });
        } catch (error) {
            console.error('Error removing item:', error);
            toast({
                title: "Error",
                description: "Failed to remove item",
                variant: "destructive",
            });
        } finally {
            setRemovingId(null);
        }
    };

    const applyCoupon = () => {
        if (!couponCode.trim()) return;

        // Mock coupon validation - in real app, this would call backend
        const validCoupons = ['SAVE10', 'WELCOME20'];
        if (validCoupons.includes(couponCode.toUpperCase())) {
            setAppliedCoupon(couponCode.toUpperCase());
            toast({
                title: "Success",
                description: "Coupon applied successfully!",
            });
        } else {
            toast({
                title: "Error",
                description: "Invalid coupon code",
                variant: "destructive",
            });
        }
    };

    const applyOffer = (offer: Offer) => {
        if (offer.type === 'bogo' && cartItems.length < (offer.minItems || 2)) {
            toast({
                title: "Cannot Apply",
                description: `Add ${offer.minItems} or more items to avail this offer`,
                variant: "destructive",
            });
            return;
        }

        setAppliedCoupon(offer.code);
        toast({
            title: "Success",
            description: `${offer.title} applied!`,
        });
    };

    const displayCartItems = isAuthenticated ? cartItems : guestCart;
    const subtotal = isAuthenticated
        ? cartItems.reduce((acc, item) => acc + ((item.productId?.price || 0) * item.quantity), 0)
        : guestCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingCost = subtotal > 500 ? 0 : 40;
    const onlinePaymentDiscount = subtotal * 0.05; // 5% discount
    const totalSavings = shippingCost + onlinePaymentDiscount + (appliedCoupon ? 39 : 0);
    const finalTotal = subtotal + shippingCost - onlinePaymentDiscount - (appliedCoupon ? 39 : 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
                            <span className="text-sm font-medium text-primary border-b-2 border-primary pb-1">
                                Cart
                            </span>
                            <span className="text-sm text-gray-500">Address</span>
                            <span className="text-sm text-gray-500">Payment</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Available Offers */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50 border-b">
                                <CardTitle className="text-lg font-semibold text-gray-800">
                                    Available offers for you ({availableOffers.length})
                                </CardTitle>
                                <p className="text-sm text-gray-600">All coupons are applicable on MRP.</p>
                            </CardHeader>
                            <CardContent className="space-y-4 p-6">
                                {availableOffers.map((offer) => (
                                    <div key={offer.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-gray-800">{offer.title}</h3>
                                                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                                                        {offer.code}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{offer.description}</p>
                                                {offer.savings && (
                                                    <p className="text-sm text-green-600 font-medium">
                                                        Save {offer.savings} with this offer
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => applyOffer(offer)}
                                                disabled={appliedCoupon === offer.code}
                                                className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                            >
                                                {appliedCoupon === offer.code ? 'Applied' : 'Apply'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {/* Coupon Code Input */}
                                <div className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                                    <h3 className="font-semibold mb-3 text-gray-800">Have a coupon code?</h3>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter coupon code"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            className="flex-1 border-gray-300 focus:border-orange-500"
                                        />
                                        <Button
                                            onClick={applyCoupon}
                                            disabled={!couponCode.trim()}
                                            className="bg-orange-500 hover:bg-orange-600 text-white"
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Cart Details */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50 border-b">
                                <CardTitle className="text-lg font-semibold text-gray-800">Cart details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {displayCartItems.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <MessageCircle className="h-12 w-12 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h3>
                                        <p className="text-gray-600 mb-6">Add some amazing products to get started!</p>
                                        <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                                            <Link to="/shop">Continue Shopping</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {isAuthenticated ? cartItems.map((item) => (
                                            <div
                                                key={item._id}
                                                className={`flex items-start gap-4 p-4 border border-gray-200 rounded-lg transition-all duration-300 hover:shadow-md ${removingId === item._id ? 'opacity-0' : 'opacity-100'
                                                    }`}
                                            >
                                                <img
                                                    src={item.productId?.images?.[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyMEMyOS41IDIwIDIxIDI4LjUgMjEgMzlDMjEgNDkuNSAyOS41IDU4IDQwIDU4QzUwLjUgNTggNTkgNDkuNSA1OSAzOUM1OSAyOC41IDUwLjUgMjAgNDAgMjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yMCA2MEMyMCA2MCAyNiA1NCA0MCA1NCM1NCA1NCA2MCA2MCA2MCA2MEgyMFoiIGZpbGw9IiM5QjlCQTAiLz4KPC9zdmc+Cg=='}
                                                    alt={item.productId?.name || 'Product'}
                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyMEMyOS41IDIwIDIxIDI4LjUgMjEgMzlDMjEgNDkuNSAyOS41IDU4IDQwIDU4QzUwLjUgNTggNTkgNDkuNSA1OSAzOUM1OSAyOC41IDUwLjUgMjAgNDAgMjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yMCA2MEMyMCA2MCAyNiA1NCA0MCA1NCM1NCA1NCA2MCA2MCA2MCA2MEgyMFoiIGZpbGw9IiM5QjlCQTAiLz4KPC9zdmc+Cg==';
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-sm line-clamp-2 text-gray-800">
                                                        {item.productId?.name || 'Product Name Unavailable'}
                                                    </h3>
                                                    <p className="text-xs text-green-600 mt-1 font-medium">In Stock</p>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 border-gray-300 hover:border-orange-500"
                                                                onClick={() => handleUpdateQuantity(item.productId?._id || '', item.quantity - 1)}
                                                                disabled={item.quantity === 1}
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </Button>
                                                            <span className="font-medium text-sm w-8 text-center text-gray-800">
                                                                {item.quantity}
                                                            </span>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 border-gray-300 hover:border-orange-500"
                                                                onClick={() => handleUpdateQuantity(item.productId?._id || '', item.quantity + 1)}
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-sm text-gray-800">
                                                                {formatRupees((item.productId?.price || 0) * item.quantity)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {item.quantity} | To pay: {formatRupees((item.productId?.price || 0) * item.quantity)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                    onClick={() => handleRemoveItem(item.productId?._id || '')}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )) : guestCart.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`flex items-start gap-4 p-4 border border-gray-200 rounded-lg transition-all duration-300 hover:shadow-md ${removingId === item.id ? 'opacity-0' : 'opacity-100'
                                                    }`}
                                            >
                                                <img
                                                    src={item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyMEMyOS41IDIwIDIxIDI4LjUgMjEgMzlDMjEgNDkuNSAyOS41IDU4IDQwIDU4QzUwLjUgNTggNTkgNDkuNSA1OSAzOUM1OSAyOC41IDUwLjUgMjAgNDAgMjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yMCA2MEMyMCA2MCAyNiA1NCA0MCA1NCM1NCA1NCA2MCA2MCA2MCA2MEgyMFoiIGZpbGw9IiM5QjlCQTAiLz4KPC9zdmc+Cg=='}
                                                    alt={item.name}
                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyMEMyOS41IDIwIDIxIDI4LjUgMjEgMzlDMjEgNDkuNSAyOS41IDU4IDQwIDU4QzUwLjUgNTggNTkgNDkuNSA1OSAzOUM1OSAyOC41IDUwLjUgMjAgNDAgMjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yMCA2MEMyMCA2MCAyNiA1NCA0MCA1NCM1NCA1NCA2MCA2MCA2MCA2MEgyMFoiIGZpbGw9IiM5QjlCQTAiLz4KPC9zdmc+Cg==';
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-sm line-clamp-2 text-gray-800">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-xs text-green-600 mt-1 font-medium">In Stock</p>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 border-gray-300 hover:border-orange-500"
                                                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                                disabled={item.quantity === 1}
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </Button>
                                                            <span className="font-medium text-sm w-8 text-center text-gray-800">
                                                                {item.quantity}
                                                            </span>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 border-gray-300 hover:border-orange-500"
                                                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-sm text-gray-800">
                                                                {formatRupees(item.price * item.quantity)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {item.quantity} | To pay: {formatRupees(item.price * item.quantity)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Goodness Insider */}
                        <Card className="bg-gradient-to-r from-orange-50 via-pink-50 to-rose-50 border-orange-200 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-sm font-bold">GI</span>
                                            </div>
                                            <h3 className="font-bold text-xl text-gray-800">Save ₹238 with Goodness Insider</h3>
                                        </div>
                                        <ul className="space-y-2 text-sm text-gray-700 mb-6">
                                            <li className="flex items-center gap-3">
                                                <Check className="h-5 w-5 text-green-600" />
                                                Get 2 FREE products with every order
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <Check className="h-5 w-5 text-green-600" />
                                                Unlimited FREE shipping on every order
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <Check className="h-5 w-5 text-green-600" />
                                                Exclusive Pre-Sale Access specially for you
                                            </li>
                                        </ul>
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-gray-800">Membership Plan</label>
                                            <select className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
                                                <option>6 Months ₹149</option>
                                                <option>12 Months ₹249</option>
                                            </select>
                                            <Button variant="link" className="p-0 h-auto text-sm text-orange-600 hover:text-orange-700">
                                                Add plan and select your free gifts
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Price Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-8 border-0 shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50 border-b">
                                <CardTitle className="text-lg font-semibold text-gray-800">Price Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700">Order Total</span>
                                        <span className="font-semibold text-gray-800">{formatRupees(subtotal)}</span>
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
                                    <Separator className="bg-gray-200" />
                                    <div className="flex justify-between items-center text-lg font-bold text-gray-800">
                                        <span>To Pay</span>
                                        <span>{formatRupees(finalTotal)}</span>
                                    </div>
                                </div>

                                {/* Savings Notification */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <Check className="h-5 w-5 text-green-600" />
                                        <span className="text-sm font-medium text-green-800">
                                            You are saving {formatRupees(totalSavings)} on this order
                                        </span>
                                    </div>
                                </div>

                                <Button asChild size="lg" className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                                    <Link to="/checkout">Add address</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Why Shimmer Section */}
                <div className="mt-16">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 font-playfair">Why Choose Shimmer?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="text-center p-8 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                                    <Trees className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <h3 className="font-semibold text-xl mb-3 text-gray-800">Shop with purpose</h3>
                            <p className="text-sm text-gray-600 mb-6">TREE planted with every purchase</p>
                            <div className="text-left">
                                <p className="text-xs font-medium mb-3 text-gray-700">How it works</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>Place an order</span>
                                    <ArrowRight className="h-3 w-3" />
                                    <span>Order get delivered</span>
                                    <ArrowRight className="h-3 w-3" />
                                    <span>We plant a tree</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="text-center p-8 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                                    <Shield className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <h3 className="font-semibold text-xl mb-3 text-gray-800">100% Made Safe</h3>
                            <p className="text-sm text-gray-600 mb-6">With super safe standard</p>
                            <div className="text-left">
                                <p className="text-xs font-medium mb-3 text-gray-700">What does it mean</p>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                    <div>Safe ingredients</div>
                                    <div>No harmful</div>
                                    <div>Ecosystem focused</div>
                                    <div>Best of nature</div>
                                </div>
                            </div>
                        </Card>

                        <Card className="text-center p-8 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                                    <Leaf className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <h3 className="font-semibold text-xl mb-3 text-gray-800">Natural & Organic</h3>
                            <p className="text-sm text-gray-600">With natural ingredients</p>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Chat Support */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button size="icon" className="h-14 w-14 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300">
                    <MessageCircle className="h-7 w-7 text-white" />
                </Button>
            </div>

            <Footer />
        </div>
    );
};

export default Cart; 