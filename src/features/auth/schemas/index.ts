/**
 * Authentication Schemas Export
 * 
 * 统一导出认证模块的表单验证模式、类型定义和工具函数
 * 提供类型安全的认证表单验证，集成现有的安全防护机制
 */

// 主要验证模式
export {
  loginFormSchema,
  passwordResetSchema,
  newPasswordSchema,
  registerFormSchema,
  socialAuthCallbackSchema,
} from './auth-schemas';

// 类型定义
export type {
  LoginFormData,
  PasswordResetData,
  NewPasswordData,
  RegisterFormData,
  SocialAuthCallbackData,
} from './auth-schemas';

// React Hook Form resolvers
export {
  loginFormResolver,
  passwordResetResolver,
  newPasswordResolver,
  registerFormResolver,
  socialAuthCallbackResolver,
} from './auth-schemas';

// 表单默认值
export {
  loginFormDefaults,
  passwordResetDefaults,
  newPasswordDefaults,
  registerFormDefaults,
} from './auth-schemas';

// 验证工具函数
export {
  validateLoginCredentials,
  validatePasswordReset,
  validateNewPassword,
  sanitizeAuthInput,
  isValidLoginEmail,
  checkPasswordSecurity,
} from './auth-schemas';

// 错误消息常量
export {
  AUTH_ERROR_MESSAGES,
  AUTH_FORM_FIELDS,
} from './auth-schemas';