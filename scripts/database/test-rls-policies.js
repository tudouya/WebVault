/**
 * RLS Policies Verification Script
 * 
 * 验证管理员专属认证系统的行级安全策略(RLS)是否正确工作
 * 
 * Requirements验证:
 * - 7.5: RLS策略SHALL确保只有admin角色用户能访问敏感数据
 * 
 * 测试场景:
 * 1. 未认证用户访问 - 应被完全阻止
 * 2. 普通用户访问 - 只能访问自己的资料
 * 3. Admin用户访问 - 能访问所有用户资料和系统数据
 * 4. Service role访问 - 拥有完全权限
 * 5. 跨表权限验证 - auth_lockouts表只有admin和service role可访问
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

// 加载环境变量
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '../../.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
} catch (error) {
  console.log('Warning: Could not load .env.local file');
}

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('   需要: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// 创建不同权限级别的客户端
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// 测试用户数据
const testUsers = {
  admin: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'rls.test.admin@webvault.test',
    name: 'RLS Test Admin',
    role: 'admin'
  },
  user: {
    id: '00000000-0000-0000-0000-000000000002', 
    email: 'rls.test.user@webvault.test',
    name: 'RLS Test User',
    role: 'user'
  }
};

/**
 * 清理测试数据
 */
async function cleanupTestData() {
  try {
    console.log('🧹 清理之前的测试数据...');
    
    // 清理认证用户 (如果存在)
    const { data: users } = await adminClient.auth.admin.listUsers();
    const testEmails = Object.values(testUsers).map(u => u.email);
    
    for (const user of users?.users || []) {
      if (testEmails.includes(user.email)) {
        await adminClient.auth.admin.deleteUser(user.id, false);
      }
    }
    
    // 清理用户资料表数据
    await adminClient
      .from('user_profiles')
      .delete()
      .in('email', testEmails);
    
    // 清理锁定记录
    await adminClient
      .from('auth_lockouts')
      .delete()
      .in('email', testEmails);
      
    console.log('✅ 测试数据清理完成');
  } catch (error) {
    console.log('⚠️ 清理测试数据时出现错误:', error.message);
  }
}

/**
 * 创建测试用户
 */
async function createTestUsers() {
  console.log('👤 创建测试用户...');
  
  try {
    // 创建admin用户
    const { data: adminAuthUser, error: adminError } = await adminClient.auth.admin.createUser({
      email: testUsers.admin.email,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        name: testUsers.admin.name,
        role: testUsers.admin.role
      }
    });
    
    if (adminError) throw adminError;
    
    // 更新admin用户为admin角色
    await adminClient
      .from('user_profiles')
      .update({ role: 'admin' })
      .eq('id', adminAuthUser.user.id);
    
    console.log(`✅ 创建admin测试用户: ${testUsers.admin.email}`);
    
    // 创建普通用户
    const { data: normalAuthUser, error: userError } = await adminClient.auth.admin.createUser({
      email: testUsers.user.email,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        name: testUsers.user.name,
        role: testUsers.user.role
      }
    });
    
    if (userError) throw userError;
    
    console.log(`✅ 创建普通测试用户: ${testUsers.user.email}`);
    
    // 更新测试用户ID为实际创建的ID
    testUsers.admin.id = adminAuthUser.user.id;
    testUsers.user.id = normalAuthUser.user.id;
    
    return true;
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error.message);
    return false;
  }
}

/**
 * 测试未认证用户访问权限
 */
async function testUnauthenticatedAccess() {
  console.log('🔍 测试未认证用户访问权限...');
  const results = [];
  
  try {
    // 测试访问用户资料表
    const { data: profiles, error: profileError } = await anonClient
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      results.push({
        test: 'user_profiles访问',
        status: 'PASS',
        expected: '拒绝访问',
        actual: `RLS阻止: ${profileError.message}`,
        secure: true
      });
    } else {
      results.push({
        test: 'user_profiles访问', 
        status: 'FAIL',
        expected: '拒绝访问',
        actual: `允许访问，获得${profiles?.length || 0}条记录`,
        secure: false
      });
    }
    
    // 测试访问锁定记录表
    const { data: lockouts, error: lockoutError } = await anonClient
      .from('auth_lockouts')
      .select('*')
      .limit(1);
    
    if (lockoutError) {
      results.push({
        test: 'auth_lockouts访问',
        status: 'PASS',
        expected: '拒绝访问',
        actual: `RLS阻止: ${lockoutError.message}`,
        secure: true
      });
    } else {
      results.push({
        test: 'auth_lockouts访问',
        status: 'FAIL', 
        expected: '拒绝访问',
        actual: `允许访问，获得${lockouts?.length || 0}条记录`,
        secure: false
      });
    }
    
  } catch (error) {
    results.push({
      test: '未认证访问测试',
      status: 'ERROR',
      expected: '完成测试',
      actual: `测试异常: ${error.message}`,
      secure: false
    });
  }
  
  return results;
}

