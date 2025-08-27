/**
 * ClerkAuthService Unit Tests
 * 
 * Comprehensive test suite for ClerkAuthService implementation covering:
 * - Authentication methods (email/password, social OAuth)
 * - Session management (creation, refresh, validation, expiration)
 * - Error handling and mapping (Clerk errors to AuthError types)
 * - Account security (lockout mechanism, failed attempts tracking)
 * - User management (profile updates, metadata management)
 * - Mock strategies for Clerk SDK integration
 * 
 * Requirements Coverage:
 * - R3.1: ClerkAuthService SHALL implement existing AuthService interface
 * - R3.2: IF 调用认证方法 THEN ClerkAuthService SHALL 返回与原接口兼容的数据结构
 * - R3.3: System SHALL map Clerk errors to unified AuthError types
 * - 1.1: Email authentication with form validation and error handling
 * - 2.1: Social authentication (Google, GitHub OAuth)
 * - 5.1: Session management (30-day persistence, 15-minute lockout mechanism)
 * 
 * @version 1.0.0
 * @created 2025-08-25
 */

import { ClerkAuthService } from '../ClerkAuthService';
import { AuthFormData, AuthSession, AuthUser, SocialProvider, AuthError, DEFAULT_SESSION_CONFIG } from '../../types';
import { AuthService, AuthServiceError } from '../AuthService.interface';

// ============================================================================
// Mock Setup - Clerk SDK
// ============================================================================

// Mock Clerk SDK modules
const mockClerkClient = {
  signInTokens: {
    createSignInToken: jest.fn(),
  },
  users: {
    getUser: jest.fn(),
  },
  sessions: {
    getSession: jest.fn(),
  },
};

const mockAuth = jest.fn();
const mockSignOut = jest.fn();
const mockRedirect = jest.fn();

// Mock dynamic imports for Clerk SDK
jest.mock('@clerk/clerk-sdk-node', () => ({
  clerkClient: mockClerkClient,
}));

jest.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
  signOut: mockSignOut,
}));

jest.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

jest.mock('@/lib/clerk', () => ({
  clerk: mockClerkClient,
  clerkOptions: {},
  authConfig: {},
}));

// Mock SessionManager - define before using in mock implementation
jest.mock('../SessionManager', () => {
  const mockSessionManager = {
    storeSession: jest.fn(),
    getSession: jest.fn(),
    clearSession: jest.fn(),
    refreshSession: jest.fn(),
    checkLockoutStatus: jest.fn(),
    recordFailedAttempt: jest.fn(),
    clearFailedAttempts: jest.fn(),
    unlockAccount: jest.fn(),
  };
  
  return {
    SessionManager: jest.fn().mockImplementation(() => mockSessionManager),
    mockSessionManager, // Export for test access
  };
});

// Environment variables are already set at the top of the file

// ============================================================================
// Test Data Factory
// ============================================================================

/**
 * Factory for creating test AuthUser objects
 */
const createTestAuthUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user_test123',
  email: 'test@example.com',
  emailVerified: true,
  name: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  provider: 'email',
  role: 'admin',
  metadata: {
    language: 'zh-CN',
    theme: 'system',
    lastLogin: new Date().toISOString(),
    loginCount: 1,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Factory for creating test AuthSession objects
 */
const createTestAuthSession = (overrides: Partial<AuthSession> = {}): AuthSession => {
  const now = new Date();
  const user = createTestAuthUser();
  
  return {
    accessToken: 'clerk_session_test_token',
    refreshToken: 'clerk_refresh_test_token',
    expiresAt: new Date(now.getTime() + DEFAULT_SESSION_CONFIG.sessionDuration).toISOString(),
    refreshExpiresAt: new Date(now.getTime() + DEFAULT_SESSION_CONFIG.sessionDuration * 2).toISOString(),
    user,
    createdAt: now.toISOString(),
    lastActivity: now.toISOString(),
    persistent: false,
    ...overrides,
  };
};

/**
 * Factory for creating test Clerk user objects
 */
const createTestClerkUser = (overrides: any = {}) => ({
  id: 'user_clerk123',
  emailAddresses: [
    {
      id: 'email_123',
      emailAddress: 'test@example.com',
      verification: { status: 'verified' },
    },
  ],
  primaryEmailAddressId: 'email_123',
  firstName: 'Test',
  lastName: 'User',
  imageUrl: 'https://example.com/avatar.jpg',
  externalAccounts: [],
  publicMetadata: { role: 'admin' },
  privateMetadata: { isAdmin: true },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

/**
 * Factory for creating test Clerk session objects
 */
const createTestClerkSession = (overrides: any = {}) => ({
  id: 'sess_clerk123',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  expireAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  ...overrides,
});

// ============================================================================
// Test Suite
// ============================================================================

// Get mock access
const { mockSessionManager } = require('../SessionManager');

describe('ClerkAuthService', () => {
  let clerkAuthService: ClerkAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all mock implementations
    Object.values(mockSessionManager).forEach((mock: any) => {
      if (jest.isMockFunction(mock)) {
        mock.mockReset();
      }
    });
    
    // Setup default mock returns
    mockAuth.mockResolvedValue({ userId: null, sessionId: null });
    mockSessionManager.getSession.mockResolvedValue(null);
    mockSessionManager.checkLockoutStatus.mockResolvedValue({
      isLocked: false,
      attemptCount: 0,
    });
    
    // Create fresh service instance
    clerkAuthService = new ClerkAuthService();
  });

  // ========================================================================
  // Constructor and Configuration Tests
  // ========================================================================

  describe('Constructor and Configuration', () => {
    test('should initialize with default configuration', () => {
      const service = new ClerkAuthService();
      expect(service).toBeInstanceOf(ClerkAuthService);
      expect(service).toEqual(expect.any(Object));
    });

    test('should accept custom configuration', () => {
      const customConfig = {
        signInUrl: '/custom-login',
        afterSignInUrl: '/custom-dashboard',
      };
      
      const service = new ClerkAuthService(customConfig);
      expect(service).toBeInstanceOf(ClerkAuthService);
    });

    test('should validate required Clerk configuration', () => {
      // Temporarily remove required env var
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      
      expect(() => {
        new ClerkAuthService();
      }).toThrow('Clerk publishable key is required but not provided');
      
      // Restore env var
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_example-publishable-key';
    });

    test('should implement AuthService interface', () => {
      const service = new ClerkAuthService();
      
      // Check that all required interface methods exist
      expect(typeof service.signIn).toBe('function');
      expect(typeof service.signInWithProvider).toBe('function');
      expect(typeof service.handleSocialCallback).toBe('function');
      expect(typeof service.signOut).toBe('function');
      expect(typeof service.refreshSession).toBe('function');
      expect(typeof service.getSession).toBe('function');
      expect(typeof service.validateSession).toBe('function');
      expect(typeof service.checkAccountLockout).toBe('function');
      expect(typeof service.recordFailedAttempt).toBe('function');
      expect(typeof service.clearFailedAttempts).toBe('function');
    });
  });

  // ========================================================================
  // Email/Password Authentication Tests
  // ========================================================================

  describe('Email/Password Authentication', () => {
    describe('signIn()', () => {
      const validCredentials: AuthFormData = {
        email: 'test@example.com',
        password: 'SecurePassword123',
        rememberMe: false,
      };

      test('should successfully sign in with valid credentials', async () => {
        // Setup mocks for successful login
        mockClerkClient.signInTokens.createSignInToken.mockResolvedValue({
          token: 'test_token',
        });
        
        const result = await clerkAuthService.signIn(validCredentials);
        
        // Verify returned session structure
        expect(result).toMatchObject({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          expiresAt: expect.any(String),
          refreshExpiresAt: expect.any(String),
          user: expect.objectContaining({
            id: expect.any(String),
            email: validCredentials.email,
            emailVerified: expect.any(Boolean),
            provider: 'email',
            role: 'admin',
          }),
          createdAt: expect.any(String),
          lastActivity: expect.any(String),
          persistent: false,
        });
        
        // Verify session manager interactions
        expect(mockSessionManager.checkLockoutStatus).toHaveBeenCalledWith(validCredentials.email);
        expect(mockSessionManager.clearFailedAttempts).toHaveBeenCalledWith(validCredentials.email);
      });

      test('should handle remember me option correctly', async () => {
        mockClerkClient.signInTokens.createSignInToken.mockResolvedValue({
          token: 'test_token',
        });
        
        const credentialsWithRememberMe = {
          ...validCredentials,
          rememberMe: true,
        };
        
        const result = await clerkAuthService.signIn(credentialsWithRememberMe);
        
        expect(result.persistent).toBe(false); // Initially false, but persistent storage called
        expect(mockSessionManager.storeSession).toHaveBeenCalledWith(
          expect.any(Object),
          true,
          true
        );
      });

      test('should throw error for missing email or password', async () => {
        const invalidCredentials = {
          email: '',
          password: 'SecurePassword123',
        };
        
        await expect(clerkAuthService.signIn(invalidCredentials)).rejects.toEqual(
          expect.objectContaining({
            code: 'INVALID_CREDENTIALS',
            message: 'Email and password are required',
            field: 'email',
          })
        );
      });

      test('should respect account lockout', async () => {
        // Mock account lockout status
        mockSessionManager.checkLockoutStatus.mockResolvedValue({
          isLocked: true,
          remainingTime: 10 * 60 * 1000, // 10 minutes
          attemptCount: 5,
        });
        
        await expect(clerkAuthService.signIn(validCredentials)).rejects.toEqual(
          expect.objectContaining({
            code: 'ACCOUNT_LOCKED',
            message: expect.stringContaining('Account is locked'),
            field: 'email',
          })
        );
        
        // Should not attempt actual login
        expect(mockClerkClient.signInTokens.createSignInToken).not.toHaveBeenCalled();
      });

      test('should record failed attempt on invalid credentials', async () => {
        mockClerkClient.signInTokens.createSignInToken.mockResolvedValue(null);
        
        await expect(clerkAuthService.signIn(validCredentials)).rejects.toEqual(
          expect.objectContaining({
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            field: 'email',
          })
        );
        
        expect(mockSessionManager.recordFailedAttempt).toHaveBeenCalledWith(validCredentials.email);
      });

      test('should handle Clerk SDK errors', async () => {
        const clerkError = new Error('Clerk API Error');
        (clerkError as any).code = 'form_password_incorrect';
        
        mockClerkClient.signInTokens.createSignInToken.mockRejectedValue(clerkError);
        
        await expect(clerkAuthService.signIn(validCredentials)).rejects.toEqual(
          expect.objectContaining({
            code: 'INVALID_CREDENTIALS',
            message: '密码错误，请重新输入',
            field: 'password',
            provider: 'clerk',
            originalError: clerkError,
          })
        );
        
        expect(mockSessionManager.recordFailedAttempt).toHaveBeenCalledWith(validCredentials.email);
      });
    });
  });

  // ========================================================================
  // Social Authentication Tests
  // ========================================================================

  describe('Social Authentication', () => {
    describe('signInWithProvider()', () => {
      test('should handle Google OAuth flow', async () => {
        // Mock server-side context (no window)
        const originalWindow = global.window;
        delete (global as any).window;
        
        try {
          await expect(
            clerkAuthService.signInWithProvider('google')
          ).rejects.toEqual(
            expect.objectContaining({
              code: 'OAUTH_ERROR',
              message: expect.stringContaining('OAuth redirect required for google'),
              requiresRedirect: true,
              redirectUrl: expect.any(String),
            })
          );
        } finally {
          global.window = originalWindow;
        }
      });

      test('should handle GitHub OAuth flow', async () => {
        const originalWindow = global.window;
        delete (global as any).window;
        
        try {
          await expect(
            clerkAuthService.signInWithProvider('github')
          ).rejects.toEqual(
            expect.objectContaining({
              code: 'OAUTH_ERROR',
              message: expect.stringContaining('OAuth redirect required for github'),
              requiresRedirect: true,
              redirectUrl: expect.any(String),
            })
          );
        } finally {
          global.window = originalWindow;
        }
      });

      test('should reject unsupported social providers', async () => {
        await expect(
          clerkAuthService.signInWithProvider('facebook' as SocialProvider)
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'OAUTH_ERROR',
            message: 'Unsupported social provider: facebook',
            field: 'general',
          })
        );
      });

      test('should return existing session for authenticated users', async () => {
        // Mock already authenticated user
        mockAuth.mockResolvedValue({ 
          userId: 'user_123', 
          sessionId: 'sess_123' 
        });
        
        const mockClerkUser = createTestClerkUser();
        mockClerkClient.users.getUser.mockResolvedValue(mockClerkUser);
        
        const result = await clerkAuthService.signInWithProvider('google');
        
        expect(result).toMatchObject({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          user: expect.objectContaining({
            id: mockClerkUser.id,
            email: mockClerkUser.emailAddresses[0].emailAddress,
            provider: 'google',
          }),
        });
      });

      test('should handle client-side redirect', async () => {
        const mockWindow = {
          location: { href: '' },
        };
        global.window = mockWindow as any;
        
        const result = await clerkAuthService.signInWithProvider('google');
        
        // Should return pending session for client-side flow
        expect(result.user.id).toContain('pending_');
        expect(result.user.provider).toBe('google');
        expect(result.persistent).toBe(false);
        expect(mockWindow.location.href).toContain('oauth');
      });
    });

    describe('handleSocialCallback()', () => {
      test('should handle valid OAuth callback', async () => {
        const mockClerkUser = createTestClerkUser({
          externalAccounts: [
            { provider: 'oauth_google', emailAddress: 'test@example.com' },
          ],
        });
        
        mockAuth.mockResolvedValue({ 
          userId: 'user_123', 
          sessionId: 'sess_123' 
        });
        mockClerkClient.users.getUser.mockResolvedValue(mockClerkUser);
        
        const validState = Buffer.from(JSON.stringify({
          redirectUrl: '/dashboard',
          timestamp: Date.now(),
          nonce: 'test-nonce',
        })).toString('base64url');
        
        const result = await clerkAuthService.handleSocialCallback(
          'google',
          'auth_code_123',
          validState
        );
        
        expect(result).toMatchObject({
          accessToken: expect.any(String),
          user: expect.objectContaining({
            id: mockClerkUser.id,
            provider: 'google',
          }),
        });
        
        expect(mockSessionManager.clearFailedAttempts).toHaveBeenCalledWith(
          mockClerkUser.emailAddresses[0].emailAddress
        );
        expect(mockSessionManager.storeSession).toHaveBeenCalled();
      });

      test('should reject invalid provider', async () => {
        await expect(
          clerkAuthService.handleSocialCallback(
            'facebook' as SocialProvider,
            'code123',
            'state123'
          )
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'OAUTH_ERROR',
            message: 'Invalid social provider in callback: facebook',
          })
        );
      });

      test('should reject missing authorization code', async () => {
        const validState = Buffer.from(JSON.stringify({
          redirectUrl: '/dashboard',
          timestamp: Date.now(),
          nonce: 'test-nonce',
        })).toString('base64url');
        
        await expect(
          clerkAuthService.handleSocialCallback('google', '', validState)
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'OAUTH_ERROR',
            message: 'Missing authorization code in OAuth callback',
          })
        );
      });

      test('should reject invalid state parameter (CSRF protection)', async () => {
        await expect(
          clerkAuthService.handleSocialCallback('google', 'code123', 'invalid-state')
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'OAUTH_ERROR',
            message: expect.stringContaining('Invalid state parameter'),
          })
        );
      });

      test('should reject expired state parameter', async () => {
        const expiredState = Buffer.from(JSON.stringify({
          redirectUrl: '/dashboard',
          timestamp: Date.now() - 20 * 60 * 1000, // 20 minutes ago
          nonce: 'test-nonce',
        })).toString('base64url');
        
        await expect(
          clerkAuthService.handleSocialCallback('google', 'code123', expiredState)
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'OAUTH_ERROR',
            message: expect.stringContaining('Invalid state parameter'),
          })
        );
      });

      test('should handle missing user session after callback', async () => {
        mockAuth.mockResolvedValue({ userId: null, sessionId: null });
        
        const validState = Buffer.from(JSON.stringify({
          redirectUrl: '/dashboard',
          timestamp: Date.now(),
          nonce: 'test-nonce',
        })).toString('base64url');
        
        await expect(
          clerkAuthService.handleSocialCallback('google', 'code123', validState)
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'OAUTH_ERROR',
            message: 'google authentication failed - no session created',
          })
        );
      });
    });
  });

  // ========================================================================
  // Session Management Tests
  // ========================================================================

  describe('Session Management', () => {
    describe('getSession()', () => {
      test('should return null when no session exists', async () => {
        mockSessionManager.getSession.mockResolvedValue(null);
        mockAuth.mockResolvedValue({ userId: null, sessionId: null });
        
        const result = await clerkAuthService.getSession();
        expect(result).toBeNull();
      });

      test('should return valid local session', async () => {
        const testSession = createTestAuthSession();
        mockSessionManager.getSession.mockResolvedValue(testSession);
        
        // Mock validateSession method behavior
        jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(true);
        
        const result = await clerkAuthService.getSession();
        
        expect(result).toEqual(expect.objectContaining({
          accessToken: testSession.accessToken,
          user: expect.objectContaining({
            id: testSession.user.id,
            email: testSession.user.email,
          }),
        }));
        
        expect(mockSessionManager.storeSession).toHaveBeenCalled();
      });

      test('should fetch Clerk server session when no local session', async () => {
        mockSessionManager.getSession.mockResolvedValue(null);
        
        const mockClerkUser = createTestClerkUser();
        const mockClerkSession = createTestClerkSession();
        
        mockAuth.mockResolvedValue({ 
          userId: 'user_123', 
          sessionId: 'sess_123' 
        });
        mockClerkClient.users.getUser.mockResolvedValue(mockClerkUser);
        mockClerkClient.sessions.getSession.mockResolvedValue(mockClerkSession);
        
        const result = await clerkAuthService.getSession();
        
        expect(result).toMatchObject({
          accessToken: mockClerkSession.id,
          user: expect.objectContaining({
            id: mockClerkUser.id,
            email: mockClerkUser.emailAddresses[0].emailAddress,
          }),
        });
        
        expect(mockSessionManager.storeSession).toHaveBeenCalled();
      });

      test('should clear invalid local session and check Clerk', async () => {
        const invalidSession = createTestAuthSession();
        mockSessionManager.getSession.mockResolvedValue(invalidSession);
        
        // Mock validateSession to return false (invalid)
        jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(false);
        
        mockAuth.mockResolvedValue({ userId: null, sessionId: null });
        
        const result = await clerkAuthService.getSession();
        
        expect(mockSessionManager.clearSession).toHaveBeenCalled();
        expect(result).toBeNull();
      });

      test('should handle errors gracefully and return null', async () => {
        mockSessionManager.getSession.mockRejectedValue(new Error('Storage error'));
        
        const result = await clerkAuthService.getSession();
        expect(result).toBeNull();
      });
    });

    describe('validateSession()', () => {
      test('should validate session structure', async () => {
        const validSession = createTestAuthSession();
        
        const result = await clerkAuthService.validateSession(validSession);
        expect(result).toBe(true);
      });

      test('should reject session missing required fields', async () => {
        const invalidSession = {
          accessToken: '',
          user: null,
        } as any;
        
        const result = await clerkAuthService.validateSession(invalidSession);
        expect(result).toBe(false);
      });

      test('should reject expired sessions', async () => {
        const expiredSession = createTestAuthSession({
          expiresAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
          refreshExpiresAt: new Date(Date.now() + 1000).toISOString(), // Still valid refresh
        });
        
        const result = await clerkAuthService.validateSession(expiredSession);
        expect(result).toBe(false);
      });

      test('should reject sessions with expired refresh token', async () => {
        const expiredRefreshSession = createTestAuthSession({
          refreshExpiresAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
        });
        
        const result = await clerkAuthService.validateSession(expiredRefreshSession);
        expect(result).toBe(false);
      });

      test('should validate admin role requirement', async () => {
        const nonAdminSession = createTestAuthSession({
          user: createTestAuthUser({ role: 'user' }),
        });
        
        const result = await clerkAuthService.validateSession(nonAdminSession);
        expect(result).toBe(false);
      });

      test('should reject unverified email', async () => {
        const unverifiedSession = createTestAuthSession({
          user: createTestAuthUser({ emailVerified: false }),
        });
        
        const result = await clerkAuthService.validateSession(unverifiedSession);
        expect(result).toBe(false);
      });

      test('should reject sessions with excessive inactivity', async () => {
        const inactiveSession = createTestAuthSession({
          lastActivity: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        });
        
        const result = await clerkAuthService.validateSession(inactiveSession);
        expect(result).toBe(false);
      });

      test('should validate against Clerk server session when available', async () => {
        const testSession = createTestAuthSession();
        
        mockAuth.mockResolvedValue({ 
          userId: testSession.user.id, 
          sessionId: 'sess_123' 
        });
        
        const result = await clerkAuthService.validateSession(testSession);
        expect(result).toBe(true);
      });

      test('should detect user ID mismatch with Clerk', async () => {
        const testSession = createTestAuthSession();
        
        mockAuth.mockResolvedValue({ 
          userId: 'different_user_id', 
          sessionId: 'sess_123' 
        });
        
        const result = await clerkAuthService.validateSession(testSession);
        expect(result).toBe(false);
      });
    });

    describe('refreshSession()', () => {
      test('should refresh valid session', async () => {
        const testSession = createTestAuthSession();
        mockSessionManager.refreshSession.mockResolvedValue(testSession);
        
        // Mock validateSession to return true
        jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(true);
        
        const result = await clerkAuthService.refreshSession();
        
        expect(result).toEqual(expect.objectContaining({
          accessToken: testSession.accessToken,
          user: expect.objectContaining({
            metadata: expect.objectContaining({
              lastLogin: expect.any(String),
              loginCount: expect.any(Number),
            }),
          }),
        }));
      });

      test('should throw error when refresh fails', async () => {
        mockSessionManager.refreshSession.mockResolvedValue(null);
        
        await expect(clerkAuthService.refreshSession()).rejects.toEqual(
          expect.objectContaining({
            code: 'SESSION_EXPIRED',
            message: 'Unable to refresh session. Please sign in again.',
          })
        );
      });

      test('should clear invalid refreshed session', async () => {
        const testSession = createTestAuthSession();
        mockSessionManager.refreshSession.mockResolvedValue(testSession);
        
        // Mock validateSession to return false (invalid)
        jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(false);
        
        await expect(clerkAuthService.refreshSession()).rejects.toEqual(
          expect.objectContaining({
            code: 'SESSION_EXPIRED',
            message: 'Session validation failed. Please sign in again.',
          })
        );
        
        expect(mockSessionManager.clearSession).toHaveBeenCalled();
      });

      test('should handle refresh errors', async () => {
        mockSessionManager.refreshSession.mockRejectedValue(
          new Error('Refresh token expired')
        );
        
        await expect(clerkAuthService.refreshSession()).rejects.toEqual(
          expect.objectContaining({
            code: 'SESSION_EXPIRED',
            message: 'Session refresh failed. Please sign in again.',
          })
        );
      });
    });

    describe('signOut()', () => {
      test('should successfully sign out user', async () => {
        const testSession = createTestAuthSession();
        mockSessionManager.getSession.mockResolvedValue(testSession);
        
        await clerkAuthService.signOut();
        
        expect(mockSessionManager.clearSession).toHaveBeenCalled();
        expect(mockSessionManager.clearFailedAttempts).toHaveBeenCalledWith(
          testSession.user.email
        );
      });

      test('should handle Clerk signOut errors gracefully', async () => {
        mockSignOut.mockRejectedValue(new Error('Clerk error'));
        mockSessionManager.getSession.mockResolvedValue(null);
        
        await clerkAuthService.signOut();
        
        expect(mockSessionManager.clearSession).toHaveBeenCalled();
      });

      test('should clear session even on complete failure', async () => {
        mockSessionManager.getSession.mockRejectedValue(new Error('Storage error'));
        mockSignOut.mockRejectedValue(new Error('Clerk error'));
        
        await expect(clerkAuthService.signOut()).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: expect.stringContaining('Error occurred during sign out'),
          })
        );
        
        expect(mockSessionManager.clearSession).toHaveBeenCalledTimes(2); // Once in try, once in error handler
      });
    });
  });

  // ========================================================================
  // Account Security and Lockout Tests
  // ========================================================================

  describe('Account Security and Lockout', () => {
    describe('checkAccountLockout()', () => {
      test('should return unlocked status for valid email', async () => {
        mockSessionManager.checkLockoutStatus.mockResolvedValue({
          isLocked: false,
          attemptCount: 2,
        });
        
        const result = await clerkAuthService.checkAccountLockout('test@example.com');
        
        expect(result).toEqual({
          isLocked: false,
          attemptCount: 2,
        });
      });

      test('should return locked status with remaining time', async () => {
        const remainingTime = 10 * 60 * 1000; // 10 minutes
        mockSessionManager.checkLockoutStatus.mockResolvedValue({
          isLocked: true,
          remainingTime,
          attemptCount: 5,
        });
        
        const result = await clerkAuthService.checkAccountLockout('test@example.com');
        
        expect(result).toEqual({
          isLocked: true,
          remainingTime,
          attemptCount: 5,
        });
      });
    });

    describe('recordFailedAttempt()', () => {
      test('should record failed login attempt', async () => {
        await clerkAuthService.recordFailedAttempt('test@example.com');
        
        expect(mockSessionManager.recordFailedAttempt).toHaveBeenCalledWith(
          'test@example.com'
        );
      });
    });

    describe('clearFailedAttempts()', () => {
      test('should clear failed attempts on successful login', async () => {
        await clerkAuthService.clearFailedAttempts('test@example.com');
        
        expect(mockSessionManager.clearFailedAttempts).toHaveBeenCalledWith(
          'test@example.com'
        );
      });
    });

    describe('unlockAccount()', () => {
      test('should unlock locked account', async () => {
        await clerkAuthService.unlockAccount('test@example.com');
        
        expect(mockSessionManager.unlockAccount).toHaveBeenCalledWith(
          'test@example.com'
        );
      });
    });
  });

  // ========================================================================
  // Error Mapping Tests
  // ========================================================================

  describe('Error Mapping', () => {
    test('should map Clerk authentication errors correctly', async () => {
      const testCases = [
        {
          clerkError: { code: 'form_identifier_not_found', message: 'User not found' },
          expectedCode: 'USER_NOT_FOUND',
          expectedField: 'email',
        },
        {
          clerkError: { code: 'form_password_incorrect', message: 'Wrong password' },
          expectedCode: 'INVALID_CREDENTIALS',
          expectedField: 'password',
        },
        {
          clerkError: { code: 'form_password_pwned', message: 'Password compromised' },
          expectedCode: 'WEAK_PASSWORD',
          expectedField: 'password',
        },
        {
          clerkError: { code: 'too_many_requests', message: 'Rate limited' },
          expectedCode: 'RATE_LIMIT_EXCEEDED',
          expectedField: undefined,
        },
        {
          clerkError: { code: 'oauth_error', message: 'OAuth failed' },
          expectedCode: 'OAUTH_ERROR',
          expectedField: 'general',
        },
        {
          clerkError: { code: 'session_expired', message: 'Session expired' },
          expectedCode: 'SESSION_EXPIRED',
          expectedField: undefined,
        },
      ];

      for (const testCase of testCases) {
        mockClerkClient.signInTokens.createSignInToken.mockRejectedValue(testCase.clerkError);
        
        await expect(
          clerkAuthService.signIn({ email: 'test@example.com', password: 'password' })
        ).rejects.toEqual(
          expect.objectContaining({
            code: testCase.expectedCode,
            field: testCase.expectedField,
            provider: 'clerk',
            originalError: testCase.clerkError,
            message: expect.any(String),
            timestamp: expect.any(String),
          })
        );
      }
    });

    test('should handle unknown Clerk errors', async () => {
      const unknownError = { code: 'unknown_clerk_error', message: 'Unknown error' };
      mockClerkClient.signInTokens.createSignInToken.mockRejectedValue(unknownError);
      
      await expect(
        clerkAuthService.signIn({ email: 'test@example.com', password: 'password' })
      ).rejects.toEqual(
        expect.objectContaining({
          code: 'SERVER_ERROR',
          provider: 'clerk',
          originalError: unknownError,
        })
      );
    });

    test('should handle errors with nested error structure', async () => {
      const nestedError = {
        errors: [
          { code: 'form_password_incorrect', message: 'Password incorrect' }
        ]
      };
      mockClerkClient.signInTokens.createSignInToken.mockRejectedValue(nestedError);
      
      await expect(
        clerkAuthService.signIn({ email: 'test@example.com', password: 'password' })
      ).rejects.toEqual(
        expect.objectContaining({
          code: 'INVALID_CREDENTIALS',
          field: 'password',
          provider: 'clerk',
        })
      );
    });
  });

  // ========================================================================
  // User Management Tests
  // ========================================================================

  describe('User Management', () => {
    describe('getCurrentUser()', () => {
      test('should return null (not implemented)', async () => {
        const result = await clerkAuthService.getCurrentUser();
        expect(result).toBeNull();
      });
    });

    describe('updateUserMetadata()', () => {
      test('should throw not implemented error', async () => {
        await expect(
          clerkAuthService.updateUserMetadata({ theme: 'dark' })
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: 'Method not implemented yet',
          })
        );
      });
    });

    describe('updateUserProfile()', () => {
      test('should throw not implemented error', async () => {
        await expect(
          clerkAuthService.updateUserProfile({ name: 'New Name' })
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: 'Method not implemented yet',
          })
        );
      });
    });

    describe('changePassword()', () => {
      test('should throw not implemented error', async () => {
        await expect(
          clerkAuthService.changePassword('oldPassword', 'newPassword')
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: 'Method not implemented yet',
          })
        );
      });
    });
  });

  // ========================================================================
  // Password Recovery Tests
  // ========================================================================

  describe('Password Recovery', () => {
    describe('resetPassword()', () => {
      test('should throw not implemented error', async () => {
        await expect(
          clerkAuthService.resetPassword('test@example.com')
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: 'Method not implemented yet',
          })
        );
      });
    });

    describe('confirmPasswordReset()', () => {
      test('should throw not implemented error', async () => {
        await expect(
          clerkAuthService.confirmPasswordReset('token123', 'newPassword')
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: 'Method not implemented yet',
          })
        );
      });
    });

    describe('verifyResetToken()', () => {
      test('should return false (not implemented)', async () => {
        const result = await clerkAuthService.verifyResetToken('token123');
        expect(result).toBe(false);
      });
    });
  });

  // ========================================================================
  // Email Verification Tests
  // ========================================================================

  describe('Email Verification', () => {
    describe('sendEmailVerification()', () => {
      test('should throw not implemented error', async () => {
        await expect(
          clerkAuthService.sendEmailVerification('test@example.com')
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: 'Method not implemented yet',
          })
        );
      });
    });

    describe('confirmEmailVerification()', () => {
      test('should throw not implemented error', async () => {
        await expect(
          clerkAuthService.confirmEmailVerification('token123')
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: 'Method not implemented yet',
          })
        );
      });
    });
  });

  // ========================================================================
  // Session Analytics Tests
  // ========================================================================

  describe('Session Analytics', () => {
    describe('getSessionHistory()', () => {
      test('should return empty array (not implemented)', async () => {
        const result = await clerkAuthService.getSessionHistory();
        expect(result).toEqual([]);
      });

      test('should handle limit parameter', async () => {
        const result = await clerkAuthService.getSessionHistory(10);
        expect(result).toEqual([]);
      });
    });

    describe('revokeSession()', () => {
      test('should throw not implemented error', async () => {
        await expect(
          clerkAuthService.revokeSession('sess_123')
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: 'Method not implemented yet',
          })
        );
      });
    });

    describe('revokeAllOtherSessions()', () => {
      test('should throw not implemented error', async () => {
        await expect(
          clerkAuthService.revokeAllOtherSessions()
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: 'Method not implemented yet',
          })
        );
      });
    });
  });

  // ========================================================================
  // Admin Functions Tests
  // ========================================================================

  describe('Admin Functions', () => {
    describe('getUserById()', () => {
      test('should throw not implemented error', async () => {
        await expect(
          clerkAuthService.getUserById('user_123')
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: 'Admin functions not implemented yet',
          })
        );
      });
    });

    describe('listUsers()', () => {
      test('should throw not implemented error', async () => {
        await expect(
          clerkAuthService.listUsers()
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: 'Admin functions not implemented yet',
          })
        );
      });

      test('should handle pagination options', async () => {
        await expect(
          clerkAuthService.listUsers({
            page: 1,
            limit: 10,
            search: 'test',
            role: 'admin',
          })
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: 'Admin functions not implemented yet',
          })
        );
      });
    });

    describe('updateUserRole()', () => {
      test('should throw not implemented error', async () => {
        await expect(
          clerkAuthService.updateUserRole('user_123', 'admin')
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: 'Admin functions not implemented yet',
          })
        );
      });
    });
  });

  // ========================================================================
  // Private Helper Methods Tests
  // ========================================================================

  describe('Private Helper Methods', () => {
    describe('Clerk User Conversion', () => {
      test('should convert Clerk user to AuthUser format', async () => {
        const mockClerkUser = createTestClerkUser({
          id: 'user_clerk_123',
          emailAddresses: [
            {
              id: 'email_123',
              emailAddress: 'test@example.com',
              verification: { status: 'verified' },
            },
          ],
          firstName: 'John',
          lastName: 'Doe',
          imageUrl: 'https://example.com/avatar.jpg',
          publicMetadata: { role: 'admin' },
        });
        
        mockAuth.mockResolvedValue({ 
          userId: 'user_clerk_123', 
          sessionId: 'sess_123' 
        });
        mockClerkClient.users.getUser.mockResolvedValue(mockClerkUser);
        
        // Use social callback to test the conversion
        const validState = Buffer.from(JSON.stringify({
          redirectUrl: '/dashboard',
          timestamp: Date.now(),
          nonce: 'test-nonce',
        })).toString('base64url');
        
        const result = await clerkAuthService.handleSocialCallback(
          'google',
          'code123',
          validState
        );
        
        expect(result.user).toMatchObject({
          id: 'user_clerk_123',
          email: 'test@example.com',
          emailVerified: true,
          name: 'John Doe',
          avatar: 'https://example.com/avatar.jpg',
          provider: 'google',
          role: 'admin',
          metadata: expect.objectContaining({
            language: 'zh-CN',
            theme: 'system',
          }),
        });
      });

      test('should handle missing email address', async () => {
        const mockClerkUser = createTestClerkUser({
          emailAddresses: [],
        });
        
        mockAuth.mockResolvedValue({ 
          userId: 'user_123', 
          sessionId: 'sess_123' 
        });
        mockClerkClient.users.getUser.mockResolvedValue(mockClerkUser);
        
        const validState = Buffer.from(JSON.stringify({
          redirectUrl: '/dashboard',
          timestamp: Date.now(),
          nonce: 'test-nonce',
        })).toString('base64url');
        
        await expect(
          clerkAuthService.handleSocialCallback('google', 'code123', validState)
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            message: 'No email address found for user',
          })
        );
      });

      test('should handle missing external account', async () => {
        const mockClerkUser = createTestClerkUser({
          externalAccounts: [], // No external accounts
        });
        
        mockAuth.mockResolvedValue({ 
          userId: 'user_123', 
          sessionId: 'sess_123' 
        });
        mockClerkClient.users.getUser.mockResolvedValue(mockClerkUser);
        
        const validState = Buffer.from(JSON.stringify({
          redirectUrl: '/dashboard',
          timestamp: Date.now(),
          nonce: 'test-nonce',
        })).toString('base64url');
        
        await expect(
          clerkAuthService.handleSocialCallback('google', 'code123', validState)
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'OAUTH_ERROR',
            message: 'No google connection found for this user',
          })
        );
      });
    });

    describe('OAuth State Management', () => {
      test('should generate valid OAuth state', async () => {
        const originalWindow = global.window;
        delete (global as any).window;
        
        try {
          await expect(
            clerkAuthService.signInWithProvider('google', { redirectTo: '/custom' })
          ).rejects.toEqual(
            expect.objectContaining({
              redirectUrl: expect.stringContaining('state='),
            })
          );
        } finally {
          global.window = originalWindow;
        }
      });

      test('should verify OAuth state correctly', async () => {
        const validState = Buffer.from(JSON.stringify({
          redirectUrl: '/dashboard',
          timestamp: Date.now(),
          nonce: Math.random().toString(36).substring(2, 15),
        })).toString('base64url');
        
        // Test state verification indirectly through callback
        mockAuth.mockResolvedValue({ userId: null, sessionId: null });
        
        await expect(
          clerkAuthService.handleSocialCallback('google', 'code123', validState)
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'OAUTH_ERROR',
            message: expect.stringContaining('no session created'),
          })
        );
        
        // The fact that we get to this error means state validation passed
      });
    });

    describe('Session Conversion', () => {
      test('should convert Clerk session to AuthSession format', async () => {
        const mockClerkUser = createTestClerkUser();
        const mockClerkSession = createTestClerkSession({
          id: 'sess_clerk_123',
          expireAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        });
        
        mockAuth.mockResolvedValue({ 
          userId: 'user_123', 
          sessionId: 'sess_123' 
        });
        mockClerkClient.users.getUser.mockResolvedValue(mockClerkUser);
        mockClerkClient.sessions.getSession.mockResolvedValue(mockClerkSession);
        
        const result = await clerkAuthService.getSession();
        
        expect(result).toMatchObject({
          accessToken: 'sess_clerk_123',
          refreshToken: expect.stringContaining('clerk_refresh_sess_clerk_123'),
          expiresAt: expect.any(String),
          refreshExpiresAt: expect.any(String),
          user: expect.objectContaining({
            id: mockClerkUser.id,
          }),
          persistent: true,
        });
      });
    });
  });

  // ========================================================================
  // Integration Tests
  // ========================================================================

  describe('Integration Tests', () => {
    test('should handle complete login flow with session persistence', async () => {
      const credentials: AuthFormData = {
        email: 'test@example.com',
        password: 'SecurePassword123',
        rememberMe: true,
      };
      
      // Mock successful Clerk login
      mockClerkClient.signInTokens.createSignInToken.mockResolvedValue({
        token: 'test_token',
      });
      
      const result = await clerkAuthService.signIn(credentials);
      
      // Verify complete session object
      expect(result).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresAt: expect.any(String),
        refreshExpiresAt: expect.any(String),
        user: expect.objectContaining({
          email: credentials.email,
          role: 'admin',
          provider: 'email',
        }),
        createdAt: expect.any(String),
        lastActivity: expect.any(String),
        persistent: false, // Initial value, updated via separate call
      });
      
      // Verify session management interactions
      expect(mockSessionManager.checkLockoutStatus).toHaveBeenCalledWith(credentials.email);
      expect(mockSessionManager.clearFailedAttempts).toHaveBeenCalledWith(credentials.email);
      expect(mockSessionManager.storeSession).toHaveBeenCalledWith(
        expect.any(Object),
        true,
        true // Remember me
      );
    });

    test('should handle complete OAuth flow', async () => {
      // Step 1: Initiate OAuth (server-side redirect)
      const originalWindow = global.window;
      delete (global as any).window;
      
      try {
        await expect(
          clerkAuthService.signInWithProvider('google')
        ).rejects.toEqual(
          expect.objectContaining({
            code: 'OAUTH_ERROR',
            requiresRedirect: true,
            redirectUrl: expect.stringContaining('oauth'),
          })
        );
      } finally {
        global.window = originalWindow;
      }
      
      // Step 2: Handle OAuth callback
      const mockClerkUser = createTestClerkUser({
        externalAccounts: [
          { provider: 'oauth_google', emailAddress: 'test@example.com' },
        ],
      });
      
      mockAuth.mockResolvedValue({ 
        userId: 'user_123', 
        sessionId: 'sess_123' 
      });
      mockClerkClient.users.getUser.mockResolvedValue(mockClerkUser);
      
      const validState = Buffer.from(JSON.stringify({
        redirectUrl: '/dashboard',
        timestamp: Date.now(),
        nonce: 'test-nonce',
      })).toString('base64url');
      
      const result = await clerkAuthService.handleSocialCallback(
        'google',
        'auth_code_123',
        validState
      );
      
      expect(result).toMatchObject({
        user: expect.objectContaining({
          provider: 'google',
          email: mockClerkUser.emailAddresses[0].emailAddress,
        }),
      });
      
      expect(mockSessionManager.storeSession).toHaveBeenCalled();
      expect(mockSessionManager.clearFailedAttempts).toHaveBeenCalled();
    });

    test('should handle session lifecycle (create, validate, refresh, destroy)', async () => {
      // Create session
      const testSession = createTestAuthSession();
      mockSessionManager.getSession.mockResolvedValue(testSession);
      jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(true);
      
      // Get session
      let currentSession = await clerkAuthService.getSession();
      expect(currentSession).not.toBeNull();
      
      // Validate session
      const isValid = await clerkAuthService.validateSession(currentSession!);
      expect(isValid).toBe(true);
      
      // Refresh session
      mockSessionManager.refreshSession.mockResolvedValue(testSession);
      const refreshedSession = await clerkAuthService.refreshSession();
      expect(refreshedSession).toBeDefined();
      
      // Sign out
      await clerkAuthService.signOut();
      expect(mockSessionManager.clearSession).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Edge Cases and Error Scenarios
  // ========================================================================

  describe('Edge Cases and Error Scenarios', () => {
    test('should handle malformed OAuth state', async () => {
      await expect(
        clerkAuthService.handleSocialCallback('google', 'code123', 'malformed-state')
      ).rejects.toEqual(
        expect.objectContaining({
          code: 'OAUTH_ERROR',
          message: expect.stringContaining('Invalid state parameter'),
        })
      );
    });

    test('should handle network errors during Clerk operations', async () => {
      const networkError = new Error('Network request failed');
      (networkError as any).code = 'network_error';
      
      mockClerkClient.signInTokens.createSignInToken.mockRejectedValue(networkError);
      
      await expect(
        clerkAuthService.signIn({ email: 'test@example.com', password: 'password' })
      ).rejects.toEqual(
        expect.objectContaining({
          code: 'NETWORK_ERROR',
          message: '网络连接失败，请检查网络设置',
          provider: 'clerk',
          originalError: networkError,
        })
      );
    });

    test('should handle concurrent session operations', async () => {
      const testSession = createTestAuthSession();
      mockSessionManager.getSession.mockResolvedValue(testSession);
      jest.spyOn(clerkAuthService, 'validateSession').mockResolvedValue(true);
      
      // Simulate concurrent getSession calls
      const promises = Array(5).fill(null).map(() => clerkAuthService.getSession());
      const results = await Promise.all(promises);
      
      // All should return the same session
      results.forEach(result => {
        expect(result).toEqual(testSession);
      });
    });

    test('should handle session storage failures gracefully', async () => {
      mockSessionManager.storeSession.mockRejectedValue(new Error('Storage full'));
      
      mockClerkClient.signInTokens.createSignInToken.mockResolvedValue({
        token: 'test_token',
      });
      
      // Should still return session even if storage fails
      const result = await clerkAuthService.signIn({
        email: 'test@example.com',
        password: 'password',
        rememberMe: true,
      });
      
      expect(result).toBeDefined();
    });

    test('should handle rapid lockout/unlock scenarios', async () => {
      const email = 'test@example.com';
      
      // Trigger lockout
      mockSessionManager.checkLockoutStatus.mockResolvedValue({
        isLocked: true,
        remainingTime: 15 * 60 * 1000,
        attemptCount: 5,
      });
      
      await expect(
        clerkAuthService.signIn({ email, password: 'wrong' })
      ).rejects.toEqual(
        expect.objectContaining({
          code: 'ACCOUNT_LOCKED',
        })
      );
      
      // Unlock account
      await clerkAuthService.unlockAccount(email);
      
      // Should be able to attempt login again
      mockSessionManager.checkLockoutStatus.mockResolvedValue({
        isLocked: false,
        attemptCount: 0,
      });
      
      mockClerkClient.signInTokens.createSignInToken.mockResolvedValue({
        token: 'test_token',
      });
      
      const result = await clerkAuthService.signIn({ email, password: 'correct' });
      expect(result).toBeDefined();
    });

    test('should handle session corruption scenarios', async () => {
      // Return corrupted session data
      const corruptedSession = {
        accessToken: null,
        user: undefined,
      } as any;
      
      mockSessionManager.getSession.mockResolvedValue(corruptedSession);
      
      const result = await clerkAuthService.getSession();
      
      // Should clear corrupted session and return null
      expect(result).toBeNull();
    });
  });
});