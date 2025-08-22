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
  const { startDate, endDate } = req.query;
  
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // Total Sales
  const totalSalesResult = await OrderModel.aggregate([
    { $match: { ...dateFilter, paymentStatus: "completed" } },
    { $group: { _id: null, totalSales: { $sum: "$totalAmt" } } },
  ]);
  const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].totalSales : 0;

  // Order Counts
  const pendingOrders = await OrderModel.countDocuments({ ...dateFilter, paymentStatus: "pending" });
  const acceptedOrders = await OrderModel.countDocuments({ ...dateFilter, paymentStatus: "accepted" });
  const rejectedOrders = await OrderModel.countDocuments({ ...dateFilter, paymentStatus: "rejected" });
  const completedOrders = await OrderModel.countDocuments({ ...dateFilter, paymentStatus: "completed" });

  // Total Customers (not time-sensitive)
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