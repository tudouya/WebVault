/**
 * AuthService Interface Definition
 * 
 * Establishes the complete service layer contract for WebVault authentication system.
 * Provides dependency injection foundation for multiple authentication providers.
 * 
 * Requirements:
 * - 2.1: Social authentication (Google, GitHub OAuth)
 * - 5.1: Session management (30-day persistence, 15-minute lockout mechanism)
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

import { 
  AuthUser, 
  AuthSession, 
  AuthFormData, 
  SocialProvider,
  AuthError 
} from '../types';

// ============================================================================
// Core Authentication Interface
// ============================================================================

/**
 * AuthService interface for dependency injection
 * 
 * Complete authentication service contract that abstracts authentication provider
 * implementation details. Enables easy testing and provider switching.
 */
export interface AuthService {
  // ========================================================================
  // Email/Password Authentication
  // ========================================================================
  
  /**
   * Sign in with email and password
   * 
   * @param credentials - User login credentials
   * @returns Authentication session with user data
   * @throws AuthError on invalid credentials or system errors
   * 
   * Requirements: 1.1 (Email authentication)
   */
  signIn(credentials: AuthFormData): Promise<AuthSession>;
  
  /**
   * Sign up new user with email and password
   * 
   * @param userData - Registration form data
   * @returns Authentication session (may require email confirmation)
   * @throws AuthError on validation errors or email conflicts
   */
  signUp(userData: AuthFormData): Promise<AuthSession>;
  
  // ========================================================================
  // Social Authentication (Requirements 2.1)
  // ========================================================================
  
  /**
   * Sign in with social provider (Google, GitHub)
   * 
   * @param provider - Social authentication provider
   * @param options - Additional authentication options
   * @returns Authentication session with social user data
   * @throws AuthError on OAuth errors or account conflicts
   * 
   * Requirements: 2.1 (Social authentication)
   */
  signInWithProvider(
    provider: SocialProvider, 
    options?: { redirectTo?: string }
  ): Promise<AuthSession>;
  
  /**
   * Handle social authentication callback
   * 
   * @param provider - Social provider used
   * @param code - OAuth authorization code
   * @param state - CSRF protection state parameter
   * @returns Authentication session
   * @throws AuthError on invalid callback or CSRF mismatch
   */
  handleSocialCallback(
    provider: SocialProvider, 
    code: string, 
    state: string
  ): Promise<AuthSession>;
  
  // ========================================================================
  // Session Management (Requirements 5.1)
  // ========================================================================
  
  /**
   * Sign out current user
   * Clears session data and invalidates tokens
   * 
   * @returns Promise that resolves when logout is complete
   */
  signOut(): Promise<void>;
  
  /**
   * Refresh authentication session
   * Extends session validity using refresh token
   * 
   * @returns Updated authentication session
   * @throws AuthError if refresh token is invalid or expired
   * 
   * Requirements: 5.1 (30-day persistence)
   */
  refreshSession(): Promise<AuthSession>;
  
  /**
   * Get current authentication session
   * 
   * @returns Current session or null if not authenticated
   */
  getSession(): Promise<AuthSession | null>;
  
  /**
   * Validate authentication session
   * Checks session validity and user permissions
   * 
   * @param session - Session to validate
   * @returns True if session is valid and active
   */
  validateSession(session: AuthSession): Promise<boolean>;
  
  // ========================================================================
  // Password Recovery
  // ========================================================================
  
  /**
   * Send password reset email
   * 
   * @param email - User email address
   * @returns Promise that resolves when reset email is sent
   * @throws AuthError if email not found or rate limited
   */
  resetPassword(email: string): Promise<void>;
  
  /**
   * Confirm password reset with token
   * 
   * @param token - Password reset token from email
   * @param newPassword - New password to set
   * @returns Promise that resolves when password is updated
   * @throws AuthError if token is invalid or expired
   */
  confirmPasswordReset(token: string, newPassword: string): Promise<void>;
  
