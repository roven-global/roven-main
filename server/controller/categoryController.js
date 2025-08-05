const CategoryModel = require("../models/categoryModel");
const ProductModel = require("../models/productModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const uploadImageCloudinary = require("../utils/uploadImageCloudinary");

// Utility to generate a slug
const generateSlug = (name) => {
  return slugify(name, {
    lower: true,
    remove: /[*+~.()'"!:@]/g,
  });
};

/**
 * Creates a new category (Admin only)
 * @route POST /api/category/create
 */
const createCategory = asyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing request body.",
    });
  }

  const { name, parentCategory } = req.body;
  const image = req.file; // Validate required fields

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Category name is required.",
    });
  }

  if (!image) {
    return res.status(400).json({
      success: false,
      message: "Category image is required.",
    });
  } // Check if category already exists

  const existingCategory = await CategoryModel.findOne({ name });
  if (existingCategory) {
    return res.status(409).json({
      success: false,
      message: "Category with this name already exists.",
    });
  } // If parentCategory is provided, check if it exists

  if (parentCategory) {
    const parentExists = await CategoryModel.findById(parentCategory);
    if (!parentExists) {
      return res.status(400).json({
        success: false,
        message: "Parent category not found.",
      });
    }
  } // Upload image to Cloudinary

  let upload;
  try {
    upload = await uploadImageCloudinary(image);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Image upload failed.",
      error: err.message,
    });
  } // Create category

  const slug = generateSlug(name);
  const categoryData = {
    name,
    slug,
    image: {
      public_id: upload.public_id,
      url: upload.url,
    },
    parentCategory: parentCategory || null,
  };

  const newCategory = new CategoryModel(categoryData);
  await newCategory.save();

  return res.status(201).json({
    success: true,
    message: "Category created successfully.",
    data: newCategory,
  });
});

/**
 * Get all categories with optional filtering
 * @route GET /api/category/all
 */
const getAllCategories = asyncHandler(async (req, res) => {
  const { parent, active } = req.query;
  let filter = {}; // Filter by parent category
  if (parent === "null" || parent === "main") {
    filter.parentCategory = null;
  } else if (parent) {
    filter.parentCategory = parent;
  } // Filter by active status
  if (active !== undefined) {
    filter.isActive = active === "true";
  }

  const categories = await CategoryModel.find(filter)
    .populate("parentCategory", "name slug")
    .populate("subcategories")
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    message: "Categories retrieved successfully.",
    data: categories,
  });
});

/**
 * Get single category by ID or slug
 * @route GET /api/category/:identifier
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const { identifier } = req.params;

  let category; // Check if identifier is a valid ObjectId
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    category = await CategoryModel.findById(identifier);
  } else {
    // Search by slug
    category = await CategoryModel.findOne({ slug: identifier });
  }

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found.",
    });
  } // Populate related data

  await category.populate("parentCategory", "name slug");
  await category.populate("subcategories");

  return res.json({
    success: true,
    message: "Category retrieved successfully.",
    data: category,
  });
});

/**
 * Update category (Admin only)
 * @route PUT /api/category/:id
 */
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, parentCategory } = req.body;
  const image = req.file;

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing request body.",
    });
  }

  const category = await CategoryModel.findById(id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found.",
    });
  }

  let updateFields = {};
  let newSlug; // Update name if provided

  if (name && name !== category.name) {
    const existingCategory = await CategoryModel.findOne({
      name,
      _id: { $ne: id },
    });
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists.",
      });
    }
    updateFields.name = name;
    newSlug = generateSlug(name); // Generate the new slug
    updateFields.slug = newSlug; // Add the new slug to the update fields
  } // Update parent category if provided

  if (parentCategory !== undefined) {
    if (parentCategory && parentCategory !== String(category.parentCategory)) {
      const parentExists = await CategoryModel.findById(parentCategory);
      if (!parentExists) {
        return res.status(400).json({
          success: false,
          message: "Parent category not found.",
        });
      }
      if (parentCategory === id) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be its own parent.",
        });
      }
    }
    updateFields.parentCategory = parentCategory || null;
  } // Update image if provided

  if (image) {
    try {
      const upload = await uploadImageCloudinary(image);
      updateFields.image = {
        public_id: upload.public_id,
        url: upload.url,
      };
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Image upload failed.",
        error: err.message,
      });
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid fields provided for update.",
    });
  }

  const updatedCategory = await CategoryModel.findByIdAndUpdate(
    id,
    updateFields,
    { new: true, runValidators: true }
  ).populate("parentCategory", "name slug");

  // If the slug was updated, propagate this change to all related products.
  if (newSlug) {
    await ProductModel.updateMany(
      { category: id },
      { $set: { categorySlug: newSlug } }
    );
  }

  return res.json({
    success: true,
    message: "Category updated successfully.",
    data: updatedCategory,
  });
});

/**
 * Delete category (Admin only)
 * @route DELETE /api/category/:id
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await CategoryModel.findById(id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found.",
    });
  } // Check if category has subcategories

  const subcategories = await CategoryModel.find({ parentCategory: id });
  if (subcategories.length > 0) {
    return res.status(400).json({
      success: false,
      message:
        "Cannot delete category with subcategories. Delete subcategories first.",
    });
  }

  const ProductModel = require("../models/productModel");
  const products = await ProductModel.find({ category: id });
  if (products.length > 0) {
    return res.status(400).json({
      success: false,
      message:
        "Cannot delete category with products. Move or delete products first.",
    });
  }

  await CategoryModel.findByIdAndDelete(id);

  return res.json({
    success: true,
    message: "Category deleted successfully.",
  });
});

/**
 * Bulk delete categories (Admin only)
 * @route DELETE /api/category/bulk-delete
 */
const bulkDeleteCategories = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Category IDs must be provided as a non-empty array.",
    });
  } // Validation: Check if any categories are in use

  const subcategoryCheck = await CategoryModel.findOne({
    parentCategory: { $in: ids },
  });
  if (subcategoryCheck) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete because category "${subcategoryCheck.name}" is a parent to other categories.`,
    });
  }

  const productCheck = await ProductModel.findOne({ category: { $in: ids } });
  if (productCheck) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete because at least one category is assigned to a product (e.g., "${productCheck.name}").`,
    });
  }

  const result = await CategoryModel.deleteMany({ _id: { $in: ids } });

  if (result.deletedCount === 0) {
    return res.status(404).json({
      success: false,
      message: "No categories found with the provided IDs.",
    });
  }

  return res.json({
    success: true,
    message: `${result.deletedCount} categories deleted successfully.`,
  });
});

/**
 * Get category hierarchy (parent categories with their subcategories)
 * @route GET /api/category/hierarchy
 */
const getCategoryHierarchy = asyncHandler(async (req, res) => {
  const parentCategories = await CategoryModel.find({ parentCategory: null })
    .populate({
      path: "subcategories",
      populate: {
        path: "subcategories", // For deeper nesting if needed
      },
    })
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    message: "Category hierarchy retrieved successfully.",
    data: parentCategories,
  });
});

/**
 * Search categories
 * @route GET /api/category/search
 */
const searchCategories = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: "Search query is required.",
    });
  }

  const categories = await CategoryModel.find({
    name: { $regex: q, $options: "i" },
  })
    .populate("parentCategory", "name slug")
    .limit(20);

  return res.json({
    success: true,
    message: "Search results retrieved successfully.",
    data: categories,
  });
});

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
  getCategoryHierarchy,
  searchCategories,
};
