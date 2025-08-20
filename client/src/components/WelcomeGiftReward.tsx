import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Check, X, Info } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useUserReward } from "@/contexts/UserRewardContext";
import { formatRupees } from "@/lib/currency";

export const WelcomeGiftReward: React.FC = () => {
  const { orderQuote } = useCart();
  const { userReward } = useUserReward();

  if (!userReward) {
    // If the user hasn't claimed a reward, don't render anything.
    // The RewardPopup component handles offering the gift.
    return null;
  }

  const isApplied = orderQuote?.discounts?.welcomeGift > 0;
  const subtotal = orderQuote?.subtotal || 0;
  const conditionsMet = subtotal >= userReward.minOrderAmount;

  if (isApplied) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">
                  {userReward.title}
                </h4>
                <p className="text-sm font-medium text-green-800">
                  -{formatRupees(orderQuote.discounts.welcomeGift)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userReward && !conditionsMet) {
    const remainingAmount = userReward.minOrderAmount - subtotal;
    return (
      <Card className="border-2 border-yellow-200 bg-yellow-50">
        <CardContent className="p-4 flex items-center gap-3">
          <Info className="w-5 h-5 text-yellow-600" />
          <div>
            <h4 className="font-semibold text-yellow-800">{userReward.title} Available</h4>
            <p className="text-sm text-yellow-700">
              Add {formatRupees(remainingAmount)} more to your cart to apply this gift.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback case, in theory this should not be reached if logic is correct
  return null;
};

export default WelcomeGiftReward;
