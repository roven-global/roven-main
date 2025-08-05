const asyncHandler = require("express-async-handler");
const OrderModel = require("../models/orderModel");
const UserModel = require("../models/userModel");
const CategoryModel = require("../models/categoryModel");
const ProductModel = require("../models/productModel");

/**
 * Get Admin Overview Stats
 * @route GET /api/admin/overview
 */
const getOverviewStats = asyncHandler(async (req, res) => {
  // Total Sales
  const totalSalesResult = await OrderModel.aggregate([
    { $match: { paymentStatus: "completed" } },
    { $group: { _id: null, totalSales: { $sum: "$totalAmt" } } },
  ]);
  const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].totalSales : 0;

  // Order Counts
  const pendingOrders = await OrderModel.countDocuments({ paymentStatus: "pending" });
  const acceptedOrders = await OrderModel.countDocuments({ paymentStatus: "accepted" });
  const rejectedOrders = await OrderModel.countDocuments({ paymentStatus: "rejected" });
  const completedOrders = await OrderModel.countDocuments({ paymentStatus: "completed" });

  // Total Customers
  const totalCustomers = await UserModel.countDocuments({ role: "USER" });

  // Collection Counts
  const totalCategories = await CategoryModel.countDocuments({ parentCategory: null });
  const totalSubcategories = await CategoryModel.countDocuments({ parentCategory: { $ne: null } });
  const totalBrands = await ProductModel.distinct("brand").then(brands => brands.length);

  res.json({
    success: true,
    data: {
      totalSales,
      pendingOrders,
      acceptedOrders,
      rejectedOrders,
      completedOrders,
      totalCustomers,
      totalCategories,
      totalSubcategories,
      totalBrands,
      deliveryAreas: 0,
    },
  });
});

module.exports = {
  getOverviewStats,
};