require("dotenv").config();
const mongoose = require("mongoose");
const connectDb = require("../config/dbConnection");
const WelcomeGift = require("../models/welcomeGiftModel");

const gifts = [
  {
    title: "Beauty Starter Pack",
    description: "Get 15% off your first beauty haul",
    icon: "Gift",
    color: "text-pink-600",
    bgColor: "bg-pink-50 hover:bg-pink-100",
    reward: "15% off your first beauty haul",
    couponCode: "BEAUTY15",
    rewardType: "percentage",
    rewardValue: 15,
    maxDiscount: 500,
    minOrderAmount: 299,
    isActive: true,
  },
  {
    title: "Free Shipping Delight",
    description: "Enjoy free shipping on orders over ₹499",
    icon: "Truck",
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
    reward: "Free shipping on orders over ₹499",
    couponCode: "FREESHIP",
    rewardType: "fixed_amount",
    rewardValue: 50,
    maxDiscount: null,
    minOrderAmount: 499,
    isActive: true,
  },
  {
    title: "Premium Discount",
    description: "Save ₹200 on premium orders over ₹999",
    icon: "Star",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 hover:bg-yellow-100",
    reward: "₹200 off on orders over ₹999",
    couponCode: "PREMIUM200",
    rewardType: "fixed_amount",
    rewardValue: 200,
    maxDiscount: null,
    minOrderAmount: 999,
    isActive: true,
  },
  {
    title: "Luxury Beauty Bundle",
    description: "Get 20% off luxury beauty products",
    icon: "Award",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:bg-indigo-100",
    reward: "20% off luxury beauty products",
    couponCode: "LUXURY20",
    rewardType: "percentage",
    rewardValue: 20,
    maxDiscount: 800,
    minOrderAmount: 799,
    isActive: true,
  },
  {
    title: "First Purchase Special",
    description: "Flat ₹150 off your first order",
    icon: "DollarSign",
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100",
    reward: "₹150 off your first order",
    couponCode: "FIRST150",
    rewardType: "fixed_amount",
    rewardValue: 150,
    maxDiscount: null,
    minOrderAmount: 399,
    isActive: true,
  },
  {
    title: "Buy One Get One Free",
    description: "BOGO on select beauty products",
    icon: "Gift",
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
    reward: "Buy one get one free on select items",
    couponCode: "BOGOBEAUTY",
    rewardType: "buy_one_get_one",
    rewardValue: 0,
    buyQuantity: 1,
    getQuantity: 1,
    maxDiscount: null,
    minOrderAmount: 599,
    isActive: true,
  },
  // New Gifts
  {
    title: "Skincare Special - Buy 2 Get 1",
    description: "Buy any 2 skincare products, get the 3rd (cheapest) free.",
    icon: "Heart",
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
    reward: "Buy 2 skincare items, get 1 free!",
    couponCode: "SKINB2G1",
    rewardType: "buy_one_get_one",
    rewardValue: 0,
    buyQuantity: 2,
    getQuantity: 1,
    maxDiscount: null,
    minOrderAmount: 0,
    isActive: true,
  },
  {
    title: "Mega Discount",
    description: "A huge 30% off everything!",
    icon: "Percent",
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100",
    reward: "30% off your entire order",
    couponCode: "MEGA30",
    rewardType: "percentage",
    rewardValue: 30,
    maxDiscount: 2000,
    minOrderAmount: 1499,
    isActive: true,
  },
  {
    title: "Big Spender Bonus",
    description: "Get ₹1000 off on orders over ₹5000",
    icon: "Zap",
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
    reward: "₹1000 OFF",
    couponCode: "SPEND5K",
    rewardType: "fixed_amount",
    rewardValue: 1000,
    maxDiscount: null,
    minOrderAmount: 5000,
    isActive: true,
  },
  {
    title: "Inactive Test Gift",
    description: "This is a test gift that should not be visible to users.",
    icon: "Shield",
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
    reward: "Inactive",
    couponCode: "INACTIVE",
    rewardType: "percentage",
    rewardValue: 10,
    maxDiscount: 100,
    minOrderAmount: 100,
    isActive: false,
  },
];

async function seedWelcomeGifts() {
  try {
    await connectDb();

    console.log("Starting to seed welcome gifts...");

    // Clear existing welcome gifts and drop problematic indexes
    console.log("Clearing existing welcome gifts...");
    await WelcomeGift.deleteMany({});
    console.log("Existing welcome gifts cleared.");

    // Drop all indexes and recreate them according to current schema
    try {
      await WelcomeGift.collection.dropIndexes();
      console.log("Indexes dropped successfully.");
    } catch (indexError) {
      console.log(
        "No indexes to drop or error dropping indexes:",
        indexError.message
      );
    }

    const results = [];
    for (const gift of gifts) {
      const created = await WelcomeGift.create(gift);
      results.push({
        coupon: gift.couponCode,
        status: created ? "Created" : "Error",
      });
    }

    const finalCount = await WelcomeGift.countDocuments();
    console.log("Seed results:", results);
    console.log(`Seeding complete. Total welcome gifts in DB: ${finalCount}`);
  } catch (error) {
    console.error("Error seeding welcome gifts:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedWelcomeGifts();
