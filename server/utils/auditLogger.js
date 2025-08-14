const fs = require('fs').promises;
const path = require('path');

// Create logs directory if it doesn't exist
const createLogsDirectory = async () => {
  const logsDir = path.join(__dirname, '..', 'logs');
  try {
    await fs.mkdir(logsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating logs directory:', error);
  }
  return logsDir;
};

// Format log entry
const formatLogEntry = (level, category, event, details, req = null) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    event,
    details,
    request: req ? {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?._id,
      sessionId: req.sessionID,
      headers: {
        'content-type': req.get('Content-Type'),
        'accept': req.get('Accept'),
        'referer': req.get('Referer')
      }
    } : null
  };

  return JSON.stringify(logEntry);
};

// Write log to file
const writeLogToFile = async (filename, logEntry) => {
  try {
    const logsDir = await createLogsDirectory();
    const logFile = path.join(logsDir, filename);
    
    await fs.appendFile(logFile, logEntry + '\n');
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
};

// Security event logger
const logSecurityEvent = async (event, details, req = null) => {
  const logEntry = formatLogEntry('SECURITY', 'SECURITY', event, details, req);
  console.log(`[SECURITY]`, logEntry);
  
  // Write to security log file
  const date = new Date().toISOString().split('T')[0];
  await writeLogToFile(`security-${date}.log`, logEntry);
};

// Welcome gift specific logger
const logGiftEvent = async (event, details, req = null) => {
  const logEntry = formatLogEntry('INFO', 'WELCOME_GIFT', event, details, req);
  console.log(`[GIFT]`, logEntry);
  
  // Write to gift log file
  const date = new Date().toISOString().split('T')[0];
  await writeLogToFile(`welcome-gifts-${date}.log`, logEntry);
};

// Error logger
const logError = async (error, event, req = null) => {
  const details = {
    message: error.message,
    stack: error.stack,
    code: error.code
  };
  
  const logEntry = formatLogEntry('ERROR', 'ERROR', event, details, req);
  console.error(`[ERROR]`, logEntry);
  
  // Write to error log file
  const date = new Date().toISOString().split('T')[0];
  await writeLogToFile(`errors-${date}.log`, logEntry);
};

// Audit specific actions
const logAuditEvent = async (action, resourceType, resourceId, changes, req = null) => {
  const details = {
    action, // CREATE, UPDATE, DELETE, CLAIM, USE
    resourceType, // WELCOME_GIFT, USER_REWARD
    resourceId,
    changes,
    timestamp: new Date().toISOString()
  };
  
  const logEntry = formatLogEntry('AUDIT', 'AUDIT', action, details, req);
  console.log(`[AUDIT]`, logEntry);
  
  // Write to audit log file
  const date = new Date().toISOString().split('T')[0];
  await writeLogToFile(`audit-${date}.log`, logEntry);
};

// Middleware to log all requests
const requestLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  const requestDetails = {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id
  };
  
  console.log(`[REQUEST]`, JSON.stringify(requestDetails));
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(obj) {
    const responseTime = Date.now() - startTime;
    const responseDetails = {
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      success: obj?.success,
      message: obj?.message
    };
    
    console.log(`[RESPONSE]`, JSON.stringify(responseDetails));
    return originalJson.call(this, obj);
  };
  
  next();
};

// Clean up old log files (keep last 30 days)
const cleanupOldLogs = async () => {
  try {
    const logsDir = await createLogsDirectory();
    const files = await fs.readdir(logsDir);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (const file of files) {
      if (file.endsWith('.log')) {
        const filePath = path.join(logsDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < thirtyDaysAgo) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old log file: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up old logs:', error);
  }
};

// Schedule daily cleanup
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000); // Run daily

module.exports = {
  logSecurityEvent,
  logGiftEvent,
  logError,
  logAuditEvent,
  requestLoggingMiddleware,
  cleanupOldLogs
};