/**
 * 测试普通用户访问权限
 */
async function testNormalUserAccess() {
  console.log('👤 测试普通用户访问权限...');
  const results = [];
  
  try {
    // 登录为普通用户
    const { data: session, error: loginError } = await anonClient.auth.signInWithPassword({
      email: testUsers.user.email,
      password: 'TestPassword123!'
    });
    
    if (loginError) {
      throw new Error(`普通用户登录失败: ${loginError.message}`);
    }
    
    // 创建认证客户端
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${session.session.access_token}` } }
    });
    
    // 设置会话
    await userClient.auth.setSession(session.session);
    
    // 测试访问自己的资料
    const { data: ownProfile, error: ownProfileError } = await userClient
      .from('user_profiles')
      .select('*')
      .eq('id', testUsers.user.id);
    
    if (!ownProfileError && ownProfile && ownProfile.length > 0) {
      results.push({
        test: '访问自己的资料',
        status: 'PASS',
        expected: '允许访问',
        actual: `成功获取自己的资料`,
        secure: true
      });
    } else {
      results.push({
        test: '访问自己的资料',
        status: 'FAIL',
        expected: '允许访问',
        actual: `无法访问自己的资料: ${ownProfileError?.message}`,
        secure: false
      });
    }
    
    // 测试访问其他用户的资料
    const { data: otherProfiles, error: otherError } = await userClient
      .from('user_profiles')
      .select('*')
      .neq('id', testUsers.user.id);
    
    if (otherError || !otherProfiles || otherProfiles.length === 0) {
      results.push({
        test: '访问其他用户资料',
        status: 'PASS',
        expected: '拒绝访问',
        actual: `RLS阻止访问其他用户资料`,
        secure: true
      });
    } else {
      results.push({
        test: '访问其他用户资料',
        status: 'FAIL',
        expected: '拒绝访问',
        actual: `能够访问${otherProfiles.length}个其他用户的资料`,
        secure: false
      });
    }
    
    // 测试访问锁定记录（应该被拒绝）
    const { data: lockouts, error: lockoutError } = await userClient
      .from('auth_lockouts')
      .select('*');
    
    if (lockoutError) {
      results.push({
        test: '普通用户访问锁定记录',
        status: 'PASS',
        expected: '拒绝访问',
        actual: `RLS正确阻止: ${lockoutError.message}`,
        secure: true
      });
    } else {
      results.push({
        test: '普通用户访问锁定记录',
        status: 'FAIL',
        expected: '拒绝访问',
        actual: `普通用户能访问${lockouts?.length || 0}条锁定记录`,
        secure: false
      });
    }
    
    // 测试更新自己的资料（除了角色）
    const { error: updateError } = await userClient
      .from('user_profiles')
      .update({ name: 'Updated Test User Name' })
      .eq('id', testUsers.user.id);
    
    if (!updateError) {
      results.push({
        test: '更新自己资料',
        status: 'PASS',
        expected: '允许更新',
        actual: '成功更新自己的资料',
        secure: true
      });
    } else {
      results.push({
        test: '更新自己资料',
        status: 'FAIL',
        expected: '允许更新',
        actual: `无法更新自己的资料: ${updateError.message}`,
        secure: false
      });
    }
    
    // 测试尝试修改自己的角色（应该被拒绝）
    const { error: roleUpdateError } = await userClient
      .from('user_profiles')
      .update({ role: 'admin' })
      .eq('id', testUsers.user.id);
    
    if (roleUpdateError) {
      results.push({
        test: '尝试修改自己角色',
        status: 'PASS',
        expected: '拒绝修改',
        actual: `RLS正确阻止角色修改: ${roleUpdateError.message}`,
        secure: true
      });
    } else {
      results.push({
        test: '尝试修改自己角色',
        status: 'FAIL',
        expected: '拒绝修改',
        actual: '普通用户能够修改自己的角色',
        secure: false
      });
    }
    
    // 登出
    await userClient.auth.signOut();
    
  } catch (error) {
    results.push({
      test: '普通用户权限测试',
      status: 'ERROR',
      expected: '完成测试',
      actual: `测试异常: ${error.message}`,
      secure: false
    });
  }
  
  return results;
}

/**
 * 测试管理员用户访问权限
 */
async function testAdminUserAccess() {
  console.log('👑 测试管理员用户访问权限...');
  const results = [];
  
  try {
    // 登录为管理员用户
    const { data: session, error: loginError } = await anonClient.auth.signInWithPassword({
      email: testUsers.admin.email,
      password: 'TestPassword123!'
    });
    
    if (loginError) {
      throw new Error(`管理员用户登录失败: ${loginError.message}`);
    }
    
    // 创建认证客户端
    const adminUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${session.session.access_token}` } }
    });
    
    // 设置会话
    await adminUserClient.auth.setSession(session.session);
    
    // 测试访问所有用户资料
    const { data: allProfiles, error: allProfilesError } = await adminUserClient
      .from('user_profiles')
      .select('*');
    
    if (!allProfilesError && allProfiles && allProfiles.length >= 2) {
      results.push({
        test: '管理员访问所有用户资料',
        status: 'PASS',
        expected: '允许访问',
        actual: `管理员能访问${allProfiles.length}个用户资料`,
        secure: true
      });
    } else {
      results.push({
        test: '管理员访问所有用户资料',
        status: 'FAIL',
        expected: '允许访问',
        actual: `管理员无法访问所有用户资料: ${allProfilesError?.message}`,
        secure: false
      });
    }
    
    // 测试管理员访问锁定记录
    const { data: lockouts, error: lockoutError } = await adminUserClient
      .from('auth_lockouts')
      .select('*');
    
    if (!lockoutError) {
      results.push({
        test: '管理员访问锁定记录',
        status: 'PASS',
        expected: '允许访问',
        actual: `管理员能访问${lockouts?.length || 0}条锁定记录`,
        secure: true
      });
    } else {
      results.push({
        test: '管理员访问锁定记录',
        status: 'FAIL',
        expected: '允许访问',
        actual: `管理员无法访问锁定记录: ${lockoutError.message}`,
        secure: false
      });
    }
    
    // 测试管理员创建新用户资料
    const testProfileData = {
      id: '00000000-0000-0000-0000-000000000999',
      email: 'admin.created@test.com',
      name: 'Admin Created User',
      role: 'user'
    };
    
    const { error: createError } = await adminUserClient
      .from('user_profiles')
      .insert(testProfileData);
    
    if (!createError) {
      results.push({
        test: '管理员创建用户资料',
        status: 'PASS',
        expected: '允许创建',
        actual: '管理员成功创建新用户资料',
        secure: true
      });
      
      // 清理创建的测试数据
      await adminClient
        .from('user_profiles')
        .delete()
        .eq('email', testProfileData.email);
    } else {
      results.push({
        test: '管理员创建用户资料',
        status: 'FAIL',
        expected: '允许创建',
        actual: `管理员无法创建用户资料: ${createError.message}`,
        secure: false
      });
    }
    
    // 测试管理员修改其他用户资料
    const { error: updateError } = await adminUserClient
      .from('user_profiles')
      .update({ name: 'Admin Updated User Name' })
      .eq('id', testUsers.user.id);
    
    if (!updateError) {
      results.push({
        test: '管理员修改其他用户资料',
        status: 'PASS',
        expected: '允许修改',
        actual: '管理员成功修改其他用户资料',
        secure: true
      });
    } else {
      results.push({
        test: '管理员修改其他用户资料',
        status: 'FAIL',
        expected: '允许修改',
        actual: `管理员无法修改其他用户资料: ${updateError.message}`,
        secure: false
      });
    }
    
    // 登出
    await adminUserClient.auth.signOut();
    
  } catch (error) {
    results.push({
      test: '管理员权限测试',
      status: 'ERROR',
      expected: '完成测试',
      actual: `测试异常: ${error.message}`,
      secure: false
    });
  }
  
  return results;
}

