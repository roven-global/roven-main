import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { toast } from '@/hooks/use-toast';

// Import the secure anonymous ID utilities
const generateSecureAnonymousId = (): string => {
  // This would ideally come from the server, but for client-side we'll use a simpler approach
  const timestamp = Date.now();
  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return `${timestamp}-${randomBytes}-client`;
};

const validateAnonymousId = (anonymousId: string): boolean => {
  if (!anonymousId || typeof anonymousId !== 'string') return false;
  const parts = anonymousId.split('-');
  return parts.length >= 3; // Basic validation for client-side generated IDs
};

export const useRewardPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const { user, checkAuthStatus } = useAuth();
  const hasCheckedRef = useRef(false);
  const eligibilityCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRetriedRef = useRef(false);

  useEffect(() => {
    fetchWelcomeGifts();
    
    // Cleanup on unmount
    return () => {
      if (eligibilityCheckTimeoutRef.current) {
        clearTimeout(eligibilityCheckTimeoutRef.current);
      }
    };
  }, []);

  const fetchWelcomeGifts = async () => {
    try {
      const response = await Axios.get(SummaryApi.getAllWelcomeGifts.url);
      if (response.data.success) {
        setGifts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching welcome gifts:', error);
      // Don't show error toast for background fetch
    }
  };

  const checkEligibility = useCallback(async (force: boolean = false, overrideAnonymousId?: string) => {
    // Prevent multiple simultaneous eligibility checks
    if (!force && (hasCheckedRef.current || loading)) {
      console.log('Eligibility check already in progress or completed');
      return;
    }

    // Use localStorage with expiration to prevent excessive checks
    const eligibilityCheckKey = 'eligibilityCheckCompleted';
    const eligibilityTimestamp = localStorage.getItem('eligibilityCheckTimestamp');
    const now = Date.now();
    const checkValidityPeriod = 60 * 60 * 1000; // 1 hour

    if (!force && eligibilityTimestamp) {
      const lastCheck = parseInt(eligibilityTimestamp);
      if (now - lastCheck < checkValidityPeriod) {
        console.log('Eligibility check recently completed, skipping');
        hasCheckedRef.current = true;
        return;
      }
    }

    try {
      // Don't check eligibility if user is already logged in and has claimed a reward
      if (user && user.rewardClaimed) {
        console.log('User already has claimed reward, skipping eligibility check');
        localStorage.setItem(eligibilityCheckKey, 'true');
        localStorage.setItem('eligibilityCheckTimestamp', now.toString());
        hasCheckedRef.current = true;
        return;
      }

      // Don't check eligibility if we already have a valid reward in localStorage
      const hasClaimedReward = localStorage.getItem('rewardClaimed') === 'true';
      const rewardTimestamp = localStorage.getItem('rewardClaimedTimestamp');
      
      if (hasClaimedReward && rewardTimestamp) {
        const rewardAge = now - parseInt(rewardTimestamp);
        const rewardValidityPeriod = 24 * 60 * 60 * 1000; // 24 hours
        
        if (rewardAge < rewardValidityPeriod) {
          console.log('Valid reward already claimed, skipping eligibility check');
          localStorage.setItem(eligibilityCheckKey, 'true');
          localStorage.setItem('eligibilityCheckTimestamp', now.toString());
          hasCheckedRef.current = true;
          return;
        }
      }

      // Retrieve anonymous ID; if invalid, let server issue a new one
      let anonymousId: string | undefined = overrideAnonymousId ?? (localStorage.getItem('anonymousId') || undefined);
      if (!anonymousId || !validateAnonymousId(anonymousId)) {
        anonymousId = undefined;
      }

      console.log('Checking welcome gift eligibility');
      
      // Add timeout to prevent hanging requests
      const timeoutId = setTimeout(() => {
        console.log('Eligibility check timeout');
        hasCheckedRef.current = true;
      }, 10000); // 10 second timeout

      const response = await Axios.get(SummaryApi.checkWelcomeGiftEligibility.url, {
        params: anonymousId ? { anonymousId } : {},
        timeout: 8000 // 8 second request timeout
      });

      clearTimeout(timeoutId);

      if (response.data.success) {
        const { shouldShowPopup, newAnonymousId, anonymousId: serverAnonymousId, reason } = response.data.data;

        // Persist any server-issued anonymous ID
        if (newAnonymousId && newAnonymousId !== (localStorage.getItem('anonymousId') || undefined)) {
          localStorage.setItem('anonymousId', newAnonymousId);
        }
        if (serverAnonymousId && serverAnonymousId !== (localStorage.getItem('anonymousId') || undefined)) {
          localStorage.setItem('anonymousId', serverAnonymousId);
        }

        if (shouldShowPopup) {
          console.log('Eligibility check passed, opening popup');
          setIsOpen(true);
          // Mark as checked with timestamp
          localStorage.setItem(eligibilityCheckKey, 'true');
          localStorage.setItem('eligibilityCheckTimestamp', now.toString());
          hasCheckedRef.current = true;
        } else if (!shouldShowPopup && !hasRetriedRef.current && (newAnonymousId || serverAnonymousId)) {
          // If server provided an ID, retry once using it explicitly
          hasRetriedRef.current = true;
          console.log('Retrying eligibility check with server-issued anonymousId');
          await checkEligibility(true, (newAnonymousId || serverAnonymousId));
          return; // Let the retry decide marking completion
        } else {
          console.log('Eligibility check failed or popup not needed', reason || '');
          // Only mark as checked if not an invalid session
          if (!reason || !String(reason).toLowerCase().includes('invalid session')) {
            localStorage.setItem(eligibilityCheckKey, 'true');
            localStorage.setItem('eligibilityCheckTimestamp', now.toString());
            hasCheckedRef.current = true;
          }
        }
      } else {
        // Non-success response; still mark as checked to prevent loops
        localStorage.setItem(eligibilityCheckKey, 'true');
        localStorage.setItem('eligibilityCheckTimestamp', now.toString());
        hasCheckedRef.current = true;
      }
      
    } catch (error: any) {
      console.error('Error checking eligibility:', error);
      
      // Handle different error types
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.log('Eligibility check timed out');
      } else if (error.response?.status === 429) {
        console.log('Rate limited - too many eligibility checks');
      } else {
        console.log('Network error during eligibility check');
      }
      
      // Mark as checked even on error to prevent infinite retries
      localStorage.setItem(eligibilityCheckKey, 'true');
      localStorage.setItem('eligibilityCheckTimestamp', now.toString());
      hasCheckedRef.current = true;
    }
  }, [user, loading]);

  const claimReward = useCallback(async (giftId: string) => {
    if (loading) {
      console.log('Claim already in progress');
      return false;
    }

    try {
      setLoading(true);

      // Validate gift ID
      if (!giftId || !giftId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid gift ID');
      }

      // Get and validate anonymous ID
      let anonymousId = localStorage.getItem('anonymousId');
      if (!anonymousId || !validateAnonymousId(anonymousId)) {
        anonymousId = generateSecureAnonymousId();
        localStorage.setItem('anonymousId', anonymousId);
      }

      const response = await Axios.post(
        SummaryApi.claimWelcomeGift.url.replace(':id', giftId),
        { anonymousId },
        { timeout: 15000 } // 15 second timeout for claim requests
      );

      if (response.data.success) {
        const { gift, claimed, anonymousId: claimedAnonymousId } = response.data.data;

        // Store reward data with timestamp for validation
        const now = Date.now();
        localStorage.setItem('rewardClaimed', 'true');
        localStorage.setItem('rewardClaimedTimestamp', now.toString());
        localStorage.setItem('claimedRewardDetails', JSON.stringify({
          id: gift._id,
          title: gift.title,
          reward: gift.reward,
          couponCode: gift.couponCode || '',
          claimedAt: new Date().toISOString(),
          rewardType: gift.rewardType,
          rewardValue: gift.rewardValue,
          maxDiscount: gift.maxDiscount,
          minOrderAmount: gift.minOrderAmount
        }));

        // Update anonymous ID if changed
        if (claimedAnonymousId && claimedAnonymousId !== anonymousId) {
          localStorage.setItem('anonymousId', claimedAnonymousId);
        }

        // If user is logged in, refresh their data to update rewardClaimed status
        if (user && checkAuthStatus) {
          try {
            await checkAuthStatus();
          } catch (error) {
            console.error('Error updating auth status:', error);
          }
        }

        toast({
          title: "Reward claimed successfully!",
          description: `${gift.title} has been added to your account.`,
        });

        console.log('Reward claimed successfully:', gift.reward);
        setIsOpen(false);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      
      let errorMessage = "Please try again.";
      
      if (error.response?.status === 429) {
        errorMessage = "Too many attempts. Please wait before trying again.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Invalid request. Please refresh the page.";
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = "Request timed out. Please try again.";
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
  }, [user, checkAuthStatus, loading]);

  const openPopup = useCallback(() => setIsOpen(true), []);
  const closePopup = useCallback(() => setIsOpen(false), []);

  // Reset function to clear eligibility check flag
  const resetEligibilityCheck = useCallback(() => {
    localStorage.removeItem('eligibilityCheckCompleted');
    localStorage.removeItem('eligibilityCheckTimestamp');
    localStorage.removeItem('anonymousId');
    hasCheckedRef.current = false;
    console.log('Eligibility check flag reset');
  }, []);

  // Get claimed reward details with validation
  const getClaimedRewardDetails = useCallback(() => {
    try {
      const details = localStorage.getItem('claimedRewardDetails');
      const timestamp = localStorage.getItem('rewardClaimedTimestamp');
      
      if (details && timestamp) {
        const parsed = JSON.parse(details);
        const rewardAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        // Check if reward is still valid
        if (rewardAge < maxAge) {
          return {
            ...parsed,
            claimedAt: parsed.claimedAt || new Date().toISOString(),
            isExpired: false,
            ageHours: Math.floor(rewardAge / (60 * 60 * 1000))
          };
        } else {
          // Clean up expired reward
          localStorage.removeItem('rewardClaimed');
          localStorage.removeItem('rewardClaimedTimestamp');
          localStorage.removeItem('claimedRewardDetails');
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing claimed reward details:', error);
      // Clean up corrupted data
      localStorage.removeItem('claimedRewardDetails');
      localStorage.removeItem('rewardClaimed');
      localStorage.removeItem('rewardClaimedTimestamp');
      return null;
    }
  }, []);

  const hasClaimedReward = useCallback(() => {
    const claimed = localStorage.getItem('rewardClaimed') === 'true';
    const timestamp = localStorage.getItem('rewardClaimedTimestamp');
    
    if (claimed && timestamp) {
      const rewardAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (rewardAge >= maxAge) {
        // Clean up expired reward
        localStorage.removeItem('rewardClaimed');
        localStorage.removeItem('rewardClaimedTimestamp');
        localStorage.removeItem('claimedRewardDetails');
        return false;
      }
      
      return true;
    }
    
    return false;
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
