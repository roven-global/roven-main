import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Gift, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getUserRewards } from "@/utils/markRewardAsUsed";
import { toast } from "@/hooks/use-toast";
import { formatRupees } from "@/lib/currency";

interface WelcomeGiftRewardProps {
  cartItems?: any[];
  onRewardRemoved: () => void;
  appliedReward?: any;
  onValidateReward: (gift: any, couponCode?: string) => void;
  hasClaimedReward: boolean;
}

export const WelcomeGiftReward: React.FC<WelcomeGiftRewardProps> = ({
  onRewardRemoved,
  appliedReward,
  onValidateReward,
  hasClaimedReward,
}) => {
  const { user } = useAuth();
  const [userReward, setUserReward] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Fetch user's claimed reward
  useEffect(() => {
    const fetchUserReward = async () => {
      setLoading(true);
      setUserReward(null); // Reset on each fetch
      try {
        let rewardData = null;
        // 1. If user is logged in, prioritize fetching from the backend.
        if (user) {
          const rewards = await getUserRewards();
          const unusedReward = rewards.find((reward: any) => !reward.isUsed);
          if (unusedReward) {
            rewardData = unusedReward;
          }
        }

        // 2. If no reward from backend OR user is a guest, fall back to localStorage.
        if (!rewardData) {
          const storedReward = localStorage.getItem("claimedRewardDetails");
          if (storedReward) {
            try {
              rewardData = JSON.parse(storedReward);
            } catch (e) {
              console.error("Error parsing stored reward from localStorage", e);
            }
          }
        }

        // 3. If any reward is found, set the state.
        if (rewardData) {
          setUserReward(rewardData);
          setCouponCode(rewardData.couponCode || "");
        }
      } catch (error) {
        console.error("Error fetching user reward:", error);
      } finally {
        setLoading(false);
      }
    };

    if (hasClaimedReward) {
      fetchUserReward();
    } else {
      setUserReward(null);
    }
  }, [user, hasClaimedReward]);

  const handleApply = async (couponToApply?: string) => {
    const code = couponToApply || couponCode;
    if (!userReward || !code) return;

    const currentTarget = couponToApply ? setCouponLoading : setApplying;
    currentTarget(true);

    try {
      onValidateReward(userReward, code);
    } catch (error) {
      console.error("Error during handleApply:", error);
      toast({
        title: "Error Applying Gift",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      currentTarget(false);
    }
  };

  const handleRemoveReward = () => {
    onRewardRemoved();
    toast({
      title: "Welcome gift removed",
      description: "The welcome gift has been removed from your order.",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-center">Loading gift...</CardContent>
      </Card>
    );
  }

  if (appliedReward) {
    const isValid = appliedReward.isValid !== false;
    return (
      <Card
        className={cn(
          "border-2",
          isValid
            ? "border-green-200 bg-green-50"
            : "border-orange-200 bg-orange-50"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isValid ? "bg-green-100" : "bg-orange-100"
                )}
              >
                {isValid ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 text-orange-600">⚠️</div>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-green-800">
                  {appliedReward.reward?.title}
                </h4>
                <p className="text-sm text-green-700">
                  {appliedReward.validationMessage ||
                    appliedReward.reward?.reward}
                </p>
                {isValid && (
                  <p className="text-sm font-medium text-green-800">
                    -{formatRupees(appliedReward.discountAmount)}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveReward}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userReward) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-warm-taupe">No welcome gift claimed yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-100">
              <Gift className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-orange-800">
                Welcome Gift Available!
              </h4>
              <p className="text-sm text-orange-700 mb-2">
                {userReward.title}: {userReward.reward}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-orange-800">
              Enter Coupon Code to Apply:
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., WELCOME10"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 border-orange-300 focus:border-orange-500"
              />
              <Button
                onClick={() => handleApply(couponCode)}
                disabled={couponLoading || !couponCode.trim()}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {couponLoading ? "Applying..." : "Apply Code"}
              </Button>
            </div>
            {couponError && (
              <p className="text-xs text-red-600">{couponError}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleApply()}
              disabled={applying}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {applying ? <>Applying...</> : <>Apply Gift</>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeGiftReward;
