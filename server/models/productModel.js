const mongoose = require("mongoose");
const slugify = require("slugify");

/**
 * Ingredient Schema
 * Schema for product ingredients with image support
 */
const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    description: { type: String, trim: true, maxlength: 300 },
    image: {
      public_id: { type: String, trim: true }, // Cloudinary public ID
      url: { type: String, trim: true }, // Cloudinary secure URL
    },
  },
  { _id: false }
);

/**
 * Product Schema
 * Main product schema with variants, specifications, and inventory management
 */
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
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
    },
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
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    specifications: {
      volume: { type: String, trim: true },
      skinType: {
        type: [String],
        enum: [
          "Normal",
          "Dry",
          "Oily",
          "Combination",
          "Sensitive",
          "All Types",
        ],
        default: ["All Types"],
        validate: {
          validator: function (v) {
            return Array.isArray(v) && v.length > 0;
          },
          message: "Skin type must be a non-empty array",
        },
      },
      hairType: {
        type: [String],
        enum: [
          "Normal",
          "Dry",
          "Oily",
          "Damaged",
          "Color-Treated",
          "All Types",
        ],
        default: ["All Types"],
        validate: {
          validator: function (v) {
            return Array.isArray(v) && v.length > 0;
          },
          message: "Hair type must be a non-empty array",
        },
      },
      fragrance: { type: String, trim: true },
    },
    ingredients: [ingredientSchema], // hero ingredients with uploaded images
    suitableFor: [
      {
        type: String,
        enum: ["Men", "Women", "Unisex", "All", "Dry", "Wet", "Sensitive"],
        trim: true,
        validate: {
          validator: function (v) {
            return v && v.trim().length > 0;
          },
          message: "Suitable for item cannot be empty",
        },
      },
    ],
    benefits: [
      {
        type: String,
        trim: true,
        maxlength: [100, "Benefit cannot exceed 100 characters"],
      },
    ],
    howToUse: [
      {
        type: String,
        trim: true,
        maxlength: [300, "How to use step cannot exceed 300 characters"],
      },
    ],
    tags: [{ type: String, trim: true, lowercase: true }],
    relatedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    ranking_featured: {
      type: Number,
      default: 0,
      min: [0, "Featured ranking cannot be negative"],
    },
    products_ranking: {
      type: Number,
      default: 0,
      min: [0, "Products ranking cannot be negative"],
    },
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
  { timestamps: true }
);

/**
 * Pre-save middleware to generate slug from product name
 */
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      remove: /[*+~.()'"!:@]/g,
      strict: true,
    });
  }

  if (this.variants && this.variants.length > 0) {
    this.price = Math.min(...this.variants.map((v) => v.price));
    const variantsWithOriginalPrice = this.variants.filter(
      (v) => v.originalPrice
    );
    if (variantsWithOriginalPrice.length > 0) {
      this.originalPrice = Math.min(
        ...variantsWithOriginalPrice.map((v) => v.originalPrice)
      );
    }
  }

  next();
});

// Virtuals
productSchema.virtual("discountPercentage").get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100
    );
  }
  return 0;
});

productSchema.virtual("stockStatus").get(function () {
  if (!this.variants || this.variants.length === 0) return "Out of Stock";
  const totalStock = this.variants.reduce((t, v) => t + (v.stock || 0), 0);
  const minThreshold = Math.min(
    ...this.variants.map((v) => v.lowStockThreshold || 10)
  );
  if (totalStock === 0) return "Out of Stock";
  if (totalStock <= minThreshold) return "Low Stock";
  return "In Stock";
});

productSchema.virtual("minPrice").get(function () {
  if (!this.variants || this.variants.length === 0) return this.price;
  return Math.min(...this.variants.map((v) => v.price));
});

productSchema.virtual("maxPrice").get(function () {
  if (!this.variants || this.variants.length === 0) return this.price;
  return Math.max(...this.variants.map((v) => v.price));
});

productSchema.virtual("availableVariants").get(function () {
  if (!this.variants) return [];
  return this.variants.filter((v) => v.isActive && v.stock > 0);
});

productSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

productSchema.index({ name: "text", description: "text", brand: "text" });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ ratings: 1 });
productSchema.index({ name: 1, brand: 1, category: 1 });
productSchema.index({ ranking_featured: 1, isFeatured: 1, isActive: 1 });
productSchema.index({ products_ranking: 1, isActive: 1 });

module.exports = mongoose.model("Product", productSchema);
