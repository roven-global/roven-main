import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Gift, ShieldCheck, Truck, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { Link, useNavigate } from 'react-router-dom';
import { formatRupees } from '@/lib/currency';
import { toast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';

const Cart = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const {
        cartItems,
        updateQuantity,
        removeFromCart,
        fetchUserCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon
    } = useCart();
    const { guestCart, removeFromGuestCart, updateGuestCartQuantity } = useGuest();
    const [loading, setLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserCart().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, fetchUserCart]);

    const handleUpdateQuantity = async (cartItemId: string, newQuantity: number, variant?: { volume: string; sku: string }) => {
        if (newQuantity < 1) return;
        if (isAuthenticated) {
            await updateQuantity(cartItemId, newQuantity);
        } else {
            updateGuestCartQuantity(cartItemId, newQuantity, variant);
        }
    };

    const handleRemoveItem = async (cartItemId: string, variant?: { volume: string; sku: string }) => {
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

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setCouponLoading(true);
        setCouponError('');

        try {
            const displayCartItems = isAuthenticated ? cartItems : guestCart;
            const subtotal = isAuthenticated
                ? cartItems.reduce((acc, item) => acc + ((item.variant?.price || item.productId?.price || 0) * item.quantity), 0)
                : guestCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

            const success = await applyCoupon(couponCode, subtotal, displayCartItems);
            if (success) {
                setCouponCode('');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Invalid coupon code";
            setCouponError(errorMessage);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        removeCoupon();
        setCouponError('');
    };

    const displayCartItems = isAuthenticated ? cartItems : guestCart;
    const subtotal = isAuthenticated
        ? cartItems.reduce((acc, item) => acc + ((item.variant?.price || item.productId?.price || 0) * item.quantity), 0)
        : guestCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const shippingCost = subtotal > 499 ? 0 : 50;
    const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const finalTotal = subtotal - couponDiscount + shippingCost;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-warm-cream">
                <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-sage"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-warm-cream">
            <Navigation />
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-2 mb-8">
                        <ShoppingBag className="w-6 h-6 text-sage" />
                        <h1 className="text-3xl font-bold text-deep-forest">Shopping Cart</h1>
                    </div>

                    {displayCartItems.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-lg shadow-md">
                            <ShoppingBag className="h-16 w-16 text-warm-taupe mx-auto mb-4" />
                            <h2 className="text-2xl font-semibold text-deep-forest mb-2">Your cart is empty</h2>
                            <p className="text-forest mb-6">Looks like you haven't added anything to your cart yet.</p>
                            <Button asChild size="lg" className="bg-sage text-white hover:bg-forest rounded-full">
                                <Link to="/shop">Continue Shopping</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {/* Cart Items */}
                            <div className="lg:col-span-2 space-y-4">
                                {displayCartItems.map((item: any) => (
                                    <Card key={item._id || `${item.id}-${JSON.stringify(item.variant)}`} className={`flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm transition-opacity duration-300 ${removingId === (item._id || item.id) ? 'opacity-50' : ''}`}>
                                        <img
                                            src={isAuthenticated ? item.productId?.images?.[0]?.url : item.image}
                                            alt={isAuthenticated ? item.productId?.name : item.name}
                                            className="w-24 h-24 object-cover rounded-md border border-soft-beige"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-deep-forest line-clamp-2">
                                                {isAuthenticated ? item.productId?.name : item.name}
                                            </h3>
                                            {item.variant && <p className="text-sm text-forest">{item.variant.volume}</p>}
                                            <p className="text-sage font-semibold mt-1">
                                                {formatRupees(isAuthenticated ? (item.variant?.price || item.productId?.price) : item.price)} each
                                            </p>
                                            <div className="flex items-center justify-between mt-3">
                                                <div className="flex items-center gap-2 border border-warm-taupe rounded-full p-1">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => handleUpdateQuantity(item._id || item.id, item.quantity - 1, item.variant)} disabled={item.quantity === 1}>
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="font-medium text-sm w-8 text-center">{item.quantity}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => handleUpdateQuantity(item._id || item.id, item.quantity + 1, item.variant)}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <p className="font-semibold text-deep-forest">
                                                    {formatRupees((isAuthenticated ? (item.variant?.price || item.productId?.price) : item.price) * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-warm-taupe hover:text-destructive hover:bg-red-50 rounded-full" onClick={() => handleRemoveItem(item._id || item.id, item.variant)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </Card>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Gift className="w-5 h-5 text-sage" />
                                            Apply Coupon
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
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
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Order Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>{formatRupees(subtotal)}</span>
                                        </div>
                                        {couponDiscount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Coupon Discount</span>
                                                <span>-{formatRupees(couponDiscount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>Shipping</span>
                                            <span>{shippingCost === 0 ? 'Free' : formatRupees(shippingCost)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between font-semibold text-lg">
                                            <span>Total</span>
                                            <span>{formatRupees(finalTotal)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-forest">
                                            <ShieldCheck className="w-4 h-4" />
                                            <span>Secure checkout</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-forest">
                                            <Truck className="w-4 h-4" />
                                            <span>Free shipping on orders above ₹499</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Button
                                    onClick={() => navigate('/checkout')}
                                    className="w-full bg-sage hover:bg-forest text-white"
                                    disabled={displayCartItems.length === 0}
                                >
                                    Proceed to Checkout
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Cart;
