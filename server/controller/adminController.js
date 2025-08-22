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

const getCustomers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = 'lastOrderDate',
    sortOrder = 'desc',
    status = ''
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const pipeline = [];

  // Initial match for users
  pipeline.push({ $match: { role: "USER" } });

  // Lookup orders
  pipeline.push({
    $lookup: {
      from: 'orders',
      localField: 'orderHistory',
      foreignField: '_id',
      as: 'orders'
    }
  });

  // Add fields for total orders and last order
  pipeline.push({
    $addFields: {
      totalOrders: { $size: "$orders" },
      lastOrder: { $arrayElemAt: ["$orders", -1] }
    }
  });

  // Filter for customers with at least one order
  pipeline.push({
    $match: { totalOrders: { $gt: 0 } }
  });

  // Add fields for last order date and status
  pipeline.push({
    $addFields: {
      lastOrderDate: "$lastOrder.createdAt",
      lastOrderStatus: "$lastOrder.orderStatus"
    }
  });

  // Search filter
  if (search) {
    const searchRegex = { $regex: search, $options: "i" };
    pipeline.push({
      $match: {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { 'orders.orderNumber': searchRegex }
        ]
      }
    });
  }

  // Status filter
  if (status) {
    pipeline.push({ $match: { lastOrderStatus: status } });
  }

  // Sorting
  const sortStage = {};
  sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;
  pipeline.push({ $sort: sortStage });

  // Facet for pagination and total count
  pipeline.push({
    $facet: {
      metadata: [{ $count: "total" }],
      data: [{ $skip: skip }, { $limit: limitNum }]
    }
  });

  const result = await UserModel.aggregate(pipeline);

  const customers = result[0].data;
  const totalCustomers = result[0].metadata[0] ? result[0].metadata[0].total : 0;
  const totalPages = Math.ceil(totalCustomers / limitNum);

  res.json({
    success: true,
    data: {
      customers,
      pagination: {
        total: totalCustomers,
        totalPages,
        currentPage: pageNum,
        limit: limitNum
      }
    }
  });
});

module.exports = {
  getOverviewStats,
  getCustomers,
};