/**
 * Input Validation Utilities for IdeaVault API
 * Provides reusable validation functions for request data sanitization
 */

/**
 * Validates that required fields are present and non-empty in the request body
 * @param {Object} body - The request body object
 * @param {string[]} requiredFields - Array of required field names
 * @returns {{ valid: boolean, missing: string[] }}
 */
function validateRequiredFields(body, requiredFields) {
  const missing = requiredFields.filter(field => {
    const value = body[field];
    return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
  });

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Sanitizes a string input by trimming whitespace and removing HTML tags
 * @param {string} input - Raw string input
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/<[^>]*>/g, '');
}

/**
 * Validates an email address format
 * @param {string} email - Email address to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a MongoDB ObjectId string format
 * @param {string} id - The ID string to validate
 * @returns {boolean}
 */
function isValidObjectId(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Parses and validates tags input into a clean array
 * @param {string|string[]} tags - Tags as comma-separated string or array
 * @returns {string[]} Cleaned array of tag strings
 */
function parseTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map(t => sanitizeString(t)).filter(t => t.length > 0);
  }
  if (typeof tags === 'string' && tags.trim()) {
    return tags.split(',').map(t => sanitizeString(t)).filter(t => t.length > 0);
  }
  return [];
}

module.exports = {
  validateRequiredFields,
  sanitizeString,
  isValidEmail,
  isValidObjectId,
  parseTags
};
