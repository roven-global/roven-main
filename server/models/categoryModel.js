const mongoose = require("mongoose");
const slugify = require("slugify");

/**
 * Category Schema
 * Stores product categories with hierarchical structure support
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    image: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const generateSlug = (name) => {
  return slugify(name, {
    lower: true,
    remove: /[*+~.()'"!:@]/g,
    strict: true,
  });
};

/**
 * Pre-save middleware to generate slug from category name
 */
categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = generateSlug(this.name);
  }
  next();
});

/**
 * Pre-update middleware to generate slug when category name is updated
 */
categorySchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.name) {
    this.set({ slug: generateSlug(update.name) });
  }
  next();
});

// Virtual for subcategories
categorySchema.virtual("subcategories", {
  ref: "Category",
  localField: "_id",
  foreignField: "parentCategory",
});

// Virtual for products count
categorySchema.virtual("productsCount", {
  ref: "Product",
  localField: "_id",
  foreignField: "category",
  count: true,
});

// Ensure virtuals are included in JSON output
categorySchema.set("toJSON", { virtuals: true });
categorySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Category", categorySchema);
