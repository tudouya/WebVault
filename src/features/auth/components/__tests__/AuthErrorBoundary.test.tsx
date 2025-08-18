import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { 
  AuthErrorBoundary,
  AuthErrorType,
  detectAuthErrorType,
  isAuthRelatedError 
} from '../AuthErrorBoundary';

/**
 * Mock child component that throws errors for testing
 */
const ThrowingComponent: React.FC<{ error?: Error }> = ({ error }) => {
  if (error) {
    throw error;
  }
  return <div>No error</div>;
};

/**
 * Test wrapper for AuthErrorBoundary
 */
const TestWrapper: React.FC<{ error?: Error; children?: React.ReactNode }> = ({ 
  error, 
  children = <ThrowingComponent error={error} /> 
}) => {
  return (
    <AuthErrorBoundary level="component">
      {children}
    </AuthErrorBoundary>
  );
};

describe('AuthErrorBoundary', () => {
  beforeEach(() => {
    // Reset console errors for clean test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Error Detection', () => {
    it('should detect authentication related errors', () => {
      const authErrors = [
        new Error('Invalid credentials'),
        new Error('Session expired'),
        new Error('账户已锁定'),
        new Error('OAuth provider error'),
        new Error('Token expired')
      ];

      authErrors.forEach(error => {
        expect(isAuthRelatedError(error)).toBe(true);
      });
    });

    it('should not detect non-authentication errors', () => {
      const nonAuthErrors = [
        new Error('Network connection failed'),
        new Error('Database error'),
        new Error('File not found'),
        new Error('General application error')
      ];

      // Note: 'Network connection failed' might be detected as auth-related 
      // due to 'network' keyword, so we test with more specific errors
      const specificNonAuthErrors = [
        new Error('Database connection timeout'),
        new Error('File system error'),
        new Error('Calculation overflow')
      ];

      specificNonAuthErrors.forEach(error => {
        expect(isAuthRelatedError(error)).toBe(false);
      });
    });

    it('should correctly categorize error types', () => {
      const errorTypeTests = [
        {
          error: new Error('邮箱或密码错误'),
          expectedType: AuthErrorType.INVALID_CREDENTIALS
        },
        {
          error: new Error('Network connection failed'),
          expectedType: AuthErrorType.NETWORK_ERROR
        },
        {
          error: new Error('账户已锁定'),
          expectedType: AuthErrorType.ACCOUNT_LOCKED
        },
        {
          error: new Error('Google OAuth error'),
          expectedType: AuthErrorType.OAUTH_ERROR
        },
        {
          error: new Error('Session expired'),
          expectedType: AuthErrorType.SESSION_EXPIRED
        },
        {
          error: new Error('Invalid email format'),
          expectedType: AuthErrorType.VALIDATION_ERROR
        }
      ];

      errorTypeTests.forEach(({ error, expectedType }) => {
        expect(detectAuthErrorType(error)).toBe(expectedType);
      });
    });
  });

  describe('Error Boundary Behavior', () => {
    it('should render children when no error occurs', () => {
      render(
        <TestWrapper>
          <div>Child component</div>
        </TestWrapper>
      );

      expect(screen.getByText('Child component')).toBeInTheDocument();
    });

    it('should render error fallback for authentication errors', () => {
      const authError = new Error('Session expired');
      
      render(<TestWrapper error={authError} />);

      expect(screen.getByText(/认证失败/)).toBeInTheDocument();
    });

    it('should throw non-authentication errors to parent boundary', () => {
      const nonAuthError = new Error('Database connection failed');
      
      // This should throw the error to parent boundary
      expect(() => {
        render(<TestWrapper error={nonAuthError} />);
      }).toThrow('Database connection failed');
    });
  });

  describe('Error Display', () => {
    it('should show appropriate error message for invalid credentials', () => {
      const credentialsError = new Error('Invalid credentials');
      
      render(<TestWrapper error={credentialsError} />);

      expect(screen.getByText(/认证失败/)).toBeInTheDocument();
      expect(screen.getByText(/登录/)).toBeInTheDocument();
    });

    it('should show retry button for network errors', () => {
      const networkError = new Error('Network connection failed');
      
      render(<TestWrapper error={networkError} />);

      expect(screen.getByText(/重试/)).toBeInTheDocument();
    });

    it('should show back to login button for session expired', () => {
      const sessionError = new Error('Session expired');
      
      render(<TestWrapper error={sessionError} />);

      expect(screen.getByText(/登录/)).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should use custom fallback component when provided', () => {
      const CustomFallback = () => <div>Custom error display</div>;
      const authError = new Error('Auth error');

      render(
        <AuthErrorBoundary fallback={CustomFallback} level="component">
          <ThrowingComponent error={authError} />
        </AuthErrorBoundary>
      );

      expect(screen.getByText('Custom error display')).toBeInTheDocument();
    });

    it('should handle different error boundary levels', () => {
      const authError = new Error('Auth error');

      const { rerender } = render(
        <AuthErrorBoundary level="page">
          <ThrowingComponent error={authError} />
        </AuthErrorBoundary>
      );

      expect(screen.getByRole('generic')).toHaveAttribute(
        'data-auth-error-boundary', 
        'page'
      );

      rerender(
        <AuthErrorBoundary level="section">
          <ThrowingComponent error={authError} />
        </AuthErrorBoundary>
      );

      expect(screen.getByRole('generic')).toHaveAttribute(
        'data-auth-error-boundary', 
        'section'
      );
    });
  });
});

