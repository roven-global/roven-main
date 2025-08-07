import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Gift, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { Link, useNavigate } from 'react-router-dom';
import { formatRupees } from '@/lib/currency';
import { toast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Cart = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { cartItems, updateQuantity, removeFromCart, fetchUserCart } = useCart();
    const { guestCart, removeFromGuestCart, updateGuestCartQuantity } = useGuest();
    const [loading, setLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
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

    const applyCoupon = () => {
        if (!couponCode.trim()) return;
        const validCoupons = ['ROVEN10', 'WELCOME15'];
        if (validCoupons.includes(couponCode.toUpperCase())) {
            setAppliedCoupon(couponCode.toUpperCase());
            toast({
                title: "Coupon applied successfully!",
            });
        } else {
            toast({
                title: "Invalid coupon code",
                variant: "destructive",
            });
        }
    };

    const displayCartItems = isAuthenticated ? cartItems : guestCart;
    const subtotal = isAuthenticated
        ? cartItems.reduce((acc, item) => acc + ((item.variant?.price || item.productId?.price || 0) * item.quantity), 0)
        : guestCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const shippingCost = subtotal > 499 ? 0 : 50;
    const couponDiscount = appliedCoupon ? subtotal * 0.1 : 0; // Example 10% discount
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
                <h1 className="font-playfair text-4xl font-bold text-deep-forest mb-2 text-center">Your Shopping Cart</h1>
                <p className="text-center text-forest mb-10">Review your items and proceed to checkout.</p>

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
                        <div className="lg:col-span-1 sticky top-24">
                            <Card className="bg-white rounded-lg shadow-lg border border-warm-taupe/50">
                                <CardHeader>
                                    <CardTitle className="font-playfair text-2xl text-deep-forest">Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input placeholder="Coupon Code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="rounded-full" />
                                        <Button variant="outline" className="rounded-full border-sage text-sage hover:bg-sage hover:text-white" onClick={applyCoupon}>Apply</Button>
                                    </div>
                                    <Separator className="bg-warm-taupe/50" />
                                    <div className="space-y-2 text-forest">
                                        <div className="flex justify-between"><span>Subtotal</span><span className="font-medium text-deep-forest">{formatRupees(subtotal)}</span></div>
                                        {appliedCoupon && <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span className="font-medium">-{formatRupees(couponDiscount)}</span></div>}
                                        <div className="flex justify-between"><span>Shipping</span><span className="font-medium text-deep-forest">{shippingCost > 0 ? formatRupees(shippingCost) : 'Free'}</span></div>
                                    </div>
                                    <Separator className="bg-warm-taupe/50" />
                                    <div className="flex justify-between items-center font-bold text-lg text-deep-forest">
                                        <span>Total</span>
                                        <span>{formatRupees(finalTotal)}</span>
                                    </div>
                                    <Button size="lg" className="w-full bg-sage text-white hover:bg-forest rounded-full font-semibold" onClick={() => navigate('/checkout')}>
                                        Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </CardContent>
                            </Card>
                            <div className="mt-6 flex flex-col items-center text-center gap-4 text-sm text-forest">
                                <ShieldCheck className="h-8 w-8 text-sage" />
                                <p>100% Secure Payments</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default Cart;
