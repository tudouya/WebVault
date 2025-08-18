/**
 * Authentication Form Validation Schemas
 * 
 * 为登录页面提供类型安全的认证表单验证规则，包括邮箱登录、密码恢复和社交认证。
 * 扩展现有表单验证模式，集成XSS防护和恶意提交防护措施。
 * 
 * 使用 Zod v4.0.17 和 @hookform/resolvers v5.2.1 提供React Hook Form集成。
 * 
 * 需求引用: 1.1 (邮箱认证), 6.1 (配色系统)
 */

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// 复用现有安全验证功能
import { 
  detectMaliciousContent, 
  safeStringValidator,
  isValidEmailDomain,
  FORM_ERROR_MESSAGES 
} from '@/features/websites/schemas';

/**
 * 密码强度验证函数
 * 符合现代安全要求的密码策略
 */
const validatePasswordStrength = (password: string): boolean => {
  if (!password || password.length < 8) return false;
  
  // 检查是否包含至少三种字符类型
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecials = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const typeCount = [hasLowercase, hasUppercase, hasNumbers, hasSpecials]
    .filter(Boolean).length;
  
  return typeCount >= 3;
};

/**
 * 常见弱密码检测
 */
const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    '1234567890', 'login', 'admin123', 'root', 'user'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
};

/**
 * 邮箱登录表单验证Schema
 * 
 * 用于邮箱密码登录，包含安全验证和用户体验优化
 * 需求引用: 1.1 (邮箱认证)
 */
export const loginFormSchema = z.object({
  /**
   * 邮箱地址
   * - 必填字段
   * - 验证邮箱格式
   * - 最大长度320字符（RFC标准）
   * - 包含XSS防护
   * - 域名有效性验证
   */
  email: z
    .string({ message: '请输入邮箱地址' })
    .trim()
    .min(1, '请输入邮箱地址')
    .max(320, '邮箱地址不能超过320个字符')
    .email('请输入有效的邮箱地址')
    .refine(
      (value) => !detectMaliciousContent(value),
      {
        message: '邮箱地址包含不安全的字符',
      }
    )
    .refine(
      (email) => isValidEmailDomain(email),
      {
        message: '请输入有效的邮箱域名',
      }
    ),

  /**
   * 密码
   * - 必填字段
   * - 最小长度8字符
   * - 最大长度128字符（安全考虑）
   * - 包含XSS防护
   * - 强度验证（可选，登录时不做强制要求）
   */
  password: z
    .string({ message: '请输入密码' })
    .min(1, '请输入密码')
    .max(128, '密码不能超过128个字符')
    .refine(
      (value) => !detectMaliciousContent(value),
      {
        message: '密码包含不安全的字符',
      }
    ),

  /**
   * 记住我选项
   * 用于30天持久化会话管理
   */
  rememberMe: z
    .boolean()
    .optional()
    .default(false),

  /**
   * 蜜罐字段（反机器人）
   * 这个字段对用户不可见，如果被填写说明是机器人提交
   */
  honeypot: z
    .string()
    .optional()
    .refine((value) => !value || value === '', {
      message: '检测到异常提交',
    }),
});

/**
 * 密码重置请求表单验证Schema
 * 
 * 用于密码恢复功能，发送重置邮件
 */
export const passwordResetSchema = z.object({
  /**
   * 邮箱地址
   * - 必填字段
   * - 验证邮箱格式
   * - 包含XSS防护
   */
  email: z
    .string({ message: '请输入邮箱地址' })
    .trim()
    .min(1, '请输入邮箱地址')
    .max(320, '邮箱地址不能超过320个字符')
    .email('请输入有效的邮箱地址')
    .refine(
      (value) => !detectMaliciousContent(value),
      {
        message: '邮箱地址包含不安全的字符',
      }
    ),

  /**
   * 蜜罐字段（反机器人）
   */
  honeypot: z
    .string()
    .optional()
    .refine((value) => !value || value === '', {
      message: '检测到异常提交',
    }),
});

/**
 * 新密码设置表单验证Schema
 * 
 * 用于重置密码后设置新密码
 */
export const newPasswordSchema = z.object({
  /**
   * 新密码
   * - 必填字段
   * - 强度验证
   * - 包含XSS防护
   * - 常见密码检测
   */
  password: z
    .string({ message: '请输入新密码' })
    .min(8, '密码至少需要8个字符')
    .max(128, '密码不能超过128个字符')
    .refine(
      (value) => !detectMaliciousContent(value),
      {
        message: '密码包含不安全的字符',
      }
    )
    .refine(
      (password) => validatePasswordStrength(password),
      {
        message: '密码强度不足，请包含至少3种字符类型（大写字母、小写字母、数字、特殊字符）',
      }
    )
    .refine(
      (password) => !isCommonPassword(password),
      {
        message: '请避免使用常见密码，选择更安全的密码',
      }
    ),

  /**
   * 确认密码
   * - 必填字段
   * - 与新密码匹配验证
   */
  confirmPassword: z
    .string({ message: '请确认新密码' })
    .min(1, '请确认新密码'),

  /**
   * 重置令牌
   * - 从邮件链接获取的令牌
   * - 服务端验证有效性
   */
  token: z
    .string({ message: '重置令牌无效' })
    .min(1, '重置令牌无效')
    .refine(
      (value) => !detectMaliciousContent(value),
      {
        message: '重置令牌包含不安全的字符',
      }
    ),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  }
);

