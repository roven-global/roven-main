import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Gift, Percent, Truck, Star, DollarSign, Clock, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRewards } from '@/utils/markRewardAsUsed';
import { toast } from '@/hooks/use-toast';
import { formatRupees } from '@/lib/currency';

interface WelcomeGiftRewardProps {
    subtotal: number;
    shippingCost: number;
    onRewardApplied: (reward: any, discountAmount: number) => void;
    onRewardRemoved: () => void;
    appliedReward?: any;
    isCheckout?: boolean;
}

// Icon mapping for dynamic rendering (for future use)
// const iconMap: { [key: string]: React.ReactNode } = {
//     Percent: <Percent className="w-4 h-4" />,
//     Truck: <Truck className="w-4 h-4" />,
//     Gift: <Gift className="w-4 h-4" />,
//     Star: <Star className="w-4 h-4" />,
//     DollarSign: <DollarSign className="w-4 h-4" />,
//     Clock: <Clock className="w-4 h-4" />,
// };

export const WelcomeGiftReward: React.FC<WelcomeGiftRewardProps> = ({
    subtotal,
    shippingCost,
    onRewardApplied,
    onRewardRemoved,
    appliedReward,
    isCheckout = false
}) => {
    const { user } = useAuth();
    const [userReward, setUserReward] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);

    // Fetch user's claimed reward
    useEffect(() => {
        const fetchUserReward = async () => {
            if (!user) return;

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
        };

        fetchUserReward();
    }, [user]);

    const calculateDiscountAmount = (reward: any, subtotal: number, shippingCost: number) => {
        const rewardText = reward.rewardText.toLowerCase();

        if (rewardText.includes('10%') || rewardText.includes('percent')) {
            return Math.min(subtotal * 0.1, subtotal); // 10% off, max up to subtotal
        } else if (rewardText.includes('100') || rewardText.includes('flat')) {
            return Math.min(100, subtotal); // Flat ₹100 off, max up to subtotal
        } else if (rewardText.includes('free shipping') || rewardText.includes('shipping')) {
            return shippingCost; // Free shipping
        }

        return 0;
    };

    const handleApplyReward = async () => {
        if (!userReward) return;

        setApplying(true);
        try {
            const discountAmount = calculateDiscountAmount(userReward, subtotal, shippingCost);

            if (discountAmount > 0) {
                onRewardApplied(userReward, discountAmount);
                toast({
                    title: "Welcome gift applied!",
                    description: `${userReward.rewardTitle} has been applied to your order.`,
                });
            } else {
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



    // Don't show anything if no user or no reward
    if (!user || !userReward) {
        return null;
    }

    // If reward is already applied, show the applied state
    if (appliedReward) {
        const discountAmount = calculateDiscountAmount(appliedReward, subtotal, shippingCost);

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
                                        {appliedReward.rewardTitle}
                                    </h4>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        Applied
                                    </Badge>
                                </div>
                                <p className="text-sm text-green-700">
                                    {appliedReward.rewardText}
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

    // Show available reward
    const discountAmount = calculateDiscountAmount(userReward, subtotal, shippingCost);
    const isApplicable = discountAmount > 0;

    return (
        <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
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
                                    New Customer
                                </Badge>
                            </div>
                            <p className="text-sm text-orange-700 mb-2">
                                {userReward.rewardTitle}: {userReward.rewardText}
                            </p>
                            {isApplicable && (
                                <p className="text-sm font-medium text-orange-800 mb-3">
                                    Save up to {formatRupees(discountAmount)}
                                </p>
                            )}
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
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default WelcomeGiftReward;
