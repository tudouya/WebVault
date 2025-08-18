/**
 * Authentication Types & Interfaces
 * 
 * Defines comprehensive type definitions for WebVault authentication system
 * including user management, session handling, error processing, and form validation.
 * 
 * Requirements:
 * - 1.1: Email authentication with validation and error handling
 * - 2.1: Social authentication (Google, GitHub OAuth)
 * - 5.1: Session management (30-day persistence, 15-minute lockout)
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

// ============================================================================
// Core Authentication Types
// ============================================================================

/**
 * Authentication user interface
 * 
 * Represents the authenticated user data structure based on Supabase Auth.
 * Contains essential user information and metadata for session management.
 */
export interface AuthUser {
  /** Unique user identifier from Supabase */
  id: string;
  
  /** User's email address (primary identifier) */
  email: string;
  
  /** Email verification status */
  emailVerified: boolean;
  
  /** User's display name (optional) */
  name?: string;
  
  /** User's avatar/profile image URL (optional) */
  avatar?: string;
  
  /** Authentication provider used */
  provider: 'email' | 'google' | 'github';
  
  /** User role for authorization */
  role: 'admin' | 'user';
  
  /** User metadata and preferences */
  metadata: {
    /** Preferred language */
    language?: string;
    /** Theme preference */
    theme?: 'light' | 'dark' | 'system';
    /** Last login timestamp */
    lastLogin?: string;
    /** Login count */
    loginCount?: number;
  };
  
  /** Account creation timestamp */
  createdAt: string;
  
  /** Last profile update timestamp */
  updatedAt: string;
}

/**
 * Authentication session interface
 * 
 * Manages user session state with JWT tokens and refresh capabilities.
 * Implements 30-day persistence requirement.
 */
export interface AuthSession {
  /** JWT access token */
  accessToken: string;
  
  /** JWT refresh token for session renewal */
  refreshToken: string;
  
  /** Access token expiration timestamp */
  expiresAt: string;
  
  /** Session refresh deadline */
  refreshExpiresAt: string;
  
  /** Authenticated user information */
  user: AuthUser;
  
  /** Session creation timestamp */
  createdAt: string;
  
  /** Last session activity timestamp */
  lastActivity: string;
  
  /** Session persistence flag (for 30-day requirement) */
  persistent: boolean;
}

/**
 * Authentication error interface
 * 
 * Standardized error handling for authentication flows with user-friendly messaging.
 */
export interface AuthError {
  /** Error type/code for programmatic handling */
  code: 
    | 'EMAIL_NOT_CONFIRMED'
    | 'INVALID_CREDENTIALS'
    | 'USER_NOT_FOUND'
    | 'WEAK_PASSWORD'
    | 'EMAIL_ALREADY_EXISTS'
    | 'SIGNUP_DISABLED'
    | 'INVALID_EMAIL'
    | 'NETWORK_ERROR'
    | 'SERVER_ERROR'
    | 'OAUTH_ERROR'
    | 'SESSION_EXPIRED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'ACCOUNT_LOCKED'
    | 'UNKNOWN_ERROR';
  
  /** User-friendly error message for UI display */
  message: string;
  
  /** Technical error details (for logging/debugging) */
  details?: string;
  
  /** Associated field for form validation errors */
  field?: 'email' | 'password' | 'confirmPassword' | 'general';
  
  /** Error timestamp */
  timestamp: string;
  
  /** Additional context data */
  metadata?: Record<string, any>;
}

/**
 * Session configuration interface
 * 
 * Defines session behavior including persistence and security settings.
 * Implements 30-day persistence and 15-minute lockout requirements.
 */
export interface SessionConfig {
  /** Session duration in milliseconds (30 days) */
  sessionDuration: number;
  
  /** Session refresh threshold in milliseconds */
  refreshThreshold: number;
  
  /** Maximum login attempts before lockout */
  maxLoginAttempts: number;
  
  /** Account lockout duration in milliseconds (15 minutes) */
  lockoutDuration: number;
  
  /** Remember me option availability */
  rememberMeEnabled: boolean;
  
  /** Automatic session extension on activity */
  autoExtendSession: boolean;
  
  /** Session storage strategy */
  storageType: 'localStorage' | 'sessionStorage' | 'cookie';
  
  /** CSRF protection enabled */
  csrfProtection: boolean;
  
  /** Secure cookie settings */
  secureCookies: boolean;
}

// ============================================================================
// Form & UI Types
// ============================================================================

/**
 * Authentication form data interface
 * 
 * Defines form validation structure for login and registration flows.
 */
export interface AuthFormData {
  /** User email address */
  email: string;
  
