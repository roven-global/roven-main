const mongoose = require("mongoose");

const adminSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, "Setting key is required"],
    unique: true,
    trim: true,
    index: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, "Setting value is required"],
  },
  description: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Method to get a setting, providing a default if it doesn't exist
adminSettingSchema.statics.getSetting = async function(key, defaultValue) {
  const setting = await this.findOne({ key });
  if (setting) {
    return setting.value;
  }
  if (defaultValue !== undefined) {
    // If you want to create it with the default value when first requested
    // await this.create({ key, value: defaultValue, description: `Default value for ${key}` });
    return defaultValue;
  }
  return null;
};

// Method to update or create a setting
adminSettingSchema.statics.updateSetting = async function(key, value, description = '') {
  return this.findOneAndUpdate(
    { key },
    { value, ...(description && { description }) },
    { new: true, upsert: true, runValidators: true }
  );
};


module.exports = mongoose.model("AdminSetting", adminSettingSchema);
