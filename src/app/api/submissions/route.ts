/**
 * Submissions API Route - /api/submissions
 * 
 * 处理网站提交相关的API请求，包括创建、验证和管理网站提交数据。
 * 遵循WebVault的安全标准和验证规则。
 * 
 * Endpoints:
 * - POST /api/submissions - 创建新的网站提交
 * - GET /api/submissions - 获取提交列表（管理员）
 * 
 * Security Features:
 * - 输入验证和清理
 * - XSS防护
 * - 文件类型和大小验证
 * - 反机器人检测（蜜罐）
 * - 请求频率限制
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';

// 导入现有的验证Schema和工具
import { 
  submissionFormSchema,
  validateSubmissionForm,
  sanitizeSubmissionInput,
  SUBMISSION_ERROR_MESSAGES,
  VALIDATION_CONSTANTS
} from '@/features/submissions/schemas/submission-schemas';
import type { SubmissionFormData } from '@/features/submissions/schemas/submission-schemas';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * API响应基础类型
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * 提交创建响应类型
 */
interface SubmissionCreateResponse {
  id: string;
  status: 'submitted' | 'pending' | 'reviewing';
  message: string;
  nextSteps?: {
    payment?: string;
    tracking?: string;
  };
}

/**
 * 错误详情类型
 */
interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 创建标准化的API响应
 */
function createApiResponse<T>(
  success: boolean, 
  data?: T, 
  error?: string, 
  message?: string
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 创建错误响应
 */
function createErrorResponse(
  message: string, 
  status: number = 400,
  details?: ValidationErrorDetail[]
): NextResponse {
  return NextResponse.json(
    createApiResponse(false, details, message),
    { status }
  );
}

/**
 * 创建成功响应
 */
function createSuccessResponse<T>(
  data: T, 
  message?: string, 
  status: number = 200
): NextResponse {
  return NextResponse.json(
    createApiResponse(true, data, undefined, message),
    { status }
  );
}

/**
 * 验证请求频率限制
 * 基础实现，后续可集成Redis
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 每小时10次请求
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1小时

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(clientId);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT) {
    return false;
  }
  
  limit.count += 1;
  return true;
}

/**
 * 获取客户端标识符
 */
function getClientId(request: NextRequest): string {
  // 优先使用真实IP，回退到其他标识
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return ip;
}

/**
 * 处理文件上传数据
 * 从FormData中提取并验证文件
 */
async function processFileUploads(formData: FormData): Promise<{
  icon_file?: File;
  image_file?: File;
  errors: ValidationErrorDetail[];
}> {
  const errors: ValidationErrorDetail[] = [];
  const result: { icon_file?: File; image_file?: File } = {};
  
  // 处理图标文件
  const iconFile = formData.get('icon_file') as File | null;
  if (iconFile && iconFile.size > 0) {
    if (iconFile.size > VALIDATION_CONSTANTS.MAX_FILE_SIZE) {
      errors.push({
        field: 'icon_file',
        message: SUBMISSION_ERROR_MESSAGES.SUBMISSION.FILE_TOO_LARGE,
        code: 'FILE_TOO_LARGE'
      });
    } else if (!VALIDATION_CONSTANTS.SUPPORTED_FILE_TYPES.includes(iconFile.type as any)) {
      errors.push({
        field: 'icon_file',
        message: SUBMISSION_ERROR_MESSAGES.SUBMISSION.FILE_INVALID_TYPE,
        code: 'FILE_INVALID_TYPE'
      });
    } else {
      result.icon_file = iconFile;
    }
  }
  
  // 处理主图文件
  const imageFile = formData.get('image_file') as File | null;
  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > VALIDATION_CONSTANTS.MAX_FILE_SIZE) {
      errors.push({
        field: 'image_file',
        message: SUBMISSION_ERROR_MESSAGES.SUBMISSION.FILE_TOO_LARGE,
        code: 'FILE_TOO_LARGE'
      });
    } else if (!VALIDATION_CONSTANTS.SUPPORTED_FILE_TYPES.includes(imageFile.type as any)) {
      errors.push({
        field: 'image_file',
        message: SUBMISSION_ERROR_MESSAGES.SUBMISSION.FILE_INVALID_TYPE,
        code: 'FILE_INVALID_TYPE'
      });
    } else {
      result.image_file = imageFile;
    }
  }
  
  return { ...result, errors };
}

