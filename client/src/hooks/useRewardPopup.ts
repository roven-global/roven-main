import { useState, useEffect, useCallback, useRef } from 'react';
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
    const hasCheckedRef = useRef(false);

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

    const checkEligibility = useCallback(async () => {
        // Use localStorage to prevent multiple eligibility checks
        const eligibilityCheckKey = 'eligibilityCheckCompleted';
        const hasCheckedEligibility = localStorage.getItem(eligibilityCheckKey) === 'true';

        if (hasCheckedEligibility || hasCheckedRef.current) {
            console.log('Eligibility already checked, skipping');
            return;
        }

        try {
            // Don't check eligibility if user is already logged in and has claimed a reward
            if (user && user.rewardClaimed) {
                console.log('User already has claimed reward, skipping eligibility check');
                localStorage.setItem(eligibilityCheckKey, 'true');
                hasCheckedRef.current = true;
                return;
            }

            // Don't check eligibility if we already have a reward in localStorage
            const hasClaimedReward = localStorage.getItem('rewardClaimed') === 'true';
            if (hasClaimedReward) {
                console.log('Reward already claimed in localStorage, skipping eligibility check');
                localStorage.setItem(eligibilityCheckKey, 'true');
                hasCheckedRef.current = true;
                return;
            }

            const anonymousId = generateAnonymousId();
            // Store anonymousId in localStorage for later use during login
            localStorage.setItem('anonymousId', anonymousId);
            console.log('Checking welcome gift eligibility for anonymousId:', anonymousId);

            const response = await Axios.get(SummaryApi.checkWelcomeGiftEligibility.url, {
                params: { anonymousId }
            });

            if (response.data.success && response.data.data.shouldShowPopup) {
                console.log('Eligibility check passed, opening popup');
                setIsOpen(true);
            } else {
                console.log('Eligibility check failed or popup not needed');
            }

            // Mark as checked to prevent future calls
            localStorage.setItem(eligibilityCheckKey, 'true');
            hasCheckedRef.current = true;
        } catch (error) {
            console.error('Error checking eligibility:', error);
            // Mark as checked even on error to prevent infinite retries
            localStorage.setItem(eligibilityCheckKey, 'true');
            hasCheckedRef.current = true;
        }
    }, [user]);

    const claimReward = useCallback(async (giftId: string) => {
        try {
            setLoading(true);
            // Use existing anonymousId from localStorage or generate new one
            let anonymousId = localStorage.getItem('anonymousId');
            if (!anonymousId) {
                anonymousId = generateAnonymousId();
                localStorage.setItem('anonymousId', anonymousId);
            }

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
    }, [user, checkAuthStatus]);

    const openPopup = useCallback(() => setIsOpen(true), []);
    const closePopup = useCallback(() => setIsOpen(false), []);

    // Reset function to clear eligibility check flag
    const resetEligibilityCheck = useCallback(() => {
        localStorage.removeItem('eligibilityCheckCompleted');
        localStorage.removeItem('anonymousId');
        hasCheckedRef.current = false;
        console.log('Eligibility check flag reset');
    }, []);

    // Add missing functions that ClaimedRewardDisplay needs
    const getClaimedRewardDetails = useCallback(() => {
        try {
            const details = localStorage.getItem('claimedRewardDetails');
            if (details) {
                const parsed = JSON.parse(details);
                return {
                    ...parsed,
                    claimedAt: new Date().toISOString() // Use current time as fallback
                };
            }
            return null;
        } catch (error) {
            console.error('Error parsing claimed reward details:', error);
            return null;
        }
    }, []);

    const hasClaimedReward = useCallback(() => {
        return localStorage.getItem('rewardClaimed') === 'true';
    }, []);

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
        resetEligibilityCheck,
        getClaimedRewardDetails,
        hasClaimedReward,
    };
};
