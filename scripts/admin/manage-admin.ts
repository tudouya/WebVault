#!/usr/bin/env npx tsx

/**
 * Admin User Management CLI Script
 * 
 * Comprehensive management tool for administrator accounts including:
 * - Update admin information (name, email)
 * - Delete admin accounts with safety checks
 * - Reset admin passwords with optional generation
 * - Check admin status and lockout information
 * - Unlock locked admin accounts
 * 
 * Requirements:
 * - 2.5: 管理员账户管理脚本功能扩展
 * 
 * Usage:
 *   npm run admin:update -- --id=uuid-here --name="New Name" [--email=new@email.com]
 *   npm run admin:delete -- --id=uuid-here [--confirm]
 *   npm run admin:reset-password -- --email=admin@example.com [--password=NewPass123]
 *   npm run admin:status -- --email=admin@example.com
 *   npm run admin:unlock -- --email=admin@example.com
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
    updatedAt?: string;
    role?: 'admin';
    status?: 'active' | 'locked';
    lockoutInfo?: {
      attemptCount: number;
      lockedUntil: string | null;
      remainingLockTime?: string;
    };
    changes?: {
      before: Record<string, any>;
      after: Record<string, any>;
    };
  };
  error?: {
    code: string;
    details: string;
    field?: string;
  };
}

// ============================================================================
// Operation Type Definitions
// ============================================================================

type OperationType = 'update' | 'delete' | 'reset-password' | 'status' | 'unlock';

// ============================================================================
// Input Validation Schemas
// ============================================================================

const UpdateAdminSchema = z.object({
  operation: z.literal('update'),
  id: z.string().uuid('管理员ID必须是有效的UUID'),
  name: z
    .string()
    .min(2, '姓名至少需要2个字符')
    .max(100, '姓名不能超过100个字符')
    .trim()
    .optional(),
  email: z
    .string()
    .email('邮箱格式无效')
    .min(5, '邮箱至少需要5个字符')
    .max(255, '邮箱不能超过255个字符')
    .toLowerCase()
    .trim()
    .optional(),
});

const DeleteAdminSchema = z.object({
  operation: z.literal('delete'),
  id: z.string().uuid('管理员ID必须是有效的UUID'),
  confirm: z.boolean().default(false),
});

const ResetPasswordSchema = z.object({
  operation: z.literal('reset-password'),
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
    )
    .optional(),
});

const StatusSchema = z.object({
  operation: z.literal('status'),
  email: z
    .string()
    .email('邮箱格式无效')
    .min(5, '邮箱至少需要5个字符')
    .max(255, '邮箱不能超过255个字符')
    .toLowerCase()
    .trim(),
});

const UnlockSchema = z.object({
  operation: z.literal('unlock'),
  email: z
    .string()
    .email('邮箱格式无效')
    .min(5, '邮箱至少需要5个字符')
    .max(255, '邮箱不能超过255个字符')
    .toLowerCase()
    .trim(),
});

type UpdateAdminInput = z.infer<typeof UpdateAdminSchema>;
type DeleteAdminInput = z.infer<typeof DeleteAdminSchema>;
type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
type StatusInput = z.infer<typeof StatusSchema>;
type UnlockInput = z.infer<typeof UnlockSchema>;

type ManageAdminInput = UpdateAdminInput | DeleteAdminInput | ResetPasswordInput | StatusInput | UnlockInput;

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

function parseArguments(): ManageAdminInput | CLIResponse {
  const args = process.argv.slice(2);
  const parsedArgs: Record<string, string> = {};
  
  // 第一个参数如果不是以--开头，则认为是操作类型
  let explicitOperation: OperationType | undefined;
  let startIndex = 0;
  
  if (args.length > 0 && !args[0].startsWith('--')) {
    const firstArg = args[0];
    if (['update', 'delete', 'reset-password', 'status', 'unlock'].includes(firstArg)) {
      explicitOperation = firstArg as OperationType;
      startIndex = 1;
    }
  }

  for (let i = startIndex; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=', 2);
      if (key && value !== undefined) {
        parsedArgs[key] = value;
      } else if (key && value === undefined) {
        // 处理布尔标志 (如 --confirm)
        parsedArgs[key] = 'true';
      }
    }
  }

  // 确定操作类型
  let operation: OperationType;
  
  if (explicitOperation) {
    operation = explicitOperation;
  } else if (parsedArgs.id && (parsedArgs.name || parsedArgs.email)) {
    operation = 'update';
  } else if (parsedArgs.id && (parsedArgs.confirm !== undefined)) {
    operation = 'delete';
  } else if (parsedArgs.email && parsedArgs.password !== undefined) {
    operation = 'reset-password';
  } else if (parsedArgs.email && parsedArgs.unlock !== undefined) {
    operation = 'unlock';
  } else if (parsedArgs.email) {
    operation = 'status';
  } else {
    return {
      success: false,
      message: '无法识别的操作或缺少必需的参数',
      error: {
        code: 'INVALID_OPERATION',
        details: `使用方法:
        
更新管理员信息:
  npm run admin:update -- --id=uuid-here --name="New Name" [--email=new@email.com]

删除管理员账户:
  npm run admin:delete -- --id=uuid-here [--confirm]

重置管理员密码:
  npm run admin:reset-password -- --email=admin@example.com [--password=NewPass123]

检查管理员状态:
  npm run admin:status -- --email=admin@example.com

解锁管理员账户:
  npm run admin:unlock -- --email=admin@example.com`,
      },
    };
  }

  try {
    const baseInput = { operation, ...parsedArgs };
    
    // 转换布尔值
    if (parsedArgs.confirm) {
      (baseInput as any).confirm = parsedArgs.confirm === 'true';
    }

    // 根据操作类型验证输入
    switch (operation) {
      case 'update':
        return UpdateAdminSchema.parse(baseInput);
      case 'delete':
        return DeleteAdminSchema.parse(baseInput);
      case 'reset-password':
        return ResetPasswordSchema.parse(baseInput);
      case 'status':
        return StatusSchema.parse(baseInput);
      case 'unlock':
        return UnlockSchema.parse(baseInput);
      default:
        throw new Error('未知操作类型');
    }
  } catch (error: any) {
    // 处理Zod验证错误
    if (error?.issues && Array.isArray(error.issues)) {
      const errorMessages = error.issues.map((issue: any) => {
        const path = (issue.path || []).join('.');
        const fieldName = path || '参数';
        
        switch (issue.code) {
          case 'invalid_string':
            if (issue.validation === 'uuid') {
              return `${fieldName}: 必须是有效的UUID格式`;
            }
            if (issue.validation === 'email') {
              return `${fieldName}: 邮箱格式无效`;
            }
            break;
          case 'too_small':
            return `${fieldName}: 值太小，最小值为 ${issue.minimum}`;
          case 'too_big':
            return `${fieldName}: 值太大，最大值为 ${issue.maximum}`;
          case 'invalid_type':
            return `${fieldName}: 类型错误，期望 ${issue.expected}，得到 ${issue.received}`;
          default:
            return `${fieldName}: ${issue.message}`;
        }
        
        return `${fieldName}: ${issue.message}`;
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
// Helper Functions
// ============================================================================

/**
 * 生成安全的随机密码
 */
function generateRandomPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  // 确保包含每种类型的字符
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // 填充剩余长度
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // 打乱字符顺序
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * 检查锁定状态
 */
async function checkLockoutStatus(email: string): Promise<CLIResponse['data']> {
  if (!supabaseServiceRole) {
    return undefined;
  }

  try {
    const { data: lockoutData } = await supabaseServiceRole
      .from('auth_lockouts')
      .select('attempt_count, locked_until')
      .eq('email', email)
      .maybeSingle();

    if (!lockoutData) {
      return {
        status: 'active' as const,
        lockoutInfo: {
          attemptCount: 0,
          lockedUntil: null,
        },
      };
    }

    // 计算剩余锁定时间
    let status: 'active' | 'locked' = 'active';
    let remainingLockTime: string | undefined;

    if (lockoutData.locked_until) {
      const lockedUntil = new Date(lockoutData.locked_until);
      const now = new Date();
      
      if (lockedUntil > now) {
        status = 'locked';
        const remainingMs = lockedUntil.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
        remainingLockTime = `${remainingMinutes} 分钟`;
      }
    }

    return {
      status,
      lockoutInfo: {
        attemptCount: lockoutData.attempt_count,
        lockedUntil: lockoutData.locked_until,
        remainingLockTime,
      },
    };
  } catch (error) {
    console.warn(`无法查询 ${email} 的锁定状态:`, error instanceof Error ? error.message : '未知错误');
    return undefined;
  }
}

/**
 * 获取管理员总数
 */
