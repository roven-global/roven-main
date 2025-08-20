import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { toast } from '@/hooks/use-toast';

interface WelcomeGift {
  _id: string;
  title: string;
  description: string;
  couponCode: string;
  rewardType: string;
  rewardValue: number;
  minOrderAmount: number;
}

interface UserRewardContextType {
  userReward: WelcomeGift | null;
  loading: boolean;
  fetchUserReward: () => Promise<void>;
  clearUserReward: () => void;
}

const UserRewardContext = createContext<UserRewardContextType | undefined>(undefined);

export const useUserReward = () => {
  const context = useContext(UserRewardContext);
  if (!context) {
    throw new Error('useUserReward must be used within a UserRewardProvider');
  }
  return context;
};

export const UserRewardProvider = ({ children }: { children: ReactNode }) => {
  const [userReward, setUserReward] = useState<WelcomeGift | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUserReward = useCallback(async () => {
    setLoading(true);
    try {
      const response = await Axios.get(SummaryApi.checkRewardStatus.url);
      if (response.data.success && response.data.hasUnusedReward) {
        setUserReward(response.data.rewardDetails);
        toast({
          title: 'Welcome gift restored',
          description: 'Your previously claimed welcome gift is available.',
        });
      } else {
        setUserReward(null);
      }
    } catch (error) {
      console.error('Failed to fetch user reward status:', error);
      setUserReward(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearUserReward = useCallback(() => {
    setUserReward(null);
  }, []);

  const value = {
    userReward,
    loading,
    fetchUserReward,
    clearUserReward,
  };

  return (
    <UserRewardContext.Provider value={value}>
      {children}
    </UserRewardContext.Provider>
  );
};