  /**
   * Verify password reset token validity
   * 
   * @param token - Reset token to verify
   * @returns True if token is valid and not expired
   */
  verifyResetToken(token: string): Promise<boolean>;
  
  // ========================================================================
  // Account Security & Lockout (Requirements 5.1)
  // ========================================================================
  
  /**
   * Check account lockout status
   * 
   * @param email - User email to check
   * @returns Lockout status and remaining time
   * 
   * Requirements: 5.1 (15-minute lockout mechanism)
   */
  checkAccountLockout(email: string): Promise<{ 
    isLocked: boolean; 
    remainingTime?: number;
    attemptCount: number;
  }>;
  
  /**
   * Record failed login attempt
   * Increments failure counter and applies lockout if threshold reached
   * 
   * @param email - User email that failed login
   * @returns Promise that resolves when attempt is recorded
   * 
   * Requirements: 5.1 (15-minute lockout mechanism)
   */
  recordFailedAttempt(email: string): Promise<void>;
  
  /**
   * Clear failed login attempts
   * Resets failure counter on successful login
   * 
   * @param email - User email to clear attempts for
   * @returns Promise that resolves when attempts are cleared
   */
  clearFailedAttempts(email: string): Promise<void>;
  
  /**
   * Unlock user account manually
   * Administrative function to remove lockout
   * 
   * @param email - User email to unlock
   * @returns Promise that resolves when account is unlocked
   */
  unlockAccount(email: string): Promise<void>;
  
  // ========================================================================
  // User Management
  // ========================================================================
  
  /**
   * Get current authenticated user
   * 
   * @returns Current user data or null if not authenticated
   */
  getCurrentUser(): Promise<AuthUser | null>;
  
  /**
   * Update user metadata
   * 
   * @param metadata - Partial user metadata to update
   * @returns Updated user data
   * @throws AuthError if user not authenticated or update fails
   */
  updateUserMetadata(metadata: Partial<AuthUser['metadata']>): Promise<AuthUser>;
  
  /**
   * Update user profile information
   * 
   * @param updates - Partial user data to update
   * @returns Updated user data
   * @throws AuthError if validation fails or user not found
   */
  updateUserProfile(updates: Partial<Pick<AuthUser, 'name' | 'avatar'>>): Promise<AuthUser>;
  
  /**
   * Change user password
   * 
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   * @returns Promise that resolves when password is changed
   * @throws AuthError if current password is incorrect
   */
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  
  // ========================================================================
  // Email Verification
  // ========================================================================
  
  /**
   * Send email verification
   * 
   * @param email - Email address to verify
   * @returns Promise that resolves when verification email is sent
   */
  sendEmailVerification(email?: string): Promise<void>;
  
  /**
   * Confirm email verification
   * 
   * @param token - Email verification token
   * @returns Promise that resolves when email is verified
   * @throws AuthError if token is invalid or expired
   */
  confirmEmailVerification(token: string): Promise<void>;
  
  // ========================================================================
  // Session Analytics & Monitoring
  // ========================================================================
  
  /**
   * Get user session history
   * 
   * @param limit - Maximum number of sessions to return
   * @returns Array of recent session data
   */
  getSessionHistory(limit?: number): Promise<Array<{
    id: string;
    createdAt: string;
    expiresAt: string;
    userAgent?: string;
    ipAddress?: string;
    isActive: boolean;
  }>>;
  
  /**
   * Revoke specific session
   * 
   * @param sessionId - Session ID to revoke
   * @returns Promise that resolves when session is revoked
   */
  revokeSession(sessionId: string): Promise<void>;
  
  /**
   * Revoke all sessions except current
   * Security function for compromised account recovery
   * 
   * @returns Promise that resolves when all other sessions are revoked
   */
  revokeAllOtherSessions(): Promise<void>;
  
  // ========================================================================
  // Admin Functions
  // ========================================================================
  
