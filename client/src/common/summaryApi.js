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
    url: "/api/cart", 
    method: "put",
  },
  deleteFromCart: {
    url: "/api/cart", 
    method: "delete",
  },
  mergeCart: {
    url: "/api/cart/merge",
    method: "post",
  },
  googleLogin: {
    url: `${baseURL}/api/auth/google`,
    method: "get",
  },
  adminOverview: {
    url: "/api/admin/overview",
    method: "get",
  },
};

export default SummaryApi;
