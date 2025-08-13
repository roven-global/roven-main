// productController.js
const ProductModel = require("../models/productModel");
const CategoryModel = require("../models/categoryModel");
const asyncHandler = require("express-async-handler");
const uploadImageCloudinary = require("../utils/uploadImageCloudinary");
const slugify = require("slugify");

// Utility to generate a slug
const generateSlug = (name) => {
  return slugify(name, {
    lower: true,
    remove: /[*+~.()'"!:@]/g,
  });
};

// Helper: process hero ingredient images
const processIngredientImages = async (ingredients, files) => {
  if (!Array.isArray(ingredients)) return [];

  const processed = [];
  for (let i = 0; i < ingredients.length; i++) {
    const ingredient = ingredients[i];
    let imageData = null;

    // If we have an uploaded file for this ingredient
    if (files && files[`ingredientImages[${i}]`]) {
      const file = files[`ingredientImages[${i}]`][0];
      try {
        const upload = await uploadImageCloudinary(file);
        imageData = {
          public_id: upload.public_id,
          url: upload.url,
        };
      } catch (err) {
        console.error(`Failed to upload ingredient image ${i}:`, err);
        imageData = null;
      }
    } else if (ingredient.image && typeof ingredient.image === "string" && ingredient.image.trim()) {
      // If they passed a URL string (fallback)
      imageData = { public_id: null, url: ingredient.image };
    } else if (ingredient.image && ingredient.image.url) {
      // If they already have an image object
      imageData = ingredient.image;
    }

    processed.push({
      name: ingredient.name || "",
      description: ingredient.description || "",
      image: imageData || null,
    });
  }
  return processed;
};

/**
 * Create a new product (Admin only)
 * @route POST /api/product/create
 */
const createProduct = asyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing request body.",
    });
  }

  const {
    name,
    description,
    shortDescription,
    category,
    brand,
    sku,
    price,
    originalPrice,
    volume,
    variants,
    hasVariants,
    productType,
    specifications,
    ingredients,
    suitableFor,
    tags,
    benefits,
    isFeatured,
    isActive,
    howToUse,
  } = req.body;

  // Ensure images present
  if (!req.files || !req.files.images || req.files.images.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one product image is required.",
    });
  }

  // Required field check
  if (!name || !description || !category || !brand || !sku) {
    return res.status(400).json({
      success: false,
      message: "Required fields: name, description, category, brand, sku.",
    });
  }

  // Detect variant vs single
  const isVariantProduct =
    hasVariants === "true" ||
    productType === "variant" ||
    (variants && Array.isArray(variants) && variants.length > 0);

  if (!isVariantProduct) {
    // Single product must have valid price
    if (!price || parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price is required and must be greater than 0 for single products.",
      });
    }
  } else {
    // Variants must be provided and valid
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one variant is required for variant products.",
      });
    }
  }

  // Check category exists
  const categoryExists = await CategoryModel.findById(category);
  if (!categoryExists) {
    return res.status(400).json({
      success: false,
      message: "Category not found.",
    });
  }

  // Main SKU uniqueness check
  const existingProduct = await ProductModel.findOne({ sku: sku.toUpperCase() });
  if (existingProduct) {
    return res.status(409).json({
      success: false,
      message: "Product with this SKU already exists.",
    });
  }

  // Upload main images
  let uploadedImages = [];
  try {
    const productImages = req.files.images || [];
    for (let image of productImages) {
      const upload = await uploadImageCloudinary(image);
      uploadedImages.push({
        public_id: upload.public_id,
        url: upload.url,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Image upload failed.",
      error: err.message,
    });
  }

  // Parse specifications (excluding suitableFor and ingredients as they are separate fields)
  let parsedSpecifications = {};
  if (specifications) {
    parsedSpecifications =
      typeof specifications === "string" ? JSON.parse(specifications) : specifications;

    // Remove suitableFor and ingredients from specifications if they exist
    if (parsedSpecifications.suitableFor) {
      delete parsedSpecifications.suitableFor;
    }
    if (parsedSpecifications.ingredients) {
      delete parsedSpecifications.ingredients;
    }
  }

  // Parse ingredients separately (frontend sends them separately from specifications)
  let parsedIngredients = [];

  if (req.body.ingredients) {
    try {
      parsedIngredients = typeof req.body.ingredients === "string"
        ? JSON.parse(req.body.ingredients)
        : req.body.ingredients;

      if (!Array.isArray(parsedIngredients)) {
        parsedIngredients = [];
      }

      // Process ingredient images
      parsedIngredients = await processIngredientImages(parsedIngredients, req.files);
    } catch (err) {
      console.error('Error parsing ingredients:', err);
      parsedIngredients = [];
    }
  }

  // Parse suitableFor separately
  let parsedSuitableFor = [];
  if (suitableFor) {
    try {
      parsedSuitableFor = typeof suitableFor === "string"
        ? JSON.parse(suitableFor)
        : suitableFor;

      if (!Array.isArray(parsedSuitableFor)) {
        parsedSuitableFor = [];
      }
    } catch (err) {
      console.error('Error parsing suitableFor:', err);
      parsedSuitableFor = [];
    }
  }

  // Parse tags, benefits, howToUse
  const parsedTags =
    tags && typeof tags === "string"
      ? tags.includes("[") ? JSON.parse(tags) : tags.split(",").map(t => t.trim())
      : tags || [];

  const parsedBenefits =
    benefits && typeof benefits === "string"
      ? benefits.includes("[") ? JSON.parse(benefits) : benefits.split(",").map(b => b.trim())
      : benefits || [];

  let parsedHowToUse = [];
  if (howToUse) {
    parsedHowToUse =
      typeof howToUse === "string"
        ? howToUse.includes("[") ? JSON.parse(howToUse) : howToUse.split(",").map(h => h.trim())
        : Array.isArray(howToUse) ? howToUse : [];
  }

  // Ensure volume is preserved for single products
  const volumeValue =
    typeof volume === "string" && volume.trim() !== "" ? volume.trim() : undefined;

  const slug = generateSlug(name);

  let productData = {
    name,
    slug,
    description,
    shortDescription,
    category,
    categorySlug: categoryExists.slug,
    brand,
    sku: sku.toUpperCase(),
    images: uploadedImages,
    specifications: parsedSpecifications,
    ingredients: parsedIngredients,
    suitableFor: parsedSuitableFor,
    tags: parsedTags,
    benefits: parsedBenefits,
    isActive: isActive === "true" || isActive === true || isActive === undefined, // default true
    isFeatured: isFeatured === "true" || isFeatured === true,
    howToUse: parsedHowToUse,
    variants: [],
  };



  if (isVariantProduct) {
    // Validate and process variants
    let parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
    const variantSKUs = [];

    const processedVariants = parsedVariants.map(variant => {
      if (!variant.volume || !variant.price || !variant.sku) {
        throw new Error("Each variant must have volume, price, and sku.");
      }
      if (parseFloat(variant.price) <= 0) {
        throw new Error("Variant price must be greater than 0.");
      }

      const upperSKU = variant.sku.toUpperCase();
      if (variantSKUs.includes(upperSKU)) {
        throw new Error("Duplicate variant SKUs not allowed.");
      }
      variantSKUs.push(upperSKU);

      return {
        volume: variant.volume,
        price: parseFloat(variant.price),
        originalPrice: variant.originalPrice ? parseFloat(variant.originalPrice) : undefined,
        stock: parseInt(variant.stock) || 0,
        sku: upperSKU,
        lowStockThreshold: parseInt(variant.lowStockThreshold) || 10,
        isActive: variant.isActive !== false,
      };
    });

    productData.variants = processedVariants;
    productData.price = Math.min(...processedVariants.map(v => v.price));

    const variantsWithOriginalPrice = processedVariants.filter(v => v.originalPrice);
    productData.originalPrice =
      variantsWithOriginalPrice.length > 0
        ? Math.min(...variantsWithOriginalPrice.map(v => v.originalPrice))
        : undefined;
  } else {
    // Single product
    productData.price = parseFloat(price);
    productData.originalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
    productData.volume = volumeValue; // ✅ Fixed: preserve volume
  }

  const newProduct = new ProductModel(productData);
  await newProduct.save();
  await newProduct.populate("category", "name slug");

  return res.status(201).json({
    success: true,
    message: "Product created successfully.",
    data: newProduct,
  });
});