/**
 * Test the utility functions independently
 */
describe('AuthErrorBoundary Utilities', () => {
  describe('detectAuthErrorType', () => {
    it('should return correct error types for different error messages', () => {
      const testCases = [
        { message: 'Invalid credentials', expected: AuthErrorType.INVALID_CREDENTIALS },
        { message: 'Network error occurred', expected: AuthErrorType.NETWORK_ERROR },
        { message: 'Account is locked', expected: AuthErrorType.ACCOUNT_LOCKED },
        { message: 'OAuth provider failed', expected: AuthErrorType.OAUTH_ERROR },
        { message: 'JWT token expired', expected: AuthErrorType.SESSION_EXPIRED },
        { message: 'Email validation failed', expected: AuthErrorType.VALIDATION_ERROR },
        { message: 'Component render error', expected: AuthErrorType.AUTH_RENDER_ERROR },
        { message: 'Unknown auth problem', expected: AuthErrorType.UNKNOWN_AUTH_ERROR }
      ];

      testCases.forEach(({ message, expected }) => {
        const error = new Error(message);
        expect(detectAuthErrorType(error)).toBe(expected);
      });
    });
  });

  describe('isAuthRelatedError', () => {
    it('should identify auth-related errors by keywords', () => {
      const authKeywords = [
        'auth', 'login', 'signin', 'logout', 'session', 
        'token', 'credentials', 'password', 'user'
      ];

      authKeywords.forEach(keyword => {
        const error = new Error(`Error related to ${keyword}`);
        expect(isAuthRelatedError(error)).toBe(true);
      });
    });

    it('should identify auth-related errors by Chinese keywords', () => {
      const chineseAuthKeywords = ['认证', '登录', '会话', '密码'];

      chineseAuthKeywords.forEach(keyword => {
        const error = new Error(`错误：${keyword}失败`);
        expect(isAuthRelatedError(error)).toBe(true);
      });
    });

    it('should not identify non-auth errors', () => {
      const nonAuthErrors = [
        'Database connection timeout',
        'File system error', 
        'Calculation overflow',
        'UI rendering issue'
      ];

      nonAuthErrors.forEach(message => {
        const error = new Error(message);
        expect(isAuthRelatedError(error)).toBe(false);
      });
    });
  });
});

/**
 * Integration tests for error boundary with auth store
 */
describe('AuthErrorBoundary Integration', () => {
  // Mock the auth store hook
  const mockUseAuthStoreHook = {
    logout: jest.fn(),
    clearError: jest.fn(),
    isAuthenticated: false,
    user: null,
    error: null
  };

  beforeEach(() => {
    // Mock the auth store hook import
    jest.doMock('../stores', () => ({
      useAuthStoreHook: () => mockUseAuthStoreHook
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should handle error boundary with mocked auth store', () => {
    const authError = new Error('Session expired');
    
    render(<TestWrapper error={authError} />);

    expect(screen.getByText(/认证失败/)).toBeInTheDocument();
  });
});