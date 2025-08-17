# Implementation Plan - Login Page UI

## Task Overview

实现基于设计图 `8_Login.png` 的WebVault登录页面UI，采用Next.js 15 + shadcn/ui + Supabase Auth的技术栈。按照Feature-First架构组织代码，确保精确匹配设计规范的视觉效果，并提供完整的认证功能。

## Steering Document Compliance

**Architecture Pattern (structure.md)**:
- 遵循Feature-First架构，创建独立的 `src/features/auth/` 模块
- 利用现有的shadcn/ui组件和HSL主题系统
- 集成现有的表单验证和状态管理模式

**Technical Standards (tech.md)**:
- Next.js 15 App Router + TypeScript严格模式
- Zustand v5.0.7状态管理，React Hook Form v7.62.0表单处理，Zod v4.0.17验证
- 复用现有XSS防护和验证工具 (`src/features/websites/schemas/`)
- 集成Supabase Auth服务和会话管理策略

## Atomic Task Requirements

**Each task must meet these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Task Format Guidelines

- Use checkbox format: `- [ ] Task number. Task description`
- **Specify files**: Always include exact file paths to create/modify
- **Include implementation details** as bullet points
- Reference requirements using: `_Requirements: X.Y, Z.A_`
- Reference existing code to leverage using: `_Leverage: path/to/file.ts, path/to/component.tsx_`
- Focus only on coding tasks (no deployment, user testing, etc.)
- **Avoid broad terms**: No "system", "integration", "complete" in task titles

## Tasks

### Phase 1: 基础架构和类型定义

- [ ] 1. Create auth feature module structure
  - File: src/features/auth/index.ts
  - Create main auth module barrel export file
  - Set up clean imports for all auth-related components and hooks
  - Purpose: Establish Feature-First architecture foundation
  - _Leverage: src/features/websites/index.ts_
  - _Requirements: Architecture alignment_

- [ ] 2. Create auth types and interfaces
  - File: src/features/auth/types/index.ts
  - Define AuthUser, AuthSession, AuthError, SessionConfig interfaces
  - Add AuthFormData and LoginPageConfig types
  - Purpose: Establish type safety for auth implementation
  - _Leverage: TypeScript strict mode patterns_
  - _Requirements: 1.1, 2.1, 5.1_

- [ ] 3. Create auth form validation schemas
  - File: src/features/auth/schemas/auth-schemas.ts
  - Extend existing form validation patterns with auth-specific rules
  - Add authFormSchema with email/password validation and XSS protection
  - Purpose: Secure form input validation with existing patterns
  - _Leverage: src/features/websites/schemas/index.ts (detectMaliciousContent, safeStringValidator)_
  - _Requirements: 1.1, 6.1_

### Phase 2: 核心认证服务

- [ ] 4. Create AuthService interface definition
  - File: src/features/auth/services/AuthService.interface.ts
  - Define complete AuthService contract with all authentication methods
  - Include session management, social auth, and password reset interfaces
  - Purpose: Establish service layer contract for dependency injection
  - _Leverage: design.md AuthService interface_
  - _Requirements: 2.1, 5.1_

- [ ] 5. Create Supabase AuthService implementation
  - File: src/features/auth/services/SupabaseAuthService.ts
  - Implement AuthService interface using Supabase Auth SDK
  - Add error handling with consistent error mapping
  - Purpose: Concrete authentication service implementation
  - _Leverage: src/lib/supabase.ts_
  - _Requirements: 1.1, 2.1, 5.1_

- [ ] 6. Create SessionManager component
  - File: src/features/auth/services/SessionManager.ts
  - Implement session persistence, token refresh, and lockout logic
  - Add 30-day persistence and 15-minute lockout mechanisms
  - Purpose: Handle session lifecycle and security policies
  - _Leverage: existing localStorage patterns_
  - _Requirements: 5.1_

### Phase 3: 状态管理和Hooks

- [ ] 7. Create auth store with Zustand
  - File: src/features/auth/stores/auth-store.ts
  - Implement auth state management with user, session, loading, error states
  - Add persistence configuration for non-sensitive data only
  - Purpose: Centralized auth state with secure storage strategy
  - _Leverage: src/stores/theme-store.ts (Zustand patterns)_
  - _Requirements: 5.1_

