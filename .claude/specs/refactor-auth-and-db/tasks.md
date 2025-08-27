# Implementation Plan - Authentication and Database Migration

## Task Overview
将 WebVault 从 Supabase (Auth + PostgreSQL) 迁移到 Clerk + Cloudflare D1，采用渐进式迁移策略，通过兼容层最小化代码改动。

## Steering Document Compliance
- 遵循 Feature First Architecture (structure.md)
- 使用 TypeScript 严格模式 (tech.md)
- 模块化组件设计，统一导出接口

## Atomic Task Requirements
**每个任务符合以下标准：**
- **文件范围**: 涉及 1-3 个相关文件
- **时间盒**: 15-30 分钟可完成
- **单一目标**: 一个可测试的输出
- **明确文件**: 指定要创建/修改的确切文件
- **代理友好**: 清晰的输入/输出，最小上下文切换

## Tasks

### Phase 1: Environment Setup (环境准备)

- [x] 1. Install Clerk dependencies
  - File: package.json
  - Run: npm install @clerk/nextjs @clerk/clerk-sdk-node
  - Add Clerk packages to dependencies
  - Purpose: Enable Clerk authentication integration
  - _Requirements: R1.1_

- [x] 2. Install Drizzle ORM dependencies
  - File: package.json
  - Run: npm install drizzle-orm drizzle-kit
  - Add Drizzle packages to dependencies
  - Purpose: Enable D1 database access with Drizzle
  - _Requirements: R2.1, R4.2_

- [x] 3. Create Clerk configuration file
  - File: src/lib/clerk.ts (new)
  - Import and configure Clerk client
  - Export clerk instance for use across app
  - Purpose: Centralize Clerk configuration
  - _Leverage: src/lib/supabase.ts structure_
  - _Requirements: R1.1_

- [x] 4. Add Clerk environment variables to template
  - File: .env.example (modify)
  - Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  - Add CLERK_SECRET_KEY
  - Purpose: Document Clerk authentication variables
  - _Requirements: R1.1_

- [x] 5. Add Cloudflare D1 environment variables to template
  - File: .env.example (modify)
  - Add CLOUDFLARE_D1_DATABASE_ID
  - Add CLOUDFLARE_ACCOUNT_ID
  - Add CLOUDFLARE_API_TOKEN
  - Purpose: Document D1 database connection variables
  - _Requirements: R2.1_

### Phase 2: Clerk Authentication Service

- [x] 6. Create ClerkAuthService class structure
  - File: src/features/auth/services/ClerkAuthService.ts (new)
  - Define class implementing AuthService interface
  - Add constructor and private properties
  - Purpose: Create authentication service foundation
  - _Leverage: src/features/auth/services/AuthService.interface.ts_
  - _Requirements: R3.1_

- [x] 7. Implement ClerkAuthService signIn method
  - File: src/features/auth/services/ClerkAuthService.ts
  - Implement email/password authentication
  - Map Clerk response to AuthSession type
  - Purpose: Enable email/password login via Clerk
  - _Leverage: src/features/auth/services/SupabaseAuthService.ts_
  - _Requirements: R1.2, R3.2_

- [x] 8. Implement ClerkAuthService social login
  - File: src/features/auth/services/ClerkAuthService.ts
  - Add signInWithProvider for Google/GitHub
  - Handle OAuth redirects
  - Purpose: Enable social authentication
  - _Leverage: src/features/auth/types/index.ts (SocialProvider)_
  - _Requirements: R1.3_

- [x] 9. Implement ClerkAuthService session management
  - File: src/features/auth/services/ClerkAuthService.ts
  - Add getSession, refreshSession, signOut methods
  - Handle 30-day session persistence
  - Purpose: Complete session lifecycle management
  - _Requirements: R1.4, R1.6, R3.4_

- [x] 10. Implement ClerkAuthService error mapping
  - File: src/features/auth/services/ClerkAuthService.ts
  - Create mapClerkError utility function
  - Map Clerk errors to AuthError types
  - Purpose: Maintain consistent error handling
  - _Leverage: src/features/auth/types/index.ts (AuthError)_
  - _Requirements: R3.3_

- [x] 11. Create Clerk middleware integration
  - File: src/middleware.ts (modify)
  - Import and configure authMiddleware from @clerk/nextjs
  - Set up protected routes
  - Purpose: Protect admin routes with Clerk
  - _Requirements: R1.1, R6.1_

### Phase 3: Database Layer with Drizzle

- [x] 12. Create Drizzle configuration
  - File: drizzle.config.ts (new)
  - Configure D1 database connection
  - Set migration output directory
  - Purpose: Configure Drizzle for D1
  - _Requirements: R2.1_

- [x] 13. Define Drizzle schema for user_profiles
  - File: src/lib/db/schema/user-profiles.ts (new)
  - Define user_profiles table with Drizzle syntax
  - Add indexes for email
  - Purpose: Create user profile data model
  - _Leverage: src/lib/types/database.ts (UserProfile)_
  - _Requirements: R2.1, R2.2_

