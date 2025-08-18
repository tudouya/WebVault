/**
 * Authentication Utility Functions
 * 
 * 为认证系统提供可复用的工具函数，包括令牌验证、会话管理、安全验证等功能。
 * 扩展现有安全验证功能，专门针对认证场景优化，支持邮箱认证和会话管理需求。
 * 
 * 使用现有项目的验证模式和安全工具，确保一致性和可靠性。
 * 
 * 需求引用: 1.1 (邮箱认证), 5.1 (会话管理)
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

import type { Session, User } from '@supabase/supabase-js';
import type { 
  AuthUser, 
  AuthSession, 
  AuthError,
  SessionConfig,
  DEFAULT_SESSION_CONFIG 
} from '../types';
import { 
  detectMaliciousContent, 
  isValidEmailDomain,
  sanitizeSearchInput 
} from '../../websites/schemas';
import { authConfig } from '../../../lib/supabase';

// ============================================================================
// Constants & Configuration
// ============================================================================

/**
 * 认证工具常量配置
 */
export const AUTH_UTILS_CONFIG = {
  // JWT 令牌相关
  JWT: {
    HEADER_PREFIX: 'Bearer ',
    ACCESS_TOKEN_EXPIRY: 60 * 60 * 1000, // 1小时
    REFRESH_TOKEN_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30天
    REFRESH_THRESHOLD: 15 * 60 * 1000, // 15分钟
  },
  
  // 会话管理
  SESSION: {
    STORAGE_KEY: 'webvault-auth-session',
    ACTIVITY_KEY: 'webvault-last-activity',
    LOCKOUT_KEY: 'webvault-lockout',
    MAX_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15分钟
  },
  
  // 密码策略
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_TYPES: 3, // 至少3种字符类型
    COMMON_PASSWORDS_LIMIT: 50,
  },
  
  // 邮箱验证
  EMAIL: {
    MAX_LENGTH: 320, // RFC 5321标准
    DISPOSABLE_DOMAINS_CACHE_TTL: 24 * 60 * 60 * 1000, // 24小时
  },
  
  // 安全设置
  SECURITY: {
    CSRF_TOKEN_LENGTH: 32,
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15分钟
    MAX_REDIRECT_DEPTH: 3,
  },
} as const;

/**
 * 一次性邮箱域名黑名单
 * 扩展现有的验证逻辑，加强邮箱域名检查
 */
const DISPOSABLE_EMAIL_DOMAINS = [
  // 现有的域名
  '10minutemail.com',
  'tempmail.org',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  
  // 扩展的域名列表
  'temp-mail.org',
  'getnada.com',
  'yopmail.com',
  'maildrop.cc',
  'sharklasers.com',
  'grr.la',
  'dispostable.com',
  'trashmail.com',
  'mohmal.com',
  'MailDrop.cc',
  'mintemail.com',
  'mytrashmail.com',
  '33mail.com',
  'deadaddress.com',
  'emailondeck.com',
  'emailfake.com',
  'trbvm.com',
] as const;

/**
 * 常见弱密码列表
 * 扩展现有的密码检查逻辑
 */
const COMMON_WEAK_PASSWORDS = [
  // 现有密码
  'password', '123456', '123456789', 'qwerty', 'abc123',
  'password123', 'admin', 'letmein', 'welcome', 'monkey',
  '1234567890', 'login', 'admin123', 'root', 'user',
  
  // 扩展的弱密码
  'password1', 'password!', '12345678', '87654321',
  'qwerty123', 'abc12345', 'admin1234', 'welcome123',
  'letmein123', 'monkey123', 'iloveyou', 'sunshine',
  'master', 'shadow', 'football', 'baseball', 'dragon',
  'trustno1', '111111', '000000', 'superman', 'batman',
] as const;

// ============================================================================
// JWT Token Validation Functions
// ============================================================================

/**
 * 验证JWT令牌格式
 * 检查令牌是否符合JWT标准格式
 */
