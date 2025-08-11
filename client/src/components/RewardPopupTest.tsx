import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Eye, Trash2, Play } from 'lucide-react';
import { useRewardPopup } from '@/hooks/useRewardPopup';

export const RewardPopupTest: React.FC = () => {
    const {
        isPopupOpen,
        hasClaimedReward,
        isFirstTimeVisitor,
        getClaimedRewardDetails,
        resetRewardState,
        closePopup
    } = useRewardPopup();

    const claimedReward = getClaimedRewardDetails();

    const handleReset = () => {
        resetRewardState();
        window.location.reload(); // Reload to trigger the popup again
    };

    const handleManualTrigger = () => {
        // Manually trigger the popup by setting localStorage and reloading
        localStorage.removeItem('hasVisitedBefore');
        localStorage.removeItem('rewardClaimed');
        localStorage.removeItem('claimedRewardDetails');
        window.location.reload();
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Reward Popup Test
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm font-medium">First Time Visitor:</span>
                        <span className={`text-sm ${isFirstTimeVisitor ? 'text-green-600' : 'text-red-600'}`}>
                            {isFirstTimeVisitor ? 'Yes' : 'No'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm font-medium">Has Claimed Reward:</span>
                        <span className={`text-sm ${hasClaimedReward ? 'text-green-600' : 'text-red-600'}`}>
                            {hasClaimedReward ? 'Yes' : 'No'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm font-medium">Popup Open:</span>
                        <span className={`text-sm ${isPopupOpen ? 'text-green-600' : 'text-red-600'}`}>
                            {isPopupOpen ? 'Yes' : 'No'}
                        </span>
                    </div>
                </div>

                {claimedReward && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-1">Claimed Reward:</h4>
                        <p className="text-sm text-gray-600">{claimedReward.title}</p>
                        <p className="text-xs text-gray-500">{claimedReward.reward}</p>
                    </div>
                )}

                <div className="flex gap-2">
                    <Button
                        onClick={handleReset}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Reset State
                    </Button>
                    <Button
                        onClick={handleManualTrigger}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                    >
                        <Play className="w-4 h-4 mr-1" />
                        Force Popup
                    </Button>
                </div>

                {isPopupOpen && (
                    <Button
                        onClick={closePopup}
                        variant="outline"
                        size="sm"
                        className="w-full"
                    >
                        <Eye className="w-4 h-4 mr-1" />
                        Close Popup
                    </Button>
                )}

                <p className="text-xs text-gray-500 text-center">
                    This component is for testing purposes only.
                    Reset the state to simulate a first-time visit.
                </p>
            </CardContent>
        </Card>
    );
};

export default RewardPopupTest;
