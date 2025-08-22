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
    // If the setting is not found, it's not necessarily an error.
    // We can return a default value or a specific status.
    // For the activeWelcomeGiftLimit, we'll handle a default in the welcome gift controller.
    res.status(404).json({
      success: false,
      message: `Setting with key '${key}' not found.`,
    });
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
  const updatedSetting = await AdminSetting.updateSetting(key, value, description);

  res.status(200).json({
    success: true,
    message: `Setting '${key}' updated successfully.`,
    data: { key: updatedSetting.key, value: updatedSetting.value },
  });
});

module.exports = {
  getSetting,
  updateSetting,
};
