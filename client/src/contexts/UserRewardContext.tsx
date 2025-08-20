import React, { createContext, useContext, useState, useCallback,useEffect , ReactNode } from 'react';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { useAuth } from './AuthContext';

interface UserReward {
  _id: string;
  title: string;
  description: string;
  reward: string;
  couponCode?: string;
  rewardType: 'free_shipping' | 'discount' | 'sample';
  rewardValue?: number;
  // Add any other fields that come from the backend
}

interface UserRewardContextType {
  claimedReward: UserReward | null;
  isLoading: boolean;
  error: string | null;
  fetchUserReward: () => Promise<void>;
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
  const [claimedReward, setClaimedReward] = useState<UserReward | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchUserReward = useCallback(async () => {
    if (!isAuthenticated) {
        setClaimedReward(null);
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await Axios.get(SummaryApi.getUserReward.url);
      if (response.data.success && response.data.data) {
        setClaimedReward(response.data.data);
      } else {
        setClaimedReward(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user reward.');
      setClaimedReward(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUserReward();
  }, [fetchUserReward]);

  const value = {
    claimedReward,
    isLoading,
    error,
    fetchUserReward,
  };

  return (
    <UserRewardContext.Provider value={value}>
      {children}
    </UserRewardContext.Provider>
  );
};
