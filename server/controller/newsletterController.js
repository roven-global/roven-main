const asyncHandler = require("express-async-handler");
const { Parser } = require("json2csv");
const NewsletterSubscriber = require("../models/newsletterSubscriberModel");

/**
 * Subscribe to the newsletter
 * @route POST /api/newsletter/subscribe
 */
const subscribeToNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const existingSubscriber = await NewsletterSubscriber.findOne({ email });

  if (existingSubscriber) {
    res.status(400);
    throw new Error("This email is already subscribed.");
  }

  const newSubscriber = await NewsletterSubscriber.create({ email });

  if (newSubscriber) {
    res.status(201).json({
      success: true,
      message: "Thank you for subscribing!",
    });
  } else {
    res.status(500);
    throw new Error("Subscription failed. Please try again.");
  }
});

/**
 * Get all newsletter subscribers with pagination
 * @route GET /api/newsletter/subscribers
 */
const getSubscribers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15 } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const subscribers = await NewsletterSubscriber.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalSubscribers = await NewsletterSubscriber.countDocuments();
  const totalPages = Math.ceil(totalSubscribers / limitNum);

  res.json({
    success: true,
    data: {
      subscribers,
      pagination: {
        total: totalSubscribers,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
    },
  });
});

/**
 * Export newsletter subscribers as CSV file
 * @route GET /api/newsletter/export-csv
 */
const exportSubscribersAsCSV = asyncHandler(async (req, res) => {
  const subscribers = await NewsletterSubscriber.find().lean();

  if (subscribers.length === 0) {
    res.status(404);
    throw new Error("No subscribers to export.");
  }

  const fields = [
    { label: "Email", value: "email" },
    { label: "Subscribed At", value: "createdAt" },
  ];

  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(subscribers);

  res.header("Content-Type", "text/csv");
  res.attachment("newsletter-subscribers.csv");
  res.send(csv);
});

module.exports = {
  subscribeToNewsletter,
  getSubscribers,
  exportSubscribersAsCSV,
};