- [ ] 8. Create useAuth context and hook
  - File: src/features/auth/hooks/useAuth.ts
  - Implement auth context provider and consumer hook
  - Add session validation and automatic refresh logic
  - Purpose: Provide auth state access throughout app
  - _Leverage: React Context patterns_
  - _Requirements: 5.1_

- [ ] 9. Create useAuthForm hook
  - File: src/features/auth/hooks/useAuthForm.ts
  - Implement form handling logic with React Hook Form integration
  - Add validation, submission, and error handling
  - Purpose: Encapsulate login form business logic
  - _Leverage: React Hook Form v7.62.0, auth-schemas.ts_
  - _Requirements: 1.1_

- [ ] 10. Create useSocialAuth hook
  - File: src/features/auth/hooks/useSocialAuth.ts
  - Implement OAuth flow handling for Google and GitHub
  - Add provider-specific error handling and state management
  - Purpose: Manage social authentication flows
  - _Leverage: SupabaseAuthService.ts_
  - _Requirements: 2.1_

### Phase 4: UI组件实现

- [ ] 11. Create AuthLayout component
  - File: src/features/auth/components/AuthLayout.tsx
  - Implement responsive layout with brand logo and theme support
  - Add mobile-responsive design matching design specifications
  - Purpose: Provide consistent layout for auth pages
  - _Leverage: src/components/ui/ (Card, shadcn components)_
  - _Requirements: 9.1, 11.1_

- [ ] 12. Create LoginForm component
  - File: src/features/auth/components/LoginForm.tsx
  - Implement email/password form with precise visual specifications
  - Add loading states, validation feedback, and error handling
  - Purpose: Core login functionality with exact design match
  - _Leverage: src/components/ui/Input, src/components/ui/Button, useAuthForm hook_
  - _Requirements: 1.1, 6.1, 7.1, 8.1_

- [ ] 13. Create SocialAuthButtons component
  - File: src/features/auth/components/SocialAuthButtons.tsx
  - Implement Google and GitHub login buttons with icons
  - Add loading states and OAuth flow integration
  - Purpose: Social authentication UI matching design
  - _Leverage: src/components/ui/Button, Lucide React icons, useSocialAuth hook_
  - _Requirements: 2.1, 8.1_

- [ ] 14. Create LoginPageFooter component
  - File: src/features/auth/components/LoginPageFooter.tsx
  - Implement "Don't have an account? Sign up" navigation
  - Add legal links and consistent styling
  - Purpose: Registration navigation matching requirements
  - _Leverage: Next.js Link, design.md LoginPageFooter interface_
  - _Requirements: 4.1_

- [ ] 15a. Create LoginPage layout structure
  - File: src/features/auth/components/LoginPage.tsx
  - Create main container component with responsive grid layout
  - Add theme provider integration and basic responsive breakpoints
  - Purpose: Establish login page layout foundation
  - _Leverage: AuthLayout, src/app/globals.css (responsive patterns)_
  - _Requirements: 9.1, 11.1_

- [ ] 15b. Integrate child components into LoginPage
  - File: src/features/auth/components/LoginPage.tsx (continue)
  - Compose LoginForm, SocialAuthButtons, LoginPageFooter components
  - Add component prop passing and event handling coordination
  - Purpose: Connect all login UI components with proper data flow
  - _Leverage: LoginForm, SocialAuthButtons, LoginPageFooter components_
  - _Requirements: 6.1, 7.1, 8.1_

### Phase 5: 路由和页面集成

- [ ] 16. Create login page route
  - File: src/app/(auth)/login/page.tsx
  - Implement Next.js page component with LoginPage integration
  - Add metadata and SEO configuration
  - Purpose: Login page route implementation
  - _Leverage: LoginPage component, Next.js 15 App Router_
  - _Requirements: Architecture alignment_

- [ ] 17. Create auth route group layout
  - File: src/app/(auth)/layout.tsx
  - Implement auth-specific layout with theme and providers
  - Add auth context provider and global auth state
  - Purpose: Auth route group organization
  - _Leverage: AuthLayout, useAuth context_
  - _Requirements: Architecture alignment_

