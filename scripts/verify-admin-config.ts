#!/usr/bin/env tsx
/**
 * Supabase Admin-Only 系统配置验证脚本
 * 
 * 此脚本验证Supabase项目是否正确配置为管理员专用模式：
 * 1. 验证公开注册已禁用
 * 2. 验证只有Service Role可以创建用户
 * 3. 验证现有管理员账户正常工作
 * 4. 验证RLS策略生效
 * 
 * 使用方法：
 * npm run verify-admin-config
 * 
 * @author WebVault Team
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

// 加载环境变量
config({ path: path.join(process.cwd(), '.env.local') })

// 配置验证结果接口
interface ValidationResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: string
}

// 颜色输出函数
const colors = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
}

// 验证结果数组
const results: ValidationResult[] = []

// 添加验证结果
function addResult(test: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: string) {
  results.push({ test, status, message, details })
}

// 打印结果
function printResults() {
  console.log(colors.bold('\n=== Supabase 管理员专用系统配置验证报告 ===\n'))
  
  let passCount = 0
  let failCount = 0
  let warningCount = 0

  results.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
    const color = result.status === 'PASS' ? colors.green : result.status === 'FAIL' ? colors.red : colors.yellow
    
    console.log(`${icon} ${color(result.test)}: ${result.message}`)
    if (result.details) {
      console.log(`   详情: ${result.details}`)
    }
    
    if (result.status === 'PASS') passCount++
    else if (result.status === 'FAIL') failCount++
    else warningCount++
  })

  console.log(colors.bold(`\n=== 验证总结 ===`))
  console.log(`${colors.green('通过')}: ${passCount}`)
  console.log(`${colors.red('失败')}: ${failCount}`)
  console.log(`${colors.yellow('警告')}: ${warningCount}`)
  
  if (failCount > 0) {
    console.log(colors.red('\n❌ 配置验证失败！请检查失败项并修复后重新运行。'))
    process.exit(1)
  } else if (warningCount > 0) {
    console.log(colors.yellow('\n⚠️  配置验证基本通过，但有警告项需要注意。'))
  } else {
    console.log(colors.green('\n✅ 所有配置验证通过！Supabase已正确配置为管理员专用模式。'))
  }
}

async function main() {
  console.log(colors.bold('开始验证 Supabase 管理员专用系统配置...\n'))

  // 1. 验证环境变量
  console.log('1. 验证环境变量配置...')
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      addResult(`环境变量 ${envVar}`, 'PASS', '已配置')
    } else {
      addResult(`环境变量 ${envVar}`, 'FAIL', '未配置或为空', '请检查 .env.local 文件')
      continue
    }
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log(colors.red('缺少必需的环境变量，跳过后续测试'))
    printResults()
    return
  }

  // 2. 验证公开注册已禁用
  console.log('2. 验证公开注册已禁用...')
  
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { data, error } = await anonClient.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!'
    })

    if (error && error.message.toLowerCase().includes('signup')) {
      addResult('公开注册禁用', 'PASS', '用户注册已正确禁用', `错误信息: ${error.message}`)
    } else if (data.user) {
      addResult('公开注册禁用', 'FAIL', '用户注册仍然启用！', '需要在Supabase Dashboard中禁用用户注册')
    } else {
      addResult('公开注册禁用', 'WARNING', '无法确定注册状态', `响应: ${JSON.stringify({ data, error })}`)
    }
  } catch (err) {
    addResult('公开注册禁用', 'WARNING', '测试注册时出现异常', `错误: ${err}`)
  }

  // 3. 验证Service Role权限
  console.log('3. 验证 Service Role 权限...')
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    addResult('Service Role 配置', 'FAIL', 'Service Role Key 未配置', '管理员专用系统需要Service Role Key来创建用户')
  } else {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
      // 尝试创建测试用户（然后删除）
      const testEmail = `service-test-${Date.now()}@example.com`
      const { data: createData, error: createError } = await serviceClient.auth.admin.createUser({
        email: testEmail,
        password: 'TestPassword123!',
        email_confirm: true
      })

      if (createData.user) {
        addResult('Service Role 创建用户', 'PASS', 'Service Role 可以成功创建用户')
        
        // 清理测试用户
        const { error: deleteError } = await serviceClient.auth.admin.deleteUser(createData.user.id)
        if (deleteError) {
          addResult('Service Role 清理', 'WARNING', '测试用户清理失败', `用户ID: ${createData.user.id}`)
        } else {
          addResult('Service Role 清理', 'PASS', '测试用户已清理')
        }
      } else {
        addResult('Service Role 创建用户', 'FAIL', 'Service Role 无法创建用户', `错误: ${createError?.message}`)
      }
    } catch (err) {
      addResult('Service Role 权限', 'FAIL', 'Service Role 测试异常', `错误: ${err}`)
    }
  }

  // 4. 验证管理员账户存在
  console.log('4. 验证管理员账户...')
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
      // 检查 user_profiles 表中的管理员用户
      const { data: profiles, error: profilesError } = await serviceClient
        .from('user_profiles')
        .select('id, email, role, created_at')
        .eq('role', 'admin')

      if (profilesError) {
        addResult('管理员账户检查', 'FAIL', '无法查询管理员账户', `错误: ${profilesError.message}`)
      } else if (profiles && profiles.length > 0) {
        addResult('管理员账户检查', 'PASS', `找到 ${profiles.length} 个管理员账户`, `邮箱: ${profiles.map(p => p.email).join(', ')}`)
      } else {
        addResult('管理员账户检查', 'WARNING', '未找到管理员账户', '建议使用 npm run admin:create 创建管理员账户')
      }
    } catch (err) {
      addResult('管理员账户检查', 'FAIL', '查询管理员账户时出现异常', `错误: ${err}`)
    }
  }

  // 5. 验证RLS策略
  console.log('5. 验证 RLS 策略...')
  
  try {
    // 使用匿名客户端尝试访问受保护的表
    const { data, error } = await anonClient
      .from('user_profiles')
      .select('*')
      .limit(1)

    if (error && error.message.includes('permission')) {
      addResult('RLS 策略生效', 'PASS', 'RLS 策略正确阻止了未授权访问', `错误信息: ${error.message}`)
    } else if (data && data.length === 0) {
      addResult('RLS 策略生效', 'PASS', 'RLS 策略生效，返回空结果')
    } else {
      addResult('RLS 策略生效', 'FAIL', '匿名用户可以访问受保护的数据！', '检查 RLS 策略配置')
    }
  } catch (err) {
    addResult('RLS 策略验证', 'WARNING', 'RLS 策略验证时出现异常', `错误: ${err}`)
  }

  // 6. 验证配置文件
  console.log('6. 验证配置文件...')
  
  try {
    const fs = await import('fs')
    const configPath = path.join(process.cwd(), 'supabase', 'config.toml')
    
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8')
      
      // 检查关键配置项
      const checks = [
        { key: 'enable_signup = false', name: '用户注册禁用' },
        { key: '[auth.email]', name: '邮件认证配置' },
        { key: 'enable_signup = false', name: '邮件注册禁用' }
      ]
      
      for (const check of checks) {
        if (configContent.includes(check.key)) {
          addResult(`配置文件 - ${check.name}`, 'PASS', '配置正确')
        } else {
          addResult(`配置文件 - ${check.name}`, 'WARNING', '配置可能不正确', `检查 ${configPath} 中的 ${check.key}`)
        }
      }
      
      addResult('配置文件存在', 'PASS', 'supabase/config.toml 存在')
    } else {
      addResult('配置文件存在', 'WARNING', 'supabase/config.toml 不存在', '确保本地开发配置正确')
    }
  } catch (err) {
    addResult('配置文件验证', 'WARNING', '配置文件验证失败', `错误: ${err}`)
  }

  // 打印结果
  printResults()
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error(colors.red('未处理的Promise拒绝:'), reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error(colors.red('未捕获的异常:'), error)
  process.exit(1)
})

// 运行验证
main().catch((error) => {
  console.error(colors.red('验证脚本执行失败:'), error)
  process.exit(1)
})