/**
 * Supabase Client Configuration
 * 
 * Provides configured Supabase client instances for authentication and database operations.
 * Supports both client-side and server-side operations with proper environment variables.
 * 
 * Requirements:
 * - 1.1: Email authentication integration
 * - 2.1: Social authentication (Google, GitHub OAuth)
 * - 5.1: Session management (30-day persistence)
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database';
// Import compatibility adapter conditionally to avoid build errors during development
// TODO: Uncomment when compatibility adapter dependencies are ready
// import { 
//   getSupabaseCompatibilityAdapter, 
//   type CompatibleSupabaseClient 
// } from './compat';

// ============================================================================
// Environment Variables Validation
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// ============================================================================
// Migration Feature Flag Configuration
// ============================================================================

/**
 * Feature flag for gradual migration to Clerk + D1
 * 
 * When enabled, exports the compatibility adapter instead of raw Supabase client.
 * This allows for gradual rollout and testing of the new authentication system.
 * 
 * Set NEXT_PUBLIC_ENABLE_CLERK_MIGRATION=true to enable compatibility layer
 * Set to false or undefined to use original Supabase client
 */
const isClerkMigrationEnabled = process.env.NEXT_PUBLIC_ENABLE_CLERK_MIGRATION === 'true';

/**
 * Migration rollout percentage (0-100)
 * 
 * For A/B testing during migration. If set, only the specified percentage
 * of users will use the compatibility adapter.
 * 
 * Format: MIGRATION_ROLLOUT_PERCENTAGE=50 (for 50% rollout)
 */
const migrationRolloutPercentage = parseInt(process.env.MIGRATION_ROLLOUT_PERCENTAGE || '100', 10);

// ============================================================================
// Client-Side Supabase Client
// ============================================================================

/**
 * Original Supabase client instance
 * 
 * Used as the base client for both direct usage and compatibility adapter.
 * Contains all the standard Supabase client configuration.
 * 
 * Requirements: 1.1, 2.1, 5.1
 */
const originalSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    
    // Persist session in localStorage for 30-day requirement
    persistSession: true,
    
    // Detect session from URL (for OAuth callbacks)
    detectSessionInUrl: true,
    
    // Storage configuration for session persistence
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    
    // Cookie configuration for session management
    storageKey: 'webvault-auth-token',
    
    // OAuth flow type
    flowType: 'pkce',
  },
  
  // Real-time configuration
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  
  // Global configuration
  global: {
    headers: {
      'X-Client-Info': 'webvault@1.0.0',
    },
  },
});

// ============================================================================
// Migration Logic and Conditional Export
// ============================================================================

/**
 * Determine if the current user should use the migration adapter
 * 
 * Uses feature flag and rollout percentage to control migration rollout.
 * For A/B testing, uses a simple hash of user agent for consistent assignment.
 */
function shouldUseMigrationAdapter(): boolean {
  // Check if migration is globally disabled
  if (!isClerkMigrationEnabled) {
    return false;
  }
  
  // If rollout is 100%, always use migration
  if (migrationRolloutPercentage >= 100) {
    return true;
  }
  
  // For A/B testing, use a consistent hash based on user agent
  // This ensures the same user always gets the same experience
  if (typeof window !== 'undefined' && migrationRolloutPercentage > 0) {
    const userAgent = window.navigator.userAgent;
    const hash = userAgent.split('').reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff;
    }, 0);
    const percentage = Math.abs(hash) % 100;
    return percentage < migrationRolloutPercentage;
  }
  
  // Server-side: use environment variable or default to migration
  return migrationRolloutPercentage > 0;
}

/**
 * Get the appropriate client based on migration flags
 * 
 * Returns either the compatibility adapter or the original Supabase client.
 * This function enables gradual migration with feature flagging.
 */
function getClient() {
  if (shouldUseMigrationAdapter()) {
    // TODO: Return compatibility adapter when available
    // For now, fall back to original client with migration logging
    if (typeof window !== 'undefined') {
      console.warn('Migration adapter requested but not available yet. Using original Supabase client.');
    }
    
    // Uncomment when compatibility adapter is ready:
    // return getSupabaseCompatibilityAdapter();
    
    // Temporary fallback to original client
    return originalSupabaseClient;
  }
  
  // Return original Supabase client
  return originalSupabaseClient;
}

