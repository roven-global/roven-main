import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Calendar } from 'lucide-react';
import { useUserReward } from '@/contexts/UserRewardContext';

export const ClaimedRewardDisplay: React.FC = () => {
    const { claimedReward, isLoading } = useUserReward();

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Gift className="w-5 h-5 text-gray-400" />
                        <Skeleton className="h-6 w-3/4" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!claimedReward) {
        return null; // Don't render anything if there's no claimed reward
    }

    // The claimedAt property might not be on the gift object itself,
    // so we'll just display the title and reward.
    return (
        <Card className="w-full border-green-200 bg-green-50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                    <Gift className="w-5 h-5" />
                    Your Claimed Reward
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">{claimedReward.title}</h4>
                    <Badge variant="default" className="bg-green-600 text-white">
                        {claimedReward.reward}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
};

export default ClaimedRewardDisplay;