  /** User password */
  password: string;
  
  /** Password confirmation (for registration) */
  confirmPassword?: string;
  
  /** Remember me preference for persistent sessions */
  rememberMe?: boolean;
  
  /** User display name (for registration) */
  name?: string;
  
  /** Terms of service acceptance (for registration) */
  acceptTerms?: boolean;
}

/**
 * Social authentication provider type
 */
export type SocialProvider = 'google' | 'github';

/**
 * Social authentication configuration
 */
export interface SocialAuthConfig {
  /** Provider identifier */
  provider: SocialProvider;
  
  /** Provider display name */
  name: string;
  
  /** Provider icon identifier */
  icon: string;
  
  /** Provider enabled status */
  enabled: boolean;
  
  /** OAuth client configuration */
  clientId: string;
  
  /** OAuth scopes requested */
  scopes: string[];
  
  /** Redirect URL after authentication */
  redirectUrl: string;
}

/**
 * Login page configuration interface
 * 
 * Comprehensive configuration for login page UI and behavior settings.
 */
export interface LoginPageConfig {
  /** Page theme configuration */
  theme: {
    /** Brand primary color (hex) */
    primaryColor: string;
    /** Brand secondary color (hex) */
    secondaryColor: string;
    /** Background style */
    backgroundStyle: 'solid' | 'gradient' | 'image';
    /** Logo URL */
    logoUrl?: string;
    /** Brand name display */
    brandName: string;
  };
  
  /** Authentication options */
  auth: {
    /** Email/password login enabled */
    emailLoginEnabled: boolean;
    /** Social login providers */
    socialProviders: SocialAuthConfig[];
    /** Registration link enabled */
    registrationEnabled: boolean;
    /** Password reset enabled */
    passwordResetEnabled: boolean;
    /** Remember me option enabled */
    rememberMeEnabled: boolean;
  };
  
  /** Form validation settings */
  validation: {
    /** Email validation pattern */
    emailPattern: RegExp;
    /** Minimum password length */
    minPasswordLength: number;
    /** Password strength requirements */
    passwordRequirements: {
      lowercase: boolean;
      uppercase: boolean;
      numbers: boolean;
      symbols: boolean;
    };
    /** Real-time validation enabled */
    realTimeValidation: boolean;
  };
  
  /** UI/UX settings */
  ui: {
    /** Form layout style */
    layout: 'centered' | 'split' | 'minimal';
    /** Animation effects enabled */
    animations: boolean;
    /** Loading indicators style */
    loadingStyle: 'spinner' | 'skeleton' | 'pulse';
    /** Error display style */
    errorStyle: 'inline' | 'toast' | 'modal';
  };
  
  /** Security settings */
  security: {
    /** CAPTCHA enabled for login attempts */
    captchaEnabled: boolean;
    /** Rate limiting configuration */
    rateLimiting: {
      enabled: boolean;
      maxAttempts: number;
      windowMs: number;
    };
    /** Session security settings */
    session: SessionConfig;
  };
  
  /** Content customization */
  content: {
    /** Page title */
    title: string;
    /** Page description */
    description: string;
    /** Welcome message */
    welcomeMessage?: string;
    /** Terms of service URL */
    termsUrl?: string;
    /** Privacy policy URL */
    privacyUrl?: string;
  };
}

// ============================================================================
// State Management Types
// ============================================================================

/**
 * Authentication state interface
 * 
 * Global authentication state management for Zustand store.
 */
export interface AuthState {
  /** Current authentication status */
  isAuthenticated: boolean;
  
  /** Authentication loading state */
  isLoading: boolean;
  
  /** Current authenticated user */
  user: AuthUser | null;
  
  /** Current session information */
  session: AuthSession | null;
  
  /** Current authentication error */
  error: AuthError | null;
  
  /** Login attempt tracking */
  loginAttempts: number;
  
  /** Account locked status */
  isLocked: boolean;
  
  /** Lockout expiration time */
  lockoutExpiresAt: string | null;
  
  /** Session initialization status */
  isInitialized: boolean;
}

/**
 * Authentication actions interface
 * 
 * Defines available authentication actions for state management.
 */
export interface AuthActions {
  /** Initialize authentication state */
  initialize: () => Promise<void>;
  
  /** Login with email and password */
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  
  /** Login with social provider */
  loginWithProvider: (provider: SocialProvider) => Promise<void>;
  
  /** Register new user account */
  register: (formData: AuthFormData) => Promise<void>;
  
  /** Logout current user */
  logout: () => Promise<void>;
  
  /** Refresh current session */
  refreshSession: () => Promise<void>;
  