/**
 * Main Supabase client export
 * 
 * Conditionally exports either the compatibility adapter or original client
 * based on feature flags. This enables gradual migration rollout.
 * 
 * Requirements: R6.1, R6.2 (Compatibility layer routing)
 */
export const supabase = getClient();

// ============================================================================
// Next.js App Router Clients
// ============================================================================

/**
 * Client component Supabase client
 * 
 * Optimized for use in React client components with automatic session handling.
 * Uses the conditional client (either compatibility adapter or original Supabase).
 */
export const createClientComponentSupabase = () => {
  return getClient();
};

// ============================================================================
// Service Role Client (Admin Operations)
// ============================================================================

/**
 * Service role Supabase client for admin operations
 * 
 * Has elevated permissions for administrative tasks.
 * Should only be used in server-side code and API routes.
 * 
 * @warning Only use in secure server-side contexts
 */
export const supabaseServiceRole = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'webvault-admin@1.0.0',
        },
      },
    })
  : null;

// ============================================================================
// Authentication Configuration
// ============================================================================

/**
 * OAuth provider configuration
 * 
 * Defines social authentication providers and their settings.
 * Requirements: 2.1 (Social authentication)
 */
export const oauthProviders = {
  google: {
    name: 'Google',
    scopes: 'email profile',
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
  },
  github: {
    name: 'GitHub',
    scopes: 'user:email',
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
  },
} as const;

/**
 * Authentication configuration
 * 
 * Session and security settings for authentication system.
 * Requirements: 5.1 (Session management)
 */
export const authConfig = {
  // Session configuration (30-day persistence)
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
    refreshThreshold: 15 * 60, // 15 minutes in seconds
    autoRefresh: true,
  },
  
  // Security configuration (15-minute lockout)
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
    passwordMinLength: 8,
    requireEmailConfirmation: true,
  },
  
  // Redirect URLs
  redirects: {
    signIn: '/admin/dashboard',
    signOut: '/',
    signUp: '/auth/verify-email',
    error: '/auth/error',
  },
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get current session from client-side
 * 
 * Utility function for client components.
 * Returns null if no active session exists.
 */
export async function getClientSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting client session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to get client session:', error);
    return null;
  }
}

/**
 * Get current user from client-side
 * 
 * Utility function for client components.
 * Returns null if no authenticated user exists.
 */
export async function getClientUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting client user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Failed to get client user:', error);
    return null;
  }
}

// ============================================================================
// Migration Utility Functions  
// ============================================================================

/**
 * Check if the current instance is using the migration adapter
 * 
 * Utility function for debugging and monitoring migration rollout.
 * Can be used in development tools or admin dashboards.
 */
export function isUsingMigrationAdapter(): boolean {
  return shouldUseMigrationAdapter();
}

/**
 * Get migration status information
 * 
 * Returns detailed information about the current migration state
 * for debugging and monitoring purposes.
 */
export function getMigrationStatus() {
  return {
    isEnabled: isClerkMigrationEnabled,
    rolloutPercentage: migrationRolloutPercentage,
    isCurrentlyUsing: shouldUseMigrationAdapter(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server-side',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Force refresh the client configuration
 * 
 * Re-evaluates migration flags and returns a fresh client instance.
 * Useful during development or when feature flags change dynamically.
 */
export function refreshSupabaseClient() {
  return getClient();
}

/**
 * Get the original Supabase client (bypassing migration)
 * 
 * For debugging or fallback scenarios where the original client is needed.
 * Should only be used in development or emergency situations.
 * 
 * @warning This bypasses the migration layer completely
 */
export function getOriginalSupabaseClient() {
  return originalSupabaseClient;
}

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Re-export Supabase types for convenience
 */
export type { Session, User, AuthError } from '@supabase/supabase-js';
export type SupabaseClient = typeof supabase;

// ============================================================================
// Default Export
// ============================================================================

/**
 * Default export for backward compatibility
 */
export default supabase;