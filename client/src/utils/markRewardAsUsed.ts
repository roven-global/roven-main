import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";

export const markRewardAsUsed = async (): Promise<boolean> => {
  try {
    const response = await Axios.post(SummaryApi.markRewardAsUsed.url);
    if (response.data.success) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const hasUnusedReward = async (): Promise<boolean> => {
  try {
    const response = await Axios.get(SummaryApi.getUserRewards.url);
    if (response.data.success) {
      const userRewards = response.data.data;
      return userRewards.some((reward: any) => !reward.isUsed);
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const getUserRewards = async () => {
  try {
    const response = await Axios.get(SummaryApi.getUserRewards.url);
    if (response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    return [];
  }
};
