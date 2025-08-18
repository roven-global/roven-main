require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const connectDb = require("./config/dbConnection");
const userRouter = require("./routes/userRoute");
const productRouter = require("./routes/productRoute");
const categoryRouter = require("./routes/categoryRoute");
const cartRouter = require("./routes/cartRoute");
const adminRouter = require("./routes/adminRoute");
const addressRouter = require("./routes/addressRoute");
const orderRouter = require("./routes/orderRoute");
const couponRouter = require("./routes/couponRoute");
const welcomeGiftRouter = require("./routes/welcomeGiftRoute");
const session = require("express-session");
const passport = require("passport");
require("./config/passport-setup");
const authRouter = require("./routes/authRoute");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const fs = require("fs");
const https = require("https");
const nocache = require("nocache");

// Security-related constants
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 1000; // Max requests per window
const BODY_LIMIT = "10mb"; // Max request body size

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

// Trust proxy for proper IP detection
app.set('trust proxy', true);

// --- Security Middleware ---

// 1. HTTP security headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:5173"],
      },
    },
    hidePoweredBy: true,
  })
);

// 2. CORS configuration
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 3. Request parsing and rate limiting
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }));
app.use(cookieParser());

// 4. Security against common attacks, no caching
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(nocache());

// 5. Rate limiting APIs
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

// 6. Stricter rate limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});
app.use("/api/auth/", authLimiter);
app.use("/api/user/login", authLimiter);
app.use("/api/user/register", authLimiter);
app.use("/api/user/forgot-password", authLimiter);

// 7. Welcome Gift Claim stricter limiter (critical for abuse prevention!)
const claimLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 claims per hour per IP
  message: {
    success: false,
    message: "Too many gift claim attempts. Please try again later.",
  },
});
app.use("/api/welcome-gifts/:id/claim", claimLimiter);

// 8. Compression & request logging
app.use(compression());
app.use(morgan(isProduction ? "combined" : "dev"));

// 9. Secure session handling
app.use(
  session({
    secret: process.env.SESSION_SECRET || "not-so-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// 10. Passport authentication
app.use(passport.initialize());
app.use(passport.session());

// --- API ROUTES ---
app.get("/", (req, res) => {
  res.send("API is running!");
});
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/category", categoryRouter);
app.use("/api/cart", cartRouter);
app.use("/api/admin", adminRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/welcome-gifts", welcomeGiftRouter);

// Default 404 handler for all unmatched API routes (optional, but user-friendly)
app.use((req, res) => {
  res.status(404).json({ success: false, message: "API route not found" });
});

// --- Connect to DB and Start Server ---
const startServer = async () => {
  await connectDb();
  if (isProduction && process.env.SSL_KEY && process.env.SSL_CERT) {
    // HTTPS/SSL in production
    const sslOptions = {
      key: fs.readFileSync(process.env.SSL_KEY),
      cert: fs.readFileSync(process.env.SSL_CERT),
    };
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`HTTPS Server running on port ${PORT}`);
    });
  } else {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
};

// Global error handler (optionally add logError here)
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.error("[Global Error Handler]", err.stack || err);
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

startServer();
