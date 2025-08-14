require('dotenv').config();
const mongoose = require('mongoose');
const connectDb = require('../config/dbConnection');
const WelcomeGift = require('../models/welcomeGiftModel');

const gifts = [
  {
    order: 1,
    title: 'Welcome 10 Percent Off',
    description: 'Get 10% off on your first order',
    icon: 'Percent',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    reward: '10% off on your first order',
    couponCode: 'WELCOME10',
    rewardType: 'percentage',
    rewardValue: 10,
    maxDiscount: 300,
    minOrderAmount: 0,
    isActive: true,
  },
  {
    order: 2,
    title: 'Flat 100 Off',
    description: 'Save ₹100 on orders over ₹499',
    icon: 'DollarSign',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    reward: '₹100 off on orders over ₹499',
    couponCode: 'FLAT100',
    rewardType: 'fixed_amount',
    rewardValue: 100,
    maxDiscount: null,
    minOrderAmount: 499,
    isActive: true,
  },
  {
    order: 3,
    title: 'Free Shipping',
    description: 'Enjoy free shipping on your first order',
    icon: 'Truck',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    reward: 'Free shipping on your first order',
    couponCode: 'FREESHIP',
    rewardType: 'free_shipping',
    rewardValue: 0,
    maxDiscount: null,
    minOrderAmount: 0,
    isActive: true,
  },
  {
    order: 4,
    title: 'Buy One Get One',
    description: 'BOGO on select items',
    icon: 'Gift',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
    reward: 'Buy one get one free on select items',
    couponCode: 'BOGOFIRST',
    rewardType: 'buy_one_get_one',
    rewardValue: 0,
    maxDiscount: null,
    minOrderAmount: 0,
    isActive: true,
  },
  {
    order: 5,
    title: '15 Percent Off Over 999',
    description: 'Get 15% off on orders over ₹999',
    icon: 'Star',
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
    reward: '15% off on orders over ₹999',
    couponCode: 'FIRST15',
    rewardType: 'percentage',
    rewardValue: 15,
    maxDiscount: 500,
    minOrderAmount: 999,
    isActive: true,
  },
  {
    order: 6,
    title: '20 Percent Off First Order',
    description: 'Get 20% off your first order (max ₹300)',
    icon: 'Award',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    reward: '20% off your first order (max ₹300)',
    couponCode: 'NEW20',
    rewardType: 'percentage',
    rewardValue: 20,
    maxDiscount: 300,
    minOrderAmount: 0,
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
      results.push({ order: gift.order, id: updated._id.toString(), coupon: gift.couponCode });
    }

    const finalCount = await WelcomeGift.countDocuments();
    console.log('Seed complete. Current gifts:', results);
    console.log(`Total welcome gifts: ${finalCount}`);
  } catch (error) {
    console.error('Error seeding welcome gifts:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedWelcomeGifts();


