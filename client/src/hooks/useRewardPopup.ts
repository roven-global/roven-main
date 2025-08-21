import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { toast } from '@/hooks/use-toast';

export const useRewardPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const { user, loading: authLoading, checkAuthStatus } = useAuth();

  useEffect(() => {
    // This effect now controls the entire eligibility flow.
    // It depends on the authLoading state to prevent race conditions.

    // 1. Wait for the initial authentication check to complete.
    if (authLoading) {
      return;
    }

    // 2. If the user is logged in and has already claimed a reward, do nothing.
    if (user?.rewardClaimed) {
      return;
    }

    // 3. If eligible (guest or non-claiming user), fetch gifts and check with the server.
    const checkAndFetch = async () => {
      try {
        const anonymousId = localStorage.getItem('anonymousId');
        const response = await Axios.get(SummaryApi.checkWelcomeGiftEligibility.url, {
          params: { anonymousId },
        });

        if (response.data.success) {
          const { shouldShowPopup, anonymousId: serverAnonymousId } = response.data.data;

          // Always trust the server's anonymousId
          if (serverAnonymousId) {
            localStorage.setItem('anonymousId', serverAnonymousId);
          }

          if (shouldShowPopup) {
            await fetchWelcomeGifts(); // Fetch gifts only if we need to show the popup
            setIsOpen(true);
          }
        }
      } catch (error) {
        console.error('Error checking eligibility:', error);
      }
    };

    checkAndFetch();
  }, [user, authLoading]);

  const fetchWelcomeGifts = async () => {
    try {
      const response = await Axios.get(SummaryApi.getAllWelcomeGifts.url);
      if (response.data.success) {
        const allGifts = response.data.data;

        // Fisher-Yates shuffle algorithm to randomize the gifts
        for (let i = allGifts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allGifts[i], allGifts[j]] = [allGifts[j], allGifts[i]];
        }

        // Select the first 6 gifts, or fewer if not enough are available
        const selectedGifts = allGifts.slice(0, 6);
        
        setGifts(selectedGifts);
      }
    } catch (error) {
      console.error('Error fetching welcome gifts:', error);
      // Don't show error toast for background fetch
    }
  };

  const claimReward = useCallback(async (giftId: string) => {
    if (loading) return false;

    setLoading(true);
    try {
      const anonymousId = localStorage.getItem('anonymousId');
      if (!anonymousId) {
        toast({
          title: "Error claiming reward",
          description: "Your session is invalid. Please refresh the page.",
          variant: "destructive",
        });
        return false;
      }
      
      return await claimRewardWithId(giftId, anonymousId);

    } catch (error: any) {
      console.error('Error in claimReward wrapper:', error);
      toast({
        title: "An unexpected error occurred",
        description: "Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, checkAuthStatus, loading]);

  const claimRewardWithId = useCallback(async (giftId: string, anonymousId: string) => {
    try {
      setLoading(true);
      const response = await Axios.post(
        SummaryApi.claimWelcomeGift.url.replace(':id', giftId),
        { anonymousId },
        { timeout: 15000 }
      );

      if (response.data.success) {
        const { gift, claimed, anonymousId: claimedAnonymousId } = response.data.data;

        // Always update anonymous ID from server response to keep it fresh
        if (claimedAnonymousId) {
          localStorage.setItem('anonymousId', claimedAnonymousId);
        }

        // If user is logged in, refresh their data
        if (user && checkAuthStatus) {
          await checkAuthStatus();
        }

        toast({
          title: "Reward claimed successfully!",
          description: `${gift.title} has been added to your account.`,
        });

        setIsOpen(false);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      
      let errorMessage = "Please try again.";
      if (error.response?.status === 429) {
        errorMessage = "Too many attempts. Please wait before trying again.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Error claiming reward",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    } finally {
      setLoading(false);
    }
  }, [user, checkAuthStatus]);
  
  const openPopup = useCallback(() => setIsOpen(true), []);
  const closePopup = useCallback(() => setIsOpen(false), []);

  // Reset function to clear eligibility check flag (now simplified)
  const resetEligibilityCheck = useCallback(() => {
    localStorage.removeItem('anonymousId');
  }, []);


  // Debug function to manually trigger popup
  const debugOpenPopup = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    gifts,
    loading,
    selectedGift,
    setSelectedGift,
    openPopup,
    closePopup,
    claimReward,
    resetEligibilityCheck,
    debugOpenPopup,
  };
};