export function isValidJwtFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // 移除Bearer前缀（如果存在）
  const cleanToken = token.replace(AUTH_UTILS_CONFIG.JWT.HEADER_PREFIX, '').trim();
  
  // JWT应该包含3个用点分隔的部分
  const parts = cleanToken.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // 检查每个部分是否为有效的Base64
  return parts.every(part => {
    try {
      // 处理URL安全的Base64编码
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - base64.length % 4) % 4);
      atob(base64 + padding);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * 解析JWT令牌载荷
 * 安全地解析JWT载荷部分，不验证签名
 */
export function parseJwtPayload(token: string): Record<string, any> | null {
  if (!isValidJwtFormat(token)) {
    return null;
  }

  try {
    const cleanToken = token.replace(AUTH_UTILS_CONFIG.JWT.HEADER_PREFIX, '').trim();
    const payloadPart = cleanToken.split('.')[1];
    
    // 处理URL安全的Base64编码
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const decoded = atob(base64 + padding);
    
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to parse JWT payload:', error);
    return null;
  }
}

/**
 * 检查JWT令牌是否过期
 * 根据exp字段判断令牌有效性
 */
export function isJwtExpired(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // exp是Unix时间戳（秒），需要转换为毫秒
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  
  return currentTime >= expirationTime;
}

/**
 * 获取JWT令牌剩余有效时间
 * 返回毫秒数，如果已过期返回0
 */
export function getJwtTimeToExpiry(token: string): number {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) {
    return 0;
  }

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const timeLeft = expirationTime - currentTime;
  
  return Math.max(0, timeLeft);
}

/**
 * 检查JWT令牌是否需要刷新
 * 根据配置的阈值判断是否需要刷新
 */
export function shouldRefreshJwt(token: string): boolean {
  const timeLeft = getJwtTimeToExpiry(token);
  return timeLeft > 0 && timeLeft < AUTH_UTILS_CONFIG.JWT.REFRESH_THRESHOLD;
}

/**
 * 验证JWT令牌的基本声明
 * 检查必要的标准声明字段
 */
export function validateJwtClaims(token: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const payload = parseJwtPayload(token);

  if (!payload) {
    issues.push('令牌格式无效');
    return { isValid: false, issues };
  }

  // 检查过期时间
  if (!payload.exp) {
    issues.push('缺少过期时间');
  } else if (isJwtExpired(token)) {
    issues.push('令牌已过期');
  }

  // 检查签发时间
  if (payload.iat && payload.iat * 1000 > Date.now()) {
    issues.push('令牌签发时间无效');
  }

  // 检查生效时间
  if (payload.nbf && payload.nbf * 1000 > Date.now()) {
    issues.push('令牌尚未生效');
  }

  // 检查用户ID
  if (!payload.sub) {
    issues.push('缺少用户标识');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

// ============================================================================
// Session Helper Functions
// ============================================================================

/**
 * 检查会话是否有效
 * 验证会话状态和令牌有效性
 */
export function isValidSession(session: AuthSession | Session | null): boolean {
  if (!session) {
    return false;
  }

  // 处理不同的会话类型
  const accessToken = 'accessToken' in session ? session.accessToken : session.access_token;
  if (!accessToken) {
    return false;
  }

  // 检查访问令牌
  if (isJwtExpired(accessToken)) {
    return false;
  }

  // 检查刷新令牌（如果存在）
  const refreshToken = 'refreshToken' in session ? session.refreshToken : session.refresh_token;
  if (refreshToken && isJwtExpired(refreshToken)) {
    return false;
  }

  return true;
}

/**
 * 获取会话过期时间
 * 返回会话何时过期的时间戳
 */
export function getSessionExpiryTime(session: AuthSession | Session): number | null {
  const accessToken = 'accessToken' in session ? session.accessToken : session.access_token;
  if (!accessToken) {
    return null;
  }

  const payload = parseJwtPayload(accessToken);
  if (!payload || !payload.exp) {
    return null;
  }

  return payload.exp * 1000;
}

/**
 * 检查会话是否需要刷新
 * 根据配置判断是否应该刷新会话
 */
export function shouldRefreshSession(session: AuthSession | Session): boolean {
  if (!isValidSession(session)) {
    return false;
  }

  const accessToken = 'accessToken' in session ? session.accessToken : session.access_token;
  return shouldRefreshJwt(accessToken);
}

/**
 * 创建会话存储键
 * 为不同用户创建唯一的存储键
 */
export function createSessionStorageKey(userId?: string): string {
  const baseKey = AUTH_UTILS_CONFIG.SESSION.STORAGE_KEY;
  return userId ? `${baseKey}-${userId}` : baseKey;
}

/**
 * 安全存储会话数据
 * 将会话数据安全地存储到本地存储
 */
export function storeSessionSecurely(session: AuthSession, userId?: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const storageKey = createSessionStorageKey(userId);
    const sessionData = {
      ...session,
      storedAt: Date.now(),
    };
    
    localStorage.setItem(storageKey, JSON.stringify(sessionData));
    
    // 更新最后活动时间
    updateLastActivity();
    
    return true;
  } catch (error) {
    console.error('Failed to store session:', error);
    return false;
  }
}

/**
 * 安全检索会话数据
 * 从本地存储安全地检索会话数据
 */
export function retrieveStoredSession(userId?: string): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storageKey = createSessionStorageKey(userId);
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      return null;
    }

    const sessionData = JSON.parse(storedData);
    
    // 验证存储的会话
    if (!isValidSession(sessionData)) {
      clearStoredSession(userId);
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error('Failed to retrieve session:', error);
    return null;
  }
}

