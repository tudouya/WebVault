/**
 * Authentication Services
 * 认证服务统一导出
 * 
 * Provides centralized access to authentication service interfaces and implementations.
 * Supports dependency injection pattern for flexible authentication provider switching.
 */

// ============================================================================
// Service Interface Definitions
// ============================================================================

/**
 * Core AuthService interface defining authentication contract
 * Requirements: 2.1 (Social auth), 5.1 (Session management)
 */
export type { 
  AuthService,
  AuthServiceConfig,
  AuthServiceRegistry,
  AuthServiceFactory,
  AuthServiceError
} from './AuthService.interface';

// ============================================================================
// Service Implementations
// ============================================================================

/**
 * Clerk Authentication Service (Client-Side)
 * Client-side implementation for use in React components and browser contexts
 * Requirements: 1.1 (Email auth), 2.1 (Social auth), 5.1 (Session management)
 */
export { 
  ClerkClientAuthService,
  clerkClientAuthService  
} from './ClerkClientAuthService';

/**
 * Session Management Service
 * Handles session lifecycle, persistence, and security policies
 * Requirements: 5.1 (Session management)
 */
export { 
  SessionManager,
  sessionManager,
  createSessionManager
} from './SessionManager';

export type {
  SessionData,
  LockoutStatus,
  FailedAttemptData,
  SessionValidationResult
} from './SessionManager';

// Additional auth services will be exported here
// export { socialAuthService } from './socialAuthService'
// export { mockAuthService } from './mock-auth.service'

// ============================================================================
// Service Registry (To be implemented)
// ============================================================================

// export { authServiceRegistry } from './auth-service.registry'
// export { createAuthService } from './auth-service.factory'