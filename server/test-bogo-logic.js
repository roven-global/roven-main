const mongoose = require('mongoose');
require('dotenv').config();

// Import the WelcomeGift model
const WelcomeGift = require('./models/welcomeGiftModel');

async function testBogoLogic() {
    try {
        // Connect to MongoDB
        const connectionString = process.env.CONNECTION_STRING || process.env.MONGODB_URI;
        if (!connectionString) {
            throw new Error('Database connection string not found in environment variables');
        }

        await mongoose.connect(connectionString);
        console.log('✅ Connected to MongoDB successfully');

        // Find the BOGO2 welcome gift
        const bogoGift = await WelcomeGift.findOne({ couponCode: 'BOGO2' });
        
        if (!bogoGift) {
            console.log('❌ BOGO2 gift not found');
            return;
        }

        console.log('🎁 Found BOGO2 gift:', {
            title: bogoGift.title,
            rewardType: bogoGift.rewardType,
            rewardValue: bogoGift.rewardValue,
            minOrderAmount: bogoGift.minOrderAmount
        });

        // Test cart items structure (similar to what frontend sends)
        const testCartItems = [
            {
                productId: {
                    _id: 'product1',
                    price: 2000
                },
                quantity: 1,
                price: 2000
            },
            {
                productId: {
                    _id: 'product2',
                    price: 2000
                },
                quantity: 1,
                price: 2000
            }
        ];

        const testSubtotal = 4000; // ₹4000 total

        console.log('\n🧪 Testing BOGO Logic:');
        console.log('Cart Items:', JSON.stringify(testCartItems, null, 2));
        console.log('Subtotal:', testSubtotal);

        // Test the canBeApplied method
        const validationResult = bogoGift.canBeApplied(testSubtotal, testCartItems);
        console.log('\n📋 Validation Result:');
        console.log('Can Apply:', validationResult.canApply);
        console.log('Reason:', validationResult.reason);
        console.log('Discount:', validationResult.discount);
        console.log('Final Amount:', validationResult.finalAmount);

        // Test the calculateBOGODiscount method directly
        const bogoDiscount = bogoGift.calculateBOGODiscount(testCartItems);
        console.log('\n🎯 BOGO Discount Calculation:');
        console.log('Direct BOGO Discount:', bogoDiscount);

        // Test with different cart structures
        console.log('\n🔄 Testing Different Cart Structures:');
        
        // Structure 1: With variant
        const testCartWithVariant = [
            {
                productId: {
                    _id: 'product1',
                    price: 2000
                },
                variant: {
                    price: 2000
                },
                quantity: 2,
                price: 2000
            }
        ];

        const bogoDiscountVariant = bogoGift.calculateBOGODiscount(testCartWithVariant);
        console.log('With Variant (2 items):', bogoDiscountVariant);

        // Structure 2: Different quantities
        const testCartDifferentQuantities = [
            {
                productId: {
                    _id: 'product1',
                    price: 2000
                },
                quantity: 3,
                price: 2000
            }
        ];

        const bogoDiscountQuantities = bogoGift.calculateBOGODiscount(testCartDifferentQuantities);
        console.log('Different Quantities (3 items):', bogoDiscountQuantities);

        // Test the full validation flow
        console.log('\n🔍 Full Validation Flow:');
        const fullValidation = bogoGift.canBeApplied(testSubtotal, testCartItems);
        console.log('Full Validation:', fullValidation);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

// Run the test
testBogoLogic();