/**
 * Get all products with advanced filtering, sorting, and pagination
 * @route GET /api/product/all
 */
const getAllProducts = asyncHandler(async (req, res) => {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
    search,
    isActive,
  } = req.query;

  let filter = {};

  if (category) filter.category = category;
  if (brand) filter.brand = new RegExp(brand, 'i');
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (minRating) {
    filter['ratings.average'] = { $gte: Number(minRating) };
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  let sort = {};
  if (sortBy === 'featured') {
    sort.isFeatured = -1;
    sort.createdAt = -1;
  } else if (sortBy === 'rating') {
    sort['ratings.average'] = sortOrder === 'asc' ? 1 : -1;
  } else {
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  }

  const skip = (page - 1) * limit;

  const products = await ProductModel.find(filter)
    .populate('category', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const totalProducts = await ProductModel.countDocuments(filter);
  const totalPages = Math.ceil(totalProducts / limit);

  return res.json({
    success: true,
    message: "Products retrieved successfully.",
    data: {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});


/**
 * Get single product by ID or slug
 * @route GET /api/product/:identifier
 */
const getProductById = asyncHandler(async (req, res) => {
  const { identifier } = req.params;

  let product;

  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    product = await ProductModel.findById(identifier);
  } else {
    product = await ProductModel.findOne({ slug: identifier });
  }

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found.",
    });
  }

  await product.populate('category', 'name slug');

  return res.json({
    success: true,
    message: "Product retrieved successfully.",
    data: product,
  });
});

