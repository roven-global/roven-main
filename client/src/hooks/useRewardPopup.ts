import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Reward } from '@/types/reward';
import { getAnonymousId, clearAnonymousId, hasAnonymousId } from '@/utils/anonymousId';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';

interface UseRewardPopupReturn {
    isPopupOpen: boolean;
    setIsPopupOpen: (open: boolean) => void;
    handleRewardClaimed: (reward: Reward) => void;
    closePopup: () => void;
    getClaimedRewardDetails: () => Reward | null;
    resetRewardState: () => void;
    shouldShowPopup: boolean;
    loading: boolean;
}

export const useRewardPopup = (): UseRewardPopupReturn => {
    const { user } = useAuth();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [shouldShowPopup, setShouldShowPopup] = useState(false);
    const [loading, setLoading] = useState(true);
    const [claimedReward, setClaimedReward] = useState<Reward | null>(null);

    const checkEligibility = useCallback(async () => {
        setLoading(true);
        try {
            const anonymousId = getAnonymousId();
            const url = `${SummaryApi.checkWelcomeGiftEligibility.url}?anonymousId=${anonymousId}`;

            const response = await Axios.get(url);

            if (response.data.success) {
                const { shouldShowPopup: eligible } = response.data.data;
                setShouldShowPopup(eligible);

                // If eligible, show popup after a short delay
                if (eligible) {
                    setTimeout(() => {
                        setIsPopupOpen(true);
                    }, 1000); // 1 second delay
                }
            }
        } catch (error) {
            console.error('Error checking eligibility:', error);
            // Fallback: show popup if no localStorage flag exists
            const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
            const hasClaimedReward = localStorage.getItem('rewardClaimed');

            if (!hasVisitedBefore && !hasClaimedReward) {
                setShouldShowPopup(true);
                setTimeout(() => {
                    setIsPopupOpen(true);
                }, 1000);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Check eligibility on mount and when user changes
    useEffect(() => {
        checkEligibility();
    }, [user, checkEligibility]);

    const handleRewardClaimed = async (reward: Reward) => {
        try {
            // Store in localStorage for immediate feedback
            localStorage.setItem('rewardClaimed', 'true');
            localStorage.setItem('claimedRewardDetails', JSON.stringify(reward));
            setClaimedReward(reward);

            // Send claim to backend
            const anonymousId = getAnonymousId();
            const url = SummaryApi.claimWelcomeGift.url.replace(':id', reward.id.toString());

            await Axios.post(url, { anonymousId });

            console.log('Reward claimed successfully:', reward.title);
        } catch (error) {
            console.error('Error claiming reward:', error);
            // Still store locally even if backend fails
            localStorage.setItem('rewardClaimed', 'true');
            localStorage.setItem('claimedRewardDetails', JSON.stringify(reward));
            setClaimedReward(reward);
        }
    };

    const closePopup = () => {
        setIsPopupOpen(false);
        // Mark as visited
        localStorage.setItem('hasVisitedBefore', 'true');
    };

    const getClaimedRewardDetails = (): Reward | null => {
        if (claimedReward) return claimedReward;

        const stored = localStorage.getItem('claimedRewardDetails');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error('Error parsing stored reward:', error);
            }
        }
        return null;
    };

    const resetRewardState = () => {
        // Clear all localStorage flags
        localStorage.removeItem('hasVisitedBefore');
        localStorage.removeItem('rewardClaimed');
        localStorage.removeItem('claimedRewardDetails');
        localStorage.removeItem('anonymousId');

        // Reset state
        setClaimedReward(null);
        setShouldShowPopup(false);
        setIsPopupOpen(false);

        // Re-check eligibility
        setTimeout(() => {
            checkEligibility();
        }, 100);
    };

    // Clear anonymous ID when user logs in
    useEffect(() => {
        if (user && hasAnonymousId()) {
            clearAnonymousId();
            // Re-check eligibility after login
            setTimeout(() => {
                checkEligibility();
            }, 500);
        }
    }, [user]);

    return {
        isPopupOpen,
        setIsPopupOpen,
        handleRewardClaimed,
        closePopup,
        getClaimedRewardDetails,
        resetRewardState,
        shouldShowPopup,
        loading
    };
};