  /**
   * Get user by ID (admin only)
   * 
   * @param userId - User ID to retrieve
   * @returns User data or null if not found
   * @throws AuthError if insufficient permissions
   */
  getUserById(userId: string): Promise<AuthUser | null>;
  
  /**
   * List users with pagination (admin only)
   * 
   * @param options - Query options for pagination and filtering
   * @returns Paginated user list
   * @throws AuthError if insufficient permissions
   */
  listUsers(options?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: AuthUser['role'];
  }): Promise<{
    users: AuthUser[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  
  /**
   * Update user role (admin only)
   * 
   * @param userId - User ID to update
   * @param role - New role to assign
   * @returns Updated user data
   * @throws AuthError if insufficient permissions
   */
  updateUserRole(userId: string, role: AuthUser['role']): Promise<AuthUser>;
}

// ============================================================================
// Authentication Service Configuration
// ============================================================================

/**
 * Configuration options for AuthService implementation
 */
export interface AuthServiceConfig {
  /** Authentication provider type */
  provider: 'supabase' | 'firebase' | 'auth0' | 'mock';
  
  /** Provider-specific configuration */
  providerConfig: {
    /** API URL or endpoint */
    url?: string;
    /** API key or client ID */
    key?: string;
    /** Secret key (for server-side operations) */
    secret?: string;
    /** Additional provider options */
    options?: Record<string, any>;
  };
  
  /** Session configuration (Requirements 5.1) */
  session: {
    /** Session duration in milliseconds (30 days default) */
    duration: number;
    /** Refresh threshold in milliseconds */
    refreshThreshold: number;
    /** Enable persistent sessions */
    persistent: boolean;
    /** Storage type for session data */
    storage: 'localStorage' | 'sessionStorage' | 'cookie';
  };
  
  /** Security configuration (Requirements 5.1) */
  security: {
    /** Maximum login attempts before lockout */
    maxLoginAttempts: number;
    /** Lockout duration in milliseconds (15 minutes default) */
    lockoutDuration: number;
    /** Password reset token expiry in milliseconds */
    resetTokenExpiry: number;
    /** Email verification token expiry in milliseconds */
    verificationTokenExpiry: number;
  };
  
  /** Social authentication providers (Requirements 2.1) */
  socialProviders: {
    google?: {
      clientId: string;
      redirectUrl: string;
      scopes: string[];
    };
    github?: {
      clientId: string;
      redirectUrl: string;
      scopes: string[];
    };
  };
  
  /** Development and debugging options */
  development?: {
    /** Enable debug logging */
    debug: boolean;
    /** Mock authentication responses */
    mockAuth: boolean;
    /** Bypass email verification */
    skipEmailVerification: boolean;
  };
}

// ============================================================================
// Service Factory & Provider Registration
// ============================================================================

/**
 * Factory function type for creating AuthService instances
 */
export type AuthServiceFactory = (config: AuthServiceConfig) => AuthService;

/**
 * Authentication service provider registry
 * Enables dependency injection and provider switching
 */
export interface AuthServiceRegistry {
  /** Register new authentication provider */
  register(name: string, factory: AuthServiceFactory): void;
  
  /** Get authentication service instance */
  get(name?: string): AuthService;
  
  /** Check if provider is registered */
  has(name: string): boolean;
  
  /** List available providers */
  list(): string[];
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Extended error interface for service layer
 */
export interface AuthServiceError extends AuthError {
  /** Service provider that generated the error */
  provider: string;
  
  /** Original provider error (if available) */
  originalError?: Error;
  
  /** Request context */
  context?: {
    method: string;
    userId?: string;
    sessionId?: string;
    userAgent?: string;
  };
}

// ============================================================================
// Type Exports
// ============================================================================

/** Re-export essential types for convenience */
export type { 
  AuthUser, 
  AuthSession, 
  AuthFormData, 
  SocialProvider,
  AuthError
} from '../types';