/**
 * Update product (Admin only)
 * @route PUT /api/product/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    shortDescription,
    category,
    brand,
    sku,
    price,
    originalPrice,
    volume,
    variants,
    hasVariants,
    productType,
    specifications,
    ingredients,
    suitableFor,
    tags,
    benefits,
    isActive,
    isFeatured,
    howToUse,
  } = req.body;

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing request body.",
    });
  }

  const product = await ProductModel.findById(id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found.",
    });
  }

  let updateFields = {};

  if (name) {
    updateFields.name = name;
    updateFields.slug = generateSlug(name);
  }
  if (description) updateFields.description = description;
  if (shortDescription !== undefined) updateFields.shortDescription = shortDescription;
  if (brand) updateFields.brand = brand;
  if (isActive !== undefined) updateFields.isActive = isActive === "true";
  if (isFeatured !== undefined) updateFields.isFeatured = isFeatured === "true";
  if (howToUse !== undefined) updateFields.howToUse = howToUse;

  // ✅ Preserve category if not sent
  if (category && category !== String(product.category)) {
    const categoryExists = await CategoryModel.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Category not found.",
      });
    }
    updateFields.category = category;
    updateFields.categorySlug = categoryExists.slug;
  } else if (!category && product.category) {
    updateFields.category = product.category;
    updateFields.categorySlug = product.categorySlug;
  }

  if (sku && sku !== product.sku) {
    const existingProduct = await ProductModel.findOne({
      sku: sku.toUpperCase(),
      _id: { $ne: id },
    });
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product with this SKU already exists.",
      });
    }
    updateFields.sku = sku.toUpperCase();
  }

  const isVariantProduct =
    hasVariants === "true" ||
    productType === "variant" ||
    (variants && Array.isArray(variants) && variants.length > 0);

  if (variants) {
    let parsedVariants = [];
    try {
      parsedVariants =
        typeof variants === "string" ? JSON.parse(variants) : variants;

      if (isVariantProduct && (!Array.isArray(parsedVariants) || parsedVariants.length === 0)) {
        return res.status(400).json({
          success: false,
          message: "At least one product variant is required for variant products.",
        });
      }

      const variantSKUs = [];
      const mergedVariants = [...product.variants]; // start with existing variants

      for (let variant of parsedVariants) {
        if (!variant.volume || !variant.price || !variant.sku) {
          return res.status(400).json({
            success: false,
            message: "Each variant must have volume, price, and sku.",
          });
        }

        const skuUpper = variant.sku.toUpperCase();
        if (variantSKUs.includes(skuUpper)) {
          return res.status(400).json({
            success: false,
            message: "Duplicate variant SKUs not allowed in update payload.",
          });
        }
        variantSKUs.push(skuUpper);

        const existingVariantIndex = mergedVariants.findIndex(v => v.sku === skuUpper);

        const variantData = {
          volume: variant.volume,
          price: parseFloat(variant.price),
          originalPrice: variant.originalPrice ? parseFloat(variant.originalPrice) : undefined,
          stock: parseInt(variant.stock) || 0,
          sku: skuUpper,
          lowStockThreshold: parseInt(variant.lowStockThreshold) || 10,
          isActive: variant.isActive !== false,
        };

        if (existingVariantIndex !== -1) {
          mergedVariants[existingVariantIndex] = variantData; // update
        } else {
          mergedVariants.push(variantData); // add new
        }
      }

      updateFields.variants = mergedVariants;
      updateFields.price = Math.min(...mergedVariants.map(v => v.price));

      const variantsWithOriginalPrice = mergedVariants.filter(v => v.originalPrice);
      updateFields.originalPrice =
        variantsWithOriginalPrice.length > 0
          ? Math.min(...variantsWithOriginalPrice.map(v => v.originalPrice))
          : undefined;

    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid variants format.",
      });
    }
  } else if (!isVariantProduct) {
    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (parsedPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be greater than 0 for single products.",
        });
      }
      updateFields.price = parsedPrice;
    } else if (product.variants && product.variants.length > 0) {
      updateFields.price = Math.min(...product.variants.map((v) => v.price));
    }

    if (originalPrice !== undefined) {
      updateFields.originalPrice = originalPrice
        ? parseFloat(originalPrice)
        : undefined;
    }

    // ✅ Preserve volume correctly for single products
    if (volume !== undefined) {
      const volumeValue =
        typeof volume === "string" && volume.trim() !== "" ? volume.trim() : undefined;
      updateFields.volume = volumeValue;
    } else if (product.volume) {
      updateFields.volume = product.volume;
    }

    updateFields.variants = [];
  }

  if (specifications !== undefined) {
    let parsedSpecifications = specifications;
    if (typeof specifications === "string") {
      try {
        parsedSpecifications = JSON.parse(specifications);
      } catch (err) {
        parsedSpecifications = {};
      }
    }
    if (parsedSpecifications && parsedSpecifications.suitableFor) {
      if (!Array.isArray(parsedSpecifications.suitableFor)) {
        parsedSpecifications.suitableFor = [parsedSpecifications.suitableFor];
      }
    }
    updateFields.specifications = parsedSpecifications;
  } else {
    updateFields.specifications = product.specifications;
  }

  // Handle ingredients separately for updates (same as create)
  if (req.body.ingredients !== undefined) {
    try {
      let parsedIngredients = typeof req.body.ingredients === "string"
        ? JSON.parse(req.body.ingredients)
        : req.body.ingredients;

      if (!Array.isArray(parsedIngredients)) {
        parsedIngredients = [];
      }

      // Process ingredient images
      parsedIngredients = await processIngredientImages(parsedIngredients, req.files);

      // Set ingredients as a separate field
      updateFields.ingredients = parsedIngredients;
    } catch (err) {
      console.error('Error parsing ingredients in update:', err);
    }
  }

  // Handle suitableFor separately for updates
  if (suitableFor !== undefined) {
    try {
      let parsedSuitableFor = typeof suitableFor === "string"
        ? JSON.parse(suitableFor)
        : suitableFor;

      if (!Array.isArray(parsedSuitableFor)) {
        parsedSuitableFor = [];
      }

      // Set suitableFor as a separate field
      updateFields.suitableFor = parsedSuitableFor;
    } catch (err) {
      console.error('Error parsing suitableFor in update:', err);
    }
  }

  if (tags !== undefined) {
    let parsedTags = tags;
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch (err) {
        parsedTags = tags.split(",").map((tag) => tag.trim());
      }
    }
    updateFields.tags = parsedTags;
  } else {
    updateFields.tags = product.tags;
  }

  if (benefits !== undefined) {
    let parsedBenefits = benefits;
    if (typeof benefits === "string") {
      try {
        parsedBenefits = JSON.parse(benefits);
      } catch (err) {
        parsedBenefits = benefits
          ? benefits.split(",").map((benefit) => benefit.trim())
          : [];
      }
    }
    updateFields.benefits = parsedBenefits;
  } else {
    updateFields.benefits = product.benefits;
  }

  if (req.body.howToUse) {
    let parsedHowToUse = [];
    if (typeof req.body.howToUse === "string") {
      try {
        parsedHowToUse = JSON.parse(req.body.howToUse);
      } catch (err) {
        parsedHowToUse = req.body.howToUse.split(",").map((step) => step.trim());
      }
    } else if (Array.isArray(req.body.howToUse)) {
      parsedHowToUse = req.body.howToUse;
    }
    updateFields.howToUse = parsedHowToUse;
  }

  if (req.files && req.files.images && req.files.images.length > 0) {
    try {
      let uploadedImages = [];
      const productImages = req.files.images || [];
      for (let image of productImages) {
        const upload = await uploadImageCloudinary(image);
        uploadedImages.push({
          public_id: upload.public_id,
          url: upload.url,
        });
      }
      updateFields.images = uploadedImages;
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Image upload failed.",
        error: err.message,
      });
    }
  } else {
    updateFields.images = product.images;
  }

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid fields provided for update.",
    });
  }

  const updatedProduct = await ProductModel.findByIdAndUpdate(id, updateFields, {
    new: true,
    runValidators: true,
  }).populate("category", "name slug");

  return res.json({
    success: true,
    message: "Product updated successfully.",
    data: updatedProduct,
  });
});



/**
 * Delete product (Admin only)
 * @route DELETE /api/product/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await ProductModel.findById(id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found.",
    });
  }

  await ProductModel.findByIdAndDelete(id);

  return res.json({
    success: true,
    message: "Product deleted successfully.",
  });
});

/**
 * Bulk delete products (Admin only)
 * @route DELETE /api/product/bulk-delete
 */
