/**
 * UUID Generation Utility
 * 
 * This utility provides UUID generation and validation functions
 * to replace PostgreSQL's built-in UUID generation functionality.
 * 
 * Uses the Web Crypto API's crypto.randomUUID() method for secure
 * UUID v4 generation in both browser and Node.js environments.
 */

/**
 * Generates a new UUID v4 using crypto.randomUUID()
 * 
 * @returns {string} A new UUID v4 string
 * @throws {Error} If crypto.randomUUID is not available
 */
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments where crypto.randomUUID is not available
  if (typeof require !== 'undefined') {
    try {
      const { randomUUID } = require('crypto');
      return randomUUID();
    } catch (error) {
      // Fall through to manual implementation
    }
  }
  
  // Manual UUID v4 implementation as last resort
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validates if a string is a valid UUID format
 * 
 * @param {string} uuid - The string to validate
 * @returns {boolean} True if the string is a valid UUID format
 */
export function isValidUuid(uuid: string): boolean {
  if (typeof uuid !== 'string') {
    return false;
  }
  
  // UUID v4 regex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates if a string is a valid UUID format (any version)
 * 
 * @param {string} uuid - The string to validate
 * @returns {boolean} True if the string is a valid UUID format
 */
export function isValidUuidAnyVersion(uuid: string): boolean {
  if (typeof uuid !== 'string') {
    return false;
  }
  
  // General UUID regex pattern (any version)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generates a new UUID and validates it
 * 
 * @returns {string} A validated UUID v4 string
 * @throws {Error} If UUID generation fails or produces invalid UUID
 */
export function generateValidatedUuid(): string {
  const uuid = generateUuid();
  
  if (!isValidUuid(uuid)) {
    throw new Error('Generated UUID is invalid');
  }
  
  return uuid;
}

/**
 * Default export for convenience
 */
export default {
  generate: generateUuid,
  generateValidated: generateValidatedUuid,
  isValid: isValidUuid,
  isValidAnyVersion: isValidUuidAnyVersion,
};