/**
 * Centralized Error Handling Middleware for IdeaVault API
 * Catches unhandled errors and returns consistent JSON error responses
 */

/**
 * Custom API error class with HTTP status code support
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Not found handler - catches requests to undefined routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function notFoundHandler(req, res, next) {
  const error = new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`);
  next(error);
}

/**
 * Global error handler middleware
 * Formats all errors into a consistent JSON response structure
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function globalErrorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  const errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack })
  };

  // Log server errors for debugging
  if (statusCode >= 500) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    console.error(`  Message: ${err.message}`);
    console.error(`  Stack: ${err.stack}`);
  }

  res.status(statusCode).json(errorResponse);
}

module.exports = {
  ApiError,
  notFoundHandler,
  globalErrorHandler
};
