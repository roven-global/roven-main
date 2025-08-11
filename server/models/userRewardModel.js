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

module.exports = mongoose.model("UserReward", userRewardSchema);