- [x] 14. Define Drizzle schema for auth_lockouts
  - File: src/lib/db/schema/auth-lockouts.ts (new)
  - Define auth_lockouts table
  - Add indexes for email
  - Purpose: Track authentication failures
  - _Leverage: src/lib/types/database.ts (AuthLockout)_
  - _Requirements: R1.5, R2.1_

- [x] 15. Create D1 database client
  - File: src/lib/d1.ts (new)
  - Initialize Drizzle with D1 binding
  - Export database client instance
  - Purpose: Provide D1 database access
  - _Leverage: src/lib/supabase.ts structure_
  - _Requirements: R4.1_

- [x] 16. Create D1DataService class
  - File: src/lib/services/D1DataService.ts (new)
  - Implement query, insert, update, delete methods
  - Add transaction support
  - Purpose: Abstract D1 database operations
  - _Requirements: R4.1, R4.2, R4.4_

- [x] 17. Implement D1DataService retry logic
  - File: src/lib/services/D1DataService.ts
  - Add automatic retry on connection failure
  - Implement exponential backoff
  - Purpose: Handle transient connection issues
  - _Requirements: R4.6_

- [x] 18. Implement D1DataService fallback to cache
  - File: src/lib/services/D1DataService.ts
  - Add read-only cache mode on repeated failures
  - Notify admin when falling back to cache
  - Purpose: Provide degraded service on connection issues
  - _Requirements: R4.7_

- [x] 19. Create UUID generation utility
  - File: src/lib/utils/uuid.ts (new)
  - Implement crypto.randomUUID() wrapper
  - Add UUID validation function
  - Purpose: Replace PostgreSQL UUID generation
  - _Requirements: R2.4_

- [x] 19. Create JSON field handling utilities
  - File: src/lib/utils/json-fields.ts (new)
  - Implement serialize/deserialize functions
  - Add type-safe JSON parsing
  - Purpose: Handle JSON storage in TEXT fields
  - _Requirements: R2.5_

### Phase 4: Compatibility Layer

- [x] 20. Create SupabaseCompatibilityAdapter
  - File: src/lib/compat/SupabaseCompatibilityAdapter.ts (new)
  - Define adapter class structure
  - Implement auth property proxy
  - Purpose: Provide backward compatibility
  - _Requirements: R6.1, R6.2_

- [x] 21. Implement auth method routing in adapter
  - File: src/lib/compat/SupabaseCompatibilityAdapter.ts
  - Route auth.signIn to ClerkAuthService
  - Route auth.signOut to ClerkAuthService
  - Purpose: Redirect auth calls to Clerk
  - _Leverage: src/features/auth/services/ClerkAuthService.ts_
  - _Requirements: R6.1_

- [x] 22. Implement database method routing in adapter
  - File: src/lib/compat/SupabaseCompatibilityAdapter.ts
  - Route from() calls to D1DataService
  - Implement select, insert, update, delete chaining
  - Purpose: Redirect database calls to D1
  - _Leverage: src/lib/services/D1DataService.ts_
  - _Requirements: R6.2_

- [x] 23. Create empty realtime implementation
  - File: src/lib/compat/SupabaseCompatibilityAdapter.ts
  - Return no-op functions for realtime subscriptions
  - Log deprecation warnings
  - Purpose: Handle realtime calls gracefully
  - _Requirements: R6.3_

- [x] 24. Implement app-layer RLS replacement
  - File: src/lib/security/row-level-security.ts (new)
  - Create permission checking middleware
  - Implement user-based data filtering
  - Purpose: Replace PostgreSQL RLS with app-layer security
  - _Requirements: R6.4_

- [x] 25. Add incompatibility logging
  - File: src/lib/compat/migration-logger.ts (new)
  - Log all incompatible feature usage
  - Generate migration recommendations
  - Purpose: Track and guide migration issues
  - _Requirements: R6.5_

- [x] 26. Update supabase export to use adapter
  - File: src/lib/supabase.ts (modify)
  - Conditionally export adapter or original client
  - Use feature flag for gradual rollout
  - Purpose: Enable gradual migration
  - _Leverage: existing supabase exports_
  - _Requirements: R6.1, R6.2_

### Phase 5: Migration Scripts

- [x] 27. Create Supabase user export script
  - File: scripts/migration/export-supabase-users.ts (new)
  - Connect to Supabase admin API
  - Export users to JSON file
  - Purpose: Extract existing user data
  - _Requirements: R5.1_

- [x] 28. Create Clerk user import script
  - File: scripts/migration/import-to-clerk.ts (new)
  - Read exported user JSON
  - Create users in Clerk via API
  - Purpose: Migrate users to Clerk
  - _Requirements: R5.1_

- [x] 29. Create PostgreSQL to SQLite DDL converter
  - File: scripts/migration/convert-ddl.ts (new)
  - Parse PostgreSQL schema
  - Generate equivalent SQLite DDL
  - Purpose: Convert database schema
  - _Requirements: R5.2_