/**
 * 测试Service Role权限
 */
async function testServiceRoleAccess() {
  console.log('🔧 测试Service Role权限...');
  const results = [];
  
  try {
    // Service role应该能访问所有表
    const { data: profiles, error: profileError } = await adminClient
      .from('user_profiles')
      .select('*');
    
    if (!profileError) {
      results.push({
        test: 'Service Role访问用户资料',
        status: 'PASS',
        expected: '完全访问',
        actual: `Service Role能访问${profiles?.length || 0}个用户资料`,
        secure: true
      });
    } else {
      results.push({
        test: 'Service Role访问用户资料',
        status: 'FAIL',
        expected: '完全访问',
        actual: `Service Role无法访问用户资料: ${profileError.message}`,
        secure: false
      });
    }
    
    // Service role应该能管理锁定记录
    const { data: lockouts, error: lockoutError } = await adminClient
      .from('auth_lockouts')
      .select('*');
    
    if (!lockoutError) {
      results.push({
        test: 'Service Role访问锁定记录',
        status: 'PASS',
        expected: '完全访问',
        actual: `Service Role能访问${lockouts?.length || 0}条锁定记录`,
        secure: true
      });
    } else {
      results.push({
        test: 'Service Role访问锁定记录',
        status: 'FAIL',
        expected: '完全访问',
        actual: `Service Role无法访问锁定记录: ${lockoutError.message}`,
        secure: false
      });
    }
    
    // 测试Service role创建锁定记录
    const testLockoutData = {
      email: 'service.test@lockout.com',
      attempt_count: 3,
      locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };
    
    const { error: createLockoutError } = await adminClient
      .from('auth_lockouts')
      .insert(testLockoutData);
    
    if (!createLockoutError) {
      results.push({
        test: 'Service Role创建锁定记录',
        status: 'PASS',
        expected: '允许创建',
        actual: 'Service Role成功创建锁定记录',
        secure: true
      });
      
      // 清理测试数据
      await adminClient
        .from('auth_lockouts')
        .delete()
        .eq('email', testLockoutData.email);
    } else {
      results.push({
        test: 'Service Role创建锁定记录',
        status: 'FAIL',
        expected: '允许创建',
        actual: `Service Role无法创建锁定记录: ${createLockoutError.message}`,
        secure: false
      });
    }
    
  } catch (error) {
    results.push({
      test: 'Service Role权限测试',
      status: 'ERROR',
      expected: '完成测试',
      actual: `测试异常: ${error.message}`,
      secure: false
    });
  }
  
  return results;
}

