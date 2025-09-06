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
const adminSettingsRouter = require("./routes/adminSettingsRoute");
const addressRouter = require("./routes/addressRoute");
const orderRouter = require("./routes/orderRoute");
const couponRouter = require("./routes/couponRoute");
const welcomeGiftRouter = require("./routes/welcomeGiftRoute");
const reviewRouter = require("./routes/reviewRoute");
const newsletterRouter = require("./routes/newsletterRoute");
const heroImageRouter = require("./routes/heroImageRoute");
const session = require("express-session");
const passport = require("passport");
require("./config/passport-setup");
const authRouter = require("./routes/authRoute");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const fs = require("fs").promises;
const https = require("https");
const nocache = require("nocache");
const path = require("path");
const { getProductBySlugForSSR } = require("./controller/productController.js");

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 1000;
const BODY_LIMIT = "10mb";
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://roven-main.onrender.com";

const app = express();
app.set("trust proxy", true);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", FRONTEND_URL],
      },
    },
    hidePoweredBy: true,
  })
);

const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }));
app.use(cookieParser());

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(nocache());

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: { success: false, message: "Too many requests, please try later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
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

const claimLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many gift claim attempts. Please try again later.",
  },
});
app.use("/api/welcome-gifts/:id/claim", claimLimiter);

app.use(
  compression({
    level: 9,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);
app.use(morgan(isProduction ? "combined" : "dev"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "not-so-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("API is running!");
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/category", categoryRouter);
app.use("/api/cart", cartRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin/settings", adminSettingsRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/welcome-gifts", welcomeGiftRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/hero-images", heroImageRouter);

app.use(
  express.static(path.join(__dirname, "..", "client", "dist"), {
    maxAge: "1y",
  })
);
app.get("/product/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await getProductBySlugForSSR(slug);
    const indexPath = path.join(
      __dirname,
      "..",
      "client",
      "dist",
      "index.html"
    );
    let html = await fs.readFile(indexPath, "utf-8");

    if (product) {
      const { name, shortDescription, images, variants } = product;
      const imageUrl = images?.[0]?.url || "https://i.imgur.com/1twoa5I.png";
      const description = shortDescription || "Check out this amazing product!";
      const url = `${FRONTEND_URL}/product/${slug}`;

      const metaTags = `
        <meta property="og:title" content="${name}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:url" content="${url}" />
        <meta name="twitter:card" content="summary_large_image">
      `;

      html = html.replace("</head>", `${metaTags}</head>`);
    }

    res.send(html);
  } catch (error) {
    next(error);
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "dist", "index.html"));
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "API route not found" });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: isProduction ? undefined : err.stack,
  });
});

const startServer = async () => {
  try {
    await connectDb();
    if (isProduction && process.env.SSL_KEY && process.env.SSL_CERT) {
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
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
