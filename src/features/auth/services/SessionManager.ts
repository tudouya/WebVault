/**
 * Session Management Service
 * 
 * Handles session lifecycle, persistence, token refresh, and security policies for WebVault.
 * Implements 30-day persistence and 15-minute lockout mechanisms as per requirements.
 * 
 * Requirements:
 * - 5.1: Session management (30-day persistence, 15-minute lockout mechanism)
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

import { AuthSession, AuthUser, AuthError, SessionConfig, DEFAULT_SESSION_CONFIG } from '../types';

// ============================================================================
// Session Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  SESSION: 'webvault-session',
  REFRESH_TOKEN: 'webvault-refresh-token',
  SESSION_EXPIRY: 'webvault-session-expiry',
  PERSISTENT_FLAG: 'webvault-persistent-session',
  LOCKOUT_DATA: 'webvault-lockout',
  FAILED_ATTEMPTS: 'webvault-failed-attempts',
  LAST_ACTIVITY: 'webvault-last-activity',
} as const;

// ============================================================================
// Session Manager Types
// ============================================================================

/**
 * Session persistence data structure
 */
interface SessionData {
  session: AuthSession;
  expiresAt: string;
  createdAt: string;
  persistent: boolean;
  refreshExpiresAt: string;
}

/**
 * Lockout status information
 */
interface LockoutStatus {
  isLocked: boolean;
  remainingTime?: number;
  attemptCount: number;
  lockedAt?: string;
  unlockAt?: string;
}

/**
 * Failed attempt tracking
 */
interface FailedAttemptData {
  email: string;
  attempts: number;
  firstAttemptAt: string;
  lastAttemptAt: string;
  lockoutExpiresAt?: string;
}

/**
 * Session validation result
 */
interface SessionValidationResult {
  isValid: boolean;
  session?: AuthSession;
  error?: AuthError;
  needsRefresh?: boolean;
}

// ============================================================================
// Session Manager Implementation
// ============================================================================

/**
 * SessionManager class for handling authentication session lifecycle
 * 
 * Features:
 * - 30-day session persistence with refresh token rotation
 * - 15-minute account lockout after failed attempts
 * - Automatic session refresh and cleanup
 * - Secure storage management
 * - Activity tracking and timeout handling
 */
