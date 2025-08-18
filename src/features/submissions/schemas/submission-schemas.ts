/**
 * Submission Form Validation Schemas
 * 
 * 为网站提交表单提供类型安全的验证规则，包括基础信息、分类标签、文件上传等。
 * 集成了现有的XSS防护和恶意提交防护措施。
 * 
 * 使用 Zod v4.0.17 和 @hookform/resolvers v5.2.1 提供React Hook Form集成。
 * 复用现有的安全验证基础设施确保数据安全性。
 */

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// 导入现有安全工具 - 复用websites模块的安全基础设施
import { 
  detectMaliciousContent, 
  safeStringValidator,
  FORM_ERROR_MESSAGES 
} from '../../websites/schemas';

/**
 * 支持的文件类型（与file-upload.ts保持一致）
 */
const SUPPORTED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * 文件验证函数
 * 验证上传文件的格式和大小，确保符合安全要求
 * 导出供其他组件使用，支持自定义最大文件大小
 */
export const validateUploadFile = (maxSize: number = MAX_FILE_SIZE) => {
  return z.instanceof(File)
    .refine(
      (file) => file.size <= maxSize,
      `文件大小不能超过${Math.round(maxSize / 1024 / 1024)}MB`
    )
    .refine(
      (file) => SUPPORTED_FILE_TYPES.includes(file.type as any),
      '只支持PNG和JPEG格式的图片'
    )
    .refine(
      (file) => file.name.length <= 255,
      '文件名长度不能超过255个字符'
    )
    .optional();
};

/**
 * URL验证函数
 * 验证网站链接的格式和安全性，确保只允许HTTP/HTTPS协议
 * 导出供其他组件使用，可用于独立的URL验证
 */
export const validateWebsiteUrl = () => {
  return z.string()
    .min(1, '网站链接为必填项')
    .url('请输入有效的网站链接')
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          // 只允许 http 和 https 协议
          return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      '只支持HTTP和HTTPS协议的网站链接'
    )
    .refine(
      (url) => !detectMaliciousContent(url),
      '网站链接包含不安全的内容，请移除危险字符'
    );
};

/**
 * 网站提交表单验证Schema - 基础结构
 * 
 * 建立表单验证的基础架构，包含所有核心字段的验证规则。
 * 完全基于现有的安全验证模式，确保数据安全性。
 * 
 * 需求引用: 7 (表单提交和验证)
 */
export const submissionFormSchema = z.object({
  /**
   * 网站链接 - 必填字段
   * 需求引用: 2.2 (基础信息输入表单 - URL验证)
   */
  link: validateWebsiteUrl(),
  
  /**
   * 网站名称 - 必填字段，3-100字符
   * 需求引用: 2.4 (基础信息输入表单 - 名称长度验证)
   */
  name: safeStringValidator('网站名称', 100)
    .min(3, '网站名称至少需要3个字符'),
    
  /**
   * 网站描述 - 必填字段，10-500字符
   * 需求引用: 4.3 (描述文本输入 - 字符限制)
   */
  description: safeStringValidator('网站描述', 500)
    .min(10, '网站描述至少需要10个字符'),
    
  /**
   * 详细介绍 - 必填字段，支持Markdown
   * 需求引用: 5.5 (富文本编辑器 - 内容输入)
   */
  introduction: safeStringValidator('详细介绍', 5000)
    .min(50, '详细介绍至少需要50个字符'),
    
  /**
   * 分类ID - 可选字段（开发阶段支持字符串分类名称）
   * 需求引用: 3.3 (分类和标签选择 - 分类选择)
   */
  category_id: z.string()
    .min(1, '请选择网站分类')
    .optional(), // 基础版本设为可选，开发阶段接受字符串分类名称
    
  /**
   * 标签数组 - 可选字段（开发阶段支持字符串标签名称）
   * 需求引用: 3.6 (分类和标签选择 - 多选标签)
   */
  tags: z.array(z.string().min(1, '标签不能为空'))
    .max(10, '最多只能选择10个标签')
    .optional(), // 基础版本设为可选，开发阶段接受字符串标签名称
    
  /**
   * 网站图标文件上传 - 可选字段
   * 需求引用: 6.5 (文件上传功能 - 图标上传)
   */
  icon_file: validateUploadFile(),
  
  /**
   * 网站主图片文件上传 - 可选字段
   * 需求引用: 6.5 (文件上传功能 - 图片上传)
   */
  image_file: validateUploadFile(),
  
  /**
   * 联系邮箱 - 可选字段，用于提交后的沟通
   */
  contact_email: z.string()
    .email('请输入有效的邮箱地址')
    .max(320, '邮箱地址不能超过320个字符')
    .refine(
      (value) => !detectMaliciousContent(value),
      '邮箱地址包含不安全的字符'
    )
    .optional(),
    
  /**
   * 备注信息 - 可选字段
   */
  notes: safeStringValidator('备注信息', 1000)
    .optional(),
    
  /**
   * 蜜罐字段（反机器人）
   * 这个字段对用户不可见，如果被填写说明是机器人提交
   * 复用现有的反机器人模式
   */
  honeypot: z.string()
    .optional()
    .refine((value) => !value || value === '', '检测到异常提交'),
});

