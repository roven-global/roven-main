const asyncHandler = require("express-async-handler");
const ProductModel = require("../models/productModel");

/**
 * Cart Validation Utility
 * Validates cart items and calculates accurate pricing
 **/

const validateCartItems = asyncHandler(async (cartItems) => {
  if (!Array.isArray(cartItems))
    return { isValid: false, message: "Invalid cart items format" };

  const validatedItems = [];
  let totalCartValue = 0;

  for (const item of cartItems) {
    try {
      const productId =
        item && item.productId && typeof item.productId === "object"
          ? item.productId._id || item.productId.id
          : item?.productId;
      if (!productId) continue;

      const product = await ProductModel.findById(productId).populate(
        "category"
      );
      if (!product) continue;

      let actualPrice = product.price;
      if (
        item.variant?.sku &&
        Array.isArray(product.variants) &&
        product.variants.length > 0
      ) {
        const variant = product.variants.find(
          (v) => v.sku === item.variant.sku
        );
        if (variant) actualPrice = variant.price;
      }

      const quantity = Math.max(1, Math.min(99, parseInt(item.quantity) || 1));
      const itemTotal = actualPrice * quantity;
      totalCartValue += itemTotal;

      validatedItems.push({
        ...item,
        actualPrice,
        quantity,
        itemTotal,
      });
    } catch (error) {
      // skip invalid item
    }
  }

  return {
    isValid: validatedItems.length > 0,
    validatedItems,
    totalCartValue: Math.round(totalCartValue * 100) / 100,
  };
});

module.exports = { validateCartItems };
