const Highlight = require("../models/highlightModel");
const Story = require("../models/storyModel");

// Get all active highlights (public)
const getAllHighlights = async (req, res) => {
  try {
    const highlights = await Highlight.find({ isActive: true })
      .populate("stories", "title media.url media.type")
      .sort({ rank: 1, createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "Highlights fetched successfully",
      data: highlights,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching highlights",
      error: error.message,
    });
  }
};

// Get all highlights (admin only)
const getAllHighlightsAdmin = async (req, res) => {
  try {
    const highlights = await Highlight.find()
      .populate("stories", "title media.url media.type")
      .populate("createdBy", "name email")
      .sort({ rank: 1, createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "All highlights fetched successfully",
      data: highlights,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching all highlights",
      error: error.message,
    });
  }
};

// Get single highlight
const getSingleHighlight = async (req, res) => {
  try {
    const { id } = req.params;
    const highlight = await Highlight.findById(id)
      .populate("stories", "title media.url media.type")
      .populate("createdBy", "name email")
      .select("-__v");

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Highlight fetched successfully",
      data: highlight,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching highlight",
      error: error.message,
    });
  }
};

// Create highlight (admin only)
const createHighlight = async (req, res) => {
  try {
    const { title, coverImage, stories, rank, isActive, description } = req.body;

    // Validate required fields
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Highlight title is required",
      });
    }

    // Validate stories array
    if (!stories || !Array.isArray(stories)) {
      return res.status(400).json({
        success: false,
        message: "Stories array is required",
      });
    }

    // Check if all story IDs exist
    const existingStories = await Story.find({ _id: { $in: stories } });
    if (existingStories.length !== stories.length) {
      return res.status(400).json({
        success: false,
        message: "One or more story IDs are invalid",
      });
    }

    const highlightData = {
      title: title.trim(),
      coverImage: coverImage || null,
      stories,
      rank: rank ? parseInt(rank) : 1,
      isActive: isActive === "true" || isActive === true,
      description: description ? description.trim() : "",
      createdBy: req.user._id,
    };

    const highlight = await Highlight.create(highlightData);
    await highlight.populate("stories", "title media.url media.type");
    await highlight.populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Highlight created successfully",
      data: highlight,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating highlight",
      error: error.message,
    });
  }
};

// Update highlight (admin only)
const updateHighlight = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, coverImage, stories, rank, isActive, description } = req.body;

    const highlight = await Highlight.findById(id);

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found",
      });
    }

    // Validate stories array if provided
    if (stories && Array.isArray(stories)) {
      const existingStories = await Story.find({ _id: { $in: stories } });
      if (existingStories.length !== stories.length) {
        return res.status(400).json({
          success: false,
          message: "One or more story IDs are invalid",
        });
      }
    }

    const updateData = {
      title: title ? title.trim() : highlight.title,
      coverImage: coverImage !== undefined ? coverImage : highlight.coverImage,
      stories: stories || highlight.stories,
      rank: rank ? parseInt(rank) : highlight.rank,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : highlight.isActive,
      description: description !== undefined ? description.trim() : highlight.description,
    };

    const updatedHighlight = await Highlight.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("stories", "title media.url media.type")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Highlight updated successfully",
      data: updatedHighlight,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating highlight",
      error: error.message,
    });
  }
};

// Delete highlight (admin only)
const deleteHighlight = async (req, res) => {
  try {
    const { id } = req.params;

    const highlight = await Highlight.findById(id);

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found",
      });
    }

    await Highlight.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Highlight deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting highlight",
      error: error.message,
    });
  }
};

// Toggle highlight active status (admin only)
const toggleHighlightActive = async (req, res) => {
  try {
    const { id } = req.params;

    const highlight = await Highlight.findById(id);

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found",
      });
    }

    const updatedHighlight = await Highlight.findByIdAndUpdate(
      id,
      { isActive: !highlight.isActive },
      { new: true, runValidators: true }
    )
      .populate("stories", "title media.url media.type")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: `Highlight ${!highlight.isActive ? "activated" : "deactivated"} successfully`,
      data: updatedHighlight,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating highlight status",
      error: error.message,
    });
  }
};

module.exports = {
  getAllHighlights,
  getAllHighlightsAdmin,
  getSingleHighlight,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  toggleHighlightActive,
};