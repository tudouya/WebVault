/**
 * Clerk Client Configuration
 * 
 * Provides configured Clerk client instances for authentication and user management.
 * Supports both client-side and server-side operations with proper environment variables.
 * 
 * Requirements:
 * - R1.1: Clerk authentication integration
 * - 5.1: Session management (30-day persistence)
 * 
 * @version 1.0.0
 * @created 2025-08-21
 */

import { createClerkClient } from '@clerk/nextjs/server';

// ============================================================================
// Environment Variables Validation
// ============================================================================

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;

if (!clerkPublishableKey) {
  throw new Error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable');
}

if (!clerkSecretKey) {
  throw new Error('Missing CLERK_SECRET_KEY environment variable');
}

// ============================================================================
// Server-Side Clerk Client
// ============================================================================

/**
 * Server-side Clerk client for API routes and server components
 * 
 * Used in API routes, server components, and server-side operations.
 * Provides access to user management, session handling, and administrative functions.
 * 
 * Requirements: R1.1
 */
export const clerk = createClerkClient({
  secretKey: clerkSecretKey,
  publishableKey: clerkPublishableKey,
});

// ============================================================================
// Clerk Configuration Options
// ============================================================================

/**
 * Client-side Clerk configuration options
 * 
 * Configuration for Clerk provider and client-side operations.
 * Used in ClerkProvider wrapper components.
 * 
 * Requirements: R1.1, 5.1
 */
export const clerkOptions = {
  // Appearance customization
  appearance: {
    baseTheme: undefined, // Will be set based on theme
    variables: {
      colorPrimary: 'hsl(var(--primary))',
      colorTextOnPrimaryBackground: 'hsl(var(--primary-foreground))',
      colorBackground: 'hsl(var(--background))',
      colorText: 'hsl(var(--foreground))',
      colorInputBackground: 'hsl(var(--input))',
      colorInputText: 'hsl(var(--foreground))',
      borderRadius: '0.5rem',
    },
    elements: {
      formButtonPrimary: 
        'bg-primary hover:bg-primary/90 text-primary-foreground',
      card: 'bg-card border border-border',
      headerTitle: 'text-card-foreground',
      headerSubtitle: 'text-muted-foreground',
    },
  },
  
  // Localization
  localization: {
    locale: 'zh-CN', // Chinese locale to match project
  },
  
  // Sign-in/up options
  signInUrl: '/admin/sign-in',
  signUpUrl: '/admin/sign-up', 
  afterSignInUrl: '/admin/dashboard',
  afterSignUpUrl: '/admin/dashboard',
  afterSignOutUrl: '/',
  
  // Session configuration
  sessionTokenTemplate: 'webvault-session',
  
  // Allow dev instance for development
  ...(process.env.NODE_ENV === 'development' && {
    allowedRedirectOrigins: ['http://localhost:3000'],
  }),
};

// ============================================================================
// Authentication Configuration
// ============================================================================

/**
 * Authentication routes and permissions configuration
 * 
 * Defines public routes, protected routes, and authentication settings.
 * Requirements: R1.1 (Admin-only authentication)
 */
export const authConfig = {
  // Public routes (no authentication required)
  publicRoutes: [
    '/',
    '/search',
    '/category/(.*)',
    '/collection/(.*)',
    '/blog',
    '/blog/(.*)',
    '/submit',
    '/api/public/(.*)',
  ],
  
  // Admin routes (authentication required)  
  adminRoutes: [
    '/admin/(.*)',
    '/api/admin/(.*)',
  ],
  
  // Ignored routes (Clerk middleware skip)
  ignoredRoutes: [
    '/api/webhooks/(.*)',
    '/_next/(.*)',
    '/favicon.ico',
    '/assets/(.*)',
    '/public/(.*)',
  ],
  
  // Session configuration (30-day persistence)
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    updateAge: 15 * 60, // Update session every 15 minutes
    strategy: 'jwt' as const,
  },
  
  // Security configuration
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
    requireTwoFactor: false, // Can be enabled later
    sessionTimeout: 30 * 60 * 1000, // 30 minutes of inactivity
  },
  
  // Redirect URLs
  redirects: {
    signIn: '/admin/dashboard',
    signOut: '/',
    unauthorized: '/unauthorized',
    error: '/admin/auth-error',
  },
} as const;

// ============================================================================
// Webhook Configuration
// ============================================================================

/**
 * Webhook configuration for Clerk events
 * 
 * Handles user lifecycle events from Clerk.
 * Used in API webhook handlers.
 */
export const webhookConfig = {
  secret: clerkWebhookSecret,
  events: {
    'user.created': 'handleUserCreated',
    'user.updated': 'handleUserUpdated', 
    'user.deleted': 'handleUserDeleted',
    'session.created': 'handleSessionCreated',
    'session.ended': 'handleSessionEnded',
  },
  tolerance: 300, // 5 minutes tolerance for timestamp validation
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get current user from server-side context
 * 
 * Utility function for server components and API routes.
 * Returns null if no authenticated user exists.
 */
export async function getServerUser() {
  try {
    const { userId } = await import('@clerk/nextjs/server').then(m => m.auth());
    
    if (!userId) {
      return null;
    }
    
    const user = await clerk.users.getUser(userId);
    return user;
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}

/**
 * Get current session from server-side context
 * 
 * Utility function for server components and API routes.
 * Returns null if no active session exists.
 */
export async function getServerSession() {
  try {
    const { sessionId } = await import('@clerk/nextjs/server').then(m => m.auth());
    
    if (!sessionId) {
      return null;
    }
    
    const session = await clerk.sessions.getSession(sessionId);
    return session;
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

/**
 * Check if current user is an admin
 * 
 * Utility function to verify admin privileges.
 * Returns false if no user or insufficient permissions.
 */
export async function isUserAdmin(): Promise<boolean> {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return false;
    }
    
    // Check if user has admin role in metadata or specific email domains
    const isAdmin = 
      user.publicMetadata?.role === 'admin' ||
      user.privateMetadata?.isAdmin === true ||
      // Add specific admin email domains if needed
      (process.env.ADMIN_EMAIL_DOMAINS && 
       process.env.ADMIN_EMAIL_DOMAINS.split(',').some(domain => 
         user.emailAddresses.some(email => email.emailAddress.endsWith(domain.trim()))
       ));
    
    return isAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Re-export Clerk types for convenience
 */
export type {
  ClerkAPIError,
  UserResource,
  SessionResource,
} from '@clerk/types';

export type ClerkClient = typeof clerk;

// ============================================================================
// Default Export
// ============================================================================

/**
 * Default export for backward compatibility
 */
export default clerk;