const crypto = require("crypto");

const ANONYMOUS_SECRET = process.env.ANONYMOUS_SECRET || 'fallback-secret-for-development';

/**
 * Generates a cryptographically secure anonymous ID.
 * Format: timestamp-randomBytes-signature
 * @returns {string} The generated anonymous ID.
 */
const generateSecureAnonymousId = () => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const data = `${timestamp}-${randomBytes}`;
  
  const signature = crypto.createHmac('sha256', ANONYMOUS_SECRET)
    .update(data)
    .digest('hex')
    .substring(0, 16);
  
  const anonymousId = `${data}-${signature}`;
  console.log('Generated new secure anonymous ID:', {
    finalId: anonymousId,
    parts: anonymousId.split('-').length
  });
  
  return anonymousId;
};

/**
 * Validates a secure anonymous ID.
 * @param {string} anonymousId - The ID to validate.
 * @returns {boolean} True if the ID is valid, false otherwise.
 */
const validateAnonymousId = (anonymousId) => {
  if (!anonymousId || typeof anonymousId !== 'string') return false;

  const parts = anonymousId.split('-');
  if (parts.length !== 3) {
    console.log('Validation failed: Invalid ID structure');
    return false;
  }

  const [timestamp, randomPart, signature] = parts;
  const data = `${timestamp}-${randomPart}`;

  try {
    const expectedSignature = crypto.createHmac('sha256', ANONYMOUS_SECRET)
      .update(data)
      .digest('hex')
      .substring(0, 16);

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    const ts = parseInt(timestamp);
    const isTimestampValid = Number.isFinite(ts) && (Date.now() - ts) < (24 * 60 * 60 * 1000);

    if (!isSignatureValid) console.log('Validation failed: Invalid signature');
    if (!isTimestampValid) console.log('Validation failed: Timestamp expired or invalid');

    return isSignatureValid && isTimestampValid;
  } catch (error) {
    console.error('Error during signature validation:', error);
    return false;
  }
};

module.exports = {
  generateSecureAnonymousId,
  validateAnonymousId,
};
