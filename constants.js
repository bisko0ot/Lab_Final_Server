/**
 * API Constants for IdeaVault Server
 * Centralizes response messages, status codes, and configuration values
 */

// HTTP Status Codes used across the API
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500
};

// Standardized error messages for consistent API responses
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access: authentication token is missing',
  FORBIDDEN: 'Forbidden: you do not have permission to perform this action',
  TOKEN_EXPIRED: 'Forbidden: authentication token is invalid or expired',
  IDEA_NOT_FOUND: 'The requested startup idea was not found',
  COMMENT_NOT_FOUND: 'The requested comment was not found',
  COMMENT_EMPTY: 'Comment text cannot be empty',
  IDEA_ID_REQUIRED: 'Idea ID is required to post a comment',
  OWN_IDEAS_ONLY: 'You can only modify or delete your own ideas',
  OWN_COMMENTS_ONLY: 'You can only modify or delete your own comments',
  SERVER_ERROR: 'An internal server error occurred. Please try again later.',
  RATE_LIMIT: 'Too many requests. Please slow down and try again later.'
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 0,  // 0 means no limit (return all results)
  MAX_LIMIT: 100
};

// Idea categories supported by the platform
const CATEGORIES = [
  'Tech',
  'Health',
  'AI',
  'Education',
  'Finance',
  'Social',
  'Environment',
  'Other'
];

// JWT configuration defaults
const JWT_CONFIG = {
  DEFAULT_EXPIRY: '7d',
  ALGORITHM: 'HS256'
};

module.exports = {
  HTTP_STATUS,
  ERROR_MESSAGES,
  PAGINATION,
  CATEGORIES,
  JWT_CONFIG
};
