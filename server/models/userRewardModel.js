const mongoose = require("mongoose");

const userRewardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    sparse: true, // Allow null for anonymous users
    index: true
  },
  giftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WelcomeGift",
    required: true,
    index: true
  },
  rewardTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, "Reward title cannot exceed 100 characters"]
  },
  rewardText: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, "Reward text cannot exceed 200 characters"]
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true
  },
  usedAt: {
    type: Date,
    default: null
  },
  wasLoggedIn: {
    type: Boolean,
    required: true,
    default: false
  },
  anonymousId: {
    type: String,
    sparse: true, // Allow null and unique constraint
    index: true
  },
  claimedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  clientIP: {
    type: String,
    required: true
  },
  migrationData: {
    originalAnonymousId: String,
    migratedAt: Date,
    migratedFrom: { type: String, enum: ['anonymous'], default: undefined }
  }
}, {
  timestamps: true
});

// Compound indexes for performance and uniqueness
userRewardSchema.index({ userId: 1, giftId: 1 }, { unique: true, sparse: true });
userRewardSchema.index({ anonymousId: 1, giftId: 1 }, { unique: true, sparse: true });
userRewardSchema.index({ isUsed: 1, userId: 1 });


// Ensure one reward per user (authenticated) - only for non-null userIds
userRewardSchema.index({ userId: 1 }, { 
  unique: true, 
  sparse: true,
  name: 'one_reward_per_user',
  partialFilterExpression: { userId: { $exists: true, $ne: null } }
});

// Ensure one reward per anonymous session - only for non-null anonymousIds
userRewardSchema.index({ anonymousId: 1 }, { 
  unique: true, 
  sparse: true,
  name: 'one_reward_per_anonymous',
  partialFilterExpression: { anonymousId: { $exists: true, $ne: null } }
});

// Mark reward as used (with session support)
userRewardSchema.methods.markAsUsed = async function (session = null) {
  this.isUsed = true;
  this.usedAt = new Date();
  const options = session ? { session } : {};
  return this.save(options);
};

// Static method to check if user can claim a gift (with session support)
userRewardSchema.statics.canUserClaimGift = async function (userId, session = null) {
  if (!userId) return false;
  
  const options = session ? { session } : {};
  const existingReward = await this.findOne({ userId }, null, options);
  return !existingReward;
};

// Static method to check if anonymous user has claimed (with session support)
userRewardSchema.statics.hasAnonymousUserClaimed = async function (anonymousId, session = null) {
  if (!anonymousId) return false;
  
  const options = session ? { session } : {};
  const existingReward = await this.findOne({ anonymousId }, null, options);
  return !!existingReward;
};

// Static method to check if anonymous gift can be migrated (with session support)
userRewardSchema.statics.canMigrateAnonymousGift = async function (anonymousId, userId, session = null) {
  if (!anonymousId || !userId) return false;
  
  const options = session ? { session } : {};
  
  // 1. Check if the target user already has any reward. If so, migration is not allowed.
  const userHasReward = await this.findOne({ userId }, null, options);
  if (userHasReward) {
    console.log(`Migration check failed: User ${userId} already has a reward.`);
    return false;
  }
  
  // 2. Find an unused reward matching the anonymous ID.
  const anonymousReward = await this.findOne({ 
    anonymousId, 
    isUsed: false 
  }, null, options);
  
  if (!anonymousReward) {
    console.log(`Migration check failed: No unused anonymous reward found for ID ${anonymousId}.`);
    return false;
  }
  
  // 3. Check for potential unique index conflicts before attempting migration.
  // This ensures that if another anonymous reward with the same giftId has already been
  // migrated to this user, we don't proceed.
  const conflictCheck = await this.findOne({
    userId,
    giftId: anonymousReward.giftId
  }, null, options);

  if (conflictCheck) {
    console.log(`Migration check failed: A reward for gift ${anonymousReward.giftId} has already been migrated to user ${userId}.`);
    return false;
  }

  return true;
};

// Static method to migrate anonymous gift (with session support)
userRewardSchema.statics.migrateAnonymousGift = async function (anonymousId, userId, session = null) {
  if (!anonymousId || !userId) return null;
  
  const options = session ? { session } : {};
  
  try {
    // Find the anonymous reward
    const anonymousReward = await this.findOne({ 
      anonymousId, 
      isUsed: false 
    }, null, options);
    
    if (!anonymousReward) return null;
    
    // Check if user already has a reward
    const userHasReward = await this.findOne({ userId }, null, options);
    if (userHasReward) return null;
    
    // Update the anonymous reward to be associated with the user
    anonymousReward.userId = userId;
    anonymousReward.migrationData = {
      originalAnonymousId: anonymousId,
      migratedAt: new Date(),
      migratedFrom: 'anonymous'
    };
    anonymousReward.anonymousId = undefined; // Remove anonymous association
    
    await anonymousReward.save(options);
    return anonymousReward;
  } catch (error) {
    console.error('Migration error:', error);
    return error;
  }
};

// Pre-save validation
userRewardSchema.pre('save', function(next) {
  // During initial claim, either userId or anonymousId must be present
  // Note: undefined values are allowed and will be converted to null by MongoDB
  if (!this.migrationData && this.userId === null && this.anonymousId === null) {
    return next(new Error('Either userId or anonymousId must be provided'));
  }
  
  // Validate that used rewards have usedAt timestamp
  if (this.isUsed && !this.usedAt) {
    this.usedAt = new Date();
  }
  
  next();
});

// Prevent direct modification of critical fields
userRewardSchema.pre('findOneAndUpdate', function() {
  const update = this.getUpdate();
  
  // Prevent modification of claim timestamp and migration data
  if (update.$set) {
    delete update.$set.claimedAt;
    delete update.$set.migrationData;
    delete update.$set.clientIP;
  }
  
  // Only allow marking as used, not unused
  if (update.$set && update.$set.isUsed === false) {
    delete update.$set.isUsed;
    delete update.$set.usedAt;
  }
});

module.exports = mongoose.model("UserReward", userRewardSchema);
