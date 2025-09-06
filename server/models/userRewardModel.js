const mongoose = require("mongoose");

/**
 * User Reward Schema
 * Schema for tracking user's claimed welcome gifts and rewards
 */
const userRewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
      index: true,
    },
    giftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WelcomeGift",
      required: true,
      index: true,
    },
    rewardTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Reward title cannot exceed 100 characters"],
    },
    rewardText: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Reward text cannot exceed 200 characters"],
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    wasLoggedIn: {
      type: Boolean,
      required: true,
      default: false,
    },
    anonymousId: {
      type: String,
      sparse: true,
      index: true,
    },
    claimedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    clientIP: {
      type: String,
      required: true,
    },
    migrationData: {
      originalAnonymousId: String,
      migratedAt: Date,
      migratedFrom: { type: String, enum: ["anonymous"], default: undefined },
    },
  },
  {
    timestamps: true,
  }
);

userRewardSchema.index(
  { userId: 1, giftId: 1 },
  { unique: true, sparse: true }
);
userRewardSchema.index(
  { anonymousId: 1, giftId: 1 },
  { unique: true, sparse: true }
);
userRewardSchema.index({ isUsed: 1, userId: 1 });

userRewardSchema.index(
  { userId: 1 },
  {
    unique: true,
    sparse: true,
    name: "one_reward_per_user",
    partialFilterExpression: { userId: { $exists: true, $ne: null } },
  }
);

userRewardSchema.index(
  { anonymousId: 1 },
  {
    unique: true,
    sparse: true,
    name: "one_reward_per_anonymous",
    partialFilterExpression: { anonymousId: { $exists: true, $ne: null } },
  }
);

userRewardSchema.methods.markAsUsed = async function (session = null) {
  this.isUsed = true;
  this.usedAt = new Date();
  const options = session ? { session } : {};
  return this.save(options);
};

userRewardSchema.statics.canUserClaimGift = async function (
  userId,
  session = null
) {
  if (!userId) return false;

  const options = session ? { session } : {};
  const existingReward = await this.findOne({ userId }, null, options);
  return !existingReward;
};

userRewardSchema.statics.hasAnonymousUserClaimed = async function (
  anonymousId,
  session = null
) {
  if (!anonymousId) return false;

  const options = session ? { session } : {};
  const existingReward = await this.findOne({ anonymousId }, null, options);
  return !!existingReward;
};

userRewardSchema.statics.canMigrateAnonymousGift = async function (
  anonymousId,
  userId,
  session = null
) {
  if (!anonymousId || !userId) return false;

  const options = session ? { session } : {};

  const userHasReward = await this.findOne({ userId }, null, options);
  if (userHasReward) {
    return false;
  }
  const anonymousReward = await this.findOne(
    {
      anonymousId,
      isUsed: false,
    },
    null,
    options
  );

  if (!anonymousReward) {
    return false;
  }
  const conflictCheck = await this.findOne(
    {
      userId,
      giftId: anonymousReward.giftId,
    },
    null,
    options
  );

  if (conflictCheck) {
    return false;
  }

  return true;
};

userRewardSchema.statics.migrateAnonymousGift = async function (
  anonymousId,
  userId,
  session = null
) {
  if (!anonymousId || !userId) return null;

  const options = session ? { session } : {};

  try {
    const anonymousReward = await this.findOne(
      {
        anonymousId,
        isUsed: false,
      },
      null,
      options
    );

    if (!anonymousReward) return null;

    const userHasReward = await this.findOne({ userId }, null, options);
    if (userHasReward) return null;

    anonymousReward.userId = userId;
    anonymousReward.migrationData = {
      originalAnonymousId: anonymousId,
      migratedAt: new Date(),
      migratedFrom: "anonymous",
    };
    anonymousReward.anonymousId = undefined;

    await anonymousReward.save(options);
    return anonymousReward;
  } catch (error) {
    return error;
  }
};

userRewardSchema.pre("save", function (next) {
  if (
    !this.migrationData &&
    this.userId === null &&
    this.anonymousId === null
  ) {
    return next(new Error("Either userId or anonymousId must be provided"));
  }

  if (this.isUsed && !this.usedAt) {
    this.usedAt = new Date();
  }

  next();
});

userRewardSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  if (update.$set) {
    delete update.$set.claimedAt;
    delete update.$set.migrationData;
    delete update.$set.clientIP;
  }

  if (update.$set && update.$set.isUsed === false) {
    delete update.$set.isUsed;
    delete update.$set.usedAt;
  }
});

module.exports = mongoose.model("UserReward", userRewardSchema);
