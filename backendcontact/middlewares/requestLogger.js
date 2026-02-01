import { logger } from './errorHandler.js';

/**
 * Request logging middleware
 * Logs all incoming requests with method, path, body, and user info
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request details
  const logData = {
    method: req.method,
    path: req.path,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  };

  // Log request body (if present and not too large)
  if (req.body && Object.keys(req.body).length > 0) {
    // Don't log passwords or sensitive data
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.apiKey) sanitizedBody.apiKey = '***';
    logData.body = sanitizedBody;
  }

  // Log query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    logData.query = req.query;
  }

  // Log user info if available
  if (req.user) {
    logData.user = {
      email: req.user.email,
      oktaSub: req.user.oktaSub,
      groups: req.user.groups,
    };
  }

  // Log the request
  console.log('\n📥 INCOMING REQUEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Method: ${logData.method}`);
  console.log(`Path: ${logData.path}`);
  console.log(`URL: ${logData.url}`);
  console.log(`IP: ${logData.ip}`);
  
  if (logData.user) {
    console.log(`User: ${logData.user.email} (${logData.user.oktaSub})`);
    console.log(`Groups: ${logData.user.groups.join(', ') || 'none'}`);
  }
  
  if (logData.query) {
    console.log(`Query:`, logData.query);
  }
  
  if (logData.body) {
    console.log(`Body:`, JSON.stringify(logData.body, null, 2));
  }
  
  console.log(`Time: ${logData.timestamp}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Log response when it finishes
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    
    console.log('📤 RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Status: ${res.statusCode}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Path: ${req.path}`);
    
    // Log response body if it's JSON and not too large
    try {
      const parsed = JSON.parse(data);
      if (Object.keys(parsed).length < 10) {
        console.log(`Response:`, JSON.stringify(parsed, null, 2));
      } else {
        console.log(`Response: [Large object - ${Object.keys(parsed).length} keys]`);
      }
    } catch (e) {
      // Not JSON, skip
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return originalSend.call(this, data);
  };

  next();
};

