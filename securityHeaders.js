/**
 * Security Headers Middleware for IdeaVault API
 * Adds protective HTTP headers to all responses to mitigate common web vulnerabilities
 */

/**
 * Applies security-related HTTP headers to every response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function securityHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking by disabling iframe embedding
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS filter in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information sent with requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Remove the X-Powered-By header to hide Express fingerprint
  res.removeHeader('X-Powered-By');

  // Prevent caching of sensitive API responses
  if (req.headers.authorization) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
  }

  next();
}

module.exports = { securityHeaders };
