export const baseURL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const SummaryApi = {
  register: {
    url: "/api/user/register",
    method: "post",
  },
  login: {
    url: "/api/user/login",
    method: "post",
  },
  forgot_password: {
    url: "/api/user/forgot-password",
    method: "post",
  },
  verify_forgot_password_otp: {
    url: "/api/user/verify-forgot-password-otp",
    method: "post",
  },
  verify_email: {
    url: "/api/user/verify-email",
    method: "post",
  },
  logout: {
    url: "/api/user/logout",
    method: "post",
  },
  reset_password: {
    url: "/api/user/reset-password",
    method: "post",
  },
  refreshToken: {
    url: "/api/user/refresh-token",
    method: "post",
  },
  userDetails: {
    url: "/api/user/details",
    method: "get",
  },
  uploadAvatar: {
    url: "/api/user/upload-avatar",
    method: "put",
  },
  updateUser: {
    url: "/api/user/update-user",
    method: "put",
  },
  // Profile-specific endpoints
  profile: {
    url: "/api/user/profile",
    method: "get",
  },
  profileUpdate: {
    url: "/api/user/profile/update",
    method: "put",
  },
  profileAvatar: {
    url: "/api/user/profile/avatar",
    method: "put",
  },
  profileStats: {
    url: "/api/user/profile/stats",
    method: "get",
  },
  // Category endpoints
  getAllCategories: {
    url: "/api/category/all",
    method: "get",
  },
  getCategoryHierarchy: {
    url: "/api/category/hierarchy",
    method: "get",
  },
  searchCategories: {
    url: "/api/category/search",
    method: "get",
  },
  getCategoryById: {
    url: "/api/category",
    method: "get",
  },
  createCategory: {
    url: "/api/category/create",
    method: "post",
  },
  updateCategory: {
    url: "/api/category",
    method: "put",
  },
  deleteCategory: {
    url: "/api/category",
    method: "delete",
  },
  bulkDeleteCategories: {
    url: "/api/category/bulk-delete",
    method: "delete",
  },
  // Product endpoints
  getAllProducts: {
    url: "/api/product/all",
    method: "get",
  },
  getProductById: {
    url: "/api/product",
    method: "get",
  },
  getProductVariants: {
    url: "/api/product",
    method: "get",
  },
  updateVariantStock: {
    url: "/api/product",
    method: "put",
  },
  searchProducts: {
    url: "/api/product/search",
    method: "get",
  },
  getFeaturedProducts: {
    url: "/api/product/featured",
    method: "get",
  },
  getProductsByCategory: {
    url: "/api/product/category",
    method: "get",
  },
  createProduct: {
    url: "/api/product/create",
    method: "post",
  },
  updateProduct: {
    url: "/api/product",
    method: "put",
  },
  deleteProduct: {
    url: "/api/product",
    method: "delete",
  },
  bulkDeleteProducts: {
    url: "/api/product/bulk-delete",
    method: "delete",
  },
  toggleWishlist: {
    url: "/api/user/wishlist",
    method: "post",
  },
  getWishlist: {
    url: "/api/user/wishlist",
    method: "get",
  },
  // Cart Endpoints
  getCart: {
    url: "/api/cart",
    method: "get",
  },
  addToCart: {
    url: "/api/cart/add",
    method: "post",
  },
  updateCart: {
    url: "/api/cart/:cartItemId",
    method: "put",
  },
  deleteFromCart: {
    url: "/api/cart/:cartItemId",
    method: "delete",
  },
  mergeCart: {
    url: "/api/cart/merge",
    method: "post",
  },
  // Address endpoints
  saveAddress: {
    url: "/api/address/save",
    method: "post",
  },
  getUserAddresses: {
    url: "/api/address/user",
    method: "get",
  },
  getDefaultAddress: {
    url: "/api/address/default",
    method: "get",
  },
  updateAddress: {
    url: "/api/address",
    method: "put",
  },
  deleteAddress: {
    url: "/api/address/:id",
    method: "delete",
  },
  setDefaultAddress: {
    url: "/api/address/default",
    method: "put",
  },
  // Order endpoints
  createOrder: {
    url: "/api/order/create",
    method: "post",
  },
  getUserOrders: {
    url: "/api/order/user",
    method: "get",
  },
  getLifetimeSavings: {
    url: "/api/order/lifetime-savings",
    method: "get",
  },
  getOrderById: {
    url: "/api/order",
    method: "get",
  },
  cancelOrder: {
    url: "/api/order/cancel",
    method: "put",
  },
  getAllOrders: {
    url: "/api/order/all",
    method: "get",
  },
  updateOrderStatus: {
    url: "/api/order/status",
    method: "put",
  },
  // Coupon endpoints
  validateCoupon: {
    url: "/api/coupon/validate",
    method: "post",
  },
  getActiveCoupons: {
    url: "/api/coupon/active",
    method: "get",
  },
  getAllCoupons: {
    url: "/api/coupon/all",
    method: "get",
  },
  getCouponById: {
    url: "/api/coupon/:id",
    method: "get",
  },
  createCoupon: {
    url: "/api/coupon/create",
    method: "post",
  },
  updateCoupon: {
    url: "/api/coupon/:id",
    method: "put",
  },
  deleteCoupon: {
    url: "/api/coupon/:id",
    method: "delete",
  },
  toggleCouponStatus: {
    url: "/api/coupon/:id/toggle",
    method: "patch",
  },
  getCouponUsage: {
    url: "/api/coupon/:id/usage",
    method: "get",
  },
  googleLogin: {
    url: `${baseURL}/api/auth/google`,
    method: "get",
  },
  adminOverview: {
    url: "/api/admin/overview",
    method: "get",
  },
  // Welcome Gift endpoints
  getAllWelcomeGifts: {
    url: "/api/welcome-gifts",
    method: "get",
  },
  getAllWelcomeGiftsAdmin: {
    url: "/api/welcome-gifts/admin/all",
    method: "get",
  },
  getWelcomeGiftById: {
    url: "/api/welcome-gifts/admin/:id",
    method: "get",
  },
  createWelcomeGift: {
    url: "/api/welcome-gifts/admin",
    method: "post",
  },
  updateWelcomeGift: {
    url: "/api/welcome-gifts/admin/:id",
    method: "put",
  },
  deleteWelcomeGift: {
    url: "/api/welcome-gifts/admin/:id",
    method: "delete",
  },
  toggleWelcomeGiftStatus: {
    url: "/api/welcome-gifts/admin/:id/toggle",
    method: "patch",
  },
  reorderWelcomeGifts: {
    url: "/api/welcome-gifts/admin/reorder",
    method: "put",
  },
  getWelcomeGiftsAnalytics: {
    url: "/api/welcome-gifts/admin/analytics",
    method: "get",
  },
  claimWelcomeGift: {
    url: "/api/welcome-gifts/:id/claim",
    method: "post",
  },
  checkWelcomeGiftEligibility: {
    url: "/api/welcome-gifts/check-eligibility",
    method: "get",
  },
  getUserRewards: {
    url: "/api/welcome-gifts/user-rewards",
    method: "get",
  },
  markRewardAsUsed: {
    url: "/api/welcome-gifts/mark-used",
    method: "post",
  },
};

export default SummaryApi;