/**
 * 类型定义导出
 * 为组件提供类型安全的表单数据类型
 */
export type SubmissionFormData = z.infer<typeof submissionFormSchema>;

/**
 * React Hook Form resolver导出
 * 与React Hook Form集成使用
 * 
 * 需求引用: 7.2 (表单提交和验证 - 验证所有必填字段)
 */
export const submissionFormResolver = zodResolver(submissionFormSchema);

/**
 * 表单默认值
 * 提供一致的初始表单状态
 */
export const submissionFormDefaults: Partial<SubmissionFormData> = {
  link: '',
  name: '',
  description: '',
  introduction: '',
  category_id: '',
  tags: [],
  contact_email: '',
  notes: '',
  honeypot: '',
};

/**
 * 扩展错误消息常量
 * 扩展现有的错误消息结构，保持一致性
 */
export const SUBMISSION_ERROR_MESSAGES = {
  ...FORM_ERROR_MESSAGES,
  SUBMISSION: {
    LINK_REQUIRED: '请输入网站链接',
    LINK_INVALID: '请输入有效的网站链接',
    LINK_UNSAFE: '网站链接包含不安全的内容',
    NAME_REQUIRED: '请输入网站名称',
    NAME_TOO_SHORT: '网站名称至少需要3个字符',
    NAME_TOO_LONG: '网站名称不能超过100个字符',
    DESCRIPTION_REQUIRED: '请输入网站描述',
    DESCRIPTION_TOO_SHORT: '网站描述至少需要10个字符',
    DESCRIPTION_TOO_LONG: '网站描述不能超过500个字符',
    INTRODUCTION_REQUIRED: '请输入详细介绍',
    INTRODUCTION_TOO_SHORT: '详细介绍至少需要50个字符',
    CATEGORY_REQUIRED: '请选择网站分类',
    CATEGORY_INVALID: '无效的分类选择',
    TAGS_REQUIRED: '请至少选择一个标签',
    TAGS_TOO_MANY: '最多只能选择10个标签',
    TAGS_INVALID: '无效的标签选择',
    FILE_TOO_LARGE: '文件大小不能超过5MB',
    FILE_INVALID_TYPE: '只支持PNG和JPEG格式的图片',
    FILE_NAME_TOO_LONG: '文件名过长',
    EMAIL_INVALID: '请输入有效的邮箱地址',
    EMAIL_UNSAFE: '邮箱地址包含不安全的字符',
    UNSAFE_CONTENT: '内容包含不安全的字符，请移除脚本标签等危险内容',
    BOT_DETECTED: '检测到异常提交，请重试',
    SUBMIT_FAILED: '提交失败，请重试',
  },
} as const;

