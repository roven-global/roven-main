const asyncHandler = require("express-async-handler");
const AdminSetting = require("../models/adminSettingsModel");

// @desc    Get a specific setting by key
// @route   GET /api/admin/settings/:key
// @access  Private/Admin
const getSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const setting = await AdminSetting.findOne({ key });

  if (setting) {
    res.status(200).json({
      success: true,
      data: { key: setting.key, value: setting.value },
    });
  } else {
    // Handle default values for specific settings
    let defaultValue = null;
    if (key === "is_brand_category_enabled") {
      defaultValue = true;
    }

    if (defaultValue !== null) {
      res.status(200).json({
        success: true,
        data: { key, value: defaultValue },
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Setting with key '${key}' not found.`,
      });
    }
  }
});

// @desc    Update or create a setting
// @route   PUT /api/admin/settings/:key
// @access  Private/Admin
const updateSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value, description } = req.body;

  if (value === undefined) {
    res.status(400);
    throw new Error("Value is required to update a setting.");
  }

  // Use the static method from the model to handle upsert logic
  const updatedSetting = await AdminSetting.updateSetting(
    key,
    value,
    description
  );

  res.status(200).json({
    success: true,
    message: `Setting '${key}' updated successfully.`,
    data: { key: updatedSetting.key, value: updatedSetting.value },
  });
});

// @desc    Initialize default settings
// @route   POST /api/admin/settings/initialize
// @access  Private/Admin
const initializeDefaultSettings = asyncHandler(async (req, res) => {
  const defaultSettings = [
    {
      key: "is_brand_category_enabled",
      value: true,
      description:
        "Enable or disable the brand category section on the homepage",
    },
  ];

  const results = [];
  for (const setting of defaultSettings) {
    try {
      const existingSetting = await AdminSetting.findOne({ key: setting.key });
      if (!existingSetting) {
        const newSetting = await AdminSetting.create(setting);
        results.push({
          key: setting.key,
          value: newSetting.value,
          created: true,
        });
      } else {
        results.push({
          key: setting.key,
          value: existingSetting.value,
          created: false,
        });
      }
    } catch (error) {
      results.push({ key: setting.key, error: error.message });
    }
  }

  res.status(200).json({
    success: true,
    message: "Default settings initialized",
    data: results,
  });
});

module.exports = {
  getSetting,
  updateSetting,
  initializeDefaultSettings,
};