const bulkDeleteProducts = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Product IDs must be provided as a non-empty array.",
    });
  }

  const result = await ProductModel.deleteMany({ _id: { $in: ids } });

  if (result.deletedCount === 0) {
    return res.status(404).json({
      success: false,
      message: "No products found with the provided IDs.",
    });
  }

  return res.json({
    success: true,
    message: `${result.deletedCount} products deleted successfully.`,
  });
});

/**
 * Get products by category ID or slug
 * @route GET /api/product/category/:categoryId
 */
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  let category;

  if (categoryId.match(/^[0-9a-fA-F]{24}$/)) {
    category = await CategoryModel.findById(categoryId);
  } else {
    category = await CategoryModel.findOne({ slug: categoryId });
  }

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found.",
    });
  }

  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const products = await ProductModel.find({
    category: category._id,
    isActive: true
  })
    .populate('category', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const totalProducts = await ProductModel.countDocuments({
    category: category._id,
    isActive: true
  });
  const totalPages = Math.ceil(totalProducts / limit);

  return res.json({
    success: true,
    message: "Products retrieved successfully.",
    data: {
      category: {
        _id: category._id,
        name: category.name,
        slug: category.slug,
      },
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});

/**
 * Search products
 * @route GET /api/product/search
 */
const searchProducts = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: "Search query is required.",
    });
  }

  const skip = (page - 1) * limit;

  const products = await ProductModel.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { brand: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } },
    ],
    isActive: true,
  })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalProducts = await ProductModel.countDocuments({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { brand: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } },
    ],
    isActive: true,
  });

  const totalPages = Math.ceil(totalProducts / limit);

  return res.json({
    success: true,
    message: "Search results retrieved successfully.",
    data: {
      products,
      searchQuery: q,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});

/**
 * Get product variants by product ID
 * @route GET /api/product/:id/variants
 */
const getProductVariants = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await ProductModel.findById(id).select('variants name');
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found.",
    });
  }

  return res.json({
    success: true,
    message: "Product variants retrieved successfully.",
    data: {
      productId: product._id,
      productName: product.name,
      variants: product.variants,
    },
  });
});

/**
 * Update variant stock
 * @route PUT /api/product/:id/variant/:variantSku/stock
 */
const updateVariantStock = asyncHandler(async (req, res) => {
  const { id, variantSku } = req.params;
  const { stock } = req.body;

  if (stock === undefined || stock < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid stock quantity is required.",
    });
  }

  const product = await ProductModel.findById(id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found.",
    });
  }

  const variantIndex = product.variants.findIndex(
    v => v.sku === variantSku.toUpperCase()
  );

  if (variantIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Variant not found.",
    });
  }

  product.variants[variantIndex].stock = parseInt(stock);
  await product.save();

  return res.json({
    success: true,
    message: "Variant stock updated successfully.",
    data: product.variants[variantIndex],
  });
});

/**
 * Get featured products
 * @route GET /api/product/featured
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  const products = await ProductModel.find({
    isFeatured: true,
    isActive: true
  })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  return res.json({
    success: true,
    message: "Featured products retrieved successfully.",
    data: products,
  });
});

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  getProductsByCategory,
  searchProducts,
  getFeaturedProducts,
  getProductVariants,
  updateVariantStock,
};
