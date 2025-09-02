const rawBaseURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
export const baseURL = rawBaseURL.replace(/\/$/, "");

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
  reset_password: {
    url: "/api/user/reset-password",
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
  getRelatedProducts: {
    url: "/api/product/related",
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
  getOrderQuote: {
    url: "/api/order/quote",
    method: "post",
  },
  getOrderById: {
    url: "/api/order/:id",
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
  getCouponAnalytics: {
    url: "/api/coupon/analytics/summary",
    method: "get",
  },
  googleLogin: {
    url: "/api/auth/google",
    method: "get",
  },
  adminOverview: {
    url: "/api/admin/overview",
    method: "get",
  },
  // Hero Image endpoints
  getHeroImages: {
    url: "/api/hero-images",
    method: "get",
  },
  uploadHeroImage: {
    url: "/api/hero-images/upload",
    method: "post",
  },
  deleteHeroImage: {
    url: "/api/hero-images",
    method: "delete",
  },
  // Welcome Gift endpoints
  getAllWelcomeGifts: {
    url: "/api/welcome-gifts",
    method: "get",
  },
  migrateAnonymousGift: {
    url: "/api/welcome-gifts/migrate-anonymous",
    method: "post",
  },
  getAnonymousId: {
    url: "/api/welcome-gifts/anonymous-id",
    method: "get",
  },
  // User Reward endpoints
  claimReward: {
    url: "/api/user/claim-reward",
    method: "post",
  },
  useReward: {
    url: "/api/user/use-reward",
    method: "post",
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
  getWelcomeGiftsAnalytics: {
    url: "/api/welcome-gifts/admin/analytics",
    method: "get",
  },
  claimWelcomeGift: {
    url: "/api/welcome-gifts/:id/claim",
    method: "post",
  },
  validateWelcomeGiftCoupon: {
    url: "/api/welcome-gifts/validate-coupon",
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
  checkRewardStatus: {
    url: "/api/welcome-gifts/status",
    method: "get",
  },
  // New endpoint for fetching the user's claimed reward
  getUserReward: {
    url: "/api/user/reward",
    method: "get",
  },
  // Review endpoints
  getReviews: {
    url: "/api/reviews",
    method: "get",
  },
  createReview: {
    url: "/api/reviews",
    method: "post",
  },
  updateReview: {
    url: "/api/reviews",
    method: "put",
  },
  deleteReview: {
    url: "/api/reviews",
    method: "delete",
  },
  // Admin Review endpoints
  getAllReviews: {
    url: "/api/reviews/admin/all",
    method: "get",
  },
  adminUpdateReview: {
    url: "/api/reviews/admin",
    method: "put",
  },
  adminDeleteReview: {
    url: "/api/reviews/admin",
    method: "delete",
  },
  // Admin Settings
  getAdminSetting: {
    url: "/api/admin/settings/:key",
    method: "get",
  },
  updateAdminSetting: {
    url: "/api/admin/settings/:key",
    method: "put",
  },
};

export default SummaryApi;
