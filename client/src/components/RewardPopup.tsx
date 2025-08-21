import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Gift,
  Percent,
  Truck,
  DollarSign,
  Star,
  Clock,
  Heart,
  Shield,
  Zap,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRewardPopup } from "@/hooks/useRewardPopup";

interface RewardPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

// Icon mapping for dynamic rendering
const iconMap: { [key: string]: React.ReactNode } = {
  Percent: <Percent className="w-6 h-6" />,
  Truck: <Truck className="w-6 h-6" />,
  Gift: <Gift className="w-6 h-6" />,
  Star: <Star className="w-6 h-6" />,
  DollarSign: <DollarSign className="w-6 h-6" />,
  Clock: <Clock className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
  Award: <Award className="w-6 h-6" />,
};

export const RewardPopup: React.FC<RewardPopupProps> = ({
  isOpen,
  onClose,
}) => {
  const { gifts, loading, claimReward } = useRewardPopup();
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [isClaimed, setIsClaimed] = useState(false);

  // Add keyboard shortcut to close popup
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleRewardClick = async (reward: any) => {
    // Instantly claim the reward on click
    setSelectedReward(reward);
    const success = await claimReward(reward._id);
    if (success) {
      setIsClaimed(true); // Move to final "claimed" screen
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state for next time popup opens
    setTimeout(() => {
      setSelectedReward(null);
      setIsClaimed(false);
    }, 300);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading rewards...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isClaimed
                ? "🎉 Congratulations!"
                : "🎁 Choose Your Welcome Gift!"}
            </h2>
            <p className="text-gray-600 mt-1">
              {isClaimed
                ? "Your reward has been claimed and applied to your account."
                : "Select a mystery gift to reveal and claim your prize!"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isClaimed ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {gifts.map((gift) => (
                  <Card
                    key={gift._id}
                    className="cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-2 hover:border-blue-300 bg-gray-100"
                    onClick={() => handleRewardClick(gift)}
                  >
                    <CardContent className="p-6 text-center flex flex-col items-center justify-center">
                      <div className="mx-auto mb-3 w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                        <Gift className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        Mystery Gift
                      </h3>
                      <p className="text-sm text-gray-600">Click to Claim</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  Press ESC or click outside to close
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                  <Award className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedReward?.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  This reward has been added to your account! It will be applied
                  automatically at checkout.
                </p>
              </div>
              <Button
                onClick={handleClose}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Start Shopping
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardPopup;
