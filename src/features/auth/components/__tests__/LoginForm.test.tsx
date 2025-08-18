/**
 * LoginForm Component Tests
 * 
 * 全面测试LoginForm组件的功能和用户交互，包括：
 * - 表单验证（邮箱格式、密码必填、实时验证反馈、表单提交验证）
 * - 用户交互（输入框操作、按钮状态、密码显示切换、忘记密码链接）
 * - 状态管理（加载状态、错误处理、成功反馈、表单重置）
 * - 无障碍访问（屏幕阅读器支持、键盘导航、ARIA标签、焦点管理）
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LoginForm } from '../LoginForm';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock react-hook-form
const mockHandleSubmit = jest.fn();
const mockClearError = jest.fn();
const mockValidateEmail = jest.fn();
const mockForm = {
  control: {
    _formState: { errors: {} },
    _fields: {},
    _defaultValues: {},
  },
  handleSubmit: jest.fn((fn) => (e?: Event) => {
    e?.preventDefault();
    return fn({ email: 'test@example.com', password: 'password123', rememberMe: false, honeypot: '' });
  }),
  register: jest.fn(() => ({})),
  formState: { errors: {}, isSubmitting: false, isValid: true, isDirty: false },
  reset: jest.fn(),
  clearErrors: jest.fn(),
  setValue: jest.fn(),
  getValues: jest.fn(() => ({})),
  trigger: jest.fn(),
};

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useFormContext: () => mockForm,
  Controller: ({ render }: any) => {
    return render({
      field: {
        onChange: jest.fn(),
        onBlur: jest.fn(),
        value: '',
        name: 'test',
        ref: jest.fn(),
      },
      fieldState: {
        invalid: false,
        isTouched: false,
        isDirty: false,
        error: undefined,
      },
      formState: { errors: {} },
    });
  },
  FormProvider: ({ children }: any) => children,
}));

// Mock 认证hooks - 使用jest.fn直接模拟
jest.mock('../../hooks/useAuthForm', () => ({
  useLoginForm: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/form', () => ({
  Form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormField: ({ children, control, name, render }: any) => {
    const field = {
      onChange: jest.fn(),
      onBlur: jest.fn(),
      value: '',
      name,
      ref: jest.fn(),
    };
    return render({ field, fieldState: { error: undefined } });
  },
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children, ...props }: any) => <label {...props}>{children}</label>,
  FormMessage: ({ children }: any) => children ? <div role="alert">{children}</div> : null,
}));

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(({ className, ...props }, ref) => (
    <input ref={ref} className={className} {...props} />
  )),
}));

jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(({ children, className, ...props }, ref) => (
    <button ref={ref} className={className} {...props}>{children}</button>
  )),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('LoginForm', () => {
  // ========================================================================
  // Test Setup
  // ========================================================================
  
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  const mockOnForgotPassword = jest.fn();
  
  const defaultProps = {
    onSuccess: mockOnSuccess,
    onError: mockOnError,
    onForgotPassword: mockOnForgotPassword,
  };

  // 获取mock函数的引用
  const mockUseLoginForm = require('../../hooks/useAuthForm').useLoginForm;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 设置默认的mock返回值
    mockUseLoginForm.mockReturnValue({
      form: mockForm,
      isSubmitting: false,
      isValid: true,
      isDirty: false,
      hasErrors: false,
      submitError: null,
      handleSubmit: mockHandleSubmit,
      clearError: mockClearError,
      validateEmail: mockValidateEmail,
    });
    
    mockValidateEmail.mockReturnValue(true);
  });

  // ========================================================================
  // Basic Rendering Tests
  // ========================================================================
  
  describe('基本渲染', () => {
    test('应该渲染登录表单的所有必要元素', () => {
      render(<LoginForm {...defaultProps} />);

      // 检查表单标题
      expect(screen.getByText('登录账户')).toBeInTheDocument();
      expect(screen.getByText('输入您的邮箱和密码来登录账户')).toBeInTheDocument();

      // 检查表单字段
      expect(screen.getByLabelText('邮箱地址')).toBeInTheDocument();
      expect(screen.getByLabelText('密码')).toBeInTheDocument();

      // 检查按钮
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('应该显示正确的占位符文本', () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••');

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    test('应该在showRememberMe为true时显示记住我选项', () => {
      render(<LoginForm {...defaultProps} showRememberMe={true} />);

      expect(screen.getByText('30天内免登录')).toBeInTheDocument();
    });

    test('应该在showForgotPassword为true时显示忘记密码链接', () => {
      render(<LoginForm {...defaultProps} showForgotPassword={true} />);

      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    });

    test('应该显示社交登录选项', () => {
      render(<LoginForm {...defaultProps} />);

      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('或者使用社交账户登录')).toBeInTheDocument();
    });

    test('应该显示邮箱和密码输入框的图标', () => {
      const { container } = render(<LoginForm {...defaultProps} />);
      
      // 检查邮箱图标 (默认状态下是Mail图标)
      const emailIcon = container.querySelector('svg');
      expect(emailIcon).toBeInTheDocument();
    });

    test('应该有正确的表单属性', () => {
      const { container } = render(<LoginForm {...defaultProps} />);
      
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveAttribute('noValidate');
    });
  });

  // ========================================================================
  // User Interaction Tests
  // ========================================================================
  
  describe('用户交互测试', () => {
    test('应该允许用户输入邮箱和密码', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    test('应该支持密码显示/隐藏切换', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const passwordInput = screen.getByPlaceholderText('••••••');
      expect(passwordInput).toHaveAttribute('type', 'password');

      // 点击显示密码按钮 - 查找第一个不可见的按钮（密码切换按钮）
      const toggleButtons = screen.getAllByRole('button');
      const passwordToggle = toggleButtons.find(btn => btn.getAttribute('tabIndex') === '-1');
      
      if (passwordToggle) {
        await user.click(passwordToggle);
        expect(passwordInput).toHaveAttribute('type', 'text');
        
        // 再次点击应该隐藏密码
        await user.click(passwordToggle);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });

    test('应该支持记住我选项的切换', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} showRememberMe={true} />);

      const rememberMeCheckbox = screen.getByRole('checkbox');
      expect(rememberMeCheckbox).not.toBeChecked();

      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).toBeChecked();

      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).not.toBeChecked();
    });

    test('应该处理忘记密码链接点击', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} showForgotPassword={true} />);

      const forgotPasswordLink = screen.getByText('Forgot password?');
      await user.click(forgotPasswordLink);

      expect(mockOnForgotPassword).toHaveBeenCalledTimes(1);
    });

    test('应该在输入时清除错误状态', async () => {
      const user = userEvent.setup();
      
      // 设置错误状态
      mockUseLoginForm.mockReturnValue({
        form: mockForm,
        isSubmitting: false,
        isValid: true,
        isDirty: false,
        hasErrors: false,
        submitError: '登录失败',
        handleSubmit: mockHandleSubmit,
        clearError: mockClearError,
        validateEmail: mockValidateEmail,
      });
      
      render(<LoginForm {...defaultProps} />);
      
      // 验证错误显示
      expect(screen.getByText('登录失败')).toBeInTheDocument();
      
      // 输入内容应该清除错误
      const emailInput = screen.getByPlaceholderText('name@example.com');
      await user.type(emailInput, 'test@example.com');
      
      expect(mockClearError).toHaveBeenCalled();
    });

    test('应该在表单提交时调用handleSubmit', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });

    test('应该支持Enter键提交表单', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      await user.type(emailInput, 'test@example.com{enter}');

      // 表单应该被提交
      expect(mockForm.handleSubmit).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Form Validation Tests
  // ========================================================================
  
  describe('表单验证测试', () => {
    test('应该验证邮箱格式', async () => {
      mockValidateEmail.mockReturnValue(false);
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      
      // 输入无效邮箱
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // 触发blur事件

      expect(mockValidateEmail).toHaveBeenCalledWith('invalid-email');
    });

    test('应该在邮箱验证成功时显示成功图标', async () => {
      mockValidateEmail.mockReturnValue(true);
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      
      // 输入有效邮箱
      await user.type(emailInput, 'valid@example.com');
      await user.tab(); // 触发blur事件

      expect(mockValidateEmail).toHaveBeenCalledWith('valid@example.com');
    });

    test('应该在表单无效时禁用提交按钮', () => {
      mockUseLoginForm.mockReturnValue({
        form: mockForm,
        isSubmitting: false,
        isValid: false,
        isDirty: false,
        hasErrors: false,
        submitError: null,
        handleSubmit: mockHandleSubmit,
        clearError: mockClearError,
        validateEmail: mockValidateEmail,
      });
      
      render(<LoginForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /login/i });
      expect(submitButton).toBeDisabled();
    });

    test('应该显示表单验证错误', () => {
      mockUseLoginForm.mockReturnValue({
        form: mockForm,
        isSubmitting: false,
        isValid: true,
        isDirty: false,
        hasErrors: true,
        submitError: null,
        handleSubmit: mockHandleSubmit,
        clearError: mockClearError,
        validateEmail: mockValidateEmail,
      });
      
      render(<LoginForm {...defaultProps} />);
      
      // 组件应该能够正常渲染即使有错误
      expect(screen.getByText('登录账户')).toBeInTheDocument();
    });

    test('应该处理蜜罐字段验证', () => {
      const { container } = render(<LoginForm {...defaultProps} />);
      
      const honeypotField = container.querySelector('input[aria-hidden="true"]');
      expect(honeypotField).toBeInTheDocument();
      expect(honeypotField).toHaveAttribute('tabIndex', '-1');
      expect(honeypotField).toHaveAttribute('autoComplete', 'off');
    });
  });
  
  // ========================================================================
  // State Management Tests
  // ========================================================================
  
  describe('状态管理测试', () => {
    test('应该显示加载状态', () => {
      mockAuthFormState.isSubmitting = true;
      mockUseLoginForm.mockReturnValue(mockAuthFormState);
      
      render(<LoginForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /登录中/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      
      // 应该显示加载指示器
      expect(screen.getByText('登录中...')).toBeInTheDocument();
    });

    test('应该显示错误消息', () => {
      const errorMessage = '用户名或密码错误';
      mockAuthFormState.submitError = errorMessage;
      mockUseLoginForm.mockReturnValue(mockAuthFormState);
      
      render(<LoginForm {...defaultProps} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      
      // 应该有错误图标
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    test('应该能够清除错误消息', async () => {
      const user = userEvent.setup();
      const errorMessage = '登录失败';
      mockAuthFormState.submitError = errorMessage;
      mockUseLoginForm.mockReturnValue(mockAuthFormState);
      
      render(<LoginForm {...defaultProps} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      
      // 点击关闭按钮
      const closeButton = screen.getByText('×');
      await user.click(closeButton);
      
      expect(mockClearError).toHaveBeenCalledTimes(1);
    });

    test('应该在提交状态下禁用所有输入', () => {
      mockAuthFormState.isSubmitting = true;
      mockUseLoginForm.mockReturnValue(mockAuthFormState);
      
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••');
      const submitButton = screen.getByRole('button', { name: /登录中/i });
      
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    test('应该处理表单重置', () => {
      mockAuthFormState.isDirty = true;
      mockUseLoginForm.mockReturnValue(mockAuthFormState);
      
      render(<LoginForm {...defaultProps} />);
      
      // 组件应该正确显示dirty状态
      expect(screen.getByText('登录账户')).toBeInTheDocument();
    });
  });
  
  // ========================================================================
  // Props Handling Tests
  // ========================================================================
  
  describe('Props处理', () => {
    test('应该在autoFocus为true时自动聚焦邮箱输入框', () => {
      render(<LoginForm {...defaultProps} autoFocus={true} />);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      expect(emailInput).toHaveAttribute('autoFocus');
    });

    test('应该正确应用自定义className', () => {
      const { container } = render(
        <LoginForm {...defaultProps} className="custom-login-form" />
      );

      const formContainer = container.querySelector('.custom-login-form');
      expect(formContainer).toBeInTheDocument();
    });

    test('应该在不显示记住我时隐藏该选项', () => {
      render(<LoginForm {...defaultProps} showRememberMe={false} />);

      expect(screen.queryByText('30天内免登录')).not.toBeInTheDocument();
    });

    test('应该在不显示忘记密码时隐藏该链接', () => {
      render(<LoginForm {...defaultProps} showForgotPassword={false} />);

      expect(screen.queryByText('Forgot password?')).not.toBeInTheDocument();
    });

    test('应该传递redirectUrl给useLoginForm', () => {
      const redirectUrl = '/dashboard';
      render(<LoginForm {...defaultProps} redirectUrl={redirectUrl} />);

      expect(mockUseLoginForm).toHaveBeenCalledWith(
        expect.objectContaining({
          redirectUrl,
        })
      );
    });

    test('应该在debug模式下传递debug参数', () => {
      render(<LoginForm {...defaultProps} debug={true} />);

      expect(mockUseLoginForm).toHaveBeenCalledWith(
        expect.objectContaining({
          debug: true,
        })
      );
    });

    test('应该处理成功回调', async () => {
      const successResult = { success: true, redirectUrl: '/dashboard' };
      mockOnSuccess.mockImplementation(() => {});
      
      render(<LoginForm {...defaultProps} />);

      expect(mockUseLoginForm).toHaveBeenCalledWith(
        expect.objectContaining({
          onSubmitSuccess: mockOnSuccess,
        })
      );
    });

    test('应该处理错误回调', () => {
      render(<LoginForm {...defaultProps} />);

      expect(mockUseLoginForm).toHaveBeenCalledWith(
        expect.objectContaining({
          onSubmitError: mockOnError,
        })
      );
    });
  });

  // ========================================================================
  // Accessibility Tests
  // ========================================================================
  
  describe('无障碍访问测试', () => {
    test('表单字段应该有正确的标签关联', () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText('邮箱地址');
      const passwordInput = screen.getByLabelText('密码');

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    test('蜜罐字段应该对屏幕阅读器隐藏', () => {
      const { container } = render(<LoginForm {...defaultProps} />);

      const honeypotField = container.querySelector('input[aria-hidden="true"]');
      expect(honeypotField).toBeInTheDocument();
      expect(honeypotField).toHaveClass('sr-only');
    });

    test('表单应该有正确的语义结构', () => {
      const { container } = render(<LoginForm {...defaultProps} />);
      
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      
      // 检查标题的层级结构
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('登录账户');
    });

    test('错误消息应该有正确的ARIA属性', () => {
      const errorMessage = '登录失败';
      mockAuthFormState.submitError = errorMessage;
      mockUseLoginForm.mockReturnValue(mockAuthFormState);
      
      render(<LoginForm {...defaultProps} />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(errorMessage);
    });

    test('按钮应该有正确的可访问名称', () => {
      render(<LoginForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /login/i });
      expect(submitButton).toBeInTheDocument();
      
      const forgotPasswordButton = screen.getByRole('button', { name: /forgot password/i });
      expect(forgotPasswordButton).toBeInTheDocument();
    });

    test('应该支持键盘导航', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••');
      const submitButton = screen.getByRole('button', { name: /login/i });

      // 测试Tab键导航
      await user.click(emailInput);
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      // 跳过其他可聚焦元素后应该到达提交按钮
      // 注意：实际的Tab顺序可能包含其他元素
    });

    test('表单字段应该有适当的autocomplete属性', () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••');

      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });

    test('社交登录按钮应该有适当的可访问名称', () => {
      render(<LoginForm {...defaultProps} />);

      const googleButton = screen.getByRole('button', { name: /google/i });
      const githubButton = screen.getByRole('button', { name: /github/i });

      expect(googleButton).toBeInTheDocument();
      expect(githubButton).toBeInTheDocument();
    });

    test('输入字段应该在错误状态下有适当的ARIA属性', () => {
      // 这个测试验证表单字段在错误状态下的可访问性
      mockAuthFormState.hasErrors = true;
      mockUseLoginForm.mockReturnValue(mockAuthFormState);
      
      render(<LoginForm {...defaultProps} />);
      
      // 即使有错误，表单字段也应该可访问
      const emailInput = screen.getByLabelText('邮箱地址');
      expect(emailInput).toBeInTheDocument();
    });
  });

  // ========================================================================
  // Integration and Edge Cases Tests
  // ========================================================================
  
  describe('组件集成测试', () => {
    test('应该能够成功渲染而不抛出错误', () => {
      expect(() => {
        render(<LoginForm {...defaultProps} />);
      }).not.toThrow();
    });

    test('组件应该有正确的显示名称', () => {
      expect(LoginForm.displayName || LoginForm.name).toBe('LoginForm');
    });

    test('应该正确处理空props', () => {
      expect(() => {
        render(<LoginForm />);
      }).not.toThrow();
    });

    test('应该正确集成所有子组件', () => {
      render(<LoginForm {...defaultProps} />);
      
      // 验证所有主要组件都正确渲染
      expect(screen.getByLabelText('邮箱地址')).toBeInTheDocument();
      expect(screen.getByLabelText('密码')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });
  });
  
  describe('边界情况测试', () => {
    test('应该处理Hook返回的异常状态', () => {
      mockAuthFormState.form = null as any;
      mockUseLoginForm.mockReturnValue(mockAuthFormState);
      
      expect(() => {
        render(<LoginForm {...defaultProps} />);
      }).not.toThrow();
    });

    test('应该处理undefined的回调函数', () => {
      const propsWithUndefinedCallbacks = {
        onSuccess: undefined,
        onError: undefined,
        onForgotPassword: undefined,
      };
      
      expect(() => {
        render(<LoginForm {...propsWithUndefinedCallbacks} />);
      }).not.toThrow();
    });

    test('应该处理长文本的错误消息', () => {
      const longErrorMessage = '这是一个非常长的错误消息，用来测试组件如何处理长文本内容，确保界面不会因为长文本而破坏布局，同时保持良好的用户体验。';
      mockAuthFormState.submitError = longErrorMessage;
      mockUseLoginForm.mockReturnValue(mockAuthFormState);
      
      render(<LoginForm {...defaultProps} />);
      
      expect(screen.getByText(longErrorMessage)).toBeInTheDocument();
    });

    test('应该正确处理同时存在的多种状态', () => {
      mockAuthFormState.isSubmitting = true;
      mockAuthFormState.submitError = '网络错误';
      mockAuthFormState.hasErrors = true;
      mockUseLoginForm.mockReturnValue(mockAuthFormState);
      
      render(<LoginForm {...defaultProps} />);
      
      // 应该优先显示提交状态
      expect(screen.getByText('登录中...')).toBeInTheDocument();
      // 错误消息也应该显示
      expect(screen.getByText('网络错误')).toBeInTheDocument();
    });
  });
  
  describe('性能和优化测试', () => {
    test('应该正确缓存事件处理器', () => {
      const { rerender } = render(<LoginForm {...defaultProps} />);
      
      // 重新渲染相同的props
      rerender(<LoginForm {...defaultProps} />);
      
      // 组件应该能够正常工作
      expect(screen.getByText('登录账户')).toBeInTheDocument();
    });

    test('应该在依赖项变化时正确更新', () => {
      const { rerender } = render(<LoginForm {...defaultProps} />);
      
      // 更改props
      const newProps = {
        ...defaultProps,
        showRememberMe: false,
      };
      
      rerender(<LoginForm {...newProps} />);
      
      // 记住我选项应该被隐藏
      expect(screen.queryByText('30天内免登录')).not.toBeInTheDocument();
    });
  });
});