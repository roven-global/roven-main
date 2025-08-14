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
    required: true,
    validate: {
      validator: function(v) {
        // Basic IP validation (IPv4 and IPv6)
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(v) || ipv6Regex.test(v) || v === '::1' || v === '127.0.0.1';
      },
      message: "Invalid IP address format"
    }
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


// Ensure one reward per user (authenticated)
userRewardSchema.index({ userId: 1 }, { 
  unique: true, 
  sparse: true,
  name: 'one_reward_per_user'
});

// Ensure one reward per anonymous session
userRewardSchema.index({ anonymousId: 1 }, { 
  unique: true, 
  sparse: true,
  name: 'one_reward_per_anonymous'
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
  
  // Check if user already has a reward
  const userHasReward = await this.findOne({ userId }, null, options);
  if (userHasReward) return false;
  
  // Check if anonymous gift exists and is unused
  const anonymousReward = await this.findOne({ 
    anonymousId, 
    isUsed: false 
  }, null, options);
  
  return !!anonymousReward;
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
    return null;
  }
};

// Pre-save validation
userRewardSchema.pre('save', function(next) {
  // Ensure either userId or anonymousId is present, but not both during initial claim
  if (!this.migrationData && !this.userId && !this.anonymousId) {
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
