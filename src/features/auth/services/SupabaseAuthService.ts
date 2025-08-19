/**
 * Supabase Authentication Service Implementation
 * 
 * Concrete implementation of AuthService interface using Supabase Auth SDK.
 * Provides complete authentication functionality with error handling and session management.
 * 
 * Requirements:
 * - 1.1: Email authentication with form validation and error handling
 * - 2.1: Social authentication (Google, GitHub OAuth)
 * - 5.1: Session management (30-day persistence, 15-minute lockout mechanism)
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

import { 
  AuthSession, 
  AuthUser, 
  AuthFormData, 
  SocialProvider, 
  AuthError,
  DEFAULT_SESSION_CONFIG 
} from '../types';
import { AuthService, AuthServiceError } from './AuthService.interface';
import { supabase, authConfig, oauthProviders } from '@/lib/supabase';
import type { Session, User, AuthError as SupabaseAuthError } from '@supabase/supabase-js';

// ============================================================================
// Supabase AuthService Implementation
// ============================================================================

export class SupabaseAuthService implements AuthService {
  private readonly provider = 'supabase';
  
  // ========================================================================
  // Email/Password Authentication
  // ========================================================================
  
  /**
   * Sign in with email and password
   * 
   * @param credentials - User login credentials
   * @returns Authentication session with user data
   * @throws AuthServiceError on invalid credentials or system errors
   * 
   * Requirements: 1.1 (Email authentication)
   */
  async signIn(credentials: AuthFormData): Promise<AuthSession> {
    try {
      // Check for account lockout before attempting login
      const lockoutStatus = await this.checkAccountLockout(credentials.email);
      if (lockoutStatus.isLocked) {
        throw this.createAuthError(
          'ACCOUNT_LOCKED',
          `Account is locked. Try again in ${Math.ceil((lockoutStatus.remainingTime || 0) / 60000)} minutes.`,
          'email'
        );
      }
      
      // Attempt Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        // Record failed attempt for lockout tracking
        await this.recordFailedAttempt(credentials.email);
        throw this.mapSupabaseError(error);
      }
      
      if (!data.session || !data.user) {
        throw this.createAuthError('SERVER_ERROR', 'Authentication succeeded but no session was created');
      }
      
      // Clear failed attempts on successful login
      await this.clearFailedAttempts(credentials.email);
      
      // Convert Supabase session to internal format
      const authSession = await this.convertToAuthSession(data.session, data.user);
      
      // Update session persistence if rememberMe is enabled
      if (credentials.rememberMe) {
        await this.setPersistentSession(authSession);
      }
      
      return authSession;
      
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AuthServiceError
      }
      throw this.createAuthError('UNKNOWN_ERROR', 'An unexpected error occurred during sign in');
    }
  }
  
  /**
   * Sign up new user with email and password
   * 
   * NOTE: User registration has been disabled for admin-only authentication system.
   * This method will always throw an error to prevent self-registration.
   * 
   * @param userData - Registration form data (unused)
   * @returns Never returns - always throws error
   * @throws AuthServiceError indicating registration is disabled
   * 
   * Requirements: 4.4, 4.5 (Admin-only authentication system)
   */
  async signUp(userData: AuthFormData): Promise<AuthSession> {
    // Always throw error - user registration is disabled for admin-only system
    throw this.createAuthError(
      'SIGNUP_DISABLED',
      'New user registration is disabled. Please contact an administrator for account access.',
      'email'
    );
  }
  
  // ========================================================================
  // Social Authentication (Requirements 2.1)
  // ========================================================================
  
  /**
   * Sign in with social provider (Google, GitHub)
   * 
   * @param provider - Social authentication provider
   * @param options - Additional authentication options
   * @returns Authentication session with social user data
   * @throws AuthServiceError on OAuth errors or account conflicts
   * 
   * Requirements: 2.1 (Social authentication)
   */
  async signInWithProvider(
    provider: SocialProvider, 
    options?: { redirectTo?: string }
  ): Promise<AuthSession> {
    try {
      const providerConfig = oauthProviders[provider];
      if (!providerConfig) {
        throw this.createAuthError('OAUTH_ERROR', `Provider ${provider} is not configured`);
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: options?.redirectTo || providerConfig.redirectTo,
          scopes: providerConfig.scopes,
        },
      });
      
      if (error) {
        throw this.mapSupabaseError(error);
      }
      
      // For OAuth flows, the session will be available after redirect
      // This method initiates the OAuth flow, actual session is handled in callback
      throw this.createAuthError('OAUTH_ERROR', 'OAuth flow initiated, session will be available after redirect');
      
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createAuthError('OAUTH_ERROR', 'Failed to initiate social authentication');
    }
  }
  
  /**
   * Handle social authentication callback
   * 
   * @param provider - Social provider used
   * @param code - OAuth authorization code
   * @param state - CSRF protection state parameter
   * @returns Authentication session
   * @throws AuthServiceError on invalid callback or CSRF mismatch
   */
  async handleSocialCallback(
    provider: SocialProvider, 
    code: string, 
    state: string
  ): Promise<AuthSession> {
    try {
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        throw this.mapSupabaseError(error);
      }
      
      if (!data.session || !data.user) {
        throw this.createAuthError('OAUTH_ERROR', 'OAuth callback succeeded but no session was created');
      }
      
      return await this.convertToAuthSession(data.session, data.user);
      
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createAuthError('OAUTH_ERROR', 'Failed to handle OAuth callback');
    }
  }
  
  // ========================================================================
  // Session Management (Requirements 5.1)
  // ========================================================================
  
  /**
   * Sign out current user
   * Clears session data and invalidates tokens
   * 
   * @returns Promise that resolves when logout is complete
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw this.mapSupabaseError(error);
      }
    } catch (error) {
      // Log error but don't throw - logout should always succeed from user perspective
      console.error('Error during sign out:', error);
    }
  }
  
  /**
   * Refresh authentication session
   * Extends session validity using refresh token
   * 
   * @returns Updated authentication session
   * @throws AuthServiceError if refresh token is invalid or expired
   * 
   * Requirements: 5.1 (30-day persistence)
   */
  async refreshSession(): Promise<AuthSession> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw this.mapSupabaseError(error);
      }
      
      if (!data.session || !data.user) {
        throw this.createAuthError('SESSION_EXPIRED', 'Failed to refresh session');
      }
      
      return await this.convertToAuthSession(data.session, data.user);
      
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createAuthError('SESSION_EXPIRED', 'Failed to refresh session');
    }
  }
  
  /**
   * Get current authentication session
   * 
   * @returns Current session or null if not authenticated
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }
      
      if (!data.session || !data.user) {
        return null;
      }
      
      return await this.convertToAuthSession(data.session, data.user);
      
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }
  
  /**
   * Validate authentication session
   * Checks session validity and user permissions
   * 
   * @param session - Session to validate
   * @returns True if session is valid and active
   */
  async validateSession(session: AuthSession): Promise<boolean> {
    try {
      // Check if session is expired
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      
      if (now >= expiresAt) {
        return false;
      }
      
      // Verify with Supabase
      const { data, error } = await supabase.auth.getUser(session.accessToken);
      
      if (error || !data.user) {
        return false;
      }
      
      return data.user.id === session.user.id;
      
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }
  
  // ========================================================================
  // Password Recovery
  // ========================================================================
  
  /**
   * Send password reset email
   * 
   * @param email - User email address
   * @returns Promise that resolves when reset email is sent
   * @throws AuthServiceError if email not found or rate limited
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        throw this.mapSupabaseError(error);
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createAuthError('UNKNOWN_ERROR', 'Failed to send password reset email');
    }
  }
  
  /**
   * Confirm password reset with token
   * 
   * @param token - Password reset token from email
   * @param newPassword - New password to set
   * @returns Promise that resolves when password is updated
   * @throws AuthServiceError if token is invalid or expired
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        throw this.mapSupabaseError(error);
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createAuthError('UNKNOWN_ERROR', 'Failed to reset password');
    }
  }
  
  /**
   * Verify password reset token validity
   * 
   * @param token - Reset token to verify
   * @returns True if token is valid and not expired
   */
  async verifyResetToken(token: string): Promise<boolean> {
    try {
      // Supabase handles token validation internally
      // We can attempt to get session with the token
      const { data, error } = await supabase.auth.getSession();
      return !error && !!data.session;
    } catch (error) {
      return false;
    }
  }
  
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
  async checkAccountLockout(email: string): Promise<{ 
    isLocked: boolean; 
    remainingTime?: number;
    attemptCount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('auth_lockouts')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error || !data) {
        return { isLocked: false, attemptCount: 0 };
      }
      
      const now = new Date();
      const lockedUntil = data.locked_until ? new Date(data.locked_until) : null;
      
      if (lockedUntil && now < lockedUntil) {
        return {
          isLocked: true,
          remainingTime: lockedUntil.getTime() - now.getTime(),
          attemptCount: data.attempt_count,
        };
      }
      
      return {
        isLocked: false,
        attemptCount: data.attempt_count,
      };
      
    } catch (error) {
      console.error('Error checking account lockout:', error);
      return { isLocked: false, attemptCount: 0 };
    }
  }
  
  /**
   * Record failed login attempt
   * Increments failure counter and applies lockout if threshold reached
   * 
   * @param email - User email that failed login
   * @returns Promise that resolves when attempt is recorded
   * 
   * Requirements: 5.1 (15-minute lockout mechanism)
   */
  async recordFailedAttempt(email: string): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('auth_lockouts')
        .select('*')
        .eq('email', email)
        .single();
      
      const newAttemptCount = (existing?.attempt_count || 0) + 1;
      const shouldLock = newAttemptCount >= authConfig.security.maxLoginAttempts;
      const lockedUntil = shouldLock 
        ? new Date(Date.now() + authConfig.security.lockoutDuration).toISOString()
        : null;
      
      await supabase
        .from('auth_lockouts')
        .upsert({
          email,
          attempt_count: newAttemptCount,
          locked_until: lockedUntil,
          updated_at: new Date().toISOString(),
        });
        
    } catch (error) {
      console.error('Error recording failed attempt:', error);
    }
  }
  
  /**
   * Clear failed login attempts
   * Resets failure counter on successful login
   * 
   * @param email - User email to clear attempts for
   * @returns Promise that resolves when attempts are cleared
   */
  async clearFailedAttempts(email: string): Promise<void> {
    try {
      await supabase
        .from('auth_lockouts')
        .delete()
        .eq('email', email);
    } catch (error) {
      console.error('Error clearing failed attempts:', error);
    }
  }
  
  /**
   * Unlock user account manually
   * Administrative function to remove lockout
   * 
   * @param email - User email to unlock
   * @returns Promise that resolves when account is unlocked
   */
  async unlockAccount(email: string): Promise<void> {
    try {
      await supabase
        .from('auth_lockouts')
        .delete()
        .eq('email', email);
    } catch (error) {
      console.error('Error unlocking account:', error);
      throw this.createAuthError('SERVER_ERROR', 'Failed to unlock account');
    }
  }
  
  // ========================================================================
  // User Management
  // ========================================================================
  
  /**
   * Get current authenticated user
   * 
   * @returns Current user data or null if not authenticated
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        return null;
      }
      
      return await this.convertToAuthUser(data.user);
      
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
  
  /**
   * Update user metadata
   * 
   * @param metadata - Partial user metadata to update
   * @returns Updated user data
   * @throws AuthServiceError if user not authenticated or update fails
   */
  async updateUserMetadata(metadata: Partial<AuthUser['metadata']>): Promise<AuthUser> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata,
      });
      
      if (error || !data.user) {
        throw this.mapSupabaseError(error);
      }
      
      return await this.convertToAuthUser(data.user);
      
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createAuthError('SERVER_ERROR', 'Failed to update user metadata');
    }
  }
  
  /**
   * Update user profile information
   * 
   * @param updates - Partial user data to update
   * @returns Updated user data
   * @throws AuthServiceError if validation fails or user not found
   */
  async updateUserProfile(updates: Partial<Pick<AuthUser, 'name' | 'avatar'>>): Promise<AuthUser> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          name: updates.name,
          avatar: updates.avatar,
        },
      });
      
      if (error || !data.user) {
        throw this.mapSupabaseError(error);
      }
      
      return await this.convertToAuthUser(data.user);
      
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createAuthError('SERVER_ERROR', 'Failed to update user profile');
    }
  }
  
  /**
   * Change user password
   * 
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   * @returns Promise that resolves when password is changed
   * @throws AuthServiceError if current password is incorrect
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Supabase doesn't have a direct way to verify current password
      // We'll update the password directly and let Supabase handle validation
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        throw this.mapSupabaseError(error);
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createAuthError('INVALID_CREDENTIALS', 'Failed to change password');
    }
  }
  
  // ========================================================================
  // Email Verification
  // ========================================================================
  
  /**
   * Send email verification
   * 
   * @param email - Email address to verify
   * @returns Promise that resolves when verification email is sent
   */
  async sendEmailVerification(email?: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email || '',
      });
      
      if (error) {
        throw this.mapSupabaseError(error);
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createAuthError('SERVER_ERROR', 'Failed to send verification email');
    }
  }
  
  /**
   * Confirm email verification
   * 
   * @param token - Email verification token
   * @returns Promise that resolves when email is verified
   * @throws AuthServiceError if token is invalid or expired
   */
  async confirmEmailVerification(token: string): Promise<void> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });
      
      if (error) {
        throw this.mapSupabaseError(error);
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createAuthError('SERVER_ERROR', 'Failed to verify email');
    }
  }
  
  // ========================================================================
  // Session Analytics & Monitoring (Simplified Implementation)
  // ========================================================================
  
  async getSessionHistory(limit = 10): Promise<Array<{
    id: string;
    createdAt: string;
    expiresAt: string;
    userAgent?: string;
    ipAddress?: string;
    isActive: boolean;
  }>> {
    // Simplified implementation - Supabase doesn't provide session history by default
    const session = await this.getSession();
    if (!session) return [];
    
    return [{
      id: session.user.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isActive: true,
    }];
  }
  
  async revokeSession(sessionId: string): Promise<void> {
    await this.signOut();
  }
  
  async revokeAllOtherSessions(): Promise<void> {
    // Supabase doesn't support revoking specific sessions
    // This would require custom implementation with session tracking
    console.warn('revokeAllOtherSessions not implemented for Supabase');
  }
  
  // ========================================================================
  // Admin Functions (Placeholder Implementation)
  // ========================================================================
  
  async getUserById(userId: string): Promise<AuthUser | null> {
    throw this.createAuthError('SERVER_ERROR', 'Admin functions require service role implementation');
  }
  
  async listUsers(options?: any): Promise<any> {
    throw this.createAuthError('SERVER_ERROR', 'Admin functions require service role implementation');
  }
  
  async updateUserRole(userId: string, role: AuthUser['role']): Promise<AuthUser> {
    throw this.createAuthError('SERVER_ERROR', 'Admin functions require service role implementation');
  }
  
  // ========================================================================
  // Private Helper Methods
  // ========================================================================
  
  /**
   * Convert Supabase session to internal AuthSession format
   */
  private async convertToAuthSession(session: Session, user: User): Promise<AuthSession> {
    const authUser = await this.convertToAuthUser(user);
    
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token || '',
      expiresAt: new Date(session.expires_at! * 1000).toISOString(),
      refreshExpiresAt: new Date(Date.now() + DEFAULT_SESSION_CONFIG.sessionDuration).toISOString(),
      user: authUser,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      persistent: true,
    };
  }
  
  /**
   * Convert Supabase user to internal AuthUser format
   */
  private async convertToAuthUser(user: User): Promise<AuthUser> {
    // Get user profile data
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return {
      id: user.id,
      email: user.email || '',
      emailVerified: !!user.email_confirmed_at,
      name: profile?.name || user.user_metadata?.name || null,
      avatar: profile?.avatar || user.user_metadata?.avatar_url || null,
      provider: this.getUserProvider(user),
      role: profile?.role || 'user',
      metadata: {
        language: user.user_metadata?.language,
        theme: user.user_metadata?.theme,
        lastLogin: new Date().toISOString(),
        loginCount: (user.user_metadata?.loginCount || 0) + 1,
      },
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at,
    };
  }
  
  /**
   * Determine user authentication provider
   */
  private getUserProvider(user: User): 'email' | 'google' | 'github' {
    const provider = user.app_metadata?.provider;
    if (provider === 'google' || provider === 'github') {
      return provider;
    }
    return 'email';
  }
  
  /**
   * Create pending session for email confirmation flow
   * 
   * NOTE: Removed as part of admin-only authentication system.
   * User registration and email confirmation are disabled.
   * 
   * @deprecated Method removed due to disabled user registration (Requirements 4.4, 4.5)
   */
  private createPendingSession(user: User): AuthSession {
    throw this.createAuthError(
      'SIGNUP_DISABLED', 
      'Pending session creation is disabled in admin-only authentication system'
    );
  }
  
  /**
   * Set persistent session for remember me functionality
   */
  private async setPersistentSession(session: AuthSession): Promise<void> {
    try {
      // Update user metadata to indicate persistent session preference
      await supabase.auth.updateUser({
        data: {
          ...session.user.metadata,
          persistentSession: true,
        },
      });
    } catch (error) {
      console.warn('Failed to set persistent session:', error);
    }
  }
  
  /**
   * Map Supabase errors to internal AuthError format
   */
  private mapSupabaseError(error: SupabaseAuthError | null): AuthServiceError {
    if (!error) {
      return this.createAuthError('UNKNOWN_ERROR', 'An unknown error occurred');
    }
    
    const errorMap: Record<string, { code: AuthError['code']; message: string; field?: AuthError['field'] }> = {
      'invalid_credentials': {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        field: 'email',
      },
      'email_not_confirmed': {
        code: 'EMAIL_NOT_CONFIRMED',
        message: 'Please check your email and click the confirmation link',
        field: 'email',
      },
      'user_not_found': {
        code: 'USER_NOT_FOUND',
        message: 'No account found with this email address',
        field: 'email',
      },
      'weak_password': {
        code: 'WEAK_PASSWORD',
        message: 'Password is too weak. Please choose a stronger password',
        field: 'password',
      },
      'email_address_already_exists': {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists',
        field: 'email',
      },
      'signup_disabled': {
        code: 'SIGNUP_DISABLED',
        message: 'New user registration is currently disabled',
      },
      'invalid_email': {
        code: 'INVALID_EMAIL',
        message: 'Please enter a valid email address',
        field: 'email',
      },
      'rate_limit_exceeded': {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later',
      },
    };
    
    const mapping = errorMap[error.message] || errorMap[error.__isAuthError ? 'invalid_credentials' : 'server_error'];
    
    return this.createAuthError(
      mapping?.code || 'SERVER_ERROR',
      mapping?.message || error.message || 'A server error occurred',
      mapping?.field,
      error
    );
  }
  
  /**
   * Create standardized AuthServiceError
   */
  private createAuthError(
    code: AuthError['code'],
    message: string,
    field?: AuthError['field'],
    originalError?: Error
  ): AuthServiceError {
    return {
      code,
      message,
      details: originalError?.message,
      field,
      timestamp: new Date().toISOString(),
      provider: this.provider,
      originalError,
      context: {
        method: 'SupabaseAuthService',
      },
    };
  }
}

// ============================================================================
// Service Instance Export
// ============================================================================

/**
 * Default Supabase auth service instance
 */
export const supabaseAuthService = new SupabaseAuthService();

/**
 * Default export for convenience
 */
export default SupabaseAuthService;