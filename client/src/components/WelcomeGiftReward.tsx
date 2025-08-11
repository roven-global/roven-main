import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Gift, Percent, Truck, Star, DollarSign, Clock, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRewards } from '@/utils/markRewardAsUsed';
import { toast } from '@/hooks/use-toast';
import { formatRupees } from '@/lib/currency';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';

interface WelcomeGiftRewardProps {
    subtotal: number;
    shippingCost: number;
    cartItems?: any[]; // Add cartItems for BOGO calculations
    onRewardApplied: (reward: any, discountAmount: number, additionalData?: any) => void;
    onRewardRemoved: () => void;
    appliedReward?: any;
    isCheckout?: boolean;
}

export const WelcomeGiftReward: React.FC<WelcomeGiftRewardProps> = ({
    subtotal,
    shippingCost,
    cartItems = [], // Add default empty array
    onRewardApplied,
    onRewardRemoved,
    appliedReward,
    isCheckout = false
}) => {
    const { user } = useAuth();
    const [userReward, setUserReward] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');

    // Fetch user's claimed reward (for authenticated users)
    useEffect(() => {
        const fetchUserReward = async () => {
            if (user) {
                setLoading(true);
                try {
                    const rewards = await getUserRewards();
                    const unusedReward = rewards.find((reward: any) => !reward.isUsed);
                    setUserReward(unusedReward || null);
                } catch (error) {
                    console.error('Error fetching user reward:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchUserReward();
    }, [user]);

    // Check localStorage for anonymous user rewards OR as fallback for authenticated users
    useEffect(() => {
        const hasClaimedReward = localStorage.getItem('rewardClaimed') === 'true';
        console.log('WelcomeGiftReward: Checking localStorage for rewards');
        console.log('WelcomeGiftReward: hasClaimedReward from localStorage:', hasClaimedReward);

        if (hasClaimedReward) {
            const storedReward = localStorage.getItem('claimedRewardDetails');
            console.log('WelcomeGiftReward: storedReward from localStorage:', storedReward);

            if (storedReward) {
                try {
                    const parsedReward = JSON.parse(storedReward);
                    console.log('WelcomeGiftReward: parsedReward:', parsedReward);

                    // Normalize the reward data structure
                    const normalizedReward = {
                        _id: parsedReward.id || parsedReward._id,
                        rewardTitle: parsedReward.title || parsedReward.rewardTitle,
                        rewardText: parsedReward.reward || parsedReward.rewardText,
                        giftId: parsedReward.id || parsedReward._id,
                        couponCode: parsedReward.couponCode || ''
                    };
                    console.log('WelcomeGiftReward: normalizedReward:', normalizedReward);

                    // Set the reward from localStorage (this will override backend data if available)
                    setUserReward(normalizedReward);
                } catch (error) {
                    console.error('Error parsing stored reward:', error);
                }
            }
        }
    }, [user]); // Re-run when user changes

    // New function to validate and apply welcome gift coupon code
    const handleApplyCouponCode = async () => {
        if (!couponCode.trim()) return;

        setCouponLoading(true);
        setCouponError('');

        try {
            console.log('WelcomeGiftReward: Validating coupon code:', couponCode);

            const response = await Axios.post(SummaryApi.validateWelcomeGiftCoupon.url, {
                couponCode: couponCode.trim(),
                orderAmount: subtotal,
                cartItems: cartItems
            });

            if (response.data.success) {
                const { gift, discountAmount, reason, finalAmount, shippingDiscount, productDiscount } = response.data.data;

                console.log('WelcomeGiftReward: Coupon validated successfully:', response.data.data);

                // Apply the reward with enhanced data
                onRewardApplied(gift, discountAmount, {
                    rewardType: gift.rewardType,
                    rewardValue: gift.rewardValue,
                    maxDiscount: gift.maxDiscount,
                    minOrderAmount: gift.minOrderAmount,
                    displayText: gift.displayText,
                    reason,
                    finalAmount,
                    shippingDiscount,
                    productDiscount
                });

                // Show success message
                toast({
                    title: "Welcome Gift Applied!",
                    description: `${gift.displayText} - ${reason}`,
                });

                // Clear the input
                setCouponCode('');
            }
        } catch (error: any) {
            console.error('WelcomeGiftReward: Error applying coupon code:', error);
            const errorMessage = error.response?.data?.message || 'Failed to apply welcome gift';
            setCouponError(errorMessage);

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setCouponLoading(false);
        }
    };

    // Enhanced discount calculation using the new coupon code system
    const calculateDiscountAmount = (reward: any, subtotal: number, shippingCost: number) => {
        if (!reward) {
            console.log('WelcomeGiftReward: No reward provided to calculateDiscountAmount');
            return 0;
        }

        // Validate reward structure
        if (typeof reward !== 'object') {
            console.log('WelcomeGiftReward: Invalid reward structure:', reward);
            return 0;
        }

        // Add null checks for reward properties with fallbacks
        const rewardText = (reward.rewardText || reward.reward || '').toLowerCase();
        const rewardTitle = (reward.rewardTitle || reward.title || '').toLowerCase();

        console.log('WelcomeGiftReward: calculateDiscountAmount called');
        console.log('WelcomeGiftReward: reward object:', reward);
        console.log('WelcomeGiftReward: rewardText:', rewardText);
        console.log('WelcomeGiftReward: rewardTitle:', rewardTitle);
        console.log('WelcomeGiftReward: subtotal:', subtotal);
        console.log('WelcomeGiftReward: shippingCost:', shippingCost);

        // Check for percentage discounts
        if (rewardText.includes('10%') || rewardText.includes('percent') || rewardTitle.includes('10%')) {
            const discount = Math.min(subtotal * 0.1, subtotal);
            console.log('WelcomeGiftReward: 10% discount calculated:', discount);
            return discount;
        }
        // Check for flat amount discounts (₹100 off)
        else if (rewardText.includes('100') || rewardText.includes('flat') || rewardTitle.includes('100') ||
            rewardText.includes('flat100') || rewardTitle.includes('flat100') ||
            rewardText.includes('use code: flat100') || rewardTitle.includes('use code: flat100')) {
            const discount = Math.min(100, subtotal);
            console.log('WelcomeGiftReward: ₹100 flat discount calculated:', discount);
            return discount;
        }
        // Check for free shipping
        else if (rewardText.includes('free shipping') || rewardText.includes('shipping') || rewardTitle.includes('shipping')) {
            console.log('WelcomeGiftReward: Free shipping discount:', shippingCost);
            return shippingCost;
        }
        // Check for other percentage discounts
        else if (rewardText.includes('%') || rewardTitle.includes('%')) {
            // Extract percentage from text (e.g., "25% off" -> 25)
            const percentMatch = (rewardText + rewardTitle).match(/(\d+)%/);
            if (percentMatch) {
                const percentage = parseInt(percentMatch[1]);
                const discount = Math.min((subtotal * percentage) / 100, subtotal);
                console.log('WelcomeGiftReward: Percentage discount calculated:', discount, 'from', percentage + '%');
                return discount;
            }
        }
        // Check for BOGO offers
        else if (rewardText.includes('buy one get one') || rewardText.includes('bogo') || rewardTitle.includes('bogo')) {
            // BOGO calculation will be handled by the backend API
            console.log('WelcomeGiftReward: BOGO offer detected, calculation handled by backend');
            return 0; // Will be calculated by backend
        }

        console.log('WelcomeGiftReward: No discount pattern matched, returning 0');
        return 0;
    };

    const handleApplyReward = async () => {
        if (!userReward) return;

        setApplying(true);
        try {
            const discountAmount = calculateDiscountAmount(userReward, subtotal, shippingCost);
            console.log('WelcomeGiftReward: handleApplyReward called');
            console.log('WelcomeGiftReward: userReward:', userReward);
            console.log('WelcomeGiftReward: calculated discountAmount:', discountAmount);
            console.log('WelcomeGiftReward: subtotal:', subtotal);
            console.log('WelcomeGiftReward: shippingCost:', shippingCost);

            if (discountAmount > 0) {
                console.log('WelcomeGiftReward: Calling onRewardApplied with:', userReward, discountAmount);
                onRewardApplied(userReward, discountAmount);
                toast({
                    title: "Welcome gift applied!",
                    description: `${userReward.rewardTitle} has been applied to your order.`,
                });
            } else {
                console.log('WelcomeGiftReward: Reward not applicable - discountAmount is 0');
                toast({
                    title: "Reward not applicable",
                    description: "This reward cannot be applied to your current order.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error applying reward:', error);
            toast({
                title: "Error applying reward",
                description: "Please try again.",
                variant: "destructive",
            });
        } finally {
            setApplying(false);
        }
    };

    const handleRemoveReward = () => {
        onRewardRemoved();
        toast({
            title: "Welcome gift removed",
            description: "The welcome gift has been removed from your order.",
        });
    };

    // Don't show anything if no reward (for both authenticated and anonymous users)
    if (!userReward) {
        console.log('WelcomeGiftReward: No userReward, returning null');
        console.log('WelcomeGiftReward: user:', user);
        console.log('WelcomeGiftReward: userReward state:', userReward);
        return null;
    }

    console.log('WelcomeGiftReward: Rendering with userReward:', userReward);
    console.log('WelcomeGiftReward: appliedReward:', appliedReward);
    console.log('WelcomeGiftReward: userReward structure check:', {
        hasReward: !!userReward,
        hasTitle: userReward?.rewardTitle,
        hasText: userReward?.rewardText,
        hasCouponCode: userReward?.couponCode
    });

    // If reward is already applied, show the applied state
    if (appliedReward) {
        // Safety check for appliedReward structure
        if (!appliedReward.reward || !appliedReward.reward.rewardTitle) {
            console.log('WelcomeGiftReward: Invalid appliedReward structure:', appliedReward);
            return null;
        }

        const discountAmount = calculateDiscountAmount(appliedReward.reward, subtotal, shippingCost);

        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                "bg-green-100"
                            )}>
                                <Check className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-green-800">
                                        {appliedReward.reward.rewardTitle}
                                    </h4>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        Applied
                                    </Badge>
                                </div>
                                <p className="text-sm text-green-700">
                                    {appliedReward.reward.rewardText}
                                </p>
                                <p className="text-sm font-medium text-green-800">
                                    -{formatRupees(discountAmount)}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveReward}
                            className="text-green-600 hover:text-green-800 hover:bg-green-100"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Show available reward with coupon code input
    if (!userReward) {
        console.log('WelcomeGiftReward: No userReward available');
        return null;
    }

    // Safety check for userReward structure
    if (!userReward.rewardTitle || !userReward.rewardText) {
        console.log('WelcomeGiftReward: Invalid userReward structure:', userReward);
        return null;
    }

    const discountAmount = calculateDiscountAmount(userReward, subtotal, shippingCost);
    const isApplicable = discountAmount > 0 || (userReward?.rewardText || '').toLowerCase().includes('bogo');

    return (
        <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
                <div className="space-y-4">
                    {/* Welcome Gift Info */}
                    <div className="flex items-start gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            "bg-orange-100"
                        )}>
                            <Gift className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-orange-800">
                                    Welcome Gift Available!
                                </h4>
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                    {user ? 'New Customer' : 'Guest User'}
                                </Badge>
                            </div>
                            <p className="text-sm text-orange-700 mb-2">
                                {userReward.rewardTitle}: {userReward.rewardText}
                            </p>
                            {isApplicable && (
                                <div className="space-y-1">
                                    {discountAmount > 0 && (
                                        <p className="text-sm font-medium text-orange-800">
                                            Save up to {formatRupees(discountAmount)}
                                        </p>
                                    )}
                                    {userReward?.rewardText && (userReward.rewardText.toLowerCase().includes('bogo')) && (
                                        <p className="text-sm font-medium text-orange-800">
                                            🎁 Buy One Get One Free offer
                                        </p>
                                    )}
                                </div>
                            )}
                            {/* Show the actual coupon code if available */}
                            {userReward.couponCode && (
                                <div className="p-2 bg-orange-100 rounded text-sm font-mono text-orange-800 mt-2">
                                    Coupon Code: <strong>{userReward.couponCode}</strong>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Coupon Code Input - More Prominent */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-orange-800">
                            Enter Coupon Code to Apply:
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g., FLAT100, WELCOME10, BOGO"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                className="flex-1 border-orange-300 focus:border-orange-500"
                            />
                            <Button
                                onClick={handleApplyCouponCode}
                                disabled={couponLoading || !couponCode.trim()}
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                {couponLoading ? 'Applying...' : 'Apply Code'}
                            </Button>
                        </div>
                        {couponError && (
                            <p className="text-xs text-red-600">{couponError}</p>
                        )}
                        <p className="text-xs text-orange-600">
                            💡 <strong>Tip:</strong> You can also use the coupon code "{userReward.couponCode || 'from your reward'}" to apply this welcome gift!
                        </p>
                    </div>

                    {/* Apply Button */}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleApplyReward}
                            disabled={!isApplicable || applying}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {applying ? (
                                <>Applying...</>
                            ) : (
                                <>Apply Now</>
                            )}
                        </Button>
                        {!isApplicable && (
                            <p className="text-xs text-orange-600 self-center">
                                Minimum order required
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default WelcomeGiftReward;
