/**
 * Database Schema Exports
 * 
 * Unified export for all Drizzle schema definitions.
 * This follows the project convention of providing index.ts
 * files for clean imports across the application.
 */

// User profiles table and types
export { userProfiles } from './user-profiles';
export type { UserProfile, InsertUserProfile, UpdateUserProfile } from './user-profiles';

// Auth lockouts table and types
export { authLockouts } from './auth-lockouts';
export type { AuthLockout, InsertAuthLockout, UpdateAuthLockout } from './auth-lockouts';

// Categories table and types
export { categories } from './categories';
export type { Category, InsertCategory, UpdateCategory } from './categories';

// Tags table and types
export { tags } from './tags';
export type { Tag, InsertTag, UpdateTag } from './tags';