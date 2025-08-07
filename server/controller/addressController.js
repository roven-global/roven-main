const AddressModel = require("../models/addressModel");
const asyncHandler = require("express-async-handler");

/**
 * Save user address
 * @route POST /api/address/save
 */
const saveAddress = asyncHandler(async (req, res) => {
    const {
        firstName,
        lastName,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        country,
        saveForFuture,
    } = req.body;

    if (!firstName || !lastName || !phone || !email || !address || !city || !state || !pincode) {
        return res.status(400).json({
            success: false,
            message: "All required fields must be provided",
        });
    }

    const addressData = {
        user: req.user._id,
        firstName,
        lastName,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        country: country || "India",
        isDefault: saveForFuture === "true",
    };

    try {
        const newAddress = new AddressModel(addressData);
        await newAddress.save();

        return res.status(201).json({
            success: true,
            message: "Address saved successfully",
            data: newAddress,
        });
    } catch (error) {
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach(key => {
                validationErrors[key] = error.errors[key].message;
            });

            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors,
            });
        }

        // Handle other errors
        console.error('Address save error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to save address. Please try again.",
        });
    }
});

/**
 * Get user addresses
 * @route GET /api/address/user
 */
const getUserAddresses = asyncHandler(async (req, res) => {
    const addresses = await AddressModel.find({
        user: req.user._id,
        isActive: true,
    }).sort({ isDefault: -1, createdAt: -1 });

    return res.json({
        success: true,
        message: "Addresses retrieved successfully",
        data: addresses,
    });
});

/**
 * Get user's default address
 * @route GET /api/address/default
 */
const getDefaultAddress = asyncHandler(async (req, res) => {
    const defaultAddress = await AddressModel.findOne({
        user: req.user._id,
        isDefault: true,
        isActive: true,
    });

    return res.json({
        success: true,
        message: "Default address retrieved successfully",
        data: defaultAddress,
    });
});

/**
 * Update address
 * @route PUT /api/address/:id
 */
const updateAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        firstName,
        lastName,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        country,
        isDefault,
    } = req.body;

    const addressToUpdate = await AddressModel.findOne({
        _id: id,
        user: req.user._id,
    });

    if (!addressToUpdate) {
        return res.status(404).json({
            success: false,
            message: "Address not found",
        });
    }

    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (phone) updateFields.phone = phone;
    if (email) updateFields.email = email;
    if (address) updateFields.address = address;
    if (city) updateFields.city = city;
    if (state) updateFields.state = state;
    if (pincode) updateFields.pincode = pincode;
    if (country) updateFields.country = country;
    if (isDefault !== undefined) updateFields.isDefault = isDefault;

    try {
        const updatedAddress = await AddressModel.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        );

        return res.json({
            success: true,
            message: "Address updated successfully",
            data: updatedAddress,
        });
    } catch (error) {
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach(key => {
                validationErrors[key] = error.errors[key].message;
            });

            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors,
            });
        }

        // Handle other errors
        console.error('Address update error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to update address. Please try again.",
        });
    }
});

/**
 * Delete address
 * @route DELETE /api/address/:id
 */
const deleteAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const addressToDelete = await AddressModel.findOne({
        _id: id,
        user: req.user._id,
    });

    if (!addressToDelete) {
        return res.status(404).json({
            success: false,
            message: "Address not found",
        });
    }

    await AddressModel.findByIdAndDelete(id);

    return res.json({
        success: true,
        message: "Address deleted successfully",
    });
});

/**
 * Set default address
 * @route PUT /api/address/:id/default
 */
const setDefaultAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const address = await AddressModel.findOne({
        _id: id,
        user: req.user._id,
    });

    if (!address) {
        return res.status(404).json({
            success: false,
            message: "Address not found",
        });
    }

    // Remove default from all other addresses
    await AddressModel.updateMany(
        { user: req.user._id, _id: { $ne: id } },
        { isDefault: false }
    );

    // Set this address as default
    address.isDefault = true;
    await address.save();

    return res.json({
        success: true,
        message: "Default address updated successfully",
        data: address,
    });
});

module.exports = {
    saveAddress,
    getUserAddresses,
    getDefaultAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
};