/**
 * 清理存储的会话数据
 * 从本地存储中移除会话相关数据
 */
export function clearStoredSession(userId?: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const storageKey = createSessionStorageKey(userId);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(AUTH_UTILS_CONFIG.SESSION.ACTIVITY_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

/**
 * 更新最后活动时间
 * 记录用户最后活动时间，用于会话管理
 */
export function updateLastActivity(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const timestamp = Date.now().toString();
    localStorage.setItem(AUTH_UTILS_CONFIG.SESSION.ACTIVITY_KEY, timestamp);
  } catch (error) {
    console.error('Failed to update last activity:', error);
  }
}

/**
 * 获取最后活动时间
 * 获取用户最后活动的时间戳
 */
export function getLastActivity(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const timestamp = localStorage.getItem(AUTH_UTILS_CONFIG.SESSION.ACTIVITY_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('Failed to get last activity:', error);
    return null;
  }
}

/**
 * 检查会话是否因为不活动而过期
 * 根据配置的会话超时时间检查
 */
export function isSessionInactiveExpired(maxInactiveTime: number = authConfig.session.expiresIn * 1000): boolean {
  const lastActivity = getLastActivity();
  if (!lastActivity) {
    return true;
  }

  const inactiveTime = Date.now() - lastActivity;
  return inactiveTime > maxInactiveTime;
}

// ============================================================================
// Security Utility Functions
// ============================================================================

/**
 * 生成安全的随机字符串
 * 用于生成CSRF令牌、状态参数等
 */
export function generateSecureRandomString(length: number = AUTH_UTILS_CONFIG.SECURITY.CSRF_TOKEN_LENGTH): string {
  if (typeof window === 'undefined' || !window.crypto) {
    // 服务端或不支持crypto的环境回退方案
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  
  // 转换为Base64 URL安全格式
  return Array.from(array, byte => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'[byte % 64]
  ).join('');
}

/**
 * 验证CSRF令牌
 * 比较存储的CSRF令牌与提交的令牌
 */
export function validateCsrfToken(submittedToken: string, storedToken: string): boolean {
  if (!submittedToken || !storedToken) {
    return false;
  }

  // 防止时序攻击的安全比较
  if (submittedToken.length !== storedToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < submittedToken.length; i++) {
    result |= submittedToken.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * 验证重定向URL安全性
 * 防止开放重定向攻击
 */
export function isSecureRedirectUrl(url: string, allowedDomains: string[] = []): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // 检查恶意内容
  if (detectMaliciousContent(url)) {
    return false;
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);
    
    // 只允许相对路径或相同域名
    if (parsedUrl.origin === window.location.origin) {
      return true;
    }

    // 检查允许的外部域名
    if (allowedDomains.length > 0) {
      return allowedDomains.some(domain => 
        parsedUrl.hostname === domain || 
        parsedUrl.hostname.endsWith(`.${domain}`)
      );
    }

    return false;
  } catch {
    // 如果URL解析失败，不允许重定向
    return false;
  }
}

/**
 * 安全化认证输入
 * 扩展现有的输入清理功能，专门针对认证场景
 */
export function sanitizeAuthInput(input: string, maxLength: number = 320): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .slice(0, maxLength)
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
}

/**
 * 检测并阻止暴力破解尝试
 * 实现15分钟锁定机制
 */
export function handleLoginAttempt(identifier: string): {
  allowed: boolean;
  attemptsLeft: number;
  lockoutExpiresAt: number | null;
} {
  if (typeof window === 'undefined') {
    return { allowed: true, attemptsLeft: AUTH_UTILS_CONFIG.SESSION.MAX_ATTEMPTS, lockoutExpiresAt: null };
  }

  const storageKey = `${AUTH_UTILS_CONFIG.SESSION.LOCKOUT_KEY}-${identifier}`;
  
  try {
    const storedData = localStorage.getItem(storageKey);
    const now = Date.now();
    
    let attempts = 0;
    let lockoutStart = 0;
    
    if (storedData) {
      const parsed = JSON.parse(storedData);
      attempts = parsed.attempts || 0;
      lockoutStart = parsed.lockoutStart || 0;
    }
    
    // 检查锁定状态
    const lockoutEnd = lockoutStart + AUTH_UTILS_CONFIG.SESSION.LOCKOUT_DURATION;
    if (lockoutStart && now < lockoutEnd) {
      return {
        allowed: false,
        attemptsLeft: 0,
        lockoutExpiresAt: lockoutEnd,
      };
    }
    
    // 重置已过期的锁定
    if (lockoutStart && now >= lockoutEnd) {
      attempts = 0;
      lockoutStart = 0;
    }
    
    // 增加尝试次数
    attempts++;
    
    // 检查是否需要锁定
    if (attempts >= AUTH_UTILS_CONFIG.SESSION.MAX_ATTEMPTS) {
      lockoutStart = now;
      localStorage.setItem(storageKey, JSON.stringify({ attempts, lockoutStart }));
      
      return {
        allowed: false,
        attemptsLeft: 0,
        lockoutExpiresAt: lockoutStart + AUTH_UTILS_CONFIG.SESSION.LOCKOUT_DURATION,
      };
    }
    
    // 更新尝试次数
    localStorage.setItem(storageKey, JSON.stringify({ attempts, lockoutStart }));
    
    return {
      allowed: true,
      attemptsLeft: AUTH_UTILS_CONFIG.SESSION.MAX_ATTEMPTS - attempts,
      lockoutExpiresAt: null,
    };
  } catch (error) {
    console.error('Failed to handle login attempt:', error);
    return { allowed: true, attemptsLeft: AUTH_UTILS_CONFIG.SESSION.MAX_ATTEMPTS, lockoutExpiresAt: null };
  }
}

/**
 * 重置登录尝试计数
 * 成功登录后清除失败尝试记录
 */
export function resetLoginAttempts(identifier: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const storageKey = `${AUTH_UTILS_CONFIG.SESSION.LOCKOUT_KEY}-${identifier}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to reset login attempts:', error);
  }
}

// ============================================================================
// Password Strength Validation
// ============================================================================

/**
 * 密码强度评估结果接口
 */
export interface PasswordStrengthResult {
  score: number; // 0-4, 4为最强
  strength: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong';
  feedback: string[];
  isValid: boolean;
}

/**
 * 检查密码字符类型
 */
function getPasswordCharacterTypes(password: string): {
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  typeCount: number;
} {
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*(),.?":{}|<>[\]\\`~;'+=\-_]/.test(password);
  
  const typeCount = [hasLowercase, hasUppercase, hasNumbers, hasSymbols]
    .filter(Boolean).length;
  
  return {
    hasLowercase,
    hasUppercase,
    hasNumbers,
    hasSymbols,
    typeCount,
  };
}

/**
 * 检查密码是否为常见弱密码
 */
export function isCommonPassword(password: string): boolean {
  const lowercasePassword = password.toLowerCase();
  return COMMON_WEAK_PASSWORDS.some(common => 
    lowercasePassword === common || 
    lowercasePassword.includes(common)
  );
}

/**
 * 检查密码是否包含个人信息
 * 简单检查是否包含邮箱的用户名部分
 */
export function containsPersonalInfo(password: string, email?: string): boolean {
  if (!email) {
    return false;
  }

  const username = email.split('@')[0]?.toLowerCase();
  if (!username || username.length < 3) {
    return false;
  }

  return password.toLowerCase().includes(username);
}

/**
 * 检查密码复杂度
 * 计算密码的熵值和复杂度分数
 */
export function calculatePasswordComplexity(password: string): number {
  if (!password) {
    return 0;
  }

  // 计算字符集大小
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/\d/.test(password)) charsetSize += 10;
  if (/[!@#$%^&*(),.?":{}|<>[\]\\`~;'+=\-_]/.test(password)) charsetSize += 32;

  // 计算熵值（位）
  const entropy = password.length * Math.log2(charsetSize);
  
  // 转换为0-100的分数
  return Math.min(100, Math.round((entropy / 60) * 100)); // 60位熵被认为是强密码
}

/**
 * 全面的密码强度验证
 * 结合多个维度评估密码强度
 */
export function validatePasswordStrength(password: string, email?: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  // 基本长度检查
  if (password.length < AUTH_UTILS_CONFIG.PASSWORD.MIN_LENGTH) {
    feedback.push(`密码至少需要${AUTH_UTILS_CONFIG.PASSWORD.MIN_LENGTH}个字符`);
  } else if (password.length >= 12) {
    score += 1;
  }

  // 字符类型检查
  const charTypes = getPasswordCharacterTypes(password);
  if (charTypes.typeCount < AUTH_UTILS_CONFIG.PASSWORD.REQUIRE_TYPES) {
    feedback.push(`密码需要包含至少${AUTH_UTILS_CONFIG.PASSWORD.REQUIRE_TYPES}种字符类型（大写字母、小写字母、数字、特殊字符）`);
  } else {
    score += charTypes.typeCount - 2; // 每多一种类型加一分
  }

  // 常见密码检查
  if (isCommonPassword(password)) {
    feedback.push('请避免使用常见密码，选择更独特的密码');
  } else {
    score += 1;
  }

  // 个人信息检查
  if (containsPersonalInfo(password, email)) {
    feedback.push('密码不应包含邮箱中的个人信息');
  } else if (email) {
    score += 1;
  }

  // 重复字符检查
  const hasRepeatingChars = /(.)\1{2,}/.test(password);
  if (hasRepeatingChars) {
    feedback.push('避免使用连续重复的字符');
  } else {
    score += 1;
  }

  // 复杂度检查
  const complexity = calculatePasswordComplexity(password);
  if (complexity >= 80) {
    score += 2;
  } else if (complexity >= 60) {
    score += 1;
  }

  // 恶意内容检查
  if (detectMaliciousContent(password)) {
    feedback.push('密码包含不安全的字符');
    score = 0;
  }

  // 计算最终强度
  const maxScore = 8; // 最大分数
  const normalizedScore = Math.min(4, Math.round((score / maxScore) * 4));
  
  let strength: PasswordStrengthResult['strength'];
  if (normalizedScore === 0) strength = 'very-weak';
  else if (normalizedScore === 1) strength = 'weak';
  else if (normalizedScore === 2) strength = 'medium';
  else if (normalizedScore === 3) strength = 'strong';
  else strength = 'very-strong';

  const isValid = feedback.length === 0 && normalizedScore >= 2;

  return {
    score: normalizedScore,
    strength,
    feedback,
    isValid,
  };
}

/**
 * 生成密码强度提示
 * 为用户提供改进密码的建议
 */
export function generatePasswordSuggestions(password: string): string[] {
  const suggestions: string[] = [];
  const charTypes = getPasswordCharacterTypes(password);

  if (password.length < 12) {
    suggestions.push('增加密码长度至12个字符以上');
  }

  if (!charTypes.hasLowercase) {
    suggestions.push('添加小写字母');
  }

  if (!charTypes.hasUppercase) {
    suggestions.push('添加大写字母');
  }

  if (!charTypes.hasNumbers) {
    suggestions.push('添加数字');
  }

  if (!charTypes.hasSymbols) {
    suggestions.push('添加特殊字符（如!@#$%等）');
  }

  if (charTypes.typeCount >= 3 && password.length >= 8) {
    suggestions.push('考虑使用密码短语，如多个单词的组合');
  }

  return suggestions;
}

// ============================================================================
// Email Domain Checking
// ============================================================================

/**
 * 增强的邮箱格式验证
 * 扩展现有的邮箱验证功能
 */
export function validateEmailFormat(email: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!email || typeof email !== 'string') {
    issues.push('邮箱地址不能为空');
    return { isValid: false, issues };
  }

  const trimmedEmail = email.trim();

  // 长度检查
  if (trimmedEmail.length > AUTH_UTILS_CONFIG.EMAIL.MAX_LENGTH) {
    issues.push(`邮箱地址不能超过${AUTH_UTILS_CONFIG.EMAIL.MAX_LENGTH}个字符`);
  }

  // 基本格式检查
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    issues.push('邮箱地址格式无效');
  }

  // 恶意内容检查
  if (detectMaliciousContent(trimmedEmail)) {
    issues.push('邮箱地址包含不安全的字符');
  }

  // 域名验证
  if (!isValidEmailDomain(trimmedEmail)) {
    issues.push('邮箱域名无效');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * 检查是否为一次性邮箱
 * 扩展的一次性邮箱检测
 */
export function isDisposableEmail(email: string): boolean {
  if (!email.includes('@')) {
    return false;
  }

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return false;
  }

  return DISPOSABLE_EMAIL_DOMAINS.includes(domain as any);
}

/**
 * 检查邮箱域名的MX记录（仅客户端提示）
 * 注意：浏览器环境无法直接查询DNS，这里只做格式检查
 */
export function checkEmailDomainValidity(email: string): {
  isValid: boolean;
  domain: string | null;
  suggestion?: string;
} {
  if (!email.includes('@')) {
    return { isValid: false, domain: null };
  }

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { isValid: false, domain: null };
  }

  // 基本域名格式检查
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/;
  const isValid = domainRegex.test(domain);

  // 常见域名拼写错误检测和建议
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', '163.com', 'qq.com'];
  let suggestion: string | undefined;

  if (!isValid) {
    // 简单的域名拼写建议
    for (const commonDomain of commonDomains) {
      if (domain.includes(commonDomain.slice(0, -4))) {
        suggestion = commonDomain;
        break;
      }
    }
  }

  return {
    isValid,
    domain,
    suggestion,
  };
}

