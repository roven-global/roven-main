const mongoose = require("mongoose");

const userRewardSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // Optional for anonymous users
        },
        giftId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WelcomeGift",
            required: [true, "Gift ID is required"],
        },
        claimedAt: {
            type: Date,
            default: Date.now,
        },
        isUsed: {
            type: Boolean,
            default: false,
        },
        usedAt: {
            type: Date,
            default: null,
        },
        // For anonymous users - store device fingerprint or session ID
        anonymousId: {
            type: String,
            default: null,
        },
        // Track if user was logged in when claimed
        wasLoggedIn: {
            type: Boolean,
            default: false,
        },
        // Store reward details for reference
        rewardTitle: {
            type: String,
            required: true,
        },
        rewardText: {
            type: String,
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

// Virtual field for compound unique index (only when userId exists)
userRewardSchema.virtual('userId_giftId').get(function () {
    if (this.userId) {
        return `${this.userId}_${this.giftId}`;
    }
    return null;
});

// Ensure virtual fields are serialized
userRewardSchema.set('toJSON', { virtuals: true });
userRewardSchema.set('toObject', { virtuals: true });

// Create unique index for authenticated users only
// This prevents duplicate claims from the same user for the same gift
userRewardSchema.index({ "userId_giftId": 1 }, {
    unique: true,
    sparse: true,
    name: "userId_giftId_unique"
});

// Prevent users from claiming multiple gifts (one gift per user)
userRewardSchema.index({ userId: 1 }, {
    unique: true,
    sparse: true,
    name: "userId_unique"
});

// Allow multiple claims from anonymous users (they might clear localStorage)
userRewardSchema.index({ anonymousId: 1, giftId: 1 }, { name: "anonymousId_giftId" });

// Method to mark reward as used
userRewardSchema.methods.markAsUsed = async function () {
    this.isUsed = true;
    this.usedAt = new Date();
    return await this.save();
};

// Static method to check if user has used any reward
userRewardSchema.statics.hasUserUsedAnyReward = async function (userId) {
    const usedReward = await this.findOne({
        userId,
        isUsed: true
    });
    return !!usedReward;
};

// Static method to check if anonymous user has claimed any reward
userRewardSchema.statics.hasAnonymousUserClaimed = async function (anonymousId) {
    const claimedReward = await this.findOne({
        anonymousId
    });
    return !!claimedReward;
};

// Static method to check if user can claim a welcome gift
userRewardSchema.statics.canUserClaimGift = async function (userId) {
    if (!userId) return true; // Anonymous users can always try to claim
    const existingReward = await this.findOne({ userId });
    return !existingReward;
};

// Static method to check if user has claimed a specific gift
userRewardSchema.statics.hasUserClaimedGift = async function (userId, giftId) {
    if (!userId) return false; // Anonymous users don't have persistent claims
    const existingReward = await this.findOne({ userId, giftId });
    return !!existingReward;
};

// Static method to find gift by anonymousId
userRewardSchema.statics.findByAnonymousId = async function (anonymousId) {
    return await this.findOne({ anonymousId });
};

// Static method to migrate anonymous gift to authenticated user
userRewardSchema.statics.migrateAnonymousGift = async function (anonymousId, userId) {
    console.log(`UserReward: Attempting to migrate gift for anonymousId: ${anonymousId} to userId: ${userId}`);

    const anonymousGift = await this.findOne({ anonymousId });
    if (!anonymousGift) {
        console.log('UserReward: No anonymous gift found for migration');
        return null;
    }

    console.log('UserReward: Found anonymous gift:', {
        id: anonymousGift._id,
        rewardTitle: anonymousGift.rewardTitle,
        rewardText: anonymousGift.rewardText
    });

    // Check if user already has a gift
    const existingUserGift = await this.findOne({ userId });
    if (existingUserGift) {
        console.log('UserReward: User already has a gift, removing anonymous one');
        // User already has a gift, remove the anonymous one
        await this.findByIdAndDelete(anonymousGift._id);
        return null;
    }

    // Migrate the gift
    console.log('UserReward: Migrating gift to user account');
    anonymousGift.userId = userId;
    anonymousGift.anonymousId = null; // Remove anonymous association
    anonymousGift.wasLoggedIn = true; // Mark as now logged in
    await anonymousGift.save();

    console.log('UserReward: Gift migration completed successfully');
    return anonymousGift;
};

// Static method to check if anonymous user has a gift that can be migrated
userRewardSchema.statics.canMigrateAnonymousGift = async function (anonymousId, userId) {
    const anonymousGift = await this.findOne({ anonymousId });
    if (!anonymousGift) return false;

    // Check if user already has a gift
    const existingUserGift = await this.findOne({ userId });
    return !existingUserGift; // Can migrate only if user doesn't have a gift
};

module.exports = mongoose.model("UserReward", userRewardSchema);