async function getAdminCount(): Promise<number> {
  if (!supabaseServiceRole) {
    return 0;
  }

  try {
    const { count } = await supabaseServiceRole
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    return count || 0;
  } catch (error) {
    console.warn('无法获取管理员总数:', error instanceof Error ? error.message : '未知错误');
    return 0;
  }
}

// ============================================================================
// Admin Management Operations
// ============================================================================

/**
 * 更新管理员信息
 */
async function updateAdmin(input: UpdateAdminInput): Promise<CLIResponse> {
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
    // 1. 检查管理员是否存在
    const { data: existingAdmin, error: fetchError } = await supabaseServiceRole
      .from('user_profiles')
      .select('id, email, name, role, created_at, updated_at')
      .eq('id', input.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (fetchError) {
      return {
        success: false,
        message: '查询管理员信息失败',
        error: {
          code: 'QUERY_FAILED',
          details: fetchError.message,
        },
      };
    }

    if (!existingAdmin) {
      return {
        success: false,
        message: '管理员账户不存在',
        error: {
          code: 'ADMIN_NOT_FOUND',
          details: `ID为 ${input.id} 的管理员账户不存在`,
        },
      };
    }

    // 2. 检查邮箱唯一性（如果要更新邮箱）
    if (input.email && input.email !== existingAdmin.email) {
      const { data: emailExists } = await supabaseServiceRole
        .from('user_profiles')
        .select('id')
        .eq('email', input.email)
        .neq('id', input.id)
        .maybeSingle();

      if (emailExists) {
        return {
          success: false,
          message: '邮箱更新失败',
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            details: `邮箱 ${input.email} 已被其他用户使用`,
            field: 'email',
          },
        };
      }
    }

    // 3. 准备更新数据
    const updateData: Database['public']['Tables']['user_profiles']['Update'] = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.email !== undefined) {
      updateData.email = input.email;
    }

    // 4. 在事务中更新用户资料和认证用户
    const { data: updatedAdmin, error: updateError } = await supabaseServiceRole
      .from('user_profiles')
      .update(updateData)
      .eq('id', input.id)
      .select('id, email, name, role, created_at, updated_at')
      .single();

    if (updateError) {
      return {
        success: false,
        message: '更新管理员资料失败',
        error: {
          code: 'UPDATE_PROFILE_FAILED',
          details: updateError.message,
        },
      };
    }

    // 5. 更新认证用户信息（如果有邮箱变更）
    if (input.email && input.email !== existingAdmin.email) {
      const { error: authUpdateError } = await supabaseServiceRole.auth.admin.updateUserById(
        input.id,
        { 
          email: input.email,
          user_metadata: {
            name: updatedAdmin.name,
            role: 'admin',
            updated_by: 'admin_cli',
            updated_at: new Date().toISOString(),
          },
        }
      );

      if (authUpdateError) {
        // 回滚用户资料更新
        await supabaseServiceRole
          .from('user_profiles')
          .update({
            email: existingAdmin.email,
            name: existingAdmin.name,
            updated_at: existingAdmin.updated_at,
          })
          .eq('id', input.id);

        return {
          success: false,
          message: '更新认证用户信息失败',
          error: {
            code: 'UPDATE_AUTH_FAILED',
            details: authUpdateError.message,
          },
        };
      }
    }

    return {
      success: true,
      message: '管理员信息更新成功',
      data: {
        adminId: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.name,
        role: 'admin',
        createdAt: updatedAdmin.created_at,
        updatedAt: updatedAdmin.updated_at,
        changes: {
          before: {
            email: existingAdmin.email,
            name: existingAdmin.name,
          },
          after: {
            email: updatedAdmin.email,
            name: updatedAdmin.name,
          },
        },
      },
    };

  } catch (error) {
    return {
      success: false,
      message: '更新管理员信息时发生错误',
      error: {
        code: 'UNEXPECTED_ERROR',
        details: error instanceof Error ? error.message : '未知错误',
      },
    };
  }
}

/**
 * 删除管理员账户
 */
