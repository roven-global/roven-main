import React from "react";
import { cn } from "@/lib/utils";
import { formatRupees } from "@/lib/currency";

interface SizeOption {
  volume: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sku: string;
  isActive: boolean;
}

interface SizeSelectorProps {
  variants: SizeOption[];
  selectedVariant: SizeOption | null;
  onVariantChange: (variant: SizeOption) => void;
  className?: string;
}

const SizeSelector: React.FC<SizeSelectorProps> = ({
  variants,
  selectedVariant,
  onVariantChange,
  className,
}) => {
  const calculateUnitPrice = (price: number, volume: string) => {
    const volumeNumber = parseInt(volume.replace(/\D/g, ""));
    if (volumeNumber > 0) {
      return Math.round((price / volumeNumber) * 100);
    }
    return 0;
  };

  const handleVariantSelect = (variant: SizeOption) => {
    if (variant.stock > 0 && variant.isActive) {
      onVariantChange(variant);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, variant: SizeOption) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleVariantSelect(variant);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Select Size</h4>
      </div>

      <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide sm:flex-wrap">
        {variants.map((variant) => {
          const isSelected = selectedVariant?.sku === variant.sku;
          const isDisabled = variant.stock === 0 || !variant.isActive;
          const unitPrice = calculateUnitPrice(variant.price, variant.volume);

          return (
            <button
              key={variant.sku}
              onClick={() => handleVariantSelect(variant)}
              onKeyDown={(e) => handleKeyDown(e, variant)}
              disabled={isDisabled}
              className={cn(
                "relative group border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                "w-40 sm:w-44 md:w-48 lg:w-52 h-36 sm:h-40 md:h-44 lg:h-48 flex-shrink-0 sm:flex-shrink snap-start",
                "p-2 sm:p-3 md:p-4",
                "hover:shadow-md hover:border-primary/50",
                isSelected
                  ? "border-primary bg-blue-50 shadow-md"
                  : "border-border bg-gray-100 hover:border-primary/30",
                isDisabled &&
                  "opacity-50 cursor-not-allowed hover:shadow-none hover:border-border"
              )}
              data-size={variant.volume}
              data-price={variant.price}
              data-original-price={variant.originalPrice}
              data-sku={variant.sku}
              data-stock={variant.stock}
              data-unit-price={unitPrice}
              role="radio"
              aria-checked={isSelected}
              aria-label={`Select ${variant.volume} size`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-primary-foreground"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Size Label */}
              <div className="text-center space-y-1 sm:space-y-2 flex flex-col justify-center h-full overflow-hidden">
                <div className="font-semibold text-foreground text-sm sm:text-base truncate">
                  {variant.volume}
                </div>

                {/* Price */}
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="font-bold text-foreground text-xs sm:text-sm truncate">
                    {formatRupees(variant.price)}
                  </div>

                  {/* Unit Price */}
                  {unitPrice > 0 && (
                    <div className="text-xs text-muted-foreground leading-tight break-words px-1">
                      ({formatRupees(unitPrice)} / 100ml)
                    </div>
                  )}

                  {/* Original Price */}
                  {variant.originalPrice &&
                    variant.originalPrice > variant.price && (
                      <div className="text-xs text-muted-foreground/80 line-through truncate">
                        {formatRupees(variant.originalPrice)}
                      </div>
                    )}
                </div>

                {/* Stock Status */}
                {variant.stock === 0 && (
                  <div className="text-xs text-destructive font-medium">
                    Out of Stock
                  </div>
                )}
                {variant.stock > 0 && variant.stock <= 5 && (
                  <div className="text-xs text-destructive font-medium">
                    Only {variant.stock} left
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Fallback for no JS */}
      <noscript>
        <div className="mt-4">
          <label
            htmlFor="size-select"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Select Size
          </label>
          <select
            id="size-select"
            className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            defaultValue={selectedVariant?.sku || ""}
            onChange={(e) => {
              const variant = variants.find((v) => v.sku === e.target.value);
              if (variant) onVariantChange(variant);
            }}
          >
            <option value="">Choose a size...</option>
            {variants.map((variant) => (
              <option
                key={variant.sku}
                value={variant.sku}
                disabled={variant.stock === 0 || !variant.isActive}
              >
                {variant.volume} - {formatRupees(variant.price)}
                {variant.stock === 0 ? " (Out of Stock)" : ""}
              </option>
            ))}
          </select>
        </div>
      </noscript>
    </div>
  );
};

export default SizeSelector;
