const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, "Short description cannot exceed 300 characters"],
    },
    // Base price - will be the minimum price from variants for display
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
    },
    // Volume variants with individual pricing and stock
    variants: [
      {
        volume: {
          type: String,
          required: [true, "Volume is required for variant"],
          trim: true,
        },
        price: {
          type: Number,
          required: [true, "Price is required for variant"],
          min: [0, "Price cannot be negative"],
        },
        originalPrice: {
          type: Number,
          min: [0, "Original price cannot be negative"],
        },
        stock: {
          type: Number,
          required: [true, "Stock is required for variant"],
          min: [0, "Stock cannot be negative"],
          default: 0,
        },
        sku: {
          type: String,
          required: [true, "SKU is required for variant"],
          unique: true,
          trim: true,
          uppercase: true,
        },
        lowStockThreshold: {
          type: Number,
          default: 10,
          min: [0, "Low stock threshold cannot be negative"],
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    // **FIX ADDED**: Storing the category slug on the product
    categorySlug: {
      type: String,
      required: [true, "Category slug is required"],
      lowercase: true,
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
      maxlength: [50, "Brand name cannot exceed 50 characters"],
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    images: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    specifications: {
      volume: { type: String, trim: true },
      ingredients: [{ type: String, trim: true }],
      skinType: {
        type: String,
        enum: ["Normal", "Dry", "Oily", "Combination", "Sensitive", "All Types"],
        default: "All Types",
      },
      hairType: {
        type: String,
        enum: ["Normal", "Dry", "Oily", "Damaged", "Color-Treated", "All Types"],
        default: "All Types",
      },
      suitableFor: {
        type: String,
        enum: ["Men", "Women", "Unisex"],
        default: "Unisex",
      },
      fragrance: { type: String, trim: true },
    },
    benefits: [
      {
        type: String,
        trim: true,
        maxlength: [100, "Benefit cannot exceed 100 characters"],
      },
    ],
    tags: [{ type: String, trim: true, lowercase: true }],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: [0, "Rating cannot be less than 0"],
        max: [5, "Rating cannot be more than 5"],
      },
      numOfReviews: {
        type: Number,
        default: 0,
        min: [0, "Number of reviews cannot be negative"],
      },
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create slug from name before saving
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      remove: /[*+~.()'"!:@]/g,
      strict: true,
    });
  }
  next();
});

// Virtual for discount percentage (uses minimum price variant)
productSchema.virtual("discountPercentage").get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100
    );
  }
  return 0;
});

// Virtual for stock status (based on all variants)
productSchema.virtual("stockStatus").get(function () {
  if (!this.variants || this.variants.length === 0) return "Out of Stock";
  
  const totalStock = this.variants.reduce((total, variant) => total + (variant.stock || 0), 0);
  const minLowStockThreshold = Math.min(...this.variants.map(v => v.lowStockThreshold || 10));
  
  if (totalStock === 0) return "Out of Stock";
  if (totalStock <= minLowStockThreshold) return "Low Stock";
  return "In Stock";
});

// Virtual for minimum price across variants
productSchema.virtual("minPrice").get(function () {
  if (!this.variants || this.variants.length === 0) return this.price;
  return Math.min(...this.variants.map(v => v.price));
});

// Virtual for maximum price across variants
productSchema.virtual("maxPrice").get(function () {
  if (!this.variants || this.variants.length === 0) return this.price;
  return Math.max(...this.variants.map(v => v.price));
});

// Virtual for available variants (only active variants with stock > 0)
productSchema.virtual("availableVariants").get(function () {
  if (!this.variants) return [];
  return this.variants.filter(variant => variant.isActive && variant.stock > 0);
});

// Virtual for reviews
productSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});

// Ensure virtuals are included in JSON output
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

// Index for better search performance
productSchema.index({ name: "text", description: "text", brand: "text" });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ ratings: 1 });
// Compound index for search functionality
productSchema.index({ name: 1, brand: 1, category: 1 });

module.exports = mongoose.model("Product", productSchema);
