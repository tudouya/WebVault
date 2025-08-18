/**
 * Submission Schemas Export
 * 
 * 统一导出网站提交模块的表单验证模式、类型定义和工具函数
 * 提供类型安全的网站提交表单验证
 */

// 表单验证模式导出
export { 
  submissionFormSchema,
  submissionFormResolver,
  submissionFormDefaults
} from './submission-schemas';

// 类型定义导出
export type { 
  SubmissionFormData 
} from './submission-schemas';

// 错误消息和常量导出
export { 
  SUBMISSION_ERROR_MESSAGES 
} from './submission-schemas';

// 验证工具函数导出
export { 
  validateSubmissionField,
  validateSubmissionForm,
  sanitizeSubmissionInput,
  validateFileUpload,
  validateWebsiteUrlInput,
  validateUploadFile,
  validateWebsiteUrl,
  VALIDATION_CONSTANTS
} from './submission-schemas';

// 安全工具函数（重新导出便于使用）
export { 
  detectMaliciousContent, 
  safeStringValidator 
} from './submission-schemas';