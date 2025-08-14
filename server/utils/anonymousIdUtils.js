const crypto = require("crypto");

// Get secret from environment or use fallback
const getSecret = () => {
  return process.env.ANONYMOUS_SECRET || 'your-fallback-secret-change-this-in-production';
};

// Generate cryptographically secure anonymous ID
const generateSecureAnonymousId = () => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const data = `${timestamp}-${randomBytes}`;
  const signature = crypto.createHmac('sha256', getSecret())
    .update(data).digest('hex').substring(0, 16);
  
  return `${data}-${signature}`;
};

// Validate anonymous ID with timing-safe comparison
const validateAnonymousId = (anonymousId) => {
  if (!anonymousId || typeof anonymousId !== 'string') {
    return { isValid: false, reason: 'Invalid ID format' };
  }

  const parts = anonymousId.split('-');
  if (parts.length !== 4) {
    return { isValid: false, reason: 'Invalid ID structure' };
  }

  const [timestamp, randomPart, , signature] = parts;
  const data = `${timestamp}-${randomPart}`;
  const expectedSignature = crypto.createHmac('sha256', getSecret())
    .update(data).digest('hex').substring(0, 16);

  // Use timing-safe comparison to prevent timing attacks
  let isValidSignature;
  try {
    isValidSignature = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'), 
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return { isValid: false, reason: 'Signature validation error' };
  }

  // Check timestamp (not older than 24 hours)
  const timestampValue = parseInt(timestamp);
  if (isNaN(timestampValue)) {
    return { isValid: false, reason: 'Invalid timestamp' };
  }

  const ageInHours = (Date.now() - timestampValue) / (60 * 60 * 1000);
  const maxAgeHours = 24;

  if (ageInHours > maxAgeHours) {
    return { isValid: false, reason: 'ID expired' };
  }

  if (!isValidSignature) {
    return { isValid: false, reason: 'Invalid signature' };
  }

  return { 
    isValid: true, 
    timestamp: timestampValue, 
    age: ageInHours 
  };
};

// Extract timestamp from anonymous ID
const getTimestampFromId = (anonymousId) => {
  try {
    const parts = anonymousId.split('-');
    return parseInt(parts[0]);
  } catch (error) {
    return null;
  }
};

// Check if anonymous ID is close to expiration
const isIdNearExpiration = (anonymousId, hoursBeforeExpiration = 2) => {
  const timestamp = getTimestampFromId(anonymousId);
  if (!timestamp) return true;

  const ageInHours = (Date.now() - timestamp) / (60 * 60 * 1000);
  const maxAgeHours = 24;
  
  return (maxAgeHours - ageInHours) <= hoursBeforeExpiration;
};

// Middleware to validate anonymous ID in requests
const validateAnonymousIdMiddleware = (req, res, next) => {
  const anonymousId = req.body.anonymousId || req.query.anonymousId;
  
  if (anonymousId) {
    const validation = validateAnonymousId(anonymousId);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid anonymous session. Please refresh the page.",
        error: validation.reason
      });
    }

    // Add validation info to request for use in controllers
    req.anonymousIdValidation = validation;
    
    // Warn if ID is near expiration
    if (isIdNearExpiration(anonymousId)) {
      req.anonymousIdNearExpiration = true;
    }
  }

  next();
};

module.exports = {
  generateSecureAnonymousId,
  validateAnonymousId,
  getTimestampFromId,
  isIdNearExpiration,
  validateAnonymousIdMiddleware
};
