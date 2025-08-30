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
        <h4 className="text-lg font-semibold text-gray-900">Select Size</h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
                "relative group p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2",
                "hover:shadow-md hover:border-sage/50",
                isSelected
                  ? "border-sage bg-sage/5 shadow-md"
                  : "border-gray-200 bg-white hover:border-sage/30",
                isDisabled &&
                  "opacity-50 cursor-not-allowed hover:shadow-none hover:border-gray-200"
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
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-sage rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
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
              <div className="text-center">
                <div className="font-semibold text-gray-900 text-lg mb-1">
                  {variant.volume}
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <div className="font-bold text-gray-900">
                    {formatRupees(variant.price)}
                  </div>

                  {/* Unit Price */}
                  {unitPrice > 0 && (
                    <div className="text-xs text-gray-500">
                      ({formatRupees(unitPrice)} / 100ml)
                    </div>
                  )}

                  {/* Original Price */}
                  {variant.originalPrice &&
                    variant.originalPrice > variant.price && (
                      <div className="text-xs text-gray-400 line-through">
                        {formatRupees(variant.originalPrice)}
                      </div>
                    )}
                </div>

                {/* Stock Status */}
                {variant.stock === 0 && (
                  <div className="text-xs text-red-500 font-medium mt-1">
                    Out of Stock
                  </div>
                )}
                {variant.stock > 0 && variant.stock <= 5 && (
                  <div className="text-xs text-orange-500 font-medium mt-1">
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
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Size
          </label>
          <select
            id="size-select"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-sage"
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
