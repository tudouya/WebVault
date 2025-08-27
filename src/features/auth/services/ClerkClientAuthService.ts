/**
 * Clerk Client-Side Authentication Service Implementation
 * 
 * Client-side implementation of AuthService interface using Clerk's client hooks.
 * Handles authentication operations in browser/client context only.
 * 
 * Requirements:
 * - R3.1: ClerkClientAuthService SHALL implement existing AuthService interface
 * - 1.1: Email authentication with form validation and error handling
 * - 2.1: Social authentication (Google, GitHub OAuth)
 * - 5.1: Session management (30-day persistence, 15-minute lockout mechanism)
 * 
 * @version 1.0.0
 * @created 2025-08-26
 */

'use client';

import { 
  AuthSession, 
  AuthUser, 
  AuthFormData, 
  SocialProvider, 
  AuthError,
  DEFAULT_SESSION_CONFIG 
} from '../types';
import { AuthService, AuthServiceError } from './AuthService.interface';
import { SessionManager } from './SessionManager';

// ============================================================================
// Clerk Client AuthService Implementation
// ============================================================================

/**
 * ClerkClientAuthService class implementing AuthService interface for client-side use
 * 
 * Provides authentication functionality using Clerk's client-side hooks and utilities.
 * Designed specifically for browser/React component contexts.
 */
export class ClerkClientAuthService implements AuthService {
  /** Authentication provider identifier */
  private readonly provider = 'clerk';
  
  /** Session management instance for handling persistence and lockouts */
  private readonly sessionManager: SessionManager;
  
  /** Clerk configuration and client instance */
  private readonly clerkConfig: {
    publishableKey: string;
    signInUrl: string;
    signUpUrl: string;
    afterSignInUrl: string;
    afterSignUpUrl: string;
  };

