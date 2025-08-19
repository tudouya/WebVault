/**
 * Database Type Definitions
 * 
 * TypeScript definitions for Supabase database schema.
 * Auto-generated types should replace this file when database schema is finalized.
 */

/**
 * User Profile Interface
 * Represents admin user information stored in user_profiles table
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: 'admin';
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Authentication Lockout Interface
 * Represents lockout information for failed authentication attempts
 */
export interface AuthLockout {
  email: string;
  attempt_count: number;
  locked_until: string | null;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar: string | null;
          role: 'admin';
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar?: string | null;
          role?: 'admin';
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar?: string | null;
          role?: 'admin';
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      auth_lockouts: {
        Row: {
          id: string;
          email: string;
          attempt_count: number;
          locked_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          attempt_count?: number;
          locked_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          attempt_count?: number;
          locked_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'admin';
    };
  };
}