  /** Send password reset email */
  resetPassword: (email: string) => Promise<void>;
  
  /** Update user profile */
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  
  /** Clear authentication error */
  clearError: () => void;
  
  /** Reset login attempts */
  resetLoginAttempts: () => void;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Authentication API response wrapper
 */
export type AuthApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: AuthError;
  message?: string;
};

/**
 * Login API response
 */
export interface LoginResponse {
  user: AuthUser;
  session: AuthSession;
  redirectUrl?: string;
}

/**
 * Registration API response
 */
export interface RegisterResponse {
  user: AuthUser;
  session?: AuthSession;
  requiresEmailConfirmation: boolean;
}

/**
 * Password reset API response
 */
export interface PasswordResetResponse {
  message: string;
  resetTokenSent: boolean;
  expiresAt?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Authentication context type for React Context API
 */
export type AuthContextType = AuthState & AuthActions;

/**
 * Protected route props
 */
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AuthUser['role'];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Auth hook options
 */
export interface UseAuthOptions {
  redirectOnLogin?: string;
  redirectOnLogout?: string;
  requireAuth?: boolean;
  requiredRole?: AuthUser['role'];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default session configuration
 * 
 * Implements requirements:
 * - 30-day session persistence
 * - 15-minute lockout duration
 * - Security best practices
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  sessionDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
  refreshThreshold: 15 * 60 * 1000, // 15 minutes
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  rememberMeEnabled: true,
  autoExtendSession: true,
  storageType: 'localStorage',
  csrfProtection: true,
  secureCookies: true,
};

/**
 * Default login page configuration
 */
export const DEFAULT_LOGIN_PAGE_CONFIG: LoginPageConfig = {
  theme: {
    primaryColor: '#3B82F6', // Blue-500
    secondaryColor: '#1F2937', // Gray-800
    backgroundStyle: 'gradient',
    brandName: 'WebVault',
  },
  auth: {
    emailLoginEnabled: true,
    socialProviders: [
      {
        provider: 'google',
        name: 'Google',
        icon: 'google',
        enabled: true,
        clientId: '',
        scopes: ['email', 'profile'],
        redirectUrl: '/auth/callback/google',
      },
      {
        provider: 'github',
        name: 'GitHub',
        icon: 'github',
        enabled: true,
        clientId: '',
        scopes: ['user:email'],
        redirectUrl: '/auth/callback/github',
      },
    ],
    registrationEnabled: true,
    passwordResetEnabled: true,
    rememberMeEnabled: true,
  },
  validation: {
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    minPasswordLength: 8,
    passwordRequirements: {
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: false,
    },
    realTimeValidation: true,
  },
  ui: {
    layout: 'centered',
    animations: true,
    loadingStyle: 'spinner',
    errorStyle: 'inline',
  },
  security: {
    captchaEnabled: false,
    rateLimiting: {
      enabled: true,
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    session: DEFAULT_SESSION_CONFIG,
  },
  content: {
    title: 'Login to WebVault',
    description: 'Access your website directory management platform',
    welcomeMessage: 'Welcome back! Please sign in to your account.',
  },
};

// ============================================================================
// Type Guards & Validators
// ============================================================================

/**
 * Type guard to check if value is AuthUser
 */
export function isAuthUser(value: unknown): value is AuthUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    'provider' in value &&
    'role' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).email === 'string'
  );
}

/**
 * Type guard to check if value is AuthSession
 */
export function isAuthSession(value: unknown): value is AuthSession {
  return (
    typeof value === 'object' &&
    value !== null &&
    'accessToken' in value &&
    'refreshToken' in value &&
    'user' in value &&
    typeof (value as any).accessToken === 'string' &&
    isAuthUser((value as any).user)
  );
}

/**
 * Type guard to check if value is AuthError
 */
export function isAuthError(value: unknown): value is AuthError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as any).code === 'string' &&
    typeof (value as any).message === 'string'
  );
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return DEFAULT_LOGIN_PAGE_CONFIG.validation.emailPattern.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  const { minPasswordLength, passwordRequirements } = DEFAULT_LOGIN_PAGE_CONFIG.validation;
  
  if (password.length < minPasswordLength) {
    return false;
  }
  
  if (passwordRequirements.lowercase && !/[a-z]/.test(password)) {
    return false;
  }
  
  if (passwordRequirements.uppercase && !/[A-Z]/.test(password)) {
    return false;
  }
  
  if (passwordRequirements.numbers && !/\d/.test(password)) {
    return false;
  }
  
  if (passwordRequirements.symbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return false;
  }
  
  return true;
}