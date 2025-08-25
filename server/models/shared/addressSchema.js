const mongoose = require("mongoose");

const addressSubSchema = {
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        minlength: [2, "First name must be at least 2 characters long"],
        maxlength: [50, "First name cannot exceed 50 characters"],
        match: [/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"],
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        minlength: [2, "Last name must be at least 2 characters long"],
        maxlength: [50, "Last name cannot exceed 50 characters"],
        match: [/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"],
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
        match: [/^[0-9]{10}$/, "Phone number must be exactly 10 digits"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        maxlength: [100, "Email cannot exceed 100 characters"],
        match: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            "Please enter a valid email address"
        ],
    },
    address: {
        type: String,
        required: [true, "Address is required"],
        trim: true,
        minlength: [10, "Address must be at least 10 characters long"],
        maxlength: [500, "Address cannot exceed 500 characters"],
    },
    city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
        minlength: [2, "City must be at least 2 characters long"],
        maxlength: [100, "City cannot exceed 100 characters"],
        match: [/^[a-zA-Z\s]+$/, "City can only contain letters and spaces"],
    },
    state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
        minlength: [2, "State must be at least 2 characters long"],
        maxlength: [100, "State cannot exceed 100 characters"],
        match: [/^[a-zA-Z\s]+$/, "State can only contain letters and spaces"],
    },
    pincode: {
        type: String,
        required: [true, "Pincode is required"],
        trim: true,
        match: [/^[0-9]{6}$/, "Pincode must be exactly 6 digits"],
    },
    country: {
        type: String,
        required: [true, "Country is required"],
        trim: true,
        default: "India",
    },
};

module.exports = addressSubSchema;