/**
 * 解析表单数据
 */
async function parseFormData(request: NextRequest): Promise<{
  data: Partial<SubmissionFormData>;
  files: { icon_file?: File; image_file?: File };
  errors: ValidationErrorDetail[];
}> {
  const errors: ValidationErrorDetail[] = [];
  
  try {
    const formData = await request.formData();
    
    // 处理文件上传
    const fileResult = await processFileUploads(formData);
    errors.push(...fileResult.errors);
    
    // 提取表单字段
    const data: Partial<SubmissionFormData> = {
      link: formData.get('link') as string || '',
      name: formData.get('name') as string || '',
      description: formData.get('description') as string || '',
      introduction: formData.get('introduction') as string || '',
      category_id: formData.get('category_id') as string || '',
      contact_email: formData.get('contact_email') as string || '',
      notes: formData.get('notes') as string || '',
      honeypot: formData.get('honeypot') as string || '',
    };
    
    // 处理标签数组
    const tagsData = formData.get('tags');
    if (tagsData && typeof tagsData === 'string') {
      try {
        data.tags = JSON.parse(tagsData);
      } catch {
        data.tags = tagsData.split(',').map(tag => tag.trim()).filter(Boolean);
      }
    }
    
    return {
      data: sanitizeSubmissionInput(data),
      files: { icon_file: fileResult.icon_file, image_file: fileResult.image_file },
      errors
    };
    
  } catch (error) {
    console.error('[API/Submissions] Failed to parse form data:', error);
    
    return {
      data: {},
      files: {},
      errors: [{
        field: 'form',
        message: '表单数据解析失败',
        code: 'FORM_PARSE_ERROR'
      }]
    };
  }
}

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * POST /api/submissions
 * 
 * 创建新的网站提交
 * 支持multipart/form-data格式，包含文件上传
 * 
 * Request Body:
 * - link: string (required) - 网站链接
 * - name: string (required) - 网站名称
 * - description: string (required) - 网站描述
 * - introduction: string (required) - 详细介绍
 * - category_id: string (optional) - 分类ID
 * - tags: string[] | string (optional) - 标签数组或逗号分隔字符串
 * - contact_email: string (optional) - 联系邮箱
 * - notes: string (optional) - 备注信息
 * - icon_file: File (optional) - 网站图标文件
 * - image_file: File (optional) - 网站主图文件
 * - honeypot: string (optional) - 蜜罐字段（应为空）
 * 
 * Requirements: 7 (表单提交和验证)
 */
