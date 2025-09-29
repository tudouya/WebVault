/**
 * Form Validation Schemas
 * 
 * 为首页表单提供类型安全的验证规则，包括搜索表单和邮箱订阅表单。
 * 集成了XSS防护和恶意提交防护措施。
 * 
 * 使用 Zod v4.0.17 和 @hookform/resolvers v5.2.1 提供React Hook Form集成。
 */

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * XSS防护：危险字符和模式检测
 * 检测常见的XSS攻击向量，包括脚本标签、事件处理器、javascript协议等
 */
const XSS_PATTERNS = [
  /<script[\s\S]*?<\/script>/gi,  // <script>标签
  /<iframe[\s\S]*?<\/iframe>/gi,  // <iframe>标签
  /on\w+\s*=\s*["'][^"']*["']/gi, // 事件处理器 (onclick, onload等)
  /javascript\s*:/gi,             // javascript:协议
  /<img[\s\S]*?src\s*=\s*["']javascript:/gi, // javascript:在img src中
  /expression\s*\(/gi,            // CSS expression()
  /vbscript\s*:/gi,               // vbscript:协议
  /data\s*:\s*text\/html/gi,      // data:text/html协议
];

/**
 * 恶意内容检测函数
 * @param value 要检测的字符串值
 * @returns 如果检测到恶意内容返回true
 */
const detectMaliciousContent = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;
  
  // 检查XSS模式
  return XSS_PATTERNS.some(pattern => pattern.test(value));
};

/**
 * 搜索表单验证Schema
 * 
 * 用于首页主搜索框的输入验证
 * 需求引用: 2.0 (搜索验证)
 */
export const searchFormSchema = z.object({
  /**
   * 搜索查询字符串
   * - 支持空字符串（用户可以清空搜索）
   * - 最大长度200字符
   * - 包含XSS防护
   * - 去除首尾空格
   */
  query: z
    .string()
    .trim()
    .max(200, '搜索关键词不能超过200个字符')
    .refine(
      (value) => !detectMaliciousContent(value),
      {
        message: '搜索内容包含不安全的字符，请移除脚本标签等危险内容',
      }
    )
    .optional()
    .default(''),

  /**
   * 搜索类型（可选）
   * 用于将来扩展不同类型的搜索（网站、分类、标签等）
   */
  searchType: z
    .enum(['website', 'category', 'tag', 'all'])
    .optional()
    .default('all'),
});

/**
 * 快速搜索建议验证Schema（未来增强功能）
 * 用于实时搜索建议的输入验证
 */
export const searchSuggestionSchema = z.object({
  /**
   * 搜索输入
   * 用于实时搜索建议的输入验证
   */
  input: z
    .string()
    .trim()
    .max(100, '搜索输入不能超过100个字符')
    .refine(
      (value) => !detectMaliciousContent(value),
      {
        message: '搜索输入包含不安全的内容',
      }
    ),

  /**
   * 建议数量限制
   */
  limit: z
    .number()
    .int('建议数量必须为整数')
    .min(1, '建议数量至少为1')
    .max(10, '建议数量不能超过10')
    .optional()
    .default(5),
});

/**
 * 类型定义导出
 * 为组件提供类型安全的表单数据类型
 */
export type SearchFormData = z.infer<typeof searchFormSchema>;
export type SearchSuggestionData = z.infer<typeof searchSuggestionSchema>;

/**
 * React Hook Form resolver导出
 * 与React Hook Form集成使用
 */
export const searchFormResolver = zodResolver(searchFormSchema);
export const searchSuggestionResolver = zodResolver(searchSuggestionSchema);

/**
 * 表单默认值
 * 提供一致的初始表单状态
 */
export const searchFormDefaults: SearchFormData = {
  query: '',
  searchType: 'all',
};

/**
 * 验证工具函数
 * 提供独立的验证函数，可在组件外使用
 */
export const validateSearchQuery = (query: string): boolean => {
  try {
    searchFormSchema.parse({ query });
    return true;
  } catch {
    return false;
  }
};

/**
 * 安全工具函数
 * 可在其他模块中重用的安全验证函数
 */
export const sanitizeSearchInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, 200) // 截断到最大长度
    .replace(/[<>\"'&]/g, (match) => { // 转义危险字符
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

export const isValidEmailDomain = (email: string): boolean => {
  if (!email.includes('@')) return false;
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  // 基本域名格式验证
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
};

/**
 * 表单错误消息常量
 * 提供一致的错误消息
 */
export const FORM_ERROR_MESSAGES = {
  SEARCH: {
    REQUIRED: '请输入搜索关键词',
    TOO_LONG: '搜索关键词过长',
    UNSAFE_CONTENT: '搜索内容包含不安全的字符',
    INVALID_FORMAT: '搜索格式无效',
  },
} as const;

export {
  websiteAdminCreateSchema,
  websiteAdminUpdateSchema,
  websiteStatusUpdateSchema,
  websiteBulkReviewSchema,
} from './admin'

export type {
  WebsiteAdminCreateInput,
  WebsiteAdminUpdateInput,
  WebsiteStatusUpdateInput,
  WebsiteBulkReviewInput,
} from './admin'