/**
 * 全面的邮箱验证
 * 结合格式、域名、一次性邮箱等多个维度的验证
 */
export function validateEmailComprehensive(email: string): {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // 基本格式验证
  const formatValidation = validateEmailFormat(email);
  if (!formatValidation.isValid) {
    issues.push(...formatValidation.issues);
    return { isValid: false, issues, warnings, suggestions };
  }

  // 一次性邮箱检查
  if (isDisposableEmail(email)) {
    warnings.push('检测到临时邮箱，建议使用常用邮箱地址');
  }

  // 域名有效性检查
  const domainCheck = checkEmailDomainValidity(email);
  if (!domainCheck.isValid) {
    issues.push('邮箱域名格式无效');
    if (domainCheck.suggestion) {
      suggestions.push(`您是否想输入：${email.split('@')[0]}@${domainCheck.suggestion}`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    suggestions,
  };
}

// ============================================================================
// Error Processing & User-Friendly Messages
// ============================================================================

/**
 * 错误代码到用户友好消息的映射
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  // 认证错误
  'invalid_credentials': '邮箱或密码错误，请检查后重试',
  'user_not_found': '该邮箱地址未注册',
  'email_not_confirmed': '请先验证您的邮箱地址',
  'weak_password': '密码强度不足，请选择更安全的密码',
  'email_already_exists': '该邮箱已注册，请直接登录或使用其他邮箱',
  'signup_disabled': '当前暂不开放注册，请联系管理员',
  'invalid_email': '请输入有效的邮箱地址',
  
  // 网络错误
  'network_error': '网络连接失败，请检查网络后重试',
  'server_error': '服务器错误，请稍后重试',
  'timeout': '请求超时，请重试',
  
  // OAuth错误
  'oauth_error': '第三方登录失败，请重试',
  'oauth_cancelled': '已取消第三方登录',
  'oauth_access_denied': '未授权访问权限',
  
  // 会话错误
  'session_expired': '登录已过期，请重新登录',
  'invalid_session': '会话无效，请重新登录',
  'session_conflict': '检测到其他设备登录，当前会话已失效',
  
  // 安全错误
  'rate_limit_exceeded': '操作过于频繁，请稍后再试',
  'account_locked': '账户已被锁定，请15分钟后重试',
  'suspicious_activity': '检测到异常活动，账户已被暂时保护',
  'csrf_token_mismatch': '安全验证失败，请刷新页面后重试',
  
  // 通用错误
  'unknown_error': '发生未知错误，请重试或联系客服',
};

/**
 * 转换错误为用户友好的消息
 * 将技术错误代码转换为用户可理解的消息
 */
export function formatAuthError(error: AuthError | Error | string): {
  message: string;
  code: string;
  severity: 'info' | 'warning' | 'error';
} {
  let code = 'unknown_error';
  let originalMessage = '';

  // 解析错误对象
  if (typeof error === 'string') {
    code = error;
  } else if (error && typeof error === 'object') {
    if ('code' in error && typeof error.code === 'string') {
      code = error.code;
    }
    if ('message' in error && typeof error.message === 'string') {
      originalMessage = error.message;
    }
  }

  // 获取用户友好消息
  const userMessage = ERROR_MESSAGE_MAP[code] || ERROR_MESSAGE_MAP['unknown_error'];

  // 确定错误严重程度
  let severity: 'info' | 'warning' | 'error' = 'error';
  if (['email_not_confirmed', 'weak_password'].includes(code)) {
    severity = 'warning';
  } else if (['oauth_cancelled'].includes(code)) {
    severity = 'info';
  }

  return {
    message: userMessage,
    code,
    severity,
  };
}

/**
 * 生成详细的错误报告
 * 用于日志记录和调试
 */
export function generateErrorReport(error: AuthError | Error | string, context?: Record<string, any>): {
  timestamp: string;
  error: {
    code: string;
    message: string;
    originalMessage?: string;
  };
  context?: Record<string, any>;
  userAgent: string;
  url: string;
} {
  const formatted = formatAuthError(error);
  let originalMessage: string | undefined;

  if (typeof error === 'object' && error && 'message' in error) {
    originalMessage = error.message;
  }

  return {
    timestamp: new Date().toISOString(),
    error: {
      code: formatted.code,
      message: formatted.message,
      originalMessage,
    },
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * 批量工具函数导出
 * 为其他模块提供便捷的工具函数集合
 */
export const authUtils = {
  // JWT相关
  jwt: {
    isValidFormat: isValidJwtFormat,
    parsePayload: parseJwtPayload,
    isExpired: isJwtExpired,
    getTimeToExpiry: getJwtTimeToExpiry,
    shouldRefresh: shouldRefreshJwt,
    validateClaims: validateJwtClaims,
  },
  
  // 会话相关
  session: {
    isValid: isValidSession,
    getExpiryTime: getSessionExpiryTime,
    shouldRefresh: shouldRefreshSession,
    store: storeSessionSecurely,
    retrieve: retrieveStoredSession,
    clear: clearStoredSession,
    updateActivity: updateLastActivity,
    getLastActivity: getLastActivity,
    isInactiveExpired: isSessionInactiveExpired,
  },
  
  // 安全相关
  security: {
    generateRandomString: generateSecureRandomString,
    validateCsrfToken: validateCsrfToken,
    isSecureRedirectUrl: isSecureRedirectUrl,
    sanitizeInput: sanitizeAuthInput,
    handleLoginAttempt: handleLoginAttempt,
    resetLoginAttempts: resetLoginAttempts,
  },
  
  // 密码相关
  password: {
    validateStrength: validatePasswordStrength,
    isCommon: isCommonPassword,
    containsPersonalInfo: containsPersonalInfo,
    calculateComplexity: calculatePasswordComplexity,
    generateSuggestions: generatePasswordSuggestions,
  },
  
  // 邮箱相关
  email: {
    validateFormat: validateEmailFormat,
    isDisposable: isDisposableEmail,
    checkDomainValidity: checkEmailDomainValidity,
    validateComprehensive: validateEmailComprehensive,
  },
  
  // 错误处理
  error: {
    format: formatAuthError,
    generateReport: generateErrorReport,
  },
};

/**
 * 默认导出
 */
export default authUtils;