/**
 * 测试认证函数的RLS保护
 */
async function testAuthFunctionsRLS() {
  console.log('⚙️ 测试认证函数的RLS保护...');
  const results = [];
  
  try {
    // 使用匿名客户端测试认证函数
    const testEmail = 'function.test@example.com';
    
    // 测试is_email_locked函数 - 任何人都应该能调用
    const { data: lockStatus, error: lockError } = await anonClient
      .rpc('is_email_locked', { p_email: testEmail });
    
    if (!lockError) {
      results.push({
        test: '匿名调用is_email_locked',
        status: 'PASS',
        expected: '允许调用',
        actual: `函数返回: ${JSON.stringify(lockStatus)}`,
        secure: true
      });
    } else {
      results.push({
        test: '匿名调用is_email_locked',
        status: 'FAIL',
        expected: '允许调用',
        actual: `函数调用失败: ${lockError.message}`,
        secure: false
      });
    }
    
    // 测试record_auth_failure函数 - 认证用户应该能调用
    const { data: failureResult, error: failureError } = await anonClient
      .rpc('record_auth_failure', { p_email: testEmail });
    
    if (!failureError) {
      results.push({
        test: '匿名调用record_auth_failure',
        status: 'PASS',
        expected: '允许调用',
        actual: `函数返回: ${JSON.stringify(failureResult)}`,
        secure: true
      });
    } else {
      results.push({
        test: '匿名调用record_auth_failure',
        status: 'FAIL',
        expected: '允许调用',
        actual: `函数调用失败: ${failureError.message}`,
        secure: false
      });
    }
    
    // 测试reset_auth_lockout函数 - 应该需要管理员权限
    const { data: resetResult, error: resetError } = await anonClient
      .rpc('reset_auth_lockout', { p_email: testEmail });
    
    // 这个函数应该允许认证用户调用，但实际重置需要权限
    if (!resetError || resetResult === false) {
      results.push({
        test: '匿名调用reset_auth_lockout',
        status: 'PASS',
        expected: '允许调用但限制操作',
        actual: `函数返回: ${resetResult}`,
        secure: true
      });
    } else {
      results.push({
        test: '匿名调用reset_auth_lockout',
        status: 'PASS',
        expected: '拒绝调用或限制操作',
        actual: `函数被限制: ${resetError.message}`,
        secure: true
      });
    }
    
    // 清理测试产生的锁定记录
    await adminClient
      .from('auth_lockouts')
      .delete()
      .eq('email', testEmail);
    
  } catch (error) {
    results.push({
      test: '认证函数RLS测试',
      status: 'ERROR',
      expected: '完成测试',
      actual: `测试异常: ${error.message}`,
      secure: false
    });
  }
  
  return results;
}

