// productController.js

const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const uploadImageCloudinary = require("../utils/uploadImageCloudinary");
const ProductModel = require("../models/productModel");
const CategoryModel = require("../models/categoryModel");

// Helpers
const sanitizeString = (val) => (typeof val === "string" ? val.trim() : "");
const sanitizeArray = (arr) =>
  Array.isArray(arr) ? arr.map(sanitizeString) : [];
const logError = (ctx, msg) => console.error(`[PRODUCT][ERROR][${ctx}] ${msg}`);

// Helper: Migrate legacy skinType/hairType from string to array
const migrateSpecifications = (specs) => {
  if (!specs) return specs;

  const migrated = { ...specs };

  // Migrate skinType if it's a string
  if (migrated.skinType && typeof migrated.skinType === "string") {
    migrated.skinType = [migrated.skinType];
  }

  // Migrate hairType if it's a string
  if (migrated.hairType && typeof migrated.hairType === "string") {
    migrated.hairType = [migrated.hairType];
  }

  return migrated;
};

// Utility to generate a slug
const generateSlug = (name) =>
  slugify(name, { lower: true, remove: /[*+~.()'"!:@]/g });

// Helper: process hero ingredient images
const processIngredientImages = async (ingredients, files) => {
  if (!Array.isArray(ingredients)) return [];
  const processed = [];
  for (let i = 0; i < ingredients.length; i++) {
    const ingredient = ingredients[i];
    let imageData = null;
    if (files && files[`ingredientImages[${i}]`]) {
      const file = files[`ingredientImages[${i}]`][0];
      try {
        const upload = await uploadImageCloudinary(file);
        imageData = { public_id: upload.public_id, url: upload.url };
      } catch (err) {
        logError("ingredient-upload", err.message);
        imageData = null;
      }
    } else if (
      ingredient.image &&
      typeof ingredient.image === "string" &&
      ingredient.image.trim()
    ) {
      imageData = { public_id: null, url: ingredient.image };
    } else if (ingredient.image && ingredient.image.url) {
      imageData = ingredient.image;
    }
    processed.push({
      name: sanitizeString(ingredient.name),
      description: sanitizeString(ingredient.description),
      image: imageData || null,
    });
  }
  return processed;
};

// ---- Create Product (Admin) ----
const createProduct = asyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object")
    return res
      .status(400)
      .json({ success: false, message: "Invalid or missing request body." });

  // Sanitize required fields
  let {
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

  name = sanitizeString(name);
  description = sanitizeString(description);
  category = sanitizeString(category);
  brand = sanitizeString(brand);
  sku = sanitizeString(sku);

  // Validate missing required fields
  const reqFields = { name, description, category, brand, sku };
  const missingFields = Object.entries(reqFields)
    .filter(([_, v]) => !v)
    .map(([k]) => k);
  if (missingFields.length)
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });

  // Ensure images present
  if (!req.files || !req.files.images || req.files.images.length === 0)
    return res.status(400).json({
      success: false,
      message: "At least one product image is required.",
    });

  // Detect variant vs single
  const isVariantProduct =
    hasVariants === "true" ||
    productType === "variant" ||
    (variants && Array.isArray(variants) && variants.length > 0);

  if (!isVariantProduct) {
    if (!price || parseFloat(price) <= 0)
      return res.status(400).json({
        success: false,
        message: "Price is required and must be > 0 for single products.",
      });
  } else {
    let parsedVariants;
    try {
      parsedVariants =
        typeof variants === "string" ? JSON.parse(variants) : variants;
      if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one variant is required for variant products.",
        });
      }
    } catch (error) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid variant format." });
    }
  }

  // Check category exists
  const categoryExists = await CategoryModel.findById(category);
  if (!categoryExists)
    return res
      .status(400)
      .json({ success: false, message: "Category not found." });

  // Main SKU uniqueness check
  const existingProduct = await ProductModel.findOne({
    sku: sku.toUpperCase(),
  });
  if (existingProduct)
    return res.status(409).json({
      success: false,
      message: "Product with this SKU already exists.",
    });

  // Upload main images
  let uploadedImages = [];
  try {
    for (const image of req.files.images) {
      const upload = await uploadImageCloudinary(image);
      uploadedImages.push({ public_id: upload.public_id, url: upload.url });
    }
  } catch (err) {
    logError("main-image-upload", err.message);
    return res.status(500).json({
      success: false,
      message: "Image upload failed.",
      error: err.message,
    });
  }

  // Parse specifications
  let parsedSpecifications = {};
  if (specifications) {
    try {
      parsedSpecifications =
        typeof specifications === "string"
          ? JSON.parse(specifications)
          : specifications;
    } catch (err) {
      parsedSpecifications = {};
    }
    if (parsedSpecifications.suitableFor)
      delete parsedSpecifications.suitableFor;
    if (parsedSpecifications.ingredients)
      delete parsedSpecifications.ingredients;

    // Migrate and ensure skinType and hairType are arrays
    parsedSpecifications = migrateSpecifications(parsedSpecifications);
  }

  // Parse ingredients
  let parsedIngredients = [];
  if (req.body.ingredients) {
    try {
      parsedIngredients =
        typeof req.body.ingredients === "string"
          ? JSON.parse(req.body.ingredients)
          : req.body.ingredients;
      if (!Array.isArray(parsedIngredients)) parsedIngredients = [];
      parsedIngredients = await processIngredientImages(
        parsedIngredients,
        req.files
      );
    } catch (err) {
      logError("ingredient-parse", err.message);
      parsedIngredients = [];
    }
  }

  // Parse suitableFor
  let parsedSuitableFor = [];
  if (suitableFor) {
    try {
      // Handle both string and array formats
      if (typeof suitableFor === "string") {
        parsedSuitableFor = JSON.parse(suitableFor);
      } else if (Array.isArray(suitableFor)) {
        parsedSuitableFor = suitableFor;
      } else {
        parsedSuitableFor = [];
      }

      // Ensure it's an array and filter out empty values
      if (!Array.isArray(parsedSuitableFor)) {
        parsedSuitableFor = [];
      } else {
        parsedSuitableFor = parsedSuitableFor.filter(
          (item) => item && typeof item === "string" && item.trim().length > 0
        );
      }
    } catch (err) {
      logError("suitableFor-parse", err.message);
      parsedSuitableFor = [];
    }
  }
  // Tags, Benefits, HowToUse
  let parsedTags = tags;
  if (typeof tags === "string") {
    try {
      parsedTags = JSON.parse(tags);
    } catch {
      parsedTags = tags.split(",").map(sanitizeString);
    }
  }
  parsedTags = sanitizeArray(parsedTags);

  let parsedBenefits = benefits;
  if (typeof benefits === "string") {
    try {
      parsedBenefits = JSON.parse(benefits);
    } catch {
      parsedBenefits = benefits.split(",").map(sanitizeString);
    }
  }
  parsedBenefits = sanitizeArray(parsedBenefits);

  let parsedHowToUse = [];
  if (howToUse) {
    if (typeof howToUse === "string") {
      try {
        parsedHowToUse = JSON.parse(howToUse);
      } catch {
        parsedHowToUse = howToUse.split(",").map(sanitizeString);
      }
    } else if (Array.isArray(howToUse))
      parsedHowToUse = sanitizeArray(howToUse);
  }

  // Volume
  const volumeValue =
    typeof volume === "string" && volume.trim() !== ""
      ? volume.trim()
      : undefined;

  // Slug
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
    isActive:
      isActive === "true" || isActive === true || isActive === undefined, // default true
    isFeatured: isFeatured === "true" || isFeatured === true,
    howToUse: parsedHowToUse,
    variants: [],
  };

  // Variants
  if (isVariantProduct) {
    if (parsedSpecifications.volume) {
      delete parsedSpecifications.volume;
    }
    try {
      let parsedVariants =
        typeof variants === "string" ? JSON.parse(variants) : variants;
      const variantSKUs = [];
      const processedVariants = parsedVariants.map((variant) => {
        if (!variant.volume || !variant.price || !variant.sku)
          throw new Error("Each variant must have volume, price, and sku.");
        if (parseFloat(variant.price) <= 0)
          throw new Error("Variant price must be > 0.");
        const upperSKU = sanitizeString(variant.sku).toUpperCase();
        if (variantSKUs.includes(upperSKU))
          throw new Error("Duplicate variant SKUs not allowed.");
        variantSKUs.push(upperSKU);
        return {
          volume: sanitizeString(variant.volume),
          price: parseFloat(variant.price),
          originalPrice: variant.originalPrice
            ? parseFloat(variant.originalPrice)
            : undefined,
          stock: parseInt(variant.stock) || 0,
          sku: upperSKU,
          lowStockThreshold: parseInt(variant.lowStockThreshold) || 10,
          isActive: variant.isActive !== false,
        };
      });
      productData.variants = processedVariants;
      productData.price = Math.min(...processedVariants.map((v) => v.price));
      const variantsWithOriginalPrice = processedVariants.filter(
        (v) => v.originalPrice
      );
      productData.originalPrice =
        variantsWithOriginalPrice.length > 0
          ? Math.min(...variantsWithOriginalPrice.map((v) => v.originalPrice))
          : undefined;
    } catch (err) {
      logError("variant-parse", err.message);
      return res.status(400).json({
        success: false,
        message: "Invalid variant format: " + err.message,
      });
    }
  } else {
    productData.price = parseFloat(price);
    productData.originalPrice = originalPrice
      ? parseFloat(originalPrice)
      : undefined;
    if (volumeValue) {
      if (!productData.specifications) {
        productData.specifications = {};
      }
      productData.specifications.volume = volumeValue;
    }
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

// ---- Get All Products ----
const getAllProducts = asyncHandler(async (req, res) => {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    skinType,
    hairType,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 10,
    search,
    isActive,
  } = req.query;

  let filter = {};
  if (category) filter.category = category;
  if (brand) filter.brand = new RegExp(brand, "i");
  if (isActive !== undefined) filter.isActive = isActive === "true";

  if (skinType) {
    const skinTypes = skinType.split(",").map((s) => s.trim());
    // Handle both array and string skinType values for backward compatibility
    filter["specifications.skinType"] = {
      $or: [
        { $in: skinTypes }, // For array values
        { $in: skinTypes }, // For string values (legacy)
      ],
    };
  }

  if (hairType) {
    const hairTypes = hairType.split(",").map((s) => s.trim());
    // Handle both array and string hairType values for backward compatibility
    filter["specifications.hairType"] = {
      $or: [
        { $in: hairTypes }, // For array values
        { $in: hairTypes }, // For string values (legacy)
      ],
    };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (minRating) filter["ratings.average"] = { $gte: Number(minRating) };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  let sort = {};
  if (sortBy === "featured") {
    sort.isFeatured = -1;
    sort.createdAt = -1;
  } else if (sortBy === "rating")
    sort["ratings.average"] = sortOrder === "asc" ? 1 : -1;
  else sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const safeLimit = Math.min(parseInt(limit), 50); // safe max page size
  const skip = (page - 1) * safeLimit;

  const products = await ProductModel.find(filter)
    .populate("category", "name slug")
    .sort(sort)
    .skip(skip)
    .limit(safeLimit);

  const totalProducts = await ProductModel.countDocuments(filter);
  const totalPages = Math.ceil(totalProducts / safeLimit);

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

// ---- Get Product By ID or Slug ----
const getProductById = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  let product;
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    product = await ProductModel.findById(identifier).populate(
      "relatedProducts"
    );
  } else {
    product = await ProductModel.findOne({ slug: identifier }).populate(
      "relatedProducts"
    );
  }
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Product not found." });
  await product.populate("category", "name slug");
  return res.json({
    success: true,
    message: "Product retrieved successfully.",
    data: product,
  });
});

