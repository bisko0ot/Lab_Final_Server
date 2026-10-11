/**
 * Request Logger Middleware for IdeaVault API
 * Logs incoming requests with method, URL, status code, and response time
 */

/**
 * Creates a logging middleware that records request details
 * @param {Object} options - Logger configuration options
 * @param {boolean} options.verbose - If true, logs request headers and body
 * @returns {Function} Express middleware function
 */
function createLogger(options = {}) {
  const { verbose = false } = options;

  return (req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();

    // Capture the original end method to intercept response
    const originalEnd = res.end;

    res.end = function (...args) {
      const duration = Date.now() - start;
      const logEntry = `[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`;

      if (res.statusCode >= 400) {
        console.error(logEntry);
      } else {
        console.log(logEntry);
      }

      if (verbose && req.method !== 'GET') {
        console.log(`  → Body: ${JSON.stringify(req.body || {}).substring(0, 200)}`);
      }

      originalEnd.apply(res, args);
    };

    next();
  };
}

module.exports = { createLogger };