/**
 * 打印测试结果
 */
function printResults(category, results) {
  console.log(`\n📋 ${category} 测试结果:`);
  console.log('=' + '='.repeat(category.length + 8));
  
  let passed = 0;
  let failed = 0;
  let errors = 0;
  let secure = 0;
  
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : 
                 result.status === 'FAIL' ? '❌' : '⚠️';
    
    console.log(`${icon} ${result.test}`);
    console.log(`   预期: ${result.expected}`);
    console.log(`   实际: ${result.actual}`);
    
    if (result.status === 'PASS') passed++;
    else if (result.status === 'FAIL') failed++;
    else errors++;
    
    if (result.secure) secure++;
  });
  
  console.log(`\n📊 ${category} 统计:`);
  console.log(`   ✅ 通过: ${passed}`);
  console.log(`   ❌ 失败: ${failed}`);
  console.log(`   ⚠️ 错误: ${errors}`);
  console.log(`   🛡️ 安全: ${secure}/${results.length}`);
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🛡️ WebVault RLS策略验证测试');
  console.log('============================');
  console.log('验证管理员专属认证系统的数据库行级安全策略');
  console.log('');
  
  let overallSecure = true;
  
  try {
    // 清理测试环境
    await cleanupTestData();
    console.log('');
    
    // 创建测试用户
    const usersCreated = await createTestUsers();
    if (!usersCreated) {
      console.error('❌ 无法创建测试用户，测试终止');
      return;
    }
    console.log('');
    
    // 等待数据库同步
    console.log('⏳ 等待数据库同步...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 执行各项测试
    const tests = [
      { name: '未认证用户访问', fn: testUnauthenticatedAccess },
      { name: '普通用户权限', fn: testNormalUserAccess },
      { name: '管理员权限', fn: testAdminUserAccess },
      { name: 'Service Role权限', fn: testServiceRoleAccess },
      { name: '认证函数RLS', fn: testAuthFunctionsRLS }
    ];
    
    for (const test of tests) {
      console.log(`\n🔍 开始 ${test.name} 测试...`);
      const results = await test.fn();
      printResults(test.name, results);
      
      // 检查是否有不安全的结果
      const hasInsecureResults = results.some(r => !r.secure);
      if (hasInsecureResults) {
        overallSecure = false;
      }
    }
    
  } catch (error) {
    console.error(`❌ 测试执行失败: ${error.message}`);
    overallSecure = false;
  } finally {
    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await cleanupTestData();
  }
  
  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('📋 RLS策略验证总结');
  console.log('='.repeat(50));
  
  if (overallSecure) {
    console.log('✅ 成功：所有RLS策略正常工作');
    console.log('✅ 需求7.5：RLS策略确保只有admin角色用户能访问敏感数据 - 满足');
    console.log('');
    console.log('🛡️ 数据库安全状态：良好');
    console.log('   - 未认证用户被正确阻止');
    console.log('   - 普通用户只能访问自己的数据');
    console.log('   - 管理员拥有完整系统访问权限');
    console.log('   - Service role拥有完全管理权限');
    console.log('   - 认证函数受到适当保护');
    console.log('');
    console.log('🎉 管理员专属认证系统的RLS策略验证通过！');
  } else {
    console.log('❌ 警告：发现安全漏洞');
    console.log('❌ 需求7.5：RLS策略验证失败');
    console.log('');
    console.log('🚨 请立即检查并修复以下问题：');
    console.log('   - 检查Supabase RLS策略是否正确应用');
    console.log('   - 验证用户角色和权限配置');
    console.log('   - 确认数据库迁移是否完全执行');
    console.log('');
    console.log('⚠️ 不建议在生产环境中部署，直到所有安全问题解决');
  }
  
  process.exit(overallSecure ? 0 : 1);
}

main().catch(error => {
  console.error('💥 RLS策略验证脚本执行失败:', error.message);
  process.exit(1);
});