async function deleteAdmin(input: DeleteAdminInput): Promise<CLIResponse> {
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
    // 1. 检查管理员是否存在
    const { data: existingAdmin, error: fetchError } = await supabaseServiceRole
      .from('user_profiles')
      .select('id, email, name, role')
      .eq('id', input.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (fetchError) {
      return {
        success: false,
        message: '查询管理员信息失败',
        error: {
          code: 'QUERY_FAILED',
          details: fetchError.message,
        },
      };
    }

    if (!existingAdmin) {
      return {
        success: false,
        message: '管理员账户不存在',
        error: {
          code: 'ADMIN_NOT_FOUND',
          details: `ID为 ${input.id} 的管理员账户不存在`,
        },
      };
    }

    // 2. 检查是否为最后一个管理员
    const adminCount = await getAdminCount();
    if (adminCount <= 1) {
      return {
        success: false,
        message: '删除失败：不能删除最后一个管理员账户',
        error: {
          code: 'LAST_ADMIN_PROTECTION',
          details: '系统至少需要保留一个管理员账户以确保可管理性',
        },
      };
    }

    // 3. 确认提示
    if (!input.confirm) {
      return {
        success: false,
        message: '需要确认删除操作',
        error: {
          code: 'CONFIRMATION_REQUIRED',
          details: `即将删除管理员账户: ${existingAdmin.email} (${existingAdmin.name || '未设置姓名'})
          
请使用 --confirm 参数确认删除操作:
  npm run admin:delete -- --id=${input.id} --confirm`,
        },
      };
    }

    // 4. 执行删除操作（事务处理）
    // 先删除锁定记录
    await supabaseServiceRole
      .from('auth_lockouts')
      .delete()
      .eq('email', existingAdmin.email);

    // 删除用户资料
    const { error: profileDeleteError } = await supabaseServiceRole
      .from('user_profiles')
      .delete()
      .eq('id', input.id);

    if (profileDeleteError) {
      return {
        success: false,
        message: '删除用户资料失败',
        error: {
          code: 'DELETE_PROFILE_FAILED',
          details: profileDeleteError.message,
        },
      };
    }

    // 删除认证用户
    const { error: authDeleteError } = await supabaseServiceRole.auth.admin.deleteUser(
      input.id
    );

    if (authDeleteError) {
      // 尝试恢复用户资料（虽然可能失败）
      console.warn('认证用户删除失败，但用户资料已删除:', authDeleteError.message);
      
      return {
        success: false,
        message: '删除认证用户失败',
        error: {
          code: 'DELETE_AUTH_FAILED',
          details: authDeleteError.message,
        },
      };
    }

    return {
      success: true,
      message: `管理员账户删除成功: ${existingAdmin.email}`,
      data: {
        adminId: existingAdmin.id,
        email: existingAdmin.email,
        name: existingAdmin.name,
        role: 'admin',
      },
    };

  } catch (error) {
    return {
      success: false,
      message: '删除管理员账户时发生错误',
      error: {
        code: 'UNEXPECTED_ERROR',
        details: error instanceof Error ? error.message : '未知错误',
      },
    };
  }
}

/**
 * 重置管理员密码
 */
async function resetPassword(input: ResetPasswordInput): Promise<CLIResponse> {
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
    // 1. 检查管理员是否存在
    const { data: existingAdmin, error: fetchError } = await supabaseServiceRole
      .from('user_profiles')
      .select('id, email, name, role')
      .eq('email', input.email)
      .eq('role', 'admin')
      .maybeSingle();

    if (fetchError) {
      return {
        success: false,
        message: '查询管理员信息失败',
        error: {
          code: 'QUERY_FAILED',
          details: fetchError.message,
        },
      };
    }

    if (!existingAdmin) {
      return {
        success: false,
        message: '管理员账户不存在',
        error: {
          code: 'ADMIN_NOT_FOUND',
          details: `邮箱为 ${input.email} 的管理员账户不存在`,
        },
      };
    }

    // 2. 生成密码（如果未提供）
    const newPassword = input.password || generateRandomPassword(12);

    // 3. 重置密码
    const { error: resetError } = await supabaseServiceRole.auth.admin.updateUserById(
      existingAdmin.id,
      { 
        password: newPassword,
        user_metadata: {
          name: existingAdmin.name,
          role: 'admin',
          password_reset_by: 'admin_cli',
          password_reset_at: new Date().toISOString(),
        },
      }
    );

    if (resetError) {
      return {
        success: false,
        message: '重置密码失败',
        error: {
          code: 'PASSWORD_RESET_FAILED',
          details: resetError.message,
        },
      };
    }

    // 4. 清除锁定记录（自动解锁账户）
    await supabaseServiceRole
      .from('auth_lockouts')
      .delete()
      .eq('email', input.email);

    return {
      success: true,
      message: `管理员密码重置成功: ${input.email}`,
      data: {
        adminId: existingAdmin.id,
        email: existingAdmin.email,
        name: existingAdmin.name,
        role: 'admin',
        status: 'active' as const,
        changes: {
          before: { password: '(已加密)' },
          after: { 
            password: input.password ? '(已设置)' : '(已生成)',
            newPassword: input.password ? undefined : newPassword,
          },
        },
      },
    };

  } catch (error) {
    return {
      success: false,
      message: '重置管理员密码时发生错误',
      error: {
        code: 'UNEXPECTED_ERROR',
        details: error instanceof Error ? error.message : '未知错误',
      },
    };
  }
}

