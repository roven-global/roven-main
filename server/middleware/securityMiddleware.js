const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

// Security event logging
const logSecurityEvent = (event, details, req) => {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id,
    ...details
  };
  console.log(`[SECURITY_EVENT]`, JSON.stringify(logData));
};

// Enhanced rate limiting for different endpoints
const createRateLimiter = (windowMs, max, message, keyGenerator = null) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => req.ip),
    handler: (req, res) => {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { 
        endpoint: req.path,
        method: req.method 
      }, req);
      res.status(429).json({ success: false, message });
    }
  });
};

// Specific rate limiters
const rateLimiters = {
  // General API rate limiting
  general: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // requests
    "Too many requests from this IP, please try again later"
  ),

  // Authentication endpoints
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    10, // requests
    "Too many authentication attempts, please try again later"
  ),

  // Gift claiming (most restrictive)
  giftClaim: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    5, // requests
    "Too many gift claim attempts, please try again later"
  ),

  // Coupon validation
  couponValidation: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    20, // requests
    "Too many coupon validation attempts, please try again later",
    (req) => req.user?._id || req.ip // Rate limit by user if authenticated
  )
};

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input sanitization middleware
const sanitizeInputs = [
  mongoSanitize(), // Prevent NoSQL injection
  xss(), // Prevent XSS attacks
  hpp() // Prevent HTTP Parameter Pollution
];

// Request logging middleware
const requestLogger = (req, res, next) => {
  // Log suspicious requests
  const suspiciousPatterns = [
    /\$where/i,
    /\$regex/i,
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /eval\(/i
  ];

  const requestString = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestString));

  if (isSuspicious) {
    logSecurityEvent('SUSPICIOUS_REQUEST', {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      params: req.params
    }, req);
  }

  next();
};

// IP validation middleware
const validateIP = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Block requests from known malicious IP ranges (example)
  const blockedIPRanges = [
    // Add known malicious IP ranges here
    // '192.168.1.0/24'
  ];

  // For production, you would implement actual IP range checking
  // This is a simplified example
  if (blockedIPRanges.some(range => clientIP.includes(range.split('/')[0]))) {
    logSecurityEvent('BLOCKED_IP_ACCESS', { blockedIP: clientIP }, req);
    return res.status(403).json({
      success: false,
      message: "Access denied"
    });
  }

  next();
};

// Request size limiting
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.get('content-length')) || 0;
  const maxSize = 1024 * 1024; // 1MB limit

  if (contentLength > maxSize) {
    logSecurityEvent('REQUEST_SIZE_EXCEEDED', { 
      size: contentLength, 
      maxSize 
    }, req);
    return res.status(413).json({
      success: false,
      message: "Request too large"
    });
  }

  next();
};

module.exports = {
  securityHeaders,
  sanitizeInputs,
  requestLogger,
  validateIP,
  requestSizeLimit,
  rateLimiters,
  logSecurityEvent
};
