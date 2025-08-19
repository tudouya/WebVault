#!/usr/bin/env npx tsx

/**
 * Admin User List CLI Script
 * 
 * Lists existing administrator accounts with status and filtering capabilities.
 * Supports table and JSON output formats with pagination and search functionality.
 * 
 * Requirements:
 * - 2.5: 管理员账户管理脚本功能扩展
 * 
 * Usage:
 *   npm run admin:list [-- --format=table|json] [--limit=20] [--search=admin@example.com] [--page=1]
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import { z } from 'zod';
import { supabaseServiceRole } from '../../src/lib/supabase';
import type { Database } from '../../src/lib/types/database';

// ============================================================================
// CLI Response Interface
// ============================================================================

interface CLIResponse {
  success: boolean;
  message: string;
  data?: {
    admins?: AdminInfo[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
  error?: {
    code: string;
    details: string;
    field?: string;
  };
}

interface AdminInfo {
  adminId: string;
  email: string;
  name: string | null;
  role: 'admin';
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'locked';
  lockoutInfo?: {
    attemptCount: number;
    lockedUntil: string | null;
    remainingLockTime?: string;
  };
}

// ============================================================================
// Input Validation Schema
// ============================================================================

const ListAdminsSchema = z.object({
  format: z
    .enum(['table', 'json'])
    .default('table'),
  
  limit: z
    .number()
    .min(1, '限制数量至少为1')
    .max(100, '限制数量不能超过100')
    .default(20),
  
  page: z
    .number()
    .min(1, '页码至少为1')
    .default(1),
  
  search: z
    .string()
    .email('搜索邮箱格式无效')
    .optional()
    .transform((val) => val || null),
});

type ListAdminsInput = z.infer<typeof ListAdminsSchema>;

// ============================================================================
// Environment Validation
// ============================================================================

function validateEnvironment(): CLIResponse | null {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      return {
        success: false,
        message: `缺少必需的环境变量: ${envVar}`,
        error: {
          code: 'MISSING_ENV_VAR',
          details: `环境变量 ${envVar} 未设置。请确保在 .env.local 文件中配置所有必需的环境变量。`,
        },
      };
    }
  }

  if (!supabaseServiceRole) {
    return {
      success: false,
      message: 'Supabase Service Role Client 初始化失败',
      error: {
        code: 'SERVICE_ROLE_INIT_FAILED',
        details: 'SUPABASE_SERVICE_ROLE_KEY 环境变量可能无效或格式错误。',
      },
    };
  }

  return null;
}

// ============================================================================
// Command Line Argument Parsing
// ============================================================================

function parseArguments(): ListAdminsInput | CLIResponse {
  const args = process.argv.slice(2);
  const parsedArgs: Record<string, string> = {};

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=', 2);
      if (key && value !== undefined) {
        parsedArgs[key] = value;
      }
    }
  }

  try {
    const input: any = {
      format: parsedArgs.format,
      search: parsedArgs.search,
    };

    // 处理数字类型参数
    if (parsedArgs.limit) {
      const limit = parseInt(parsedArgs.limit, 10);
      if (isNaN(limit)) {
        return {
          success: false,
          message: '参数解析失败',
          error: {
            code: 'INVALID_LIMIT',
            details: 'limit 参数必须是有效的数字',
            field: 'limit',
          },
        };
      }
      input.limit = limit;
    }

    if (parsedArgs.page) {
      const page = parseInt(parsedArgs.page, 10);
      if (isNaN(page)) {
        return {
          success: false,
          message: '参数解析失败',
          error: {
            code: 'INVALID_PAGE',
            details: 'page 参数必须是有效的数字',
            field: 'page',
          },
        };
      }
      input.page = page;
    }

    return ListAdminsSchema.parse(input);
  } catch (error: any) {
    // 处理Zod验证错误
    if (error?.issues && Array.isArray(error.issues)) {
      // Zod v3.x+ 格式
      const errorMessages = error.issues.map((issue: any) => {
        const path = (issue.path || []).join('.');
        const fieldName = path || '参数';
        
        // 处理常见的验证错误类型
        switch (issue.code) {
          case 'invalid_enum_value':
            return `${fieldName}: 无效的选项，支持的选项: ${issue.options?.join(', ')}`;
          case 'invalid_type':
            return `${fieldName}: 类型错误，期望 ${issue.expected}，得到 ${issue.received}`;
          case 'too_small':
            return `${fieldName}: 值太小，最小值为 ${issue.minimum}`;
          case 'too_big':
            return `${fieldName}: 值太大，最大值为 ${issue.maximum}`;
          default:
            return `${fieldName}: ${issue.message}`;
        }
      });
      
      return {
        success: false,
        message: '参数验证失败',
        error: {
          code: 'VALIDATION_ERROR',
          details: errorMessages.join('; '),
          field: error.issues[0]?.path?.join('.') || 'unknown',
        },
      };
    } else if (error?.errors && Array.isArray(error.errors)) {
      // Zod v2.x 格式（备用兼容）
      const errorMessages = error.errors.map((err: any) => {
        const path = (err.path || []).join('.');
        return `${path || '参数'}: ${err.message}`;
      });
      
      return {
        success: false,
        message: '参数验证失败',
        error: {
          code: 'VALIDATION_ERROR',
          details: errorMessages.join('; '),
          field: error.errors[0]?.path?.join('.') || 'unknown',
        },
      };
    }

    // 如果不是标准的Zod错误，直接返回错误信息
    return {
      success: false,
      message: '参数解析失败',
      error: {
        code: 'PARSE_ERROR',
        details: error instanceof Error ? error.message : '未知的解析错误',
      },
    };
  }
}

// ============================================================================
// Lockout Status Check Logic
// ============================================================================

async function checkLockoutStatus(email: string): Promise<AdminInfo['lockoutInfo'] | null> {
  if (!supabaseServiceRole) {
    return null;
  }

  try {
    const { data: lockoutData } = await supabaseServiceRole
      .from('auth_lockouts')
      .select('attempt_count, locked_until')
      .eq('email', email)
      .maybeSingle();

    if (!lockoutData) {
      return null;
    }

    const lockoutInfo: AdminInfo['lockoutInfo'] = {
      attemptCount: lockoutData.attempt_count,
      lockedUntil: lockoutData.locked_until,
    };

    // 计算剩余锁定时间
    if (lockoutData.locked_until) {
      const lockedUntil = new Date(lockoutData.locked_until);
      const now = new Date();
      
      if (lockedUntil > now) {
        const remainingMs = lockedUntil.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
        lockoutInfo.remainingLockTime = `${remainingMinutes} 分钟`;
      }
    }

    return lockoutInfo;
  } catch (error) {
    // 如果查询锁定状态失败，不影响主查询
    console.warn(`无法查询 ${email} 的锁定状态:`, error instanceof Error ? error.message : '未知错误');
    return null;
  }
}

// ============================================================================
// Admin Listing Logic
// ============================================================================

async function listAdmins(input: ListAdminsInput): Promise<CLIResponse> {
  if (!supabaseServiceRole) {
    return {
      success: false,
      message: 'Service Role Client 不可用',
      error: {
        code: 'SERVICE_ROLE_UNAVAILABLE',
        details: 'Supabase Service Role Client 未正确初始化',
      },
    };
  }

  try {
    // 构建查询
    let query = supabaseServiceRole
      .from('user_profiles')
      .select('id, email, name, role, created_at, updated_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    // 添加搜索过滤
    if (input.search) {
      query = query.ilike('email', `%${input.search}%`);
    }

    // 获取总数（用于分页信息）
    const { count: totalCount } = await supabaseServiceRole
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')
      .then(result => {
        if (input.search) {
          // 如果有搜索条件，需要重新计算总数
          return supabaseServiceRole!
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'admin')
            .ilike('email', `%${input.search}%`);
        }
        return result;
      });

    // 添加分页
    const offset = (input.page - 1) * input.limit;
    query = query.range(offset, offset + input.limit - 1);

    // 执行查询
    const { data: adminData, error: queryError } = await query;

    if (queryError) {
      // 检查是否是表不存在的错误
      if (queryError.message.includes('Could not find the table') || 
          queryError.code === 'PGRST116') {
        return {
          success: false,
          message: '数据库表尚未创建',
          error: {
            code: 'TABLES_NOT_CREATED',
            details: `数据库表 'user_profiles' 和 'auth_lockouts' 尚未创建。请先运行数据库迁移：\n\n1. 前往 Supabase 控制台: https://supabase.com/dashboard/project/\n2. 打开 SQL 编辑器\n3. 执行迁移文件: supabase/migrations/20250118120000_admin_auth_system.sql\n4. 重新运行此脚本\n\n或者使用: npm run db:migration-helper`,
          },
        };
      }
      
      return {
        success: false,
        message: '查询管理员列表失败',
        error: {
          code: 'QUERY_FAILED',
          details: queryError.message,
        },
      };
    }

    if (!adminData || adminData.length === 0) {
      return {
        success: true,
        message: input.search ? `未找到匹配 "${input.search}" 的管理员账户` : '当前没有管理员账户',
        data: {
          admins: [],
          pagination: {
            page: input.page,
            limit: input.limit,
            total: totalCount || 0,
            hasMore: false,
          },
        },
      };
    }

    // 检查每个管理员的锁定状态
    const adminInfoPromises = adminData.map(async (admin): Promise<AdminInfo> => {
      const lockoutInfo = await checkLockoutStatus(admin.email);
      
      // 确定状态
      let status: 'active' | 'locked' = 'active';
      if (lockoutInfo?.lockedUntil) {
        const lockedUntil = new Date(lockoutInfo.lockedUntil);
        const now = new Date();
        if (lockedUntil > now) {
          status = 'locked';
        }
      }

      return {
        adminId: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
        createdAt: admin.created_at,
        updatedAt: admin.updated_at,
        status,
        lockoutInfo: lockoutInfo || undefined,
      };
    });

    const admins = await Promise.all(adminInfoPromises);

    // 构建分页信息
    const pagination = {
      page: input.page,
      limit: input.limit,
      total: totalCount || 0,
      hasMore: (totalCount || 0) > offset + input.limit,
    };

    return {
      success: true,
      message: `找到 ${admins.length} 个管理员账户`,
      data: {
        admins,
        pagination,
      },
    };

  } catch (error) {
    return {
      success: false,
      message: '列出管理员账户时发生错误',
      error: {
        code: 'UNEXPECTED_ERROR',
        details: error instanceof Error ? error.message : '未知错误',
      },
    };
  }
}

// ============================================================================
// Output Formatting
// ============================================================================

function formatTableOutput(admins: AdminInfo[], pagination: any): void {
  console.log('');
  console.log('📋 管理员账户列表');
  console.log('════════════════════════════════════════════════════════════════════');
  
  if (admins.length === 0) {
    console.log('   (暂无数据)');
    console.log('');
    return;
  }

  // 计算列宽
  const emailMaxLength = Math.max(8, ...admins.map(a => a.email.length));
  const nameMaxLength = Math.max(6, ...admins.map(a => (a.name || '(未设置)').length));

  // 表头
  const emailHeader = 'EMAIL'.padEnd(emailMaxLength);
  const nameHeader = 'NAME'.padEnd(nameMaxLength);
  console.log(`ID                                     ${emailHeader} ${nameHeader} STATUS  CREATED`);
  console.log('─'.repeat(36 + 1 + emailMaxLength + 1 + nameMaxLength + 1 + 8 + 1 + 20));

  // 数据行
  admins.forEach((admin) => {
    const id = admin.adminId.slice(0, 36);
    const email = admin.email.padEnd(emailMaxLength);
    const name = (admin.name || '(未设置)').padEnd(nameMaxLength);
    const status = admin.status === 'locked' ? '🔒 LOCKED' : '✅ ACTIVE';
    const statusPadded = admin.status === 'locked' ? '🔒 LOCK' : '✅ ACT ';
    const created = new Date(admin.createdAt).toLocaleString('zh-CN').slice(0, 16);
    
    console.log(`${id} ${email} ${name} ${statusPadded} ${created}`);
    
    // 如果有锁定信息，显示详细信息
    if (admin.status === 'locked' && admin.lockoutInfo?.remainingLockTime) {
      console.log(`${''.padStart(36)} ${''.padStart(emailMaxLength)} ${''.padStart(nameMaxLength)} 剩余: ${admin.lockoutInfo.remainingLockTime}`);
    }
  });

  console.log('');
  
  // 分页信息
  console.log('📊 分页信息:');
  console.log(`   当前页: ${pagination.page}`);
  console.log(`   每页显示: ${pagination.limit}`);
  console.log(`   总计: ${pagination.total} 个管理员`);
  if (pagination.hasMore) {
    console.log(`   下一页: --page=${pagination.page + 1}`);
  }
}

function formatJSONOutput(admins: AdminInfo[], pagination: any): void {
  const output = {
    success: true,
    message: `找到 ${admins.length} 个管理员账户`,
    data: {
      admins,
      pagination,
    },
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(output, null, 2));
}

// ============================================================================
// Audit Logging
// ============================================================================

function logAuditEvent(
  operation: string,
  searchTerm: string | null,
  result: 'success' | 'failure',
  details?: string
) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    operation: `admin_cli:${operation}`,
    search_term: searchTerm || 'all',
    result,
    details,
    ip_address: 'CLI_EXECUTION',
    user_agent: 'admin-cli-script',
  };

  console.log(`[AUDIT LOG] ${JSON.stringify(logEntry)}`);
}

// ============================================================================
// Main Function
// ============================================================================

async function main(): Promise<void> {
  console.log('🔍 WebVault 管理员列表工具\n');

  // 1. 环境验证
  const envError = validateEnvironment();
  if (envError) {
    console.error('❌', envError.message);
    if (envError.error) {
      console.error('   详情:', envError.error.details);
    }
    process.exit(1);
  }

  // 2. 参数解析
  const parseResult = parseArguments();
  if ('success' in parseResult) {
    // 这是一个错误响应
    console.error('❌', parseResult.message);
    if (parseResult.error) {
      console.error('   详情:', parseResult.error.details);
      if (parseResult.error.field) {
        console.error('   字段:', parseResult.error.field);
      }
    }
    console.error('\n使用方法:');
    console.error('   npm run admin:list [-- --format=table|json] [--limit=20] [--search=admin@example.com] [--page=1]');
    process.exit(1);
  }

  const input = parseResult as ListAdminsInput;
  
  // 显示查询参数
  if (input.search || input.format !== 'table' || input.limit !== 20 || input.page !== 1) {
    console.log('🔧 查询参数:');
    console.log('   输出格式:', input.format);
    console.log('   每页数量:', input.limit);
    console.log('   当前页码:', input.page);
    if (input.search) {
      console.log('   搜索邮箱:', input.search);
    }
    console.log('');
  }

  // 3. 列出管理员
  try {
    const result = await listAdmins(input);

    if (result.success && result.data) {
      const { admins, pagination } = result.data;

      // 根据格式输出结果
      if (input.format === 'json') {
        formatJSONOutput(admins, pagination);
      } else {
        formatTableOutput(admins, pagination);
        console.log('✅', result.message);
      }

      // 记录成功的审计日志
      logAuditEvent(
        'list_admins',
        input.search,
        'success',
        `Found ${admins.length} admins (page ${pagination.page})`
      );
    } else {
      console.error('❌', result.message);
      if (result.error) {
        console.error('   错误代码:', result.error.code);
        console.error('   详情:', result.error.details);
        if (result.error.field) {
          console.error('   字段:', result.error.field);
        }
      }

      // 记录失败的审计日志
      logAuditEvent(
        'list_admins',
        input.search,
        'failure',
        result.error?.code || 'Unknown error'
      );
      process.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('❌ 执行过程中发生意外错误:', errorMessage);
    
    // 记录失败的审计日志
    logAuditEvent(
      'list_admins',
      input.search,
      'failure',
      `Unexpected error: ${errorMessage}`
    );
    process.exit(1);
  }
}

// ============================================================================
// Script Execution
// ============================================================================

// 只在直接运行脚本时执行
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
}

// 导出函数以供测试使用
export { listAdmins, ListAdminsSchema, type ListAdminsInput, type CLIResponse, type AdminInfo };