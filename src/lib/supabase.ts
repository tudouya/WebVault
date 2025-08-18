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
// Client-Side Supabase Client
// ============================================================================

/**
 * Client-side Supabase client for browser usage
 * 
 * Used in React components and client-side operations.
 * Automatically handles authentication state and session management.
 * 
 * Requirements: 1.1, 2.1, 5.1
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
// Next.js App Router Clients
// ============================================================================

/**
 * Client component Supabase client
 * 
 * Optimized for use in React client components with automatic session handling.
 * Uses the main supabase client for now, server components will be handled separately.
 */
export const createClientComponentSupabase = () => {
  return supabase;
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