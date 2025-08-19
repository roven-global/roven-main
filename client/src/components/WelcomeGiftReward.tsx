import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { formatRupees } from "@/lib/currency";

interface WelcomeGiftRewardProps {
  cartItems?: any[];
  onValidateReward?: (gift: any, couponCode?: string) => Promise<void>;
  onRewardRemoved?: () => void;
  appliedReward?: any;
  hasClaimedReward?: boolean;
}

export const WelcomeGiftReward: React.FC<WelcomeGiftRewardProps> = ({
  cartItems,
  onValidateReward,
  onRewardRemoved,
  appliedReward,
  hasClaimedReward: hasClaimedRewardProp,
}) => {
  const { orderQuote, applyWelcomeGift, removeWelcomeGift, hasClaimedReward } =
    useCart();

  const appliedGift = orderQuote?.discounts?.welcomeGift > 0;
  const giftDetails = orderQuote?.coupon; // Assuming gift details are in coupon field of quote

  // Use prop if provided, otherwise use context
  const finalHasClaimedReward = hasClaimedRewardProp ?? hasClaimedReward();

  if (!appliedGift) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="w-5 h-5 text-orange-600" />
            <p className="text-sm text-forest">Have a welcome gift?</p>
          </div>
          <Button
            onClick={() => applyWelcomeGift()}
            size="sm"
            variant="outline"
          >
            Apply Gift
          </Button>
        </CardContent>
      </Card>
    );
  }

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
                {giftDetails?.name || "Welcome Gift Applied"}
              </h4>
              <p className="text-sm font-medium text-green-800">
                -{formatRupees(orderQuote.discounts.welcomeGift)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeWelcomeGift()}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeGiftReward;
