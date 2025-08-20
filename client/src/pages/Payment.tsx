import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Info, CreditCard, Lock, Shield, Loader2 } from 'lucide-react';
import { formatRupees } from '@/lib/currency';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { toast } from "@/hooks/use-toast";


const Payment = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            toast({
                title: "Error",
                description: "No order ID found. Redirecting to home.",
                variant: "destructive",
            });
            navigate('/');
            return;
        }

        const fetchOrder = async () => {
            try {
                setLoading(true);
                const response = await Axios.get(SummaryApi.getOrderById.url.replace(':id', orderId));
                if (response.data.success) {
                    setOrder(response.data.data);
                } else {
                    toast({
                        title: "Error",
                        description: response.data.message || "Failed to fetch order details.",
                        variant: "destructive",
                    });
                    navigate('/');
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: "An error occurred while fetching your order. Please try again.",
                    variant: "destructive",
                });
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, navigate]);
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardData, setCardData] = useState({
        cardNumber: '',
        cardHolder: '',
        expiry: '',
        cvv: ''
    });

    const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCardData({
            ...cardData,
            [e.target.id]: e.target.value
        });
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically process the payment
        // For now, just show a success message and redirect
        alert('Payment successful! Your order has been placed.');
        navigate('/');
    };

    // Use authoritative totals from the fetched order
    const orderTotal = order?.subtotal ?? 0;
    const shippingCost = order?.shippingCost ?? 0;
    const totalDiscount = (order?.discount ?? 0) + (order?.welcomeGiftDiscount ?? 0);
    const finalTotal = order?.total ?? 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />
                <div className="flex items-center justify-center py-48">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                <Footer />
            </div>
        );
    }

    if (!order) {
        // This case is mostly handled by the useEffect redirect, but it's a good fallback.
        return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />
                <div className="flex items-center justify-center py-48">
                    <p className="text-red-500">Could not load order details.</p>
                </div>
                <Footer />
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
                            <Link to="/checkout" className="text-sm text-gray-500 hover:text-primary">
                                Address
                            </Link>
                            <span className="text-sm font-medium text-primary border-b-2 border-primary pb-1">
                                Payment
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/checkout">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-800 font-serif">Payment</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Payment Methods */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payment Methods */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50 border-b">
                                <CardTitle className="text-lg font-semibold text-gray-800">Payment Method</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Credit/Debit Card */}
                                    <div className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                                        <div className="flex items-center gap-3 mb-4">
                                            <input
                                                type="radio"
                                                id="card"
                                                name="paymentMethod"
                                                value="card"
                                                checked={paymentMethod === 'card'}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="text-orange-500 focus:ring-orange-500"
                                            />
                                            <CreditCard className="h-5 w-5 text-gray-600" />
                                            <Label htmlFor="card" className="font-medium text-gray-800">Credit/Debit Card</Label>
                                        </div>

                                        {paymentMethod === 'card' && (
                                            <form onSubmit={handlePayment} className="space-y-4">
                                                <div>
                                                    <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">Card Number</Label>
                                                    <Input
                                                        id="cardNumber"
                                                        placeholder="1234 5678 9012 3456"
                                                        value={cardData.cardNumber}
                                                        onChange={handleCardInputChange}
                                                        className="border-gray-300 focus:border-orange-500"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="cardHolder" className="text-sm font-medium text-gray-700">Card Holder Name</Label>
                                                    <Input
                                                        id="cardHolder"
                                                        placeholder="John Doe"
                                                        value={cardData.cardHolder}
                                                        onChange={handleCardInputChange}
                                                        className="border-gray-300 focus:border-orange-500"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="expiry" className="text-sm font-medium text-gray-700">Expiry Date</Label>
                                                        <Input
                                                            id="expiry"
                                                            placeholder="MM/YY"
                                                            value={cardData.expiry}
                                                            onChange={handleCardInputChange}
                                                            className="border-gray-300 focus:border-orange-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">CVV</Label>
                                                        <Input
                                                            id="cvv"
                                                            placeholder="123"
                                                            value={cardData.cvv}
                                                            onChange={handleCardInputChange}
                                                            className="border-gray-300 focus:border-orange-500"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </form>
                                        )}
                                    </div>

                                    {/* UPI */}
                                    <div className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                id="upi"
                                                name="paymentMethod"
                                                value="upi"
                                                checked={paymentMethod === 'upi'}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="text-orange-500 focus:ring-orange-500"
                                            />
                                            <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">UPI</span>
                                            </div>
                                            <Label htmlFor="upi" className="font-medium text-gray-800">UPI</Label>
                                        </div>
                                    </div>

                                    {/* Net Banking */}
                                    <div className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                id="netbanking"
                                                name="paymentMethod"
                                                value="netbanking"
                                                checked={paymentMethod === 'netbanking'}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="text-orange-500 focus:ring-orange-500"
                                            />
                                            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">NB</span>
                                            </div>
                                            <Label htmlFor="netbanking" className="font-medium text-gray-800">Net Banking</Label>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Security Info */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50 border-b">
                                <CardTitle className="text-lg font-semibold text-gray-800">Security & Privacy</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                        <Lock className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">256-bit SSL Encryption</p>
                                        <p className="text-sm text-gray-600">Your payment information is encrypted and secure</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                        <Shield className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">PCI DSS Compliant</p>
                                        <p className="text-sm text-gray-600">We follow industry security standards</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">No Card Data Storage</p>
                                        <p className="text-sm text-gray-600">We don't store your card details on our servers</p>
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
                                        <span className="text-gray-700">Shipping</span>
                                        <span className="font-semibold text-gray-800">{shippingCost > 0 ? formatRupees(shippingCost) : 'Free'}</span>
                                    </div>
                                    {totalDiscount > 0 && (
                                        <div className="flex justify-between items-center text-green-600">
                                            <span>Total Discount</span>
                                            <span>-{formatRupees(totalDiscount)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex justify-between items-center text-lg font-bold text-gray-800">
                                            <span>To Pay</span>
                                            <span>{formatRupees(finalTotal)}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handlePayment}
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    Pay {formatRupees(finalTotal)}
                                </Button>

                                <p className="text-xs text-gray-500 text-center">
                                    By clicking "Pay", you agree to our Terms of Service and Privacy Policy
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Payment; 