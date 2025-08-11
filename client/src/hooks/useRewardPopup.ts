import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { generateAnonymousId } from '@/utils/anonymousId';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { toast } from '@/hooks/use-toast';

export const useRewardPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [gifts, setGifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGift, setSelectedGift] = useState<any>(null);
    const { user, checkAuthStatus } = useAuth();

    useEffect(() => {
        fetchWelcomeGifts();
    }, []);

    const fetchWelcomeGifts = async () => {
        try {
            const response = await Axios.get(SummaryApi.getAllWelcomeGifts.url);
            if (response.data.success) {
                setGifts(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching welcome gifts:', error);
        }
    };

    const checkEligibility = async () => {
        try {
            const anonymousId = generateAnonymousId();
            const response = await Axios.get(SummaryApi.checkWelcomeGiftEligibility.url, {
                params: { anonymousId }
            });

            if (response.data.success && response.data.data.shouldShowPopup) {
                setIsOpen(true);
            }
        } catch (error) {
            console.error('Error checking eligibility:', error);
        }
    };

    const claimReward = async (giftId: string) => {
        try {
            setLoading(true);
            const anonymousId = generateAnonymousId();

            const response = await Axios.post(
                SummaryApi.claimWelcomeGift.url.replace(':id', giftId),
                { anonymousId }
            );

            if (response.data.success) {
                const { gift, claimed, anonymousId: claimedAnonymousId } = response.data.data;

                // Store in localStorage for anonymous users
                localStorage.setItem('rewardClaimed', 'true');
                localStorage.setItem('claimedRewardDetails', JSON.stringify({
                    id: gift._id,
                    title: gift.title,
                    reward: gift.reward,
                    couponCode: gift.couponCode || ''
                }));

                // If user is logged in, refresh their data to update rewardClaimed status
                if (user && checkAuthStatus) {
                    await checkAuthStatus();
                }

                toast({
                    title: "Reward claimed successfully!",
                    description: `${gift.title} has been added to your account.`,
                });

                console.log('Reward claimed successfully:', gift.reward);
                setIsOpen(false);
                return true;
            }
        } catch (error: any) {
            console.error('Error claiming reward:', error);
            toast({
                title: "Error claiming reward",
                description: error.response?.data?.message || "Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
        return false;
    };

    const openPopup = () => setIsOpen(true);
    const closePopup = () => setIsOpen(false);

    return {
        isOpen,
        gifts,
        loading,
        selectedGift,
        setSelectedGift,
        openPopup,
        closePopup,
        checkEligibility,
        claimReward,
    };
};