/**
 * 验证工具函数
 * 提供独立的验证函数，可在组件外使用
 */
export const validateSubmissionField = (
  field: keyof SubmissionFormData, 
  value: any
): boolean => {
  try {
    const fieldSchema = submissionFormSchema.pick({ [field]: true } as any);
    fieldSchema.parse({ [field]: value });
    return true;
  } catch {
    return false;
  }
};

/**
 * 全表单验证函数
 * 用于提交前的完整性检查
 */
export const validateSubmissionForm = (data: Partial<SubmissionFormData>): {
  isValid: boolean;
  errors: string[];
} => {
  try {
    submissionFormSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.issues.map(issue => issue.message),
      };
    }
    return { isValid: false, errors: ['表单验证失败'] };
  }
};

/**
 * 安全清理函数
 * 清理用户输入，移除潜在的危险内容
 */
export const sanitizeSubmissionInput = (data: Partial<SubmissionFormData>): Partial<SubmissionFormData> => {
  const sanitized = { ...data };
  
  // 清理文本字段
  if (sanitized.name) {
    sanitized.name = sanitized.name.trim().slice(0, 100);
  }
  if (sanitized.description) {
    sanitized.description = sanitized.description.trim().slice(0, 500);
  }
  if (sanitized.introduction) {
    sanitized.introduction = sanitized.introduction.trim().slice(0, 5000);
  }
  if (sanitized.notes) {
    sanitized.notes = sanitized.notes.trim().slice(0, 1000);
  }
  
  return sanitized;
};

/**
 * 文件验证工具函数
 * 独立的文件验证，用于拖拽上传等场景
 */
export const validateFileUpload = (file: File): {
  isValid: boolean;
  error?: string;
} => {
  if (!file) {
    return { isValid: false, error: '未选择文件' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: SUBMISSION_ERROR_MESSAGES.SUBMISSION.FILE_TOO_LARGE };
  }
  
  if (!SUPPORTED_FILE_TYPES.includes(file.type as any)) {
    return { isValid: false, error: SUBMISSION_ERROR_MESSAGES.SUBMISSION.FILE_INVALID_TYPE };
  }
  
  if (file.name.length > 255) {
    return { isValid: false, error: SUBMISSION_ERROR_MESSAGES.SUBMISSION.FILE_NAME_TOO_LONG };
  }
  
  return { isValid: true };
};

/**
 * URL验证工具函数
 * 独立的URL验证，用于实时验证或表单外验证
 */
export const validateWebsiteUrlInput = (url: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!url || url.trim() === '') {
    return { isValid: false, error: SUBMISSION_ERROR_MESSAGES.SUBMISSION.LINK_REQUIRED };
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, error: '只支持HTTP和HTTPS协议的网站链接' };
    }
  } catch {
    return { isValid: false, error: SUBMISSION_ERROR_MESSAGES.SUBMISSION.LINK_INVALID };
  }

  if (detectMaliciousContent(url)) {
    return { isValid: false, error: SUBMISSION_ERROR_MESSAGES.SUBMISSION.LINK_UNSAFE };
  }

  return { isValid: true };
};

/**
 * 验证常量导出
 * 供组件使用的验证相关常量
 */
export const VALIDATION_CONSTANTS = {
  MAX_FILE_SIZE,
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE_MB: Math.round(MAX_FILE_SIZE / 1024 / 1024),
  MAX_NAME_LENGTH: 100,
  MIN_NAME_LENGTH: 3,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_INTRODUCTION_LENGTH: 5000,
  MIN_INTRODUCTION_LENGTH: 50,
  MAX_NOTES_LENGTH: 1000,
  MAX_EMAIL_LENGTH: 320,
  MAX_FILENAME_LENGTH: 255,
} as const;