/**
 * 检查管理员状态
 */
async function checkAdminStatus(input: StatusInput): Promise<CLIResponse> {
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
    // 1. 获取管理员信息
    const { data: adminInfo, error: fetchError } = await supabaseServiceRole
      .from('user_profiles')
      .select('id, email, name, role, created_at, updated_at')
      .eq('email', input.email)
      .eq('role', 'admin')
      .maybeSingle();

    if (fetchError) {
      return {
        success: false,
        message: '查询管理员信息失败',
        error: {
          code: 'QUERY_FAILED',
          details: fetchError.message,
        },
      };
    }

    if (!adminInfo) {
      return {
        success: false,
        message: '管理员账户不存在',
        error: {
          code: 'ADMIN_NOT_FOUND',
          details: `邮箱为 ${input.email} 的管理员账户不存在`,
        },
      };
    }

    // 2. 获取锁定状态
    const lockoutStatus = await checkLockoutStatus(input.email);

    return {
      success: true,
      message: `管理员状态查询成功: ${input.email}`,
      data: {
        adminId: adminInfo.id,
        email: adminInfo.email,
        name: adminInfo.name,
        role: 'admin',
        createdAt: adminInfo.created_at,
        updatedAt: adminInfo.updated_at,
        status: lockoutStatus?.status || 'active',
        lockoutInfo: lockoutStatus?.lockoutInfo,
      },
    };

  } catch (error) {
    return {
      success: false,
      message: '检查管理员状态时发生错误',
      error: {
        code: 'UNEXPECTED_ERROR',
        details: error instanceof Error ? error.message : '未知错误',
      },
    };
  }
}

/**
 * 解锁管理员账户
 */
async function unlockAdmin(input: UnlockInput): Promise<CLIResponse> {
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
    // 1. 检查管理员是否存在
    const { data: existingAdmin, error: fetchError } = await supabaseServiceRole
      .from('user_profiles')
      .select('id, email, name, role')
      .eq('email', input.email)
      .eq('role', 'admin')
      .maybeSingle();

    if (fetchError) {
      return {
        success: false,
        message: '查询管理员信息失败',
        error: {
          code: 'QUERY_FAILED',
          details: fetchError.message,
        },
      };
    }

    if (!existingAdmin) {
      return {
        success: false,
        message: '管理员账户不存在',
        error: {
          code: 'ADMIN_NOT_FOUND',
          details: `邮箱为 ${input.email} 的管理员账户不存在`,
        },
      };
    }

    // 2. 检查当前锁定状态
    const lockoutStatus = await checkLockoutStatus(input.email);
    
    if (!lockoutStatus?.lockoutInfo || lockoutStatus.status === 'active') {
      return {
        success: true,
        message: `管理员账户已处于解锁状态: ${input.email}`,
        data: {
          adminId: existingAdmin.id,
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: 'admin',
          status: 'active' as const,
          lockoutInfo: lockoutStatus?.lockoutInfo,
        },
      };
    }

    // 3. 清除锁定记录
    const { error: unlockError } = await supabaseServiceRole
      .from('auth_lockouts')
      .delete()
      .eq('email', input.email);

    if (unlockError) {
      return {
        success: false,
        message: '解锁管理员账户失败',
        error: {
          code: 'UNLOCK_FAILED',
          details: unlockError.message,
        },
      };
    }

    return {
      success: true,
      message: `管理员账户解锁成功: ${input.email}`,
      data: {
        adminId: existingAdmin.id,
        email: existingAdmin.email,
        name: existingAdmin.name,
        role: 'admin',
        status: 'active' as const,
        changes: {
          before: {
            status: 'locked',
            attemptCount: lockoutStatus.lockoutInfo.attemptCount,
            lockedUntil: lockoutStatus.lockoutInfo.lockedUntil,
          },
          after: {
            status: 'active',
            attemptCount: 0,
            lockedUntil: null,
          },
        },
      },
    };

  } catch (error) {
    return {
      success: false,
      message: '解锁管理员账户时发生错误',
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
  target: string,
  result: 'success' | 'failure',
  details?: string
) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    operation: `admin_cli:${operation}`,
    target,
    result,
    details,
    ip_address: 'CLI_EXECUTION',
    user_agent: 'admin-manage-script',
  };

  console.log(`[AUDIT LOG] ${JSON.stringify(logEntry)}`);
}

