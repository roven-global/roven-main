require("dotenv").config();
const mongoose = require("mongoose");
const connectDb = require("../config/dbConnection");
const WelcomeGift = require("../models/welcomeGiftModel");

const gifts = [
  {
    order: 1,
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
    order: 2,
    title: "Free Shipping Delight",
    description: "Enjoy free shipping on orders over ₹499",
    icon: "Truck",
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
    reward: "Free shipping on orders over ₹499",
    couponCode: "FREESHIP",
    rewardType: "free_shipping",
    rewardValue: 0,
    maxDiscount: null,
    minOrderAmount: 499,
    isActive: true,
  },
  {
    order: 3,
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
    order: 4,
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
    order: 5,
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
    order: 6,
    title: "Buy One Get One Free",
    description: "BOGO on select beauty products",
    icon: "Gift",
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
    reward: "Buy one get one free on select items",
    couponCode: "BOGOBEAUTY",
    rewardType: "buy_one_get_one",
    rewardValue: 0,
    maxDiscount: null,
    minOrderAmount: 599,
    isActive: true,
  },
];

async function seedWelcomeGifts() {
  try {
    await connectDb();

    const existingCount = await WelcomeGift.countDocuments();
    console.log(`Existing welcome gifts: ${existingCount}`);

    const results = [];
    for (const gift of gifts) {
      const updated = await WelcomeGift.findOneAndUpdate(
        { order: gift.order },
        { $setOnInsert: gift },
        { new: true, upsert: true, runValidators: true }
      );
      results.push({
        order: gift.order,
        id: updated._id.toString(),
        coupon: gift.couponCode,
      });
    }

    const finalCount = await WelcomeGift.countDocuments();
    console.log("Seed complete. Current gifts:", results);
    console.log(`Total welcome gifts: ${finalCount}`);
  } catch (error) {
    console.error("Error seeding welcome gifts:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedWelcomeGifts();