// ---- Update Product ----
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

  if (!req.body || typeof req.body !== "object")
    return res
      .status(400)
      .json({ success: false, message: "Invalid or missing request body." });

  const product = await ProductModel.findById(id);
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Product not found." });

  let updateFields = {};
  if (name !== undefined) {
    updateFields.name = sanitizeString(name);
    updateFields.slug = generateSlug(name);
  }
  if (description !== undefined) updateFields.description = sanitizeString(description);
  if (shortDescription !== undefined)
    updateFields.shortDescription = sanitizeString(shortDescription);
  if (brand !== undefined) updateFields.brand = sanitizeString(brand);
  if (isActive !== undefined) updateFields.isActive = isActive === "true";
  if (isFeatured !== undefined) updateFields.isFeatured = isFeatured === "true";
  if (howToUse !== undefined) {
    let parsedHowToUse = [];
    if (typeof howToUse === "string") {
      try {
        parsedHowToUse = JSON.parse(howToUse);
      } catch {
        parsedHowToUse = howToUse.split(",").map(sanitizeString);
      }
    } else if (Array.isArray(howToUse)) {
      parsedHowToUse = sanitizeArray(howToUse);
    }
    updateFields.howToUse = parsedHowToUse;
  }

  if (category !== undefined && category !== String(product.category)) {
    const categoryExists = await CategoryModel.findById(category);
    if (!categoryExists)
      return res
        .status(400)
        .json({ success: false, message: "Category not found." });
    updateFields.category = category;
    updateFields.categorySlug = categoryExists.slug;
  } else if (!category && product.category) {
    updateFields.category = product.category;
    updateFields.categorySlug = product.categorySlug;
  }

  if (sku !== undefined && sku !== product.sku) {
    const existingProduct = await ProductModel.findOne({
      sku: sanitizeString(sku).toUpperCase(),
      _id: { $ne: id },
    });
    if (existingProduct)
      return res.status(409).json({
        success: false,
        message: "Product with this SKU already exists.",
      });
    updateFields.sku = sanitizeString(sku).toUpperCase();
  }

  const useVariants = hasVariants === "true" || productType === "variant";

  if (price !== undefined && !useVariants) {
    const parsedPrice = parseFloat(price);
    if (parsedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0 for single products.",
      });
    }
    updateFields.price = parsedPrice;
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
      if (
        isVariantProduct &&
        (!Array.isArray(parsedVariants) || parsedVariants.length === 0)
      )
        return res.status(400).json({
          success: false,
          message:
            "At least one product variant required for variant products.",
        });
      const variantSKUs = [];
      const mergedVariants = [...product.variants];
      for (let variant of parsedVariants) {
        if (!variant.volume || !variant.price || !variant.sku)
          return res.status(400).json({
            success: false,
            message: "Each variant must have volume, price, and sku.",
          });
        const skuUpper = sanitizeString(variant.sku).toUpperCase();
        if (variantSKUs.includes(skuUpper))
          return res.status(400).json({
            success: false,
            message: "Duplicate variant SKUs not allowed in update payload.",
          });
        variantSKUs.push(skuUpper);
        const existingVariantIndex = mergedVariants.findIndex(
          (v) => v.sku === skuUpper
        );
        const variantData = {
          volume: sanitizeString(variant.volume),
          price: parseFloat(variant.price),
          originalPrice: variant.originalPrice
            ? parseFloat(variant.originalPrice)
            : undefined,
          stock: parseInt(variant.stock) || 0,
          sku: skuUpper,
          lowStockThreshold: parseInt(variant.lowStockThreshold) || 10,
          isActive: variant.isActive !== false,
        };
        if (existingVariantIndex !== -1)
          mergedVariants[existingVariantIndex] = variantData;
        else mergedVariants.push(variantData);
      }
      updateFields.variants = mergedVariants;
      updateFields.price = Math.min(...mergedVariants.map((v) => v.price));
      const variantsWithOriginalPrice = mergedVariants.filter(
        (v) => v.originalPrice
      );
      updateFields.originalPrice =
        variantsWithOriginalPrice.length > 0
          ? Math.min(...variantsWithOriginalPrice.map((v) => v.originalPrice))
          : undefined;
    } catch (err) {
      logError("variant-update-parse", err.message);
      return res.status(400).json({
        success: false,
        message: "Invalid variants format in update payload.",
      });
    }
  } else if (!isVariantProduct) {
    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (parsedPrice <= 0)
        return res.status(400).json({
          success: false,
          message: "Price must be greater than 0 for single products.",
        });
      updateFields.price = parsedPrice;
    } else if (product.variants && product.variants.length > 0) {
      updateFields.price = Math.min(...product.variants.map((v) => v.price));
    }
    if (originalPrice !== undefined)
      updateFields.originalPrice = originalPrice
        ? parseFloat(originalPrice)
        : undefined;
    updateFields.variants = [];
  }

  if (specifications !== undefined) {
    let parsedSpecifications = specifications;
    if (typeof specifications === "string") {
      try {
        parsedSpecifications = JSON.parse(specifications);
      } catch {
        parsedSpecifications = {};
      }
    }
    if (
      parsedSpecifications &&
      parsedSpecifications.suitableFor &&
      !Array.isArray(parsedSpecifications.suitableFor)
    ) {
      parsedSpecifications.suitableFor = [parsedSpecifications.suitableFor];
    }

    // Migrate and ensure skinType and hairType are arrays
    parsedSpecifications = migrateSpecifications(parsedSpecifications);

    updateFields.specifications = parsedSpecifications;
  } else {
    updateFields.specifications = product.specifications;
  }

  // Handle volume for non-variant products
  if (!isVariantProduct && volume !== undefined) {
    const volumeValue =
      typeof volume === "string" && volume.trim() !== ""
        ? volume.trim()
        : undefined;

    // Initialize specs if they don't exist
    // This is safe now because the main spec block has run
    if (!updateFields.specifications) {
      updateFields.specifications = {};
    }

    if (volumeValue) {
      updateFields.specifications.volume = volumeValue;
    } else {
      // If volume is sent as an empty string, remove it
      if (updateFields.specifications) {
        delete updateFields.specifications.volume;
      }
    }
  }

  // Handle ingredients separately for updates
  if (req.body.ingredients !== undefined) {
    try {
      let parsedIngredients =
        typeof req.body.ingredients === "string"
          ? JSON.parse(req.body.ingredients)
          : req.body.ingredients;
      if (!Array.isArray(parsedIngredients)) parsedIngredients = [];
      parsedIngredients = await processIngredientImages(
        parsedIngredients,
        req.files
      );
      updateFields.ingredients = parsedIngredients;
    } catch (err) {
      logError("ingredients-update", err.message);
    }
  }

  if (suitableFor !== undefined) {
    try {
      let parsedSuitableFor =
        typeof suitableFor === "string" ? JSON.parse(suitableFor) : suitableFor;
      if (!Array.isArray(parsedSuitableFor)) parsedSuitableFor = [];
      updateFields.suitableFor = parsedSuitableFor;
    } catch (err) {
      logError("suitableFor-update", err.message);
    }
  }

  if (tags !== undefined) {
    let parsedTags = tags;
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(",").map(sanitizeString);
      }
    }
    updateFields.tags = sanitizeArray(parsedTags);
  } else updateFields.tags = product.tags;
  if (benefits !== undefined) {
    let parsedBenefits = benefits;
    if (typeof benefits === "string") {
      try {
        parsedBenefits = JSON.parse(benefits);
      } catch {
        parsedBenefits = benefits.split(",").map(sanitizeString);
      }
    }
    updateFields.benefits = sanitizeArray(parsedBenefits);
  } else updateFields.benefits = product.benefits;

  // Handle related products
  const { relatedProducts: relatedProductsBody } = req.body;
  if (relatedProductsBody !== undefined) {
    let parsedRelatedProducts;
    try {
      parsedRelatedProducts =
        typeof relatedProductsBody === "string"
          ? JSON.parse(relatedProductsBody)
          : relatedProductsBody;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: "Invalid format for relatedProducts.",
      });
    }

    if (!Array.isArray(parsedRelatedProducts)) {
      return res.status(400).json({
        success: false,
        message: "relatedProducts must be an array of product IDs.",
      });
    }
    updateFields.relatedProducts = parsedRelatedProducts;
  } else {
    updateFields.relatedProducts = product.relatedProducts;
  }

  if (req.files && req.files.images && req.files.images.length > 0) {
    try {
      let uploadedImages = [];
      for (const image of req.files.images) {
        const upload = await uploadImageCloudinary(image);
        uploadedImages.push({ public_id: upload.public_id, url: upload.url });
      }
      updateFields.images = uploadedImages;
    } catch (err) {
      logError("image-update", err.message);
      return res.status(500).json({
        success: false,
        message: "Image upload failed.",
        error: err.message,
      });
    }
  } else updateFields.images = product.images;

  // If the product is being updated to have variants, ensure specifications.volume is removed.
  const finalVariants = updateFields.variants || product.variants;
  if (finalVariants && finalVariants.length > 0) {
    if (updateFields.specifications) {
      delete updateFields.specifications.volume;
    } else if (product.specifications && product.specifications.volume) {
      updateFields.specifications = { ...product.specifications };
      delete updateFields.specifications.volume;
    }
  }

  if (Object.keys(updateFields).length === 0)
    return res.status(400).json({
      success: false,
      message: "No valid fields provided for update.",
    });

  const updatedProduct = await ProductModel.findByIdAndUpdate(
    id,
    updateFields,
    {
      new: true,
      runValidators: true,
    }
  ).populate("category", "name slug");

  return res.json({
    success: true,
    message: "Product updated successfully.",
    data: updatedProduct,
  });
});
// ---- Delete Product ----
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await ProductModel.findById(id);
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Product not found." });
  await ProductModel.findByIdAndDelete(id);
  return res.json({ success: true, message: "Product deleted successfully." });
});

