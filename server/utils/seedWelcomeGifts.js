const mongoose = require("mongoose");
const WelcomeGift = require("../models/welcomeGiftModel");
require("dotenv").config();

const defaultGifts = [
  {
    title: "10% Off",
    description: "Get 10% off your first order",
    icon: "Percent",
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100",
    reward: "Use code: WELCOME10",
    order: 1,
    isActive: true
  },
  {
    title: "Free Shipping",
    description: "Free shipping on orders above ₹500",
    icon: "Truck",
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
    reward: "Free shipping applied automatically",
    order: 2,
    isActive: true
  },
  {
    title: "Buy 1 Get 1",
    description: "Buy one product, get one free",
    icon: "Gift",
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
    reward: "Use code: BOGO50",
    order: 3,
    isActive: true
  },
  {
    title: "Free Sample",
    description: "Get a free sample with your order",
    icon: "Star",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 hover:bg-yellow-100",
    reward: "Free sample added to cart",
    order: 4,
    isActive: true
  },
  {
    title: "₹100 Off",
    description: "Flat ₹100 discount on orders above ₹1000",
    icon: "DollarSign",
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100",
    reward: "Use code: FLAT100",
    order: 5,
    isActive: true
  },
  {
    title: "Early Access",
    description: "Early access to new product launches",
    icon: "Clock",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:bg-indigo-100",
    reward: "You're now on the early access list!",
    order: 6,
    isActive: true
  }
];

const seedWelcomeGifts = async () => {
  try {
    // Connect to MongoDB
    const connectionString = process.env.CONNECTION_STRING || 'mongodb://localhost:27017/roven-global';
    await mongoose.connect(connectionString);
    console.log("Connected to MongoDB");

    // Clear existing gifts
    await WelcomeGift.deleteMany({});
    console.log("Cleared existing welcome gifts");

    // Insert default gifts
    const gifts = await WelcomeGift.insertMany(defaultGifts);
    console.log(`Seeded ${gifts.length} welcome gifts successfully`);

    // Display the created gifts
    gifts.forEach((gift, index) => {
      console.log(`${index + 1}. ${gift.title} - ${gift.reward}`);
    });

    console.log("Welcome gifts seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding welcome gifts:", error);
    process.exit(1);
  }
};

// Run the seeding function
seedWelcomeGifts();
