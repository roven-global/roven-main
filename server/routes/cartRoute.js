const express = require("express");
const {
    addToCart,
    updateCartItem,
    removeCartItem,
    mergeCart,
    getCart, 
} = require("../controller/cartController");
const auth = require("../middleware/auth");
const router = express.Router();

// All routes are protected
router.use(auth);

router.route("/").get(getCart); 
router.route("/add").post(addToCart);
router.route("/merge").post(mergeCart);
router.route("/:productId").put(updateCartItem);
router.route("/:productId").delete(removeCartItem);

module.exports = router;