export async function POST(request: NextRequest) {
  console.log('[API/Submissions] POST request received');
  
  try {
    // 1. 检查请求频率限制
    const clientId = getClientId(request);
    if (!checkRateLimit(clientId)) {
      console.warn('[API/Submissions] Rate limit exceeded for client:', clientId);
      return createErrorResponse(
        '请求过于频繁，请稍后再试',
        429
      );
    }
    
    // 2. 解析表单数据
    const { data, files, errors: parseErrors } = await parseFormData(request);
    
    if (parseErrors.length > 0) {
      console.warn('[API/Submissions] Form data parsing errors:', parseErrors);
      return createErrorResponse(
        '表单数据格式不正确',
        400,
        parseErrors
      );
    }
    
    // 3. 检查蜜罐字段（反机器人）
    if (data.honeypot && data.honeypot !== '') {
      console.warn('[API/Submissions] Bot detected via honeypot:', clientId);
      return createErrorResponse(
        SUBMISSION_ERROR_MESSAGES.SUBMISSION.BOT_DETECTED,
        400
      );
    }
    
    // 4. 验证必填字段
    const validation = validateSubmissionForm(data);
    if (!validation.isValid) {
      console.warn('[API/Submissions] Validation failed:', validation.errors);
      
      const validationErrors: ValidationErrorDetail[] = validation.errors.map((error, index) => ({
        field: `field_${index}`,
        message: error,
        code: 'VALIDATION_ERROR'
      }));
      
      return createErrorResponse(
        '表单验证失败，请检查输入内容',
        400,
        validationErrors
      );
    }
    
    // 5. 处理文件上传 (这里是占位符，实际需要集成文件存储服务)
    const uploadedFiles = {
      icon_url: files.icon_file ? `temp/icon_${Date.now()}.png` : undefined,
      image_url: files.image_file ? `temp/image_${Date.now()}.png` : undefined,
    };
    
    // TODO: 实际文件上传逻辑
    // - 上传到CDN或云存储
    // - 生成缩略图
    // - 返回文件URL
    
    // 6. 保存提交数据 (这里是占位符，实际需要集成数据库)
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // TODO: 实际数据库保存逻辑
    // const submission = await database.submissions.create({
    //   id: submissionId,
    //   ...data,
    //   ...uploadedFiles,
    //   status: 'submitted',
    //   submitted_at: new Date(),
    //   ip_address: clientId,
    // });
    
    console.log('[API/Submissions] Submission created successfully:', {
      id: submissionId,
      name: data.name,
      link: data.link
    });
    
    // 7. 返回成功响应
    const response: SubmissionCreateResponse = {
      id: submissionId,
      status: 'submitted',
      message: '网站提交成功！我们会在24-48小时内完成审核。',
      nextSteps: {
        payment: `/submit/payment?id=${submissionId}`,
        tracking: `/submit/status?id=${submissionId}`,
      }
    };
    
    return createSuccessResponse(
      response,
      '网站提交成功',
      201
    );
    
  } catch (error) {
    console.error('[API/Submissions] Unexpected error:', error);
    
    return createErrorResponse(
      '服务器内部错误，请稍后重试',
      500
    );
  }
}

/**
 * GET /api/submissions
 * 
 * 获取提交列表（管理员功能）
 * 支持分页、筛选和搜索
 * 
 * Query Parameters:
 * - page: number (optional) - 页码，默认1
 * - limit: number (optional) - 每页数量，默认20
 * - status: string (optional) - 状态筛选
 * - search: string (optional) - 搜索关键词
 */
export async function GET(request: NextRequest) {
  console.log('[API/Submissions] GET request received');
  
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // TODO: 实现认证检查 - 只允许管理员访问
    // const user = await authenticate(request);
    // if (!user || !user.isAdmin) {
    //   return createErrorResponse('无权限访问', 403);
    // }
    
    // TODO: 实际数据查询逻辑
    // const submissions = await database.submissions.findMany({
    //   where: {
    //     ...(status && { status }),
    //     ...(search && {
    //       OR: [
    //         { name: { contains: search } },
    //         { link: { contains: search } },
    //         { description: { contains: search } },
    //       ]
    //     })
    //   },
    //   orderBy: { submitted_at: 'desc' },
    //   skip: (page - 1) * limit,
    //   take: limit,
    // });
    
    // 占位符响应
    const mockSubmissions = {
      items: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0
      },
      filters: {
        status,
        search
      }
    };
    
    console.log('[API/Submissions] Retrieved submissions:', mockSubmissions.pagination);
    
    return createSuccessResponse(
      mockSubmissions,
      '获取提交列表成功'
    );
    
  } catch (error) {
    console.error('[API/Submissions] Failed to get submissions:', error);
    
    return createErrorResponse(
      '获取提交列表失败',
      500
    );
  }
}

// ============================================================================
// Route Configuration
// ============================================================================

/**
 * 支持的HTTP方法
 */
export const dynamic = 'force-dynamic';

/**
 * 路由段配置
 */
export const runtime = 'nodejs';