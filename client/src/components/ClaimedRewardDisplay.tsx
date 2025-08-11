import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Calendar } from 'lucide-react';
import { useRewardPopup } from '@/hooks/useRewardPopup';

export const ClaimedRewardDisplay: React.FC = () => {
    const { getClaimedRewardDetails, hasClaimedReward } = useRewardPopup();
    const claimedReward = getClaimedRewardDetails();

    if (!hasClaimedReward || !claimedReward) {
        return null;
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Gift className="w-5 h-5 text-green-600" />
                    Your Claimed Reward
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div>
                        <h4 className="font-semibold text-gray-900">{claimedReward.title}</h4>
                        <Badge variant="secondary" className="mt-1">
                            {claimedReward.reward}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Claimed on {formatDate(claimedReward.claimedAt)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ClaimedRewardDisplay;