export class SessionManager {
  private config: SessionConfig;
  private refreshTimer: NodeJS.Timeout | null = null;
  private activityTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.initializeSessionManagement();
  }

  // ========================================================================
  // Session Persistence Methods
  // ========================================================================

  /**
   * Store session data with persistence configuration
   * 
   * @param session - Authentication session to store
   * @param persistent - Whether to enable 30-day persistence
   * @param rememberMe - User preference for session persistence
   */
  async storeSession(session: AuthSession, persistent = false, rememberMe = false): Promise<void> {
    try {
      const isPersistent = persistent || rememberMe;
      const expiresAt = new Date(Date.now() + this.config.sessionDuration).toISOString();
      const refreshExpiresAt = new Date(Date.now() + (this.config.sessionDuration * 2)).toISOString();

      const sessionData: SessionData = {
        session: {
          ...session,
          persistent: isPersistent,
          lastActivity: new Date().toISOString(),
        },
        expiresAt,
        createdAt: new Date().toISOString(),
        persistent: isPersistent,
        refreshExpiresAt,
      };

      // Choose storage type based on persistence preference
      const storage = isPersistent ? localStorage : sessionStorage;
      
      // Store session data
      storage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
      storage.setItem(STORAGE_KEYS.SESSION_EXPIRY, expiresAt);
      storage.setItem(STORAGE_KEYS.PERSISTENT_FLAG, String(isPersistent));
      
      // Store refresh token securely
      if (session.refreshToken) {
        storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken);
      }

      // Update last activity
      this.updateLastActivity();

      // Setup automatic refresh if needed
      this.scheduleSessionRefresh(sessionData);

      console.info('[SessionManager] Session stored successfully', {
        persistent: isPersistent,
        expiresAt,
        userId: session.user?.id,
      });
    } catch (error) {
      console.error('[SessionManager] Failed to store session:', error);
      throw this.createAuthError('SESSION_STORAGE_ERROR', 'Failed to store session data');
    }
  }

  /**
   * Retrieve current session from storage
   * 
   * @returns Current session or null if not found/expired
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      // Check both storage types for session data
      let sessionData: SessionData | null = null;
      let storage: Storage | null = null;

      // Try persistent storage first
      const persistentData = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (persistentData) {
        sessionData = JSON.parse(persistentData);
        storage = localStorage;
      } else {
        // Fall back to session storage
        const tempData = sessionStorage.getItem(STORAGE_KEYS.SESSION);
        if (tempData) {
          sessionData = JSON.parse(tempData);
          storage = sessionStorage;
        }
      }

      if (!sessionData || !storage) {
        return null;
      }

      // Validate session expiry
      const validation = await this.validateSessionData(sessionData);
      if (!validation.isValid) {
        if (validation.needsRefresh) {
          // Attempt to refresh the session
          const refreshed = await this.refreshSessionInternal(sessionData);
          return refreshed || null;
        }
        
        // Clean up expired session
        await this.clearSession();
        return null;
      }

      // Update last activity
      this.updateLastActivity();

      return sessionData.session;
    } catch (error) {
      console.error('[SessionManager] Failed to retrieve session:', error);
      return null;
    }
  }

  /**
   * Clear session data from all storage locations
   */
  async clearSession(): Promise<void> {
    try {
      // Clear from both storage types
      [localStorage, sessionStorage].forEach(storage => {
        Object.values(STORAGE_KEYS).forEach(key => {
          storage.removeItem(key);
        });
      });

      // Clear timers
      this.clearRefreshTimer();
      this.clearActivityTimer();

      console.info('[SessionManager] Session cleared successfully');
    } catch (error) {
      console.error('[SessionManager] Failed to clear session:', error);
    }
  }

  // ========================================================================
  // Token Refresh Methods
  // ========================================================================

  /**
   * Refresh authentication session using refresh token
   * 
   * @param session - Current session to refresh
   * @returns Refreshed session or null if refresh failed
   */
  async refreshSession(session?: AuthSession): Promise<AuthSession | null> {
    try {
      const currentSession = session || await this.getSession();
      if (!currentSession) {
        throw this.createAuthError('NO_SESSION', 'No active session to refresh');
      }

      // Get stored session data for refresh
      const sessionData = await this.getStoredSessionData();
      if (!sessionData) {
        throw this.createAuthError('NO_SESSION_DATA', 'No session data found for refresh');
      }

      return await this.refreshSessionInternal(sessionData);
    } catch (error) {
      console.error('[SessionManager] Session refresh failed:', error);
      await this.clearSession();
      return null;
    }
  }

  /**
   * Internal session refresh implementation
   * 
   * @param sessionData - Session data to refresh
   * @returns Refreshed session or null
   */
  private async refreshSessionInternal(sessionData: SessionData): Promise<AuthSession | null> {
    try {
      // Check if refresh token is still valid
      const refreshExpiresAt = new Date(sessionData.refreshExpiresAt);
      if (refreshExpiresAt <= new Date()) {
        throw this.createAuthError('REFRESH_TOKEN_EXPIRED', 'Refresh token has expired');
      }

      // Create new session with extended expiry
      const newExpiresAt = new Date(Date.now() + this.config.sessionDuration).toISOString();
      const newRefreshExpiresAt = new Date(Date.now() + (this.config.sessionDuration * 2)).toISOString();

      const refreshedSession: AuthSession = {
        ...sessionData.session,
        expiresAt: newExpiresAt,
        refreshExpiresAt: newRefreshExpiresAt,
        lastActivity: new Date().toISOString(),
      };

      // Store refreshed session
      await this.storeSession(refreshedSession, sessionData.persistent);

      console.info('[SessionManager] Session refreshed successfully', {
        userId: refreshedSession.user?.id,
        newExpiresAt,
      });

      return refreshedSession;
    } catch (error) {
      console.error('[SessionManager] Internal session refresh failed:', error);
      return null;
    }
  }

  /**
   * Schedule automatic session refresh before expiry
   * 
   * @param sessionData - Session data to schedule refresh for
   */
  private scheduleSessionRefresh(sessionData: SessionData): void {
    this.clearRefreshTimer();

    const expiresAt = new Date(sessionData.expiresAt);
    const refreshTime = expiresAt.getTime() - this.config.refreshThreshold;
    const timeUntilRefresh = refreshTime - Date.now();

    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(async () => {
        const result = await this.refreshSessionInternal(sessionData);
        if (result) {
          // Schedule next refresh
          this.scheduleSessionRefresh({
            ...sessionData,
            session: result,
            expiresAt: result.expiresAt,
          });
        }
      }, timeUntilRefresh);

      console.debug('[SessionManager] Session refresh scheduled', {
        refreshIn: Math.round(timeUntilRefresh / 1000),
        refreshAt: new Date(refreshTime).toISOString(),
      });
    }
  }

  // ========================================================================
  // Account Lockout Methods
  // ========================================================================

  /**
   * Check if account is locked out
   * 
   * @param email - User email to check lockout status
   * @returns Lockout status information
   */
  async checkLockoutStatus(email: string): Promise<LockoutStatus> {
    try {
      const failedAttempts = this.getFailedAttempts(email);
      
      if (!failedAttempts) {
        return {
          isLocked: false,
          attemptCount: 0,
        };
      }

      // Check if lockout period has expired
      if (failedAttempts.lockoutExpiresAt) {
        const lockoutExpiry = new Date(failedAttempts.lockoutExpiresAt);
        const now = new Date();
        
        if (lockoutExpiry > now) {
          // Still locked out
          const remainingTime = lockoutExpiry.getTime() - now.getTime();
          return {
            isLocked: true,
            remainingTime,
            attemptCount: failedAttempts.attempts,
            lockedAt: failedAttempts.lastAttemptAt,
            unlockAt: failedAttempts.lockoutExpiresAt,
          };
        } else {
          // Lockout has expired, clear failed attempts
          this.clearFailedAttempts(email);
          return {
            isLocked: false,
            attemptCount: 0,
          };
        }
      }

      // Check if max attempts reached (but no lockout set yet)
      const isLocked = failedAttempts.attempts >= this.config.maxLoginAttempts;
      
      return {
        isLocked,
        attemptCount: failedAttempts.attempts,
        lockedAt: isLocked ? failedAttempts.lastAttemptAt : undefined,
      };
    } catch (error) {
      console.error('[SessionManager] Failed to check lockout status:', error);
      return {
        isLocked: false,
        attemptCount: 0,
      };
    }
  }

  /**
   * Record failed login attempt and apply lockout if necessary
   * 
   * @param email - User email that failed login
   */
  async recordFailedAttempt(email: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      const existing = this.getFailedAttempts(email);

      const failedAttemptData: FailedAttemptData = {
        email,
        attempts: (existing?.attempts || 0) + 1,
        firstAttemptAt: existing?.firstAttemptAt || now,
        lastAttemptAt: now,
      };

      // Apply lockout if max attempts reached
      if (failedAttemptData.attempts >= this.config.maxLoginAttempts) {
        failedAttemptData.lockoutExpiresAt = new Date(
          Date.now() + this.config.lockoutDuration
        ).toISOString();

        console.warn('[SessionManager] Account locked due to failed attempts', {
          email,
          attempts: failedAttemptData.attempts,
          lockoutExpiresAt: failedAttemptData.lockoutExpiresAt,
        });
      }

      // Store failed attempt data
      localStorage.setItem(
        `${STORAGE_KEYS.FAILED_ATTEMPTS}-${email}`,
        JSON.stringify(failedAttemptData)
      );

      console.info('[SessionManager] Failed attempt recorded', {
        email,
        attempts: failedAttemptData.attempts,
        maxAttempts: this.config.maxLoginAttempts,
      });
    } catch (error) {
      console.error('[SessionManager] Failed to record failed attempt:', error);
    }
  }

  /**
   * Clear failed login attempts for user
   * 
   * @param email - User email to clear attempts for
   */
  async clearFailedAttempts(email: string): Promise<void> {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.FAILED_ATTEMPTS}-${email}`);
      console.info('[SessionManager] Failed attempts cleared', { email });
    } catch (error) {
      console.error('[SessionManager] Failed to clear failed attempts:', error);
    }
  }

  /**
   * Manually unlock user account (admin function)
   * 
   * @param email - User email to unlock
   */
  async unlockAccount(email: string): Promise<void> {
    await this.clearFailedAttempts(email);
    console.info('[SessionManager] Account manually unlocked', { email });
  }

  // ========================================================================
  // Session Validation Methods
  // ========================================================================

  /**
   * Validate session data integrity and expiry
   * 
   * @param sessionData - Session data to validate
   * @returns Validation result with recommendations
   */
  private async validateSessionData(sessionData: SessionData): Promise<SessionValidationResult> {
    try {
      const now = new Date();
      const expiresAt = new Date(sessionData.expiresAt);
      const refreshExpiresAt = new Date(sessionData.refreshExpiresAt);

      // Check if session has completely expired
      if (refreshExpiresAt <= now) {
        return {
          isValid: false,
          error: this.createAuthError('SESSION_EXPIRED', 'Session has completely expired'),
        };
      }

      // Check if session needs refresh
      if (expiresAt <= now) {
        return {
          isValid: false,
          needsRefresh: true,
        };
      }

      // Check if session is close to expiry and should be refreshed
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      if (timeUntilExpiry <= this.config.refreshThreshold) {
        return {
          isValid: true,
          session: sessionData.session,
          needsRefresh: true,
        };
      }

      return {
        isValid: true,
        session: sessionData.session,
      };
    } catch (error) {
      return {
        isValid: false,
        error: this.createAuthError('VALIDATION_ERROR', 'Failed to validate session'),
      };
    }
  }

  /**
   * Validate current session and refresh if needed
   * 
   * @returns Current valid session or null
   */
  async validateCurrentSession(): Promise<AuthSession | null> {
    const sessionData = await this.getStoredSessionData();
    if (!sessionData) {
      return null;
    }

    const validation = await this.validateSessionData(sessionData);
    if (!validation.isValid) {
      if (validation.needsRefresh) {
        const refreshed = await this.refreshSessionInternal(sessionData);
        return refreshed || null;
      }
      await this.clearSession();
      return null;
    }

    return validation.session || null;
  }

  // ========================================================================
  // Activity Tracking Methods
  // ========================================================================

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    try {
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, now);
      
      // Reset activity timer
      this.scheduleActivityCheck();
    } catch (error) {
      console.error('[SessionManager] Failed to update activity:', error);
    }
  }

  /**
   * Schedule periodic activity checks for session timeout
   */
  private scheduleActivityCheck(): void {
    this.clearActivityTimer();

    this.activityTimer = setTimeout(async () => {
      const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      if (lastActivity) {
        const lastActivityTime = new Date(lastActivity);
        const inactiveTime = Date.now() - lastActivityTime.getTime();
        
        // Check if session should expire due to inactivity
        if (inactiveTime > this.config.sessionDuration) {
          console.info('[SessionManager] Session expired due to inactivity');
          await this.clearSession();
          return;
        }
      }

      // Schedule next check
      this.scheduleActivityCheck();
    }, this.config.refreshThreshold);
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Get stored session data from storage
   */
  private async getStoredSessionData(): Promise<SessionData | null> {
    try {
      // Check persistent storage first
      let sessionDataStr = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!sessionDataStr) {
        sessionDataStr = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      }

      return sessionDataStr ? JSON.parse(sessionDataStr) : null;
    } catch (error) {
      console.error('[SessionManager] Failed to get stored session data:', error);
      return null;
    }
  }

  /**
   * Get failed attempts data for user
   */
  private getFailedAttempts(email: string): FailedAttemptData | null {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.FAILED_ATTEMPTS}-${email}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[SessionManager] Failed to get failed attempts:', error);
      return null;
    }
  }

  /**
   * Initialize session management timers and cleanup
   */
  private initializeSessionManagement(): void {
    // Setup activity tracking
    this.scheduleActivityCheck();

    // Setup cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  /**
   * Clear refresh timer
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Clear activity timer
   */
  private clearActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  /**
   * Cleanup timers and resources
   */
  public cleanup(): void {
    this.clearRefreshTimer();
    this.clearActivityTimer();
  }

  /**
   * Create standardized auth error
   */
  private createAuthError(code: string, message: string): AuthError {
    return {
      code: code as any,
      message,
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'SessionManager',
      },
    };
  }

  // ========================================================================
  // Public Configuration Methods
  // ========================================================================

  /**
   * Update session configuration
   * 
   * @param newConfig - Partial configuration to update
   */
  updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.info('[SessionManager] Configuration updated', newConfig);
  }

  /**
   * Get current session configuration
   */
  getConfig(): SessionConfig {
    return { ...this.config };
  }

  /**
   * Check if browser supports required storage
   */
  static isStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      const test = 'storage-test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Default Export and Singleton Instance
// ============================================================================

/**
 * Default SessionManager instance with standard configuration
 */
export const sessionManager = new SessionManager();

/**
 * Create custom SessionManager instance with specific configuration
 * 
 * @param config - Custom session configuration
 * @returns Configured SessionManager instance
 */
export function createSessionManager(config: Partial<SessionConfig>): SessionManager {
  return new SessionManager(config);
}

/**
 * Export types for external use
 */
export type {
  SessionData,
  LockoutStatus,
  FailedAttemptData,
  SessionValidationResult,
};

/**
 * Default export for convenience
 */
export default SessionManager;