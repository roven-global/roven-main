// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const connectDb = require("./config/dbConnection");
const userRouter = require("./routes/userRoute");
const productRouter = require("./routes/productRoute");
const categoryRouter = require("./routes/categoryRoute");
const cartRouter = require("./routes/cartRoute");
const adminRouter = require("./routes/adminRoute"); 
const session = require('express-session');
const passport = require('passport');
require('./config/passport-setup'); 
const authRouter = require("./routes/authRoute");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const fs = require("fs");
const https = require("https");
const nocache = require("nocache");

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";


// Middleware (for JSON parsing)
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173", 
  })
);
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(nocache());
app.use(morgan("combined"));
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(compression());

// --- Add Passport Middleware ---
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction, 
    httpOnly: true,        
    sameSite: isProduction ? "none" : "lax",  
  },
}));
app.use(passport.initialize());
app.use(passport.session());
// --- End Passport Middleware ---

// Rate limiting middleware (e.g., 100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Data sanitization against NoSQL injection
app.use(mongoSanitize());
// Data sanitization against XSS
app.use(xss());

// Example route
app.get("/", (req, res) => {
  res.send("API is running!");
});
app.use("/api/auth", authRouter); 
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/category", categoryRouter);
app.use("/api/cart", cartRouter);
app.use("/api/admin", adminRouter); 

// Connect to DB and start server
const startServer = async () => {
  await connectDb();
  if (process.env.NODE_ENV === "production" && process.env.SSL_KEY && process.env.SSL_CERT) {
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

app.use((err, req, res, next) => {
  console.error("[Global Error Handler]", err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

startServer();