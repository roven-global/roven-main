import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Gift, Percent, Truck, DollarSign, Star, Clock, Heart, Shield, Zap, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reward } from '@/types/reward';
import { getAnonymousId } from '@/utils/anonymousId';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';

interface RewardPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onRewardClaimed: (reward: Reward) => void;
}

// Icon mapping for dynamic rendering
const iconMap: { [key: string]: React.ReactNode } = {
    Percent: <Percent className="w-6 h-6" />,
    Truck: <Truck className="w-6 h-6" />,
    Gift: <Gift className="w-6 h-6" />,
    Star: <Star className="w-6 h-6" />,
    DollarSign: <DollarSign className="w-6 h-6" />,
    Clock: <Clock className="w-6 h-6" />,
    Heart: <Heart className="w-6 h-6" />,
    Shield: <Shield className="w-6 h-6" />,
    Zap: <Zap className="w-6 h-6" />,
    Award: <Award className="w-6 h-6" />,
};

export const RewardPopup: React.FC<RewardPopupProps> = ({
    isOpen,
    onClose,
    onRewardClaimed
}) => {
    console.log('RewardPopup - isOpen:', isOpen);

    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [countdown, setCountdown] = useState(5);

    // Fetch rewards from backend
    useEffect(() => {
        const fetchRewards = async () => {
            if (isOpen && rewards.length === 0) {
                setLoading(true);
                try {
                    const response = await Axios.get(SummaryApi.getAllWelcomeGifts.url);
                    if (response.data.success) {
                        const backendRewards = response.data.data.map((gift: any) => ({
                            id: gift._id,
                            title: gift.title,
                            description: gift.description,
                            icon: iconMap[gift.icon] || <Gift className="w-6 h-6" />,
                            color: gift.color,
                            bgColor: gift.bgColor,
                            reward: gift.reward
                        }));
                        setRewards(backendRewards);
                    }
                } catch (error) {
                    console.error('Error fetching rewards:', error);
                    // Fallback to default rewards if API fails
                    setRewards([
                        {
                            id: '1',
                            title: "10% Off",
                            description: "Get 10% off your first order",
                            icon: <Percent className="w-6 h-6" />,
                            color: "text-green-600",
                            bgColor: "bg-green-50 hover:bg-green-100",
                            reward: "Use code: WELCOME10"
                        }
                    ]);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchRewards();
    }, [isOpen, rewards.length]);

    useEffect(() => {
        if (isRevealed && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (isRevealed && countdown === 0) {
            onClose();
        }
    }, [isRevealed, countdown, onClose]);

    const handleRewardClick = async (reward: Reward) => {
        setSelectedReward(reward);
        setIsRevealed(true);
        onRewardClaimed(reward);

        // Track the claim in the backend
        try {
            const anonymousId = getAnonymousId();
            const url = SummaryApi.claimWelcomeGift.url.replace(':id', reward.id.toString());
            await Axios.post(url, { anonymousId });
        } catch (error) {
            console.error('Error tracking reward claim:', error);
        }
    };

    const handleClose = () => {
        if (!isRevealed) {
            // If not revealed yet, close immediately
            onClose();
        }
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading rewards...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {isRevealed ? "🎉 Congratulations!" : "🎁 Choose Your Welcome Gift!"}
                        </h2>
                        <p className="text-gray-600 mt-1">
                            {isRevealed
                                ? "Your reward has been claimed!"
                                : "Select one of these amazing rewards for your first visit"
                            }
                        </p>
                    </div>
                    {!isRevealed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {!isRevealed ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                {rewards.map((reward) => (
                                    <Card
                                        key={reward.id}
                                        className={cn(
                                            "cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-2 hover:border-gray-300",
                                            reward.bgColor
                                        )}
                                        onClick={() => handleRewardClick(reward)}
                                    >
                                        <CardContent className="p-6 text-center">
                                            <div className={cn("mx-auto mb-3 w-12 h-12 rounded-full flex items-center justify-center", reward.bgColor)}>
                                                <div className={reward.color}>
                                                    {reward.icon}
                                                </div>
                                            </div>
                                            <h3 className="font-semibold text-gray-900 mb-2">{reward.title}</h3>
                                            <p className="text-sm text-gray-600">{reward.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500">
                                    Click on any reward to claim it instantly!
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="mb-6">
                                <div className={cn(
                                    "mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center",
                                    selectedReward?.bgColor
                                )}>
                                    <div className={selectedReward?.color}>
                                        {selectedReward?.icon}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {selectedReward?.title}
                                </h3>
                                <p className="text-gray-600 mb-4">{selectedReward?.description}</p>
                                <Badge variant="secondary" className="text-lg px-4 py-2">
                                    {selectedReward?.reward}
                                </Badge>
                            </div>

                            <div className="text-center">
                                <p className="text-sm text-gray-500 mb-2">
                                    This popup will close automatically in {countdown} seconds
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                                        style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RewardPopup;
