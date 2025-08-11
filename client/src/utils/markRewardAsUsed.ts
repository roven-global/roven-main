import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';

// Mark the user's claimed reward as used (when they place an order or use a coupon)
export const markRewardAsUsed = async (): Promise<boolean> => {
    try {
        const response = await Axios.post(SummaryApi.markRewardAsUsed.url);
        if (response.data.success) {
            console.log('Reward marked as used successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error marking reward as used:', error);
        return false;
    }
};

// Check if user has any unused rewards
export const hasUnusedReward = async (): Promise<boolean> => {
    try {
        const response = await Axios.get(SummaryApi.getUserRewards.url);
        if (response.data.success) {
            const userRewards = response.data.data;
            return userRewards.some((reward: any) => !reward.isUsed);
        }
        return false;
    } catch (error) {
        console.error('Error checking unused rewards:', error);
        return false;
    }
};

// Get user's claimed rewards
export const getUserRewards = async () => {
    try {
        const response = await Axios.get(SummaryApi.getUserRewards.url);
        if (response.data.success) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error('Error getting user rewards:', error);
        return [];
    }
};