// ============================================================================
// Main Function
// ============================================================================

async function main(): Promise<void> {
  console.log('⚡ WebVault 管理员管理工具\n');

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

  const input = parseResult as ManageAdminInput;
  
  // 显示操作信息
  console.log('📋 执行操作:', input.operation);
  switch (input.operation) {
    case 'update':
      console.log('   管理员ID:', input.id);
      if (input.name) console.log('   新姓名:', input.name);
      if (input.email) console.log('   新邮箱:', input.email);
      break;
    case 'delete':
      console.log('   管理员ID:', input.id);
      console.log('   确认删除:', input.confirm ? '是' : '否');
      break;
    case 'reset-password':
      console.log('   邮箱:', input.email);
      console.log('   自定义密码:', input.password ? '是' : '否');
      break;
    case 'status':
      console.log('   邮箱:', input.email);
      break;
    case 'unlock':
      console.log('   邮箱:', input.email);
      break;
  }
  console.log('');

  // 3. 执行对应的操作
  try {
    let result: CLIResponse;
    let targetIdentifier: string;

    switch (input.operation) {
      case 'update':
        result = await updateAdmin(input);
        targetIdentifier = input.id;
        break;
      case 'delete':
        result = await deleteAdmin(input);
        targetIdentifier = input.id;
        break;
      case 'reset-password':
        result = await resetPassword(input);
        targetIdentifier = input.email;
        break;
      case 'status':
        result = await checkAdminStatus(input);
        targetIdentifier = input.email;
        break;
      case 'unlock':
        result = await unlockAdmin(input);
        targetIdentifier = input.email;
        break;
      default:
        throw new Error('未知操作类型');
    }

    if (result.success) {
      console.log('✅', result.message);
      
      if (result.data) {
        console.log('');
        console.log('📊 详细信息:');
        
        if (result.data.adminId) {
          console.log('   ID:', result.data.adminId);
        }
        if (result.data.email) {
          console.log('   邮箱:', result.data.email);
        }
        if (result.data.name) {
          console.log('   姓名:', result.data.name);
        }
        if (result.data.role) {
          console.log('   角色:', result.data.role);
        }
        if (result.data.status) {
          console.log('   状态:', result.data.status === 'active' ? '✅ 正常' : '🔒 锁定');
        }
        if (result.data.createdAt) {
          console.log('   创建时间:', new Date(result.data.createdAt).toLocaleString('zh-CN'));
        }
        if (result.data.updatedAt) {
          console.log('   更新时间:', new Date(result.data.updatedAt).toLocaleString('zh-CN'));
        }
        
        if (result.data.lockoutInfo) {
          console.log('');
          console.log('🔒 锁定信息:');
          console.log('   失败尝试次数:', result.data.lockoutInfo.attemptCount);
          if (result.data.lockoutInfo.lockedUntil) {
            console.log('   锁定至:', new Date(result.data.lockoutInfo.lockedUntil).toLocaleString('zh-CN'));
          }
          if (result.data.lockoutInfo.remainingLockTime) {
            console.log('   剩余锁定时间:', result.data.lockoutInfo.remainingLockTime);
          }
        }
        
        if (result.data.changes) {
          console.log('');
          console.log('🔄 变更详情:');
          console.log('   变更前:', JSON.stringify(result.data.changes.before, null, 2));
          console.log('   变更后:', JSON.stringify(result.data.changes.after, null, 2));
        }
      }

      // 记录成功的审计日志
      logAuditEvent(
        input.operation,
        targetIdentifier,
        'success',
        `${input.operation} operation completed successfully`
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
        input.operation,
        targetIdentifier,
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
      input.operation,
      'unknown',
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
export {
  updateAdmin,
  deleteAdmin,
  resetPassword,
  checkAdminStatus,
  unlockAdmin,
  generateRandomPassword,
  UpdateAdminSchema,
  DeleteAdminSchema,
  ResetPasswordSchema,
  StatusSchema,
  UnlockSchema,
  type ManageAdminInput,
  type UpdateAdminInput,
  type DeleteAdminInput,
  type ResetPasswordInput,
  type StatusInput,
  type UnlockInput,
  type CLIResponse,
};