- [x] 30. Create D1 schema migration script
  - File: scripts/migration/migrate-to-d1.ts (new)
  - Execute DDL on D1 database
  - Verify table creation
  - Purpose: Initialize D1 database
  - _Requirements: R2.1, R5.2_

- [x] 31. Create data export from Supabase script
  - File: scripts/migration/export-data.ts (new)
  - Connect to Supabase database
  - Export all tables to JSON files
  - Purpose: Extract all existing data
  - _Requirements: R2.6_

- [x] 32. Create batch data import to D1 script
  - File: scripts/migration/import-data.ts (new)
  - Read exported JSON files
  - Import data in 100MB batches
  - Show progress for each batch
  - Purpose: Import data with progress tracking
  - _Requirements: R2.7, R5.3_

- [x] 33. Create migration resume capability
  - File: scripts/migration/resume-migration.ts (new)
  - Track migration state in checkpoint file
  - Support resuming from last successful batch
  - Handle batch failure recovery
  - Purpose: Enable migration resume on failure
  - _Requirements: R2.8_

- [x] 34. Create migration validation script
  - File: scripts/migration/validate-migration.ts (new)
  - Compare record counts
  - Verify data integrity
  - Generate migration report
  - Purpose: Ensure successful migration
  - _Requirements: R5.4_

### Phase 6: Testing and Integration

- [x] 35. Create ClerkAuthService unit tests
  - File: src/features/auth/services/__tests__/ClerkAuthService.test.ts (new)
  - Test all authentication methods
  - Mock Clerk SDK responses
  - Purpose: Ensure auth service reliability
  - _Leverage: src/features/auth/services/__tests__/SupabaseAuthService.test.ts_
  - _Requirements: R3.1, R3.2_

- [x] 36. Create D1DataService unit tests
  - File: src/lib/services/__tests__/D1DataService.test.ts (new)
  - Test CRUD operations
  - Test retry logic
  - Purpose: Verify database operations
  - _Requirements: R4.1, R4.6_

- [x] 37. Create compatibility adapter tests
  - File: src/lib/compat/__tests__/SupabaseCompatibilityAdapter.test.ts (new)
  - Test method routing
  - Verify backward compatibility
  - Purpose: Ensure seamless migration
  - _Requirements: R6.1, R6.2_

- [x] 38. Update auth store to use ClerkAuthService
  - File: src/features/auth/stores/auth-store.ts (modify)
  - Import ClerkAuthService instead of SupabaseAuthService
  - Update service initialization
  - Purpose: Switch auth store to Clerk
  - _Leverage: existing store structure_
  - _Requirements: R3.1_

- [x] 39. Test basic authentication flow
  - File: tests/e2e/auth-basic.test.ts (new)
  - Test login with email/password
  - Test logout functionality
  - Purpose: Verify basic auth operations
  - _Requirements: R1.1, R1.2, R1.6_

- [x] 40. Test social authentication flow
  - File: tests/e2e/auth-social.test.ts (new)
  - Test Google OAuth login
  - Test GitHub OAuth login
  - Purpose: Verify social authentication
  - _Requirements: R1.3_

- [x] 41. Test session persistence and lockout
  - File: tests/e2e/auth-session.test.ts (new)
  - Test 30-day session persistence
  - Test account lockout after 5 failures
  - Purpose: Verify session management
  - _Requirements: R1.4, R1.5_

- [x] 42. Create migration rollback script
  - File: scripts/migration/rollback.ts (new)
  - Switch environment variables back
  - Restore Supabase configuration
  - Purpose: Enable quick rollback if needed
  - _Requirements: R5.5_

### Phase 7: Documentation and Cleanup

- [x] 43. Update environment variables documentation
  - File: README.md (modify)
  - Document new Clerk variables
  - Document Cloudflare D1 setup
  - Purpose: Help future developers
  - _Requirements: All_

- [x] 44. Create migration guide
  - File: docs/migration-guide.md (new)
  - Document step-by-step migration process
  - Include troubleshooting section
  - Purpose: Document migration process
  - _Requirements: All_

- [x] 45. Remove deprecated Supabase code
  - File: src/features/auth/services/SupabaseAuthService.ts (delete)
  - Remove after confirming Clerk works
  - Clean up unused imports
  - Purpose: Remove legacy code
  - _Requirements: All_

- [x] 46. Update type definitions
  - File: src/lib/types/database.ts (modify)
  - Remove Supabase-specific types
  - Add D1/Drizzle types
  - Purpose: Clean up type system
  - _Requirements: All_

- [x] 47. Create performance verification script
  - File: tests/performance/perf-test.ts (new)
  - Measure auth response times (< 500ms)
  - Measure database query times (< 100ms)
  - Test 100 concurrent users
  - Purpose: Verify performance requirements
  - _Requirements: Performance NFRs_