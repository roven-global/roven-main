const mongoose = require("mongoose");
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

const createAdminUser = async () => {
    try {
        // Check if admin user already exists
        const existingAdmin = await UserModel.findOne({ role: "ADMIN" });
        if (existingAdmin) {
            console.log("Admin user already exists:", existingAdmin.email);
            return existingAdmin;
        }

        // Create admin user
        const adminUser = new UserModel({
            name: "Admin User",
            email: "admin@roven.com",
            password: "admin123", // This will be hashed by the pre-save middleware
            role: "ADMIN",
            verify_email: true,
            status: "Active",
        });

        await adminUser.save();
        console.log("Admin user created successfully:", adminUser.email);
        return adminUser;
    } catch (error) {
        console.error("Error creating admin user:", error);
    }
};

const main = async () => {
    await connectDb();
    await createAdminUser();
    await mongoose.connection.close();
    console.log("Database connection closed");
};

main();