- [ ] 18. Add auth middleware integration
  - File: src/middleware.ts (modify existing)
  - Add specific auth route patterns for /login, /signup paths
  - Implement session validation for protected routes only
  - Purpose: Route protection for auth-specific paths
  - _Leverage: existing middleware structure_
  - _Requirements: 5.1_

### Phase 6: 样式和主题集成

- [ ] 19. Create auth-specific styles
  - File: src/features/auth/styles/auth.css
  - Implement precise color mappings and component styles
  - Add responsive breakpoints and spacing systems
  - Purpose: Exact visual specification implementation
  - _Leverage: src/app/globals.css (HSL theme system)_
  - _Requirements: 6.1-11.1_

- [ ] 20. Update global CSS with auth theme variables
  - File: src/app/globals.css (modify existing)
  - Add auth-specific HSL theme variables from design specification
  - Ensure color system integration with existing themes
  - Purpose: Theme system extension for auth colors
  - _Leverage: existing HSL theme system_
  - _Requirements: 6.1_

### Phase 7: 错误处理和安全

- [ ] 21. Create AuthErrorBoundary component
  - File: src/features/auth/components/AuthErrorBoundary.tsx
  - Create auth-specific error boundary with session clearing
  - Add auth error categorization and user-friendly messages
  - Purpose: Robust error handling for auth flows
  - _Leverage: React ErrorBoundary patterns_
  - _Requirements: Error handling from design.md_

- [ ] 22. Create auth utility functions
  - File: src/features/auth/utils/auth-utils.ts
  - Implement token validation, session helpers, and security utilities
  - Add password strength validation and email domain checking
  - Purpose: Reusable auth utility functions
  - _Leverage: existing validation patterns_
  - _Requirements: 1.1, 5.1_

### Phase 8: 密码重置功能实现

- [ ] 23. Create PasswordResetPage component
  - File: src/features/auth/components/PasswordResetPage.tsx
  - Implement email input form for password reset request
  - Add email validation and submission handling with loading states
  - Purpose: Handle forgot password flow initiation
  - _Leverage: LoginForm component patterns, useAuthForm hook, auth-schemas.ts_
  - _Requirements: 3.1, 3.2_

- [ ] 24. Create PasswordConfirmPage component
  - File: src/features/auth/components/PasswordConfirmPage.tsx
  - Implement new password input form with confirmation field
  - Add token validation and password reset completion logic
  - Purpose: Complete password reset workflow
  - _Leverage: LoginForm validation patterns, auth-schemas.ts_
  - _Requirements: 3.3_

- [ ] 25. Create usePasswordReset hook
  - File: src/features/auth/hooks/usePasswordReset.ts
  - Implement password reset flow state management
  - Add email sending, token validation, and password update logic
  - Purpose: Encapsulate password reset business logic
  - _Leverage: SupabaseAuthService.ts, React Hook Form patterns_
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 26. Create AuthGuard component
  - File: src/features/auth/components/AuthGuard.tsx
  - Implement route-level authentication protection component
  - Add loading states, fallback rendering, and redirect logic
  - Purpose: Protect routes requiring authentication
  - _Leverage: useAuth hook, Next.js useRouter_
  - _Requirements: 5.1_

### Phase 9: 测试实现

- [ ] 27. Create LoginForm component tests
  - File: src/features/auth/components/__tests__/LoginForm.test.tsx
  - Write unit tests for form validation, submission, and error states
  - Test accessibility and user interactions
  - Purpose: Ensure form reliability and behavior
  - _Leverage: existing test patterns_
  - _Requirements: Testing strategy from design.md_

- [ ] 28. Create auth hooks unit tests
  - File: src/features/auth/hooks/__tests__/useAuth.test.ts
  - Write tests for auth state management and session handling
  - Mock Supabase Auth service for isolated testing
  - Purpose: Verify auth logic correctness
  - _Leverage: existing hook testing patterns_
  - _Requirements: Testing strategy from design.md_

- [ ] 29. Create integration tests for auth flow
  - File: src/features/auth/__tests__/auth-integration.test.tsx
  - Write end-to-end tests for complete login workflow
  - Test OAuth flows and error recovery scenarios
  - Purpose: Verify complete auth system integration
  - _Leverage: existing integration test patterns_
  - _Requirements: Testing strategy from design.md_