/**
 * 注册表单验证Schema
 * 
 * 用于用户注册功能（将来扩展）
 */
export const registerFormSchema = z.object({
  /**
   * 用户名
   * - 必填字段
   * - 3-50字符
   * - 字母数字下划线
   * - 包含XSS防护
   */
  username: safeStringValidator('用户名', 50)
    .min(3, '用户名至少需要3个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),

  /**
   * 邮箱地址
   */
  email: z
    .string({ message: '请输入邮箱地址' })
    .trim()
    .min(1, '请输入邮箱地址')
    .max(320, '邮箱地址不能超过320个字符')
    .email('请输入有效的邮箱地址')
    .refine(
      (value) => !detectMaliciousContent(value),
      {
        message: '邮箱地址包含不安全的字符',
      }
    ),

  /**
   * 密码（注册时要求强密码）
   */
  password: z
    .string({ message: '请输入密码' })
    .min(8, '密码至少需要8个字符')
    .max(128, '密码不能超过128个字符')
    .refine(
      (value) => !detectMaliciousContent(value),
      {
        message: '密码包含不安全的字符',
      }
    )
    .refine(
      (password) => validatePasswordStrength(password),
      {
        message: '密码强度不足，请包含至少3种字符类型（大写字母、小写字母、数字、特殊字符）',
      }
    )
    .refine(
      (password) => !isCommonPassword(password),
      {
        message: '请避免使用常见密码，选择更安全的密码',
      }
    ),

  /**
   * 确认密码
   */
  confirmPassword: z
    .string({ message: '请确认密码' })
    .min(1, '请确认密码'),

  /**
   * 服务条款同意确认
   */
  agreeToTerms: z
    .boolean()
    .refine((value) => value === true, {
      message: '请同意服务条款后继续',
    }),

  /**
   * 蜜罐字段（反机器人）
   */
  honeypot: z
    .string()
    .optional()
    .refine((value) => !value || value === '', {
      message: '检测到异常提交',
    }),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  }
);

/**
 * 社交认证回调验证Schema
 * 
 * 用于验证OAuth回调参数
 */
export const socialAuthCallbackSchema = z.object({
  /**
   * 认证提供商
   */
  provider: z
    .enum(['google', 'github'])
    .refine((value) => ['google', 'github'].includes(value), {
      message: '不支持的认证提供商',
    }),

  /**
   * 授权码
   */
  code: z
    .string({ message: '授权码无效' })
    .min(1, '授权码无效')
    .refine(
      (value) => !detectMaliciousContent(value),
      {
        message: '授权码包含不安全的字符',
      }
    ),

  /**
   * 状态参数（CSRF防护）
   */
  state: z
    .string({ message: '状态参数无效' })
    .min(1, '状态参数无效')
    .refine(
      (value) => !detectMaliciousContent(value),
      {
        message: '状态参数包含不安全的字符',
      }
    ),
});

/**
 * 类型定义导出
 * 为组件提供类型安全的表单数据类型
 */
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;
export type NewPasswordData = z.infer<typeof newPasswordSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type SocialAuthCallbackData = z.infer<typeof socialAuthCallbackSchema>;

/**
 * React Hook Form resolver导出
 * 与React Hook Form集成使用
 */
export const loginFormResolver = zodResolver(loginFormSchema);
export const passwordResetResolver = zodResolver(passwordResetSchema);
export const newPasswordResolver = zodResolver(newPasswordSchema);
export const registerFormResolver = zodResolver(registerFormSchema);
export const socialAuthCallbackResolver = zodResolver(socialAuthCallbackSchema);

/**
 * 表单默认值
 * 提供一致的初始表单状态
 */
export const loginFormDefaults: LoginFormData = {
  email: '',
  password: '',
  rememberMe: false,
  honeypot: '',
};

export const passwordResetDefaults: PasswordResetData = {
  email: '',
  honeypot: '',
};

export const newPasswordDefaults: Partial<NewPasswordData> = {
  password: '',
  confirmPassword: '',
  // token 由URL参数提供
};

export const registerFormDefaults: RegisterFormData = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false,
  honeypot: '',
};

/**
 * 验证工具函数
 * 提供独立的验证函数，可在组件外使用
 */
