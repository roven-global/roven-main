const Story = require("../models/storyModel");
const uploadImageCloudinary = require("../utils/uploadImageCloudinary");

// Get all active and non-expired stories only
const getAllStories = async (req, res) => {
  try {
    const now = new Date();
    const stories = await Story.find({
      isActive: true,
      $or: [{ expirationDate: null }, { expirationDate: { $gt: now } }],
    })
      .sort({ highlight: -1, order: 1, createdAt: -1 })
      .select("-__v")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Stories fetched successfully",
      stories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching stories",
      error: error.message,
    });
  }
};

// Get all stories (admin only)
const getAllStoriesAdmin = async (req, res) => {
  try {
    const stories = await Story.find()
      .sort({ highlight: -1, order: 1, createdAt: -1 })
      .select("-__v")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "All stories fetched successfully",
      stories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching all stories",
      error: error.message,
    });
  }
};

// Get single story
const getSingleStory = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id)
      .select("-__v")
      .populate("createdBy", "name email");

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Story fetched successfully",
      story,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching story",
      error: error.message,
    });
  }
};

// Create new story (admin only)
const createStory = async (req, res) => {
  try {
    // Debug logging
    console.log("=== STORY UPLOAD DEBUG ===");
    console.log(
      "req.file:",
      req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            buffer: req.file.buffer
              ? `Buffer(${req.file.buffer.length} bytes)`
              : "No buffer",
          }
        : "No file"
    );
    console.log("req.body:", req.body);
    console.log(
      "req.user:",
      req.user ? { id: req.user._id, email: req.user.email } : "No user"
    );
    console.log("=========================");

    const {
      title,
      highlight,
      highlightTitle,
      order,
      isActive,
      link,
      linkText,
      expirationHours,
    } = req.body;

    // Validate required fields
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Story title is required",
      });
    }

    // Check if media is provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Story media (image/video) is required",
      });
    }

    // Determine media type based on file mimetype
    const mediaType = req.file.mimetype.startsWith("video/")
      ? "video"
      : "image";

    // Upload media to Cloudinary
    let mediaData;
    try {
      // Check if Cloudinary is configured
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        process.env.CLOUDINARY_CLOUD_NAME === "dummy"
      ) {
        // Fallback for development/testing without Cloudinary
        mediaData = {
          public_id: `temp_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          url: `data:${req.file.mimetype};base64,${req.file.buffer.toString(
            "base64"
          )}`,
          secure_url: `data:${
            req.file.mimetype
          };base64,${req.file.buffer.toString("base64")}`,
        };
        console.log("Using fallback media storage (Cloudinary not configured)");
      } else {
        mediaData = await uploadImageCloudinary(req.file);
      }
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload media to cloud storage",
        error: uploadError.message,
      });
    }

    // Calculate expiration date
    let expirationDate = null;
    if (expirationHours && expirationHours > 0) {
      expirationDate = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
    }

    const storyData = {
      title,
      media: {
        type: mediaType,
        public_id: mediaData.public_id,
        url: mediaData.url,
        duration: mediaType === "video" ? parseInt(req.body.duration) || 0 : 0,
      },
      highlight: highlight === "true" || highlight === true,
      highlightTitle,
      order: order ? parseInt(order) : 0,
      isActive: isActive === "true" || isActive === true,
      expirationDate,
      link,
      linkText,
      createdBy: req.user._id,
    };

    // Log the story data before saving
    console.log("Story data to save:", JSON.stringify(storyData, null, 2));

    const story = await Story.create(storyData);
    await story.populate("createdBy", "name email");

    console.log("Story saved successfully:", story._id);

    res.status(201).json({
      success: true,
      message: "Story created successfully",
      story,
    });
  } catch (error) {
    console.error("Error creating story:", error);

    // Handle specific validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
        details: error.errors,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Story with this data already exists",
        error: error.message,
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: "Error creating story",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Update story (admin only)
const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      highlight,
      highlightTitle,
      order,
      isActive,
      link,
      linkText,
      expirationHours,
    } = req.body;

    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    const updateData = {
      title,
      highlight: highlight === "true" || highlight === true,
      highlightTitle,
      order: order ? parseInt(order) : story.order,
      isActive: isActive === "true" || isActive === true,
      link,
      linkText,
    };

    // Handle expiration date
    if (expirationHours !== undefined) {
      if (expirationHours && expirationHours > 0) {
        updateData.expirationDate = new Date(
          Date.now() + expirationHours * 60 * 60 * 1000
        );
      } else {
        updateData.expirationDate = null;
      }
    }

    // If new media is uploaded
    if (req.file) {
      const mediaType = req.file.mimetype.startsWith("video/")
        ? "video"
        : "image";
      const mediaData = await uploadImageCloudinary(req.file);

      updateData.media = {
        type: mediaType,
        public_id: mediaData.public_id,
        url: mediaData.url,
        duration: mediaType === "video" ? parseInt(req.body.duration) || 0 : 0,
      };
    }

    const updatedStory = await Story.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Story updated successfully",
      story: updatedStory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating story",
      error: error.message,
    });
  }
};

// Delete story (admin only)
const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;

    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    await Story.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting story",
      error: error.message,
    });
  }
};

// Update story order (admin only)
const updateStoryOrder = async (req, res) => {
  try {
    const { stories } = req.body;

    if (!Array.isArray(stories)) {
      return res.status(400).json({
        success: false,
        message: "Stories must be an array",
      });
    }

    const updatePromises = stories.map((story) =>
      Story.findByIdAndUpdate(story.id, { order: story.order }, { new: true })
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: "Story order updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating story order",
      error: error.message,
    });
  }
};

// Increment story views and clicks with detailed tracking
const incrementStoryViews = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const userAgent = req.get("User-Agent") || "";
    const ipAddress = req.ip || req.connection.remoteAddress || "";

    // Check if story exists
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // If user is logged in, check if they have anonymous views/clicks that need to be updated
    if (userId) {
      // Find anonymous views from the same IP address
      const anonymousViews = story.viewDetails.filter(
        (view) => !view.userId && view.ipAddress === ipAddress
      );

      if (anonymousViews.length > 0) {
        // Update anonymous views to associate them with the logged-in user
        await Story.findByIdAndUpdate(
          id,
          {
            $set: {
              "viewDetails.$[elem].userId": userId,
              "viewDetails.$[elem].isAnonymous": false,
            },
          },
          {
            arrayFilters: [
              {
                "elem.userId": null,
                "elem.ipAddress": ipAddress,
              },
            ],
          }
        );
      }

      // Find anonymous clicks from the same IP address
      const anonymousClicks = story.clickDetails.filter(
        (click) => !click.userId && click.ipAddress === ipAddress
      );

      if (anonymousClicks.length > 0) {
        // Update anonymous clicks to associate them with the logged-in user
        await Story.findByIdAndUpdate(
          id,
          {
            $set: {
              "clickDetails.$[elem].userId": userId,
              "clickDetails.$[elem].isAnonymous": false,
            },
          },
          {
            arrayFilters: [
              {
                "elem.userId": null,
                "elem.ipAddress": ipAddress,
              },
            ],
          }
        );
      }
    }

    // Check if user has already viewed this story (for unique view count)
    const existingView = story.viewDetails.find((view) => {
      if (
        userId &&
        view.userId &&
        view.userId.toString() === userId.toString()
      ) {
        return true;
      }
      if (!userId && view.ipAddress === ipAddress) {
        return true;
      }
      return false;
    });

    // Always increment clicks (total interactions)
    const newClick = {
      userId: userId,
      userAgent: userAgent,
      ipAddress: ipAddress,
      clickedAt: new Date(),
      isAnonymous: !userId,
    };

    let updateData = {
      $inc: { clicks: 1 },
      $push: { clickDetails: newClick },
    };

    // Only increment views if this is a new unique user
    if (!existingView) {
      const newView = {
        userId: userId,
        userAgent: userAgent,
        ipAddress: ipAddress,
        viewedAt: new Date(),
        isAnonymous: !userId,
      };

      updateData.$inc.views = 1;
      updateData.$push.viewDetails = newView;
    }

    await Story.findByIdAndUpdate(id, updateData);

    res.status(200).json({
      success: true,
      message: "Story interaction recorded",
      isNewView: !existingView,
      totalViews: existingView ? story.views : story.views + 1,
      totalClicks: story.clicks + 1,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error recording story interaction",
      error: error.message,
    });
  }
};

// Get story views details
const getStoryViews = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching views for story ID: ${id}`);

    const story = await Story.findById(id)
      .populate("viewDetails.userId", "name email")
      .select("viewDetails views");

    if (!story) {
      console.log(`Story not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    console.log(
      `Story found: ${story.title}, Views: ${
        story.views
      }, ViewDetails length: ${
        story.viewDetails ? story.viewDetails.length : "undefined"
      }`
    );

    // Handle case where viewDetails might not exist (for older stories)
    const viewDetails = story.viewDetails || [];

    // Process view details to show user names or "Unknown"
    const processedViews = viewDetails.map((view) => ({
      _id: view._id,
      userName: view.userId ? view.userId.name : "Unknown",
      userEmail: view.userId ? view.userId.email : null,
      isAnonymous: view.isAnonymous,
      viewedAt: view.viewedAt,
      userAgent: view.userAgent,
      ipAddress: view.ipAddress,
    }));

    // Sort by most recent first
    processedViews.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));

    console.log(`Processed ${processedViews.length} views for story ${id}`);

    res.status(200).json({
      success: true,
      message: "Story views retrieved successfully",
      data: {
        totalViews: story.views || 0,
        views: processedViews,
      },
    });
  } catch (error) {
    console.error("Error retrieving story views:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving story views",
      error: error.message,
    });
  }
};

// Get story clicks details
const getStoryClicks = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching clicks for story ID: ${id}`);

    const story = await Story.findById(id)
      .populate("clickDetails.userId", "name email")
      .select("clickDetails clicks");

    if (!story) {
      console.log(`Story not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    console.log(
      `Story found: ${story.title}, Clicks: ${
        story.clicks
      }, ClickDetails length: ${
        story.clickDetails ? story.clickDetails.length : "undefined"
      }`
    );

    // Handle case where clickDetails might not exist (for older stories)
    const clickDetails = story.clickDetails || [];

    // Group clicks by user and count them
    const userClickCounts = {};
    const userDetails = {};

    clickDetails.forEach((click) => {
      const userKey = click.userId ? click.userId.toString() : click.ipAddress;

      if (!userClickCounts[userKey]) {
        userClickCounts[userKey] = 0;
        userDetails[userKey] = {
          userId: click.userId,
          userName: click.userId ? click.userId.name : "Unknown",
          userEmail: click.userId ? click.userId.email : null,
          isAnonymous: click.isAnonymous,
          ipAddress: click.ipAddress,
          firstClickAt: click.clickedAt,
          lastClickAt: click.clickedAt,
          userAgent: click.userAgent,
        };
      }

      userClickCounts[userKey]++;

      // Update last click time
      if (
        new Date(click.clickedAt) > new Date(userDetails[userKey].lastClickAt)
      ) {
        userDetails[userKey].lastClickAt = click.clickedAt;
      }

      // Update first click time
      if (
        new Date(click.clickedAt) < new Date(userDetails[userKey].firstClickAt)
      ) {
        userDetails[userKey].firstClickAt = click.clickedAt;
      }
    });

    // Convert to array format with click counts
    const processedClicks = Object.keys(userClickCounts).map((userKey) => ({
      _id: userKey,
      userName: userDetails[userKey].userName,
      userEmail: userDetails[userKey].userEmail,
      isAnonymous: userDetails[userKey].isAnonymous,
      clickCount: userClickCounts[userKey],
      firstClickAt: userDetails[userKey].firstClickAt,
      lastClickAt: userDetails[userKey].lastClickAt,
      ipAddress: userDetails[userKey].ipAddress,
      userAgent: userDetails[userKey].userAgent,
    }));

    // Sort by click count (highest first), then by last click time
    processedClicks.sort((a, b) => {
      if (b.clickCount !== a.clickCount) {
        return b.clickCount - a.clickCount;
      }
      return new Date(b.lastClickAt) - new Date(a.lastClickAt);
    });

    console.log(
      `Processed ${processedClicks.length} unique users with clicks for story ${id}`
    );

    res.status(200).json({
      success: true,
      message: "Story clicks retrieved successfully",
      data: {
        totalClicks: story.clicks || 0,
        clicks: processedClicks,
      },
    });
  } catch (error) {
    console.error("Error retrieving story clicks:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving story clicks",
      error: error.message,
    });
  }
};

// Increment story clicks with detailed tracking
const incrementStoryClicks = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const userAgent = req.get("User-Agent") || "";
    const ipAddress = req.ip || req.connection.remoteAddress || "";

    // Check if story exists
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // If user is logged in, check if they have anonymous clicks that need to be updated
    if (userId) {
      // Find anonymous clicks from the same IP address
      const anonymousClicks = story.clickDetails.filter(
        (click) => !click.userId && click.ipAddress === ipAddress
      );

      if (anonymousClicks.length > 0) {
        // Update anonymous clicks to associate them with the logged-in user
        await Story.findByIdAndUpdate(
          id,
          {
            $set: {
              "clickDetails.$[elem].userId": userId,
              "clickDetails.$[elem].isAnonymous": false,
            },
          },
          {
            arrayFilters: [
              {
                "elem.userId": null,
                "elem.ipAddress": ipAddress,
              },
            ],
          }
        );
      }
    }

    // Add new click detail
    const newClick = {
      userId: userId,
      userAgent: userAgent,
      ipAddress: ipAddress,
      clickedAt: new Date(),
      isAnonymous: !userId,
    };

    await Story.findByIdAndUpdate(id, {
      $inc: { clicks: 1 },
      $push: { clickDetails: newClick },
    });

    res.status(200).json({
      success: true,
      message: "Story clicks incremented",
      totalClicks: story.clicks + 1,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error incrementing story clicks",
      error: error.message,
    });
  }
};

// Toggle story highlight (admin only)
const toggleStoryHighlight = async (req, res) => {
  try {
    const { id } = req.params;
    const { highlight, highlightTitle } = req.body;

    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    const updatedStory = await Story.findByIdAndUpdate(
      id,
      {
        highlight: highlight === "true" || highlight === true,
        highlightTitle: highlightTitle || story.highlightTitle,
      },
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Story highlight updated successfully",
      story: updatedStory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating story highlight",
      error: error.message,
    });
  }
};

module.exports = {
  getAllStories,
  getAllStoriesAdmin,
  getSingleStory,
  createStory,
  updateStory,
  deleteStory,
  updateStoryOrder,
  incrementStoryViews,
  getStoryViews,
  incrementStoryClicks,
  getStoryClicks,
  toggleStoryHighlight,
};
