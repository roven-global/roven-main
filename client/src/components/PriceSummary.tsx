import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck } from "lucide-react";
import { formatRupees } from "@/lib/currency";

interface PriceSummaryProps {
  isQuoteLoading: boolean;
  subtotal: number;
  couponDiscount: number;
  welcomeGiftDiscount: number;
  shippingCost: number;
  finalTotal: number;
  totalSavings: number;
  isAuthenticated?: boolean;
  lifetimeSavings?: number;
  lifetimeSavingsLoading?: boolean;
  children?: React.ReactNode; // To allow passing the action button
}

const PriceSummary: React.FC<PriceSummaryProps> = ({
  isQuoteLoading,
  subtotal,
  couponDiscount,
  welcomeGiftDiscount,
  shippingCost,
  finalTotal,
  totalSavings,
  isAuthenticated,
  lifetimeSavings,
  lifetimeSavingsLoading,
  children,
}) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm sticky top-4">
      <div className="p-4 border-b">
        <span className="font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          Price Summary
        </span>
      </div>
      <div className="p-4 space-y-3">
        {isQuoteLoading ? (
          <div className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <Separator />
            <div className="flex justify-between">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-brown">Order Total</span>
              <span className="text-foreground font-bold">
                {formatRupees(subtotal)}
              </span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-brown">Coupon Discount</span>
                <span className="text-primary font-bold">
                  -{formatRupees(couponDiscount)}
                </span>
              </div>
            )}
            {welcomeGiftDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-brown">Welcome Gift</span>
                <span className="text-primary font-bold">
                  -{formatRupees(welcomeGiftDiscount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-brown">Shipping</span>
              <div className="text-right">
                {shippingCost === 0 && subtotal > 0 ? (
                  <span className="text-primary font-bold">Free</span>
                ) : (
                  <span className="text-foreground font-bold">
                    {formatRupees(shippingCost)}
                  </span>
                )}
              </div>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span className="text-foreground">To Pay</span>
              <span className="text-foreground">
                {formatRupees(finalTotal)}
              </span>
            </div>
          </>
        )}
      </div>
      <div className="p-4 border-t">
        {totalSavings > 0 && (
          <div className="bg-primary/10 border border-primary/70 rounded-lg p-3 mb-4 flex items-center gap-2">
            <span className="text-primary-10">✓</span>
            <p className="text-sm text-primary-5 font-medium">
              You are saving {formatRupees(totalSavings)} on this order
            </p>
          </div>
        )}

        {isAuthenticated && (
          <div className="bg-primary/10 border border-primary/60 rounded-lg p-3 mb-4 flex items-center gap-2">
            <span className="text-primary">🏆</span>
            <div className="flex-1">
              <p className="text-sm text-primary-20 font-medium">
                Your lifetime savings with Roven Beauty
              </p>
              {lifetimeSavingsLoading ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  <span className="text-xs text-primary">
                    Calculating...
                  </span>
                </div>
              ) : (
                <p className="text-lg font-bold text-foreground mt-1">
                  {formatRupees(lifetimeSavings ?? 0)}
                </p>
              )}
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default PriceSummary;