  /**
   * Initialize ClerkClientAuthService with configuration
   * 
   * @param config - Clerk-specific configuration options
   */
  constructor(config?: Partial<ClerkClientAuthService['clerkConfig']>) {
    // Initialize session manager with default configuration
    this.sessionManager = new SessionManager(DEFAULT_SESSION_CONFIG);
    
    // Set up Clerk configuration with defaults
    this.clerkConfig = {
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
      signInUrl: '/admin/login',
      signUpUrl: '/admin/register',
      afterSignInUrl: '/admin/dashboard',
      afterSignUpUrl: '/admin/dashboard',
      ...config,
    };
    
    // Validate required configuration
    this.validateConfiguration();
  }

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
   * Requirements: 1.1 (Email authentication), R1.2, R3.2
   */
  async signIn(credentials: AuthFormData): Promise<AuthSession> {
    try {
      // Check for account lockout before attempting login
      const lockoutStatus = await this.checkAccountLockout(credentials.email);
      if (lockoutStatus.isLocked) {
        throw this.createAuthError(
          'ACCOUNT_LOCKED',
          `账户已被锁定，请 ${Math.ceil((lockoutStatus.remainingTime || 0) / 60000)} 分钟后再试`,
          'email'
        );
      }

      // Import Clerk client-side utilities (dynamic import to avoid SSR issues)
      const { useSignIn } = await import('@clerk/nextjs');
      
      // Validate credentials format
      if (!credentials.email || !credentials.password) {
        throw this.createAuthError('INVALID_CREDENTIALS', '邮箱和密码不能为空', 'email');
      }

      // Note: Clerk hooks can only be used in React components
      // For service layer, we need to use a different approach
      // This is a conceptual implementation - in reality, you'd call this from a component
      
      throw this.createAuthError(
        'SERVER_ERROR',
        'ClerkClientAuthService.signIn() 必须在 React 组件中通过 useSignIn hook 调用，不能在服务类中直接调用'
      );

    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AuthServiceError
      }
      
      // Map generic errors
      throw this.mapClerkError(error);
    }
  }
  
  // ========================================================================
  // Social Authentication (Requirements 2.1)
  // ========================================================================
  
  /**
   * Sign in with social provider (Google, GitHub)
   * 
   * Note: This should be called from a React component using Clerk's useSignIn hook
   * 
   * @param provider - Social authentication provider
   * @param options - Additional authentication options
   * @returns Authentication session with social user data
   * @throws AuthServiceError on OAuth errors or account conflicts
   */
  async signInWithProvider(
    provider: SocialProvider, 
    options?: { redirectTo?: string }
  ): Promise<AuthSession> {
    try {
      // Validate provider
      if (!['google', 'github'].includes(provider)) {
        throw this.createAuthError(
          'OAUTH_ERROR', 
          `不支持的社交登录提供商: ${provider}`,
          'general'
        );
      }

      // For client-side OAuth, we need to trigger the OAuth flow
      // This is typically done through Clerk's SignIn component or useSignIn hook
      throw this.createAuthError(
        'SERVER_ERROR',
        '社交登录必须在 React 组件中通过 Clerk 的 SignIn 组件或 useSignIn hook 实现'
      );

    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AuthServiceError
      }
      
      throw this.mapClerkError(error);
    }
  }
  
  /**
   * Handle social authentication callback
   * Not needed for client-side Clerk implementation as it's handled automatically
   */
  async handleSocialCallback(
    provider: SocialProvider, 
    code: string, 
    state: string
  ): Promise<AuthSession> {
    throw this.createAuthError(
      'SERVER_ERROR',
      'Clerk 客户端自动处理 OAuth 回调，无需手动处理'
    );
  }
  
  // ========================================================================
  // Session Management (Requirements 5.1)
  // ========================================================================
  
  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      // Clear local session first
      await this.sessionManager.clearSession();
      
      // For client-side sign out, we need to use Clerk's signOut from useAuth
      // This should be called from a React component
      throw this.createAuthError(
        'SERVER_ERROR',
        '登出功能必须在 React 组件中通过 Clerk 的 useAuth hook 调用'
      );

    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AuthServiceError
      }
      
      throw this.mapClerkError(error);
    }
  }
  
  /**
   * Refresh authentication session
   * Clerk handles token refresh automatically
   */
  async refreshSession(): Promise<AuthSession> {
    try {
      // Use SessionManager to handle refresh logic
      const refreshedSession = await this.sessionManager.refreshSession();
      
      if (!refreshedSession) {
        throw this.createAuthError(
          'SESSION_EXPIRED', 
          '无法刷新会话，请重新登录',
          'general'
        );
      }

      console.info('[ClerkClientAuthService] Session refreshed successfully', {
        userId: refreshedSession.user?.id,
        expiresAt: refreshedSession.expiresAt,
      });

      return refreshedSession;

    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AuthServiceError
      }
      
      throw this.mapClerkError(error);
    }
  }
  
  /**
   * Get current authentication session
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      // Check local session first
      const localSession = await this.sessionManager.getSession();
      
      if (!localSession) {
        return null;
      }

      // Validate local session
      const isValid = await this.validateSession(localSession);
      if (!isValid) {
        await this.sessionManager.clearSession();
        return null;
      }

      // Update last activity
      localSession.lastActivity = new Date().toISOString();
      await this.sessionManager.storeSession(localSession, localSession.persistent);

      return localSession;

    } catch (error) {
      console.error('[ClerkClientAuthService] Get session error:', error);
      return null;
    }
  }

  /**
   * Validate authentication session
   */
  async validateSession(session: AuthSession): Promise<boolean> {
    try {
      if (!session || !session.accessToken || !session.user) {
        return false;
      }

      // Check basic expiry
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      const refreshExpiresAt = new Date(session.refreshExpiresAt);

      // If refresh token has expired, session is completely invalid
      if (refreshExpiresAt <= now) {
        return false;
      }

      // If session is expired but refresh token is still valid, it needs refresh
      if (expiresAt <= now) {
        return false;
      }

      // Validate admin role for admin-only system
      if (session.user.role !== 'admin') {
        return false;
      }

      // Validate email is verified
      if (!session.user.emailVerified) {
        return false;
      }

      return true;

    } catch (error) {
      console.error('[ClerkClientAuthService] Session validation error:', error);
      return false;
    }
  }
  
  // ========================================================================
  // Password Recovery - Not implemented (Clerk handles this)
  // ========================================================================
  
  async resetPassword(email: string): Promise<void> {
    throw this.createAuthError('SERVER_ERROR', 'Clerk 通过其内置界面处理密码重置');
  }
  
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    throw this.createAuthError('SERVER_ERROR', 'Clerk 通过其内置界面处理密码重置');
  }
  
  async verifyResetToken(token: string): Promise<boolean> {
    return false;
  }
  
  // ========================================================================
  // Account Security & Lockout (Requirements 5.1)
  // ========================================================================
  
  async checkAccountLockout(email: string): Promise<{ 
    isLocked: boolean; 
    remainingTime?: number;
    attemptCount: number;
  }> {
    return await this.sessionManager.checkLockoutStatus(email);
  }
  
  async recordFailedAttempt(email: string): Promise<void> {
    await this.sessionManager.recordFailedAttempt(email);
  }
  
  async clearFailedAttempts(email: string): Promise<void> {
    await this.sessionManager.clearFailedAttempts(email);
  }
  
  async unlockAccount(email: string): Promise<void> {
    await this.sessionManager.unlockAccount(email);
  }
  
  // ========================================================================
  // User Management - Delegated to Clerk
  // ========================================================================
  
  async getCurrentUser(): Promise<AuthUser | null> {
    throw this.createAuthError('SERVER_ERROR', '使用 useUser hook 获取当前用户信息');
  }
  
  async updateUserMetadata(metadata: Partial<AuthUser['metadata']>): Promise<AuthUser> {
    throw this.createAuthError('SERVER_ERROR', '使用 useUser hook 更新用户元数据');
  }
  
  async updateUserProfile(updates: Partial<Pick<AuthUser, 'name' | 'avatar'>>): Promise<AuthUser> {
    throw this.createAuthError('SERVER_ERROR', '使用 useUser hook 更新用户资料');
  }
  
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    throw this.createAuthError('SERVER_ERROR', 'Clerk 通过其内置界面处理密码更改');
  }
  
  // ========================================================================
  // Email Verification - Delegated to Clerk
  // ========================================================================
  
  async sendEmailVerification(email?: string): Promise<void> {
    throw this.createAuthError('SERVER_ERROR', 'Clerk 自动处理邮箱验证');
  }
  
  async confirmEmailVerification(token: string): Promise<void> {
    throw this.createAuthError('SERVER_ERROR', 'Clerk 自动处理邮箱验证');
  }
  
  // ========================================================================
  // Session Analytics & Monitoring - Not implemented
  // ========================================================================
  
  async getSessionHistory(limit?: number): Promise<Array<{
    id: string;
    createdAt: string;
    expiresAt: string;
    userAgent?: string;
    ipAddress?: string;
    isActive: boolean;
  }>> {
    return [];
  }
  
  async revokeSession(sessionId: string): Promise<void> {
    throw this.createAuthError('SERVER_ERROR', '会话管理功能未实现');
  }
  
  async revokeAllOtherSessions(): Promise<void> {
    throw this.createAuthError('SERVER_ERROR', '会话管理功能未实现');
  }
  
  // ========================================================================
  // Admin Functions - Not implemented
  // ========================================================================
  
  async getUserById(userId: string): Promise<AuthUser | null> {
    throw this.createAuthError('SERVER_ERROR', '管理员功能未实现');
  }
  
  async listUsers(options?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: AuthUser['role'];
  }): Promise<{
    users: AuthUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    throw this.createAuthError('SERVER_ERROR', '管理员功能未实现');
  }
  
  async updateUserRole(userId: string, role: AuthUser['role']): Promise<AuthUser> {
    throw this.createAuthError('SERVER_ERROR', '管理员功能未实现');
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  /**
   * Validate Clerk configuration requirements
   */
  private validateConfiguration(): void {
    if (!this.clerkConfig.publishableKey) {
      throw new Error('Clerk publishable key is required but not provided');
    }
  }

  /**
   * Map Clerk errors to internal AuthServiceError format
   */
  private mapClerkError(error: any): AuthServiceError {
    if (!error) {
      return this.createAuthError('UNKNOWN_ERROR', '发生未知错误');
    }

    const errorCode = error.code || 'unknown';
    const errorMessage = error.message || '发生未知错误';

    return this.createAuthError(
      'SERVER_ERROR',
      errorMessage,
      'general',
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
        method: 'ClerkClientAuthService',
      },
    };
  }
}

// ============================================================================
// Service Instance Export
// ============================================================================

/**
 * Default Clerk client auth service instance
 * NOTE: This should only be used in client components or client-side contexts
 */
export const clerkClientAuthService = new ClerkClientAuthService();

/**
 * Default export for convenience
 */
export default ClerkClientAuthService;