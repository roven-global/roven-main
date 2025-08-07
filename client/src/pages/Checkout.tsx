import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, ShoppingBag } from 'lucide-react';
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
    const { cartItems, clearCart, refreshCart } = useCart();
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
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleStateChange = (stateName: string) => {
        setFormData(prev => ({ ...prev, state: stateName, city: '' }));
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
            });

            if (orderResponse.data.success) {
                isAuthenticated ? clearCart() : clearGuestData();
                navigate(`/payment?orderId=${orderResponse.data.data._id}`);
            }
        } catch (error: any) {
            toast({ title: "Failed to create order", description: error.response?.data?.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const subtotal = displayCartItems.reduce((acc, item: any) => acc + (isAuthenticated ? (item.variant?.price || item.productId?.price) : item.price) * item.quantity, 0);
    const shippingCost = subtotal > 499 ? 0 : 50;
    const finalTotal = subtotal + shippingCost;

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
                                    {selectedAddressId && (
                                        <p className="text-sm text-forest">Selected address ID: {selectedAddressId}</p>
                                    )}
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
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            console.log('Button clicked for address:', addr._id);
                                                            setSelectedAddressId(addr._id);
                                                            setShowNewAddressForm(false);
                                                        }}
                                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${selectedAddressId === addr._id
                                                            ? 'bg-sage text-white'
                                                            : 'bg-warm-taupe/20 text-forest hover:bg-sage/20'
                                                            }`}
                                                    >
                                                        {selectedAddressId === addr._id ? 'Selected' : 'Select'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="link" onClick={() => setShowNewAddressForm(!showNewAddressForm)}>
                                        {showNewAddressForm ? 'Cancel' : '+ Add a new address'}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {(showNewAddressForm || !isAuthenticated || savedAddresses.length === 0) && (
                            <Card className="bg-white rounded-lg shadow-md">
                                <CardHeader>
                                    <CardTitle>Enter your shipping details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSaveAddress} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" value={formData.firstName} onChange={handleInputChange} required /></div>
                                            <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" value={formData.lastName} onChange={handleInputChange} required /></div>
                                        </div>
                                        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={handleInputChange} required /></div>
                                        <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={formData.phone} onChange={handleInputChange} required /></div>
                                        <div><Label htmlFor="address">Address</Label><Textarea id="address" value={formData.address} onChange={handleInputChange} required /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="state">State</Label>
                                                <Select onValueChange={handleStateChange} value={formData.state}><SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                                                    <SelectContent>{reactSelectData.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="city">City</Label>
                                                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))} value={formData.city}><SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger>
                                                    <SelectContent>{availableCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div><Label htmlFor="pincode">Pincode</Label><Input id="pincode" value={formData.pincode} onChange={handleInputChange} required /></div>
                                        {isAuthenticated && (
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="saveForFuture"
                                                    checked={formData.saveForFuture}
                                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, saveForFuture: checked as boolean }))}
                                                />
                                                <Label htmlFor="saveForFuture" className="text-sm text-forest">Save this address for future orders</Label>
                                            </div>
                                        )}
                                        {isAuthenticated &&
                                            <Button type="submit" className="w-full bg-forest text-white" disabled={addressLoading}>
                                                {addressLoading ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />} Save Address
                                            </Button>
                                        }
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right side: Order Summary */}
                    <div className="sticky top-24">
                        <Card className="bg-white rounded-lg shadow-lg border border-warm-taupe/50">
                            <CardHeader>
                                <CardTitle className="font-playfair text-2xl text-deep-forest">Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {displayCartItems.map((item: any) => (
                                        <div key={item._id || item.id} className="flex items-center gap-4">
                                            <img src={isAuthenticated ? item.productId.images[0].url : item.image} alt={isAuthenticated ? item.productId.name : item.name} className="w-16 h-16 rounded-md object-cover" />
                                            <div className="flex-1">
                                                <p className="font-semibold text-deep-forest text-sm">{isAuthenticated ? item.productId.name : item.name}</p>
                                                <p className="text-sm text-forest">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-medium text-deep-forest">{formatRupees((isAuthenticated ? (item.variant?.price || item.productId.price) : item.price) * item.quantity)}</p>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="my-4 bg-warm-taupe/50" />
                                <div className="space-y-2 text-forest">
                                    <div className="flex justify-between"><span>Subtotal</span><span className="font-medium text-deep-forest">{formatRupees(subtotal)}</span></div>
                                    <div className="flex justify-between"><span>Shipping</span><span className="font-medium text-deep-forest">{shippingCost > 0 ? formatRupees(shippingCost) : 'Free'}</span></div>
                                </div>
                                <Separator className="my-4 bg-warm-taupe/50" />
                                <div className="flex justify-between font-bold text-lg text-deep-forest">
                                    <span>Total</span>
                                    <span>{formatRupees(finalTotal)}</span>
                                </div>
                                <Button size="lg" className="w-full mt-6 bg-sage text-white hover:bg-forest rounded-full font-semibold" onClick={handleProceedToPayment} disabled={loading || (isAuthenticated && !selectedAddressId)}>
                                    {loading ? <Loader2 className="animate-spin" /> : 'Proceed to Payment'}
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