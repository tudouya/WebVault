// Authentication Module
// 认证模块统一导出

// Types exports
export type * from './types'

// Schemas exports
export * from './schemas'

// Components exports
export * from './components'

// Hooks exports
export * from './hooks'

// Services exports
export * from './services'

// Stores exports
export * from './stores'

// Utils exports
export { authUtils } from './utils/auth-utils'
export { 
  isValidJwtFormat,
  parseJwtPayload,
  isJwtExpired,
  getJwtTimeToExpiry,
  shouldRefreshJwt,
  validateJwtClaims,
  isValidSession,
  getSessionExpiryTime,
  shouldRefreshSession,
  createSessionStorageKey,
  storeSessionSecurely,
  retrieveStoredSession,
  clearStoredSession,
  updateLastActivity,
  getLastActivity,
  isSessionInactiveExpired,
  generateSecureRandomString,
  validateCsrfToken,
  isSecureRedirectUrl,
  handleLoginAttempt,
  resetLoginAttempts,
  isCommonPassword,
  containsPersonalInfo,
  calculatePasswordComplexity,
  validatePasswordStrength,
  generatePasswordSuggestions,
  validateEmailFormat,
  isDisposableEmail,
  checkEmailDomainValidity,
  validateEmailComprehensive,
  formatAuthError,
  generateErrorReport,
} from './utils/auth-utils'

// 为避免冲突，重命名导出
export { sanitizeAuthInput as sanitizeAuthenticationInput } from './utils/auth-utils'