#!/usr/bin/env npx tsx

/**
 * Admin User Creation CLI Script
 * 
 * Creates a new administrator account with email and password validation.
 * Uses Supabase Service Role Client for secure user creation.
 * 
 * Requirements:
 * - 2.1: 管理员账户管理脚本
 * - 2.2: 验证邮箱格式和密码强度
 * - 2.4: 在Supabase auth.users和user_profiles表中创建对应记录
 * 
 * Usage:
 *   npm run admin:create -- --email=admin@example.com --password=SecurePass123 --name="Admin User"
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
    adminId?: string;
    email?: string;
    name?: string;
    createdAt?: string;
    role?: 'admin';
  };
  error?: {
    code: string;
    details: string;
    field?: string;
  };
}

// ============================================================================
// Input Validation Schema
// ============================================================================

const CreateAdminSchema = z.object({
  email: z
    .string()
    .email('邮箱格式无效')
    .min(5, '邮箱至少需要5个字符')
    .max(255, '邮箱不能超过255个字符')
    .toLowerCase()
    .trim(),
  
  password: z
    .string()
    .min(8, '密码至少需要8个字符')
    .max(128, '密码不能超过128个字符')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
      '密码必须包含至少一个小写字母、一个大写字母和一个数字'
    ),
  
  name: z
    .string()
    .min(2, '姓名至少需要2个字符')
    .max(100, '姓名不能超过100个字符')
    .trim()
    .optional()
    .transform((val) => val || null),
});

type CreateAdminInput = z.infer<typeof CreateAdminSchema>;

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

function parseArguments(): CreateAdminInput | CLIResponse {
  const args = process.argv.slice(2);
  const parsedArgs: Record<string, string> = {};

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=', 2);
      if (key && value) {
        parsedArgs[key] = value;
      }
    }
  }

  // 检查必需的参数
  if (!parsedArgs.email || !parsedArgs.password) {
    return {
      success: false,
      message: '缺少必需的参数',
      error: {
        code: 'MISSING_REQUIRED_ARGS',
        details: '使用方法: npm run admin:create -- --email=admin@example.com --password=SecurePass123 --name="Admin User"',
      },
    };
  }

  try {
    return CreateAdminSchema.parse({
      email: parsedArgs.email,
      password: parsedArgs.password,
      name: parsedArgs.name,
    });
  } catch (error: any) {
    // 处理Zod验证错误
    if (error && error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
      const errorMessages = error.errors.map((err: any) => {
        const path = (err.path || []).join('.');
        return `${path}: ${err.message}`;
      });
      return {
        success: false,
        message: '输入验证失败',
        error: {
          code: 'VALIDATION_ERROR',
          details: errorMessages.join('; '),
          field: error.errors[0]?.path?.join('.') || 'unknown',
        },
      };
    }

    return {
      success: false,
      message: '参数解析失败',
      error: {
        code: 'PARSE_ERROR',
        details: error instanceof Error ? error.message : 'Validation failed - please check your input parameters',
      },
    };
  }
}

// ============================================================================
// Admin Creation Logic
// ============================================================================

async function createAdminUser(input: CreateAdminInput): Promise<CLIResponse> {
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
    // 1. 检查邮箱是否已存在
    const { data: existingUser } = await supabaseServiceRole.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (existingUser?.users?.some(user => user.email === input.email)) {
      return {
        success: false,
        message: '管理员账户创建失败',
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          details: `邮箱 ${input.email} 已被使用`,
          field: 'email',
        },
      };
    }

    // 2. 创建用户账户
    const { data: authUser, error: authError } = await supabaseServiceRole.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true, // 自动确认邮箱
      user_metadata: {
        name: input.name,
        role: 'admin',
        created_by: 'admin_cli',
        created_at: new Date().toISOString(),
      },
    });

    if (authError || !authUser.user) {
      return {
        success: false,
        message: '用户账户创建失败',
        error: {
          code: authError?.message?.includes('password') ? 'WEAK_PASSWORD' : 'USER_CREATION_FAILED',
          details: authError?.message || '创建用户时发生未知错误',
        },
      };
    }

    // 3. 创建用户资料记录
    const profileData: Database['public']['Tables']['user_profiles']['Insert'] = {
      id: authUser.user.id,
      email: input.email,
      name: input.name,
      role: 'admin',
      avatar: null,
      metadata: {
        created_by: 'admin_cli',
        source: 'manual_creation',
        creation_timestamp: new Date().toISOString(),
      },
    };

    const { error: profileError } = await supabaseServiceRole
      .from('user_profiles')
      .insert(profileData);

    if (profileError) {
      // 如果用户资料创建失败，尝试删除已创建的用户账户
      await supabaseServiceRole.auth.admin.deleteUser(authUser.user.id);
      
      return {
        success: false,
        message: '用户资料创建失败',
        error: {
          code: 'PROFILE_CREATION_FAILED',
          details: profileError.message,
        },
      };
    }

    // 4. 返回成功结果
    return {
      success: true,
      message: `管理员账户创建成功！邮箱: ${input.email}`,
      data: {
        adminId: authUser.user.id,
        email: input.email,
        name: input.name || undefined,
        role: 'admin',
        createdAt: authUser.user.created_at,
      },
    };

  } catch (error) {
    return {
      success: false,
      message: '创建管理员账户时发生错误',
      error: {
        code: 'UNEXPECTED_ERROR',
        details: error instanceof Error ? error.message : '未知错误',
      },
    };
  }
}

// ============================================================================
// Audit Logging
// ============================================================================

function logAuditEvent(
  operation: string,
  email: string,
  result: 'success' | 'failure',
  details?: string
) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    operation: `admin_cli:${operation}`,
    email,
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
  console.log('🔧 WebVault 管理员创建工具\n');

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
    process.exit(1);
  }

  const input = parseResult as CreateAdminInput;
  console.log('📋 创建管理员账户:');
  console.log('   邮箱:', input.email);
  console.log('   姓名:', input.name || '(未设置)');
  console.log('');

  // 3. 创建管理员
  try {
    const result = await createAdminUser(input);

    if (result.success) {
      console.log('✅', result.message);
      if (result.data) {
        console.log('');
        console.log('📊 管理员信息:');
        console.log('   ID:', result.data.adminId);
        console.log('   邮箱:', result.data.email);
        console.log('   姓名:', result.data.name || '(未设置)');
        console.log('   角色:', result.data.role);
        console.log('   创建时间:', result.data.createdAt);
      }

      // 记录成功的审计日志
      logAuditEvent('create_admin', input.email, 'success', 'Admin user created successfully');
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
        'create_admin',
        input.email,
        'failure',
        result.error?.code || 'Unknown error'
      );
      process.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('❌ 执行过程中发生意外错误:', errorMessage);
    
    // 记录失败的审计日志
    logAuditEvent('create_admin', input.email, 'failure', `Unexpected error: ${errorMessage}`);
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
export { createAdminUser, CreateAdminSchema, type CreateAdminInput, type CLIResponse };