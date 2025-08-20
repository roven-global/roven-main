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
  console.log("RewardPopup - isOpen:", isOpen);

  const { gifts, loading, claimReward } = useRewardPopup();
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isRevealed && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isRevealed && countdown === 0) {
      onClose();
    }
  }, [isRevealed, countdown, onClose]);

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
    setSelectedReward(reward);
    setIsRevealed(true);

    // Use the new claimReward function from the hook
    try {
      await claimReward(reward._id);
    } catch (error) {
      console.error("Error claiming reward:", error);
    }
  };

  const handleClose = () => {
    // Always allow closing, regardless of state
    onClose();
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
              {isRevealed
                ? "🎉 Congratulations!"
                : "🎁 Choose Your Welcome Gift!"}
            </h2>
            <p className="text-gray-600 mt-1">
              {isRevealed
                ? "Your reward has been claimed!"
                : "Select one of these amazing rewards for your first visit"}
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
          {!isRevealed ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {gifts.map((gift) => (
                  <Card
                    key={gift._id}
                    className={cn(
                      "cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-2 hover:border-gray-300",
                      gift.bgColor
                    )}
                    onClick={() => handleRewardClick(gift)}
                  >
                    <CardContent className="p-6 text-center">
                      <div
                        className={cn(
                          "mx-auto mb-3 w-12 h-12 rounded-full flex items-center justify-center",
                          gift.bgColor
                        )}
                      >
                        <div className={gift.color}>
                          {iconMap[gift.icon] || <Gift className="w-6 h-6" />}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {gift.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {gift.description}
                      </p>
                      {gift.couponCode && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                          {gift.couponCode}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Click on any reward to claim it instantly!
                </p>
                <p className="text-xs text-gray-400">
                  Press ESC or click outside to close
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="mb-6">
                <div
                  className={cn(
                    "mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center",
                    selectedReward?.bgColor || "bg-green-100"
                  )}
                >
                  <div className={selectedReward?.color || "text-green-600"}>
                    {iconMap[selectedReward?.icon] || (
                      <Gift className="w-10 h-10" />
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedReward?.title}
                </h3>
                <p className="text-gray-600 mb-4">{selectedReward?.reward}</p>
                {selectedReward?.couponCode && (
                  <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      Your Coupon Code:
                    </p>
                    <code className="text-lg font-mono font-bold text-gray-800">
                      {selectedReward.couponCode}
                    </code>
                  </div>
                )}
                <div className="text-sm text-gray-500 mb-4">
                  Closing in {countdown} seconds...
                </div>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="hover:bg-gray-100"
                >
                  Close Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardPopup;