// ---- Bulk Delete ----
const bulkDeleteProducts = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0)
    return res.status(400).json({
      success: false,
      message: "Product IDs must be provided as a non-empty array.",
    });

  const result = await ProductModel.deleteMany({ _id: { $in: ids } });
  if (result.deletedCount === 0)
    return res.status(404).json({
      success: false,
      message: "No products found with the provided IDs.",
    });

  return res.json({
    success: true,
    message: `${result.deletedCount} products deleted successfully.`,
  });
});

// ---- Get Products by Category ----
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;
  let category;
  if (categoryId.match(/^[0-9a-fA-F]{24}$/))
    category = await CategoryModel.findById(categoryId);
  else category = await CategoryModel.findOne({ slug: categoryId });
  if (!category)
    return res
      .status(404)
      .json({ success: false, message: "Category not found." });
  const skip = (page - 1) * Math.min(parseInt(limit), 50);
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const products = await ProductModel.find({
    category: category._id,
    isActive: true,
  })
    .populate("category", "name slug")
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const totalProducts = await ProductModel.countDocuments({
    category: category._id,
    isActive: true,
  });
  const totalPages = Math.ceil(totalProducts / limit);

  return res.json({
    success: true,
    message: "Products retrieved successfully.",
    data: {
      category: { _id: category._id, name: category.name, slug: category.slug },
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

// ---- Search Products ----
const searchProducts = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  if (!search)
    return res
      .status(400)
      .json({ success: false, message: "Search query is required." });

  const skip = (page - 1) * Math.min(parseInt(limit), 50);

  const queryObj = {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ],
    isActive: true,
  };

  const products = await ProductModel.find(queryObj)
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalProducts = await ProductModel.countDocuments(queryObj);
  const totalPages = Math.ceil(totalProducts / limit);

  return res.json({
    success: true,
    message: "Search results retrieved successfully.",
    data: {
      products,
      searchQuery: search,
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

// ---- Get Product Variants ----
const getProductVariants = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await ProductModel.findById(id).select("variants name");
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Product not found." });
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

// ---- Update Variant Stock ----
const updateVariantStock = asyncHandler(async (req, res) => {
  const { id, variantSku } = req.params;
  const { stock } = req.body;
  if (stock === undefined || stock < 0)
    return res
      .status(400)
      .json({ success: false, message: "Valid stock quantity is required." });

  const product = await ProductModel.findById(id);
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Product not found." });

  const variantIndex = product.variants.findIndex(
    (v) => v.sku === sanitizeString(variantSku).toUpperCase()
  );
  if (variantIndex === -1)
    return res
      .status(404)
      .json({ success: false, message: "Variant not found." });

  product.variants[variantIndex].stock = parseInt(stock);
  await product.save();

  return res.json({
    success: true,
    message: "Variant stock updated successfully.",
    data: product.variants[variantIndex],
  });
});

// ---- Featured Products ----
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  const products = await ProductModel.find({ isFeatured: true, isActive: true })
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .limit(Math.min(parseInt(limit), 50));
  return res.json({
    success: true,
    message: "Featured products retrieved successfully.",
    data: products,
  });
});

// ---- Migrate Legacy Specifications ----
const migrateLegacySpecifications = asyncHandler(async (req, res) => {
  try {
    // Find products with string skinType or hairType
    const productsToMigrate = await ProductModel.find({
      $or: [
        { "specifications.skinType": { $type: "string" } },
        { "specifications.hairType": { $type: "string" } },
      ],
    });

    let migratedCount = 0;
    for (const product of productsToMigrate) {
      const migratedSpecs = migrateSpecifications(product.specifications);
      if (migratedSpecs !== product.specifications) {
        await ProductModel.updateOne(
          { _id: product._id },
          { $set: { specifications: migratedSpecs } }
        );
        migratedCount++;
      }
    }

    return res.json({
      success: true,
      message: `Successfully migrated ${migratedCount} products to new array format.`,
      migratedCount,
    });
  } catch (error) {
    logError("migration", error.message);
    return res.status(500).json({
      success: false,
      message: "Migration failed",
      error: error.message,
    });
  }
});

// ---- Get Related Products ----
const getRelatedProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 10 } = req.query;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product ID." });
  }

  const product = await ProductModel.findById(id);
  if (!product) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found." });
  }

  let relatedProducts = [];
  const safeLimit = Math.min(parseInt(limit), 20);

  // If there are hand-picked related products, use them
  if (product.relatedProducts && product.relatedProducts.length > 0) {
    relatedProducts = await ProductModel.find({
      _id: { $in: product.relatedProducts },
      isActive: true,
    }).limit(safeLimit);
  } else {
    // Fallback: Find products in the same category
    relatedProducts = await ProductModel.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    })
      .limit(safeLimit)
      .populate("category", "name slug");
  }

  return res.json({
    success: true,
    message: "Related products retrieved successfully.",
    data: relatedProducts,
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
  getRelatedProducts,
  migrateLegacySpecifications,
};