export const validateLoginCredentials = (email: string, password: string): boolean => {
  try {
    loginFormSchema.parse({ email, password });
    return true;
  } catch {
    return false;
  }
};

export const validatePasswordReset = (email: string): boolean => {
  try {
    passwordResetSchema.parse({ email });
    return true;
  } catch {
    return false;
  }
};

export const validateNewPassword = (password: string, confirmPassword: string): boolean => {
  try {
    newPasswordSchema.parse({ password, confirmPassword, token: 'dummy' });
    return true;
  } catch {
    return false;
  }
};

/**
 * 安全工具函数
 * 扩展现有安全验证功能，专门针对认证场景
 */
export const sanitizeAuthInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, 320) // 邮箱最大长度
    .replace(/[<>\"'&]/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return escapeMap[match] || match;
    });
};

export const isValidLoginEmail = (email: string): boolean => {
  try {
    loginFormSchema.pick({ email: true }).parse({ email });
    return true;
  } catch {
    return false;
  }
};

export const checkPasswordSecurity = (password: string): {
  isValid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];
  
  if (password.length < 8) {
    issues.push('密码长度至少8个字符');
  }
  
  if (!validatePasswordStrength(password)) {
    issues.push('密码需要包含至少3种字符类型');
  }
  
  if (isCommonPassword(password)) {
    issues.push('请避免使用常见密码');
  }
  
  if (detectMaliciousContent(password)) {
    issues.push('密码包含不安全的字符');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
};

/**
 * 认证表单错误消息常量
 * 提供一致的错误消息，符合品牌语调
 */
export const AUTH_ERROR_MESSAGES = {
  LOGIN: {
    EMAIL_REQUIRED: '请输入邮箱地址',
    EMAIL_INVALID: '请输入有效的邮箱地址',
    EMAIL_UNSAFE: '邮箱地址包含不安全的字符',
    PASSWORD_REQUIRED: '请输入密码',
    PASSWORD_UNSAFE: '密码包含不安全的字符',
    CREDENTIALS_INVALID: '邮箱或密码错误',
    BOT_DETECTED: '检测到异常提交，请重试',
    RATE_LIMITED: '登录尝试过于频繁，请稍后再试',
  },
  PASSWORD_RESET: {
    EMAIL_REQUIRED: '请输入邮箱地址',
    EMAIL_INVALID: '请输入有效的邮箱地址',
    EMAIL_NOT_FOUND: '该邮箱地址未注册',
    RESET_SENT: '密码重置邮件已发送，请检查邮箱',
    TOKEN_INVALID: '重置链接无效或已过期',
    TOKEN_EXPIRED: '重置链接已过期，请重新申请',
  },
  REGISTER: {
    USERNAME_REQUIRED: '请输入用户名',
    USERNAME_INVALID: '用户名格式无效',
    USERNAME_TAKEN: '用户名已被使用',
    EMAIL_REQUIRED: '请输入邮箱地址',
    EMAIL_INVALID: '请输入有效的邮箱地址',
    EMAIL_TAKEN: '该邮箱已注册',
    PASSWORD_WEAK: '密码强度不足',
    PASSWORD_MISMATCH: '两次输入的密码不一致',
    TERMS_REQUIRED: '请同意服务条款',
  },
  SOCIAL_AUTH: {
    PROVIDER_ERROR: '第三方登录失败，请重试',
    CALLBACK_ERROR: '授权回调失败',
    ACCOUNT_CONFLICT: '该邮箱已绑定其他账户',
    PERMISSION_DENIED: '未授权访问权限',
  },
} as const;

/**
 * 表单字段配置
 * 用于动态生成表单组件
 */
export const AUTH_FORM_FIELDS = {
  LOGIN: [
    {
      name: 'email' as const,
      type: 'email',
      label: '邮箱地址',
      placeholder: '请输入邮箱地址',
      required: true,
    },
    {
      name: 'password' as const,
      type: 'password',
      label: '密码',
      placeholder: '请输入密码',
      required: true,
    },
    {
      name: 'rememberMe' as const,
      type: 'checkbox',
      label: '30天内免登录',
      required: false,
    },
  ],
  PASSWORD_RESET: [
    {
      name: 'email' as const,
      type: 'email',
      label: '邮箱地址',
      placeholder: '请输入注册邮箱',
      required: true,
    },
  ],
  REGISTER: [
    {
      name: 'username' as const,
      type: 'text',
      label: '用户名',
      placeholder: '请输入用户名',
      required: true,
    },
    {
      name: 'email' as const,
      type: 'email',
      label: '邮箱地址',
      placeholder: '请输入邮箱地址',
      required: true,
    },
    {
      name: 'password' as const,
      type: 'password',
      label: '密码',
      placeholder: '请输入密码',
      required: true,
    },
    {
      name: 'confirmPassword' as const,
      type: 'password',
      label: '确认密码',
      placeholder: '请再次输入密码',
      required: true,
    },
  ],
} as const;