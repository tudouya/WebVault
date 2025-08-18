// Authentication Components
// 认证组件统一导出

// Core auth components
export { AuthLayout } from './AuthLayout';

// Auth form components
export { LoginForm } from './LoginForm';
export { LoginPageFooter } from './LoginPageFooter';

// Social auth components
export { 
  SocialAuthButtons,
  CompactSocialAuthButtons,
  StackedSocialAuthButtons 
} from './SocialAuthButtons';

// Page components
export { LoginPage } from './LoginPage';
export { PasswordResetPage } from './PasswordResetPage';
export { PasswordConfirmPage } from './PasswordConfirmPage';

// Error boundary components
export { 
  AuthErrorBoundary,
  DefaultAuthErrorFallback,
  withAuthErrorBoundary,
  useAuthErrorHandler,
  useAuthErrorBoundary,
  detectAuthErrorType,
  isAuthRelatedError,
  AuthErrorType
} from './AuthErrorBoundary';

export type {
  AuthErrorInfo,
  AuthErrorBoundaryProps,
  AuthErrorFallbackProps
} from './AuthErrorBoundary';

// Auth guard components
export { 
  AuthGuard,
  useAuthGuard,
  withAuthGuard,
  AdminOnly,
  AuthRequired,
  AuthOptional,
  AuthGuardWithErrorBoundary,
  DefaultLoadingFallback,
  DefaultPermissionDeniedFallback,
  DefaultAuthRequiredFallback
} from './AuthGuard';

export type {
  AuthGuardProps,
  UseAuthGuardOptions,
  UseAuthGuardResult
} from './AuthGuard';

// Placeholder export to make this a valid module
export const AUTH_COMPONENTS_PLACEHOLDER = 'AUTH_COMPONENTS';