const asyncHandler = require("express-async-handler");
const UserModel = require("../models/userModel");
const ProductModel = require("../models/productModel");
const CartProductModel = require("../models/cartProductModel");

/**
 * Adds an item to the user's shopping cart.
 * @route POST /api/cart/add
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, variant } = req.body;
  const userId = req.user._id;

  if (!productId || !quantity) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Product ID and quantity are required.",
      });
  }

  const product = await ProductModel.findById(productId);
  if (!product) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found." });
  }

  if (variant) {
    if (!variant.sku) {
      return res.status(400).json({
        success: false,
        message: "Variant SKU is required when adding a variant product.",
      });
    }

    const productVariant = product.variants.find(v => v.sku === variant.sku.toUpperCase());
    if (!productVariant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found.",
      });
    }

    if (productVariant.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${productVariant.stock} items available.`,
      });
    }
  } else {
    if (product.variants && product.variants.length > 0) {
      return res.status(400).json({
        success: false,
        message: "This product has variants. Please select a specific variant.",
      });
    }
  }

  let user = await UserModel.findById(userId).populate("shopping_cart");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  // Create query to find existing cart item
  const query = { userId, productId };
  if (variant) {
    query["variant.sku"] = variant.sku.toUpperCase();
  }

  const existingCartItem = await CartProductModel.findOne(query);

  if (existingCartItem) {
    // Update quantity
    const newQuantity = existingCartItem.quantity + quantity;

    // Check stock again for the new total quantity
    if (variant) {
      const productVariant = product.variants.find(v => v.sku === variant.sku.toUpperCase());
      if (productVariant.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more items. Total quantity would exceed available stock (${productVariant.stock}).`,
        });
      }
    }

    existingCartItem.quantity = newQuantity;
    await existingCartItem.save();
  } else {
    const cartItemData = {
      userId,
      productId,
      quantity,
    };

    if (variant) {
      const productVariant = product.variants.find(v => v.sku === variant.sku.toUpperCase());
      cartItemData.variant = {
        sku: variant.sku.toUpperCase(),
        volume: productVariant.volume,
        price: productVariant.price,
      };
    }

    const newCartItem = new CartProductModel(cartItemData);
    await newCartItem.save();


    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { shopping_cart: newCartItem._id }
    });
  }

  res.json({ success: true, message: "Item added to cart." });
});

/**
 * Updates the quantity of an item in the cart.
 * @route PUT /api/cart/:cartItemId
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user._id;

  if (!quantity || quantity < 1) {
    return res
      .status(400)
      .json({ success: false, message: "Quantity must be at least 1." });
  }

  const cartItem = await CartProductModel.findOne({ _id: cartItemId, userId });
  if (!cartItem) {
    return res
      .status(404)
      .json({ success: false, message: "Item not found in cart." });
  }

  // Check stock if it's a variant product
  if (cartItem.variant && cartItem.variant.sku) {
    const product = await ProductModel.findById(cartItem.productId);
    if (product) {
      const productVariant = product.variants.find(v => v.sku === cartItem.variant.sku);
      if (productVariant && productVariant.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${productVariant.stock} items available.`,
        });
      }
    }
  }

  cartItem.quantity = quantity;
  await cartItem.save();

  res.json({ success: true, message: "Cart item updated." });
});

/**
 * Removes an item from the cart.
 * @route DELETE /api/cart/:cartItemId
 */
const removeCartItem = asyncHandler(async (req, res) => {
  const { cartItemId } = req.params;
  const userId = req.user._id;

  const cartItem = await CartProductModel.findOneAndDelete({
    _id: cartItemId,
    userId,
  });

  if (!cartItem) {
    return res
      .status(404)
      .json({ success: false, message: "Item not found in cart." });
  }

  await UserModel.findByIdAndUpdate(userId, {
    $pull: { shopping_cart: cartItem._id },
  });

  res.json({ success: true, message: "Item removed from cart." });
});

/**
 * Merges a local guest cart with the user's server-side cart.
 * @route POST /api/cart/merge
 */
const mergeCart = asyncHandler(async (req, res) => {
  const { localCart } = req.body;
  const userId = req.user._id;

  if (!localCart || !Array.isArray(localCart)) {
    return res.status(400).json({ success: false, message: "Local cart data is required." });
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  for (const localItem of localCart) {
    const existingCartItem = await CartProductModel.findOne({ userId, productId: localItem.id });

    if (existingCartItem) {
      existingCartItem.quantity += localItem.quantity;
      await existingCartItem.save();
    } else {
      const newCartItem = new CartProductModel({
        userId,
        productId: localItem.id,
        quantity: localItem.quantity,
      });
      await newCartItem.save();

      await UserModel.findByIdAndUpdate(userId, {
        $addToSet: { shopping_cart: newCartItem._id }
      });
    }
  }

  res.json({ success: true, message: "Carts merged successfully." });
});

/**
 * Gets the user's current shopping cart.
 * @route GET /api/cart/
 */
const getCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const cartItems = await CartProductModel.find({ userId }).populate({
    path: 'productId',
    model: 'Product'
  });

  const cartItemIds = cartItems.map(item => item._id);
  await UserModel.findByIdAndUpdate(userId, {
    $set: { shopping_cart: cartItemIds }
  });

  res.json({ success: true, data: cartItems });
});


module.exports = {
  addToCart,
  updateCartItem,
  removeCartItem,
  mergeCart,
  getCart, 
};
