const mongoose = require("mongoose");
const CouponModel = require("../models/couponModel");
const UserModel = require("../models/userModel");
require("dotenv").config();

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const createSampleCoupons = async () => {
  try {
    // Find an admin user to use as createdBy
    const adminUser = await UserModel.findOne({ role: "ADMIN" });
    if (!adminUser) {
      console.error("No admin user found. Please create an admin user first.");
      return;
    }

    const sampleCoupons = [
      {
        code: "ROVEN10",
        name: "Roven 10% Off",
        description: "Get 10% off on your first order",
        type: "percentage",
        value: 10,
        maxDiscount: 500,
        minOrderAmount: 100,
        usageLimit: 1000,
        perUserLimit: 1,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        firstTimeUserOnly: true,
        createdBy: adminUser._id,
      },
      {
        code: "WELCOME15",
        name: "Welcome 15% Off",
        description: "Welcome discount for new customers",
        type: "percentage",
        value: 15,
        maxDiscount: 1000,
        minOrderAmount: 200,
        usageLimit: 500,
        perUserLimit: 1,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        firstTimeUserOnly: true,
        createdBy: adminUser._id,
      },
      {
        code: "SAVE50",
        name: "Save ₹50",
        description: "Flat ₹50 off on orders above ₹300",
        type: "fixed",
        value: 50,
        minOrderAmount: 300,
        usageLimit: 2000,
        perUserLimit: 2,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
        createdBy: adminUser._id,
      },
      {
        code: "FREESHIP",
        name: "Free Shipping",
        description: "Free shipping on orders above ₹500",
        type: "fixed",
        value: 50, // Assuming shipping cost is ₹50
        minOrderAmount: 500,
        usageLimit: 1000,
        perUserLimit: 1,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
        createdBy: adminUser._id,
      },
      {
        code: "FLASH25",
        name: "Flash Sale 25% Off",
        description: "Limited time 25% off on all products",
        type: "percentage",
        value: 25,
        maxDiscount: 2000,
        minOrderAmount: 100,
        usageLimit: 100,
        perUserLimit: 1,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdBy: adminUser._id,
      },
    ];

    // Clear existing sample coupons
    await CouponModel.deleteMany({
      code: { $in: sampleCoupons.map(c => c.code) }
    });

    // Create new sample coupons
    const createdCoupons = await CouponModel.insertMany(sampleCoupons);

    console.log("Sample coupons created successfully:");
    createdCoupons.forEach(coupon => {
      console.log(`- ${coupon.code}: ${coupon.name} (${coupon.type === 'percentage' ? coupon.value + '%' : '₹' + coupon.value})`);
    });

    console.log(`\nTotal coupons created: ${createdCoupons.length}`);
  } catch (error) {
    console.error("Error creating sample coupons:", error);
  }
};

const main = async () => {
  await connectDb();
  await createSampleCoupons();
  await mongoose.connection.close();
  console.log("Database connection closed");
};

main();
