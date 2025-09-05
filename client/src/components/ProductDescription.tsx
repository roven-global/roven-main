import React from "react";
import { cn } from "@/lib/utils";

interface ProductDescriptionProps {
  description: string;
  specifications?: Record<string, any>;
  className?: string;
  customSpecs?: Array<{ key: string; label: string }>;
}

/**
 * ProductDescription Component
 *
 * Displays product description and specifications in a clean, two-column layout
 * that matches the design from the provided image. The component is fully
 * reusable and can handle any product's backend description/specifications.
 *
 * Features:
 * - Main description text at the top
 * - Two-column specifications table below
 * - Automatic filtering of empty specifications
 * - Support for custom specification keys
 * - Responsive design
 * - Clean card-like styling with proper spacing
 */
const ProductDescription: React.FC<ProductDescriptionProps> = ({
  description,
  specifications = {},
  className,
  customSpecs,
}) => {
  // Define the key specifications to display in the two-column layout
  // These can be customized based on your product data structure
  const keySpecs = [
    { key: "baseMaterial", label: "Base Material" },
    { key: "phLevel", label: "pH Level" },
    { key: "color", label: "Color" },
    { key: "suitableSurfaces", label: "Suitable Surfaces" },
    { key: "volume", label: "Volume" },
    { key: "skinType", label: "Skin Type" },
    { key: "hairType", label: "Hair Type" },
    { key: "fragrance", label: "Fragrance" },
    { key: "weight", label: "Weight" },
    { key: "dimensions", label: "Dimensions" },
    { key: "material", label: "Material" },
    { key: "finish", label: "Finish" },
    { key: "application", label: "Application" },
    { key: "coverage", label: "Coverage" },
    { key: "formulation", label: "Formulation" },
  ];

  // Use custom specs if provided, otherwise use default keySpecs
  const specsToUse = customSpecs || keySpecs;

  // Filter specifications that have values
  const availableSpecs = specsToUse.filter(
    (spec) => specifications[spec.key] && specifications[spec.key] !== ""
  );

  // Split specs into two columns
  const leftColumnSpecs = availableSpecs.filter((_, index) => index % 2 === 0);
  const rightColumnSpecs = availableSpecs.filter((_, index) => index % 2 === 1);

  const renderSpecValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return String(value);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Description */}
      {description && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground">
            Product Description
          </h3>
          <p className="text-muted-brown leading-relaxed text-base">
            {description}
          </p>
        </div>
      )}

      {/* Specifications Table - Matching the image design */}
      {availableSpecs.length > 0 && (
        <div className="bg-white border border-border/20 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {leftColumnSpecs.map((spec) => (
                <div key={spec.key} className="space-y-2">
                  <h4 className="font-bold text-foreground text-base leading-tight">
                    {spec.label}:
                  </h4>
                  <p className="text-muted-brown text-sm leading-relaxed">
                    {renderSpecValue(specifications[spec.key])}
                  </p>
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {rightColumnSpecs.map((spec) => (
                <div key={spec.key} className="space-y-2">
                  <h4 className="font-bold text-foreground text-base leading-tight">
                    {spec.label}:
                  </h4>
                  <p className="text-muted-brown text-sm leading-relaxed">
                    {renderSpecValue(specifications[spec.key])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fallback message if no specifications */}
      {availableSpecs.length === 0 && specifications && (
        <div className="bg-white border border-border/20 rounded-lg p-6 shadow-sm">
          <p className="text-muted-brown text-center py-4">
            No specifications available for this product.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductDescription;

// Example usage:
//
// Basic usage with default specifications:
// <ProductDescription
//   description="High-performance calcium-based polish for marble, granite, and limestone."
//   specifications={{
//     baseMaterial: "Acid salt powder",
//     phLevel: "3-4",
//     color: "Yellow / White",
//     suitableSurfaces: "Marble, Granite, Artificial Marble"
//   }}
// />
//
// Custom specifications:
// <ProductDescription
//   description="Product description here..."
//   specifications={product.specifications}
//   customSpecs={[
//     { key: "weight", label: "Weight" },
//     { key: "dimensions", label: "Dimensions" },
//     { key: "material", label: "Material" }
//   ]}
// />
