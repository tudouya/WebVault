'use client';

import { useAuth, useSignIn, useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestLoginPage() {
  const { isSignedIn, signOut } = useAuth();
  const { signIn, isLoaded } = useSignIn();
  const { user } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🔍 关键修复：先检查是否已登录
    if (isSignedIn) {
      console.log('用户已经登录，无需重复登录');
      return;
    }
    
    if (!signIn || !isLoaded) return;
    
    setLoading(true);
    setError('');
    
    try {
      // 第一步：创建登录尝试
      const signInAttempt = await signIn.create({
        identifier: email,
      });

      // 第二步：尝试使用密码
      const result = await signInAttempt.attemptFirstFactor({
        strategy: 'password',
        password: password,
      });

      if (result.status === 'complete') {
        console.log('登录成功！');
        // 🎯 登录成功后自动跳转到管理仪表盘
        router.push('/admin/dashboard');
      } else {
        setError(`登录状态异常: ${result.status}`);
      }
    } catch (error: any) {
      console.error('登录错误:', error);
      
      if (error.errors && error.errors.length > 0) {
        const firstError = error.errors[0];
        switch (firstError.code) {
          case 'form_identifier_not_found':
            setError('未找到此邮箱对应的账户，请检查邮箱地址');
            break;
          case 'form_password_incorrect':
            setError('密码错误，请重新输入');
            break;
          case 'form_identifier_invalid':
            setError('邮箱格式不正确');
            break;
          default:
            setError(firstError.longMessage || firstError.message || '登录失败');
        }
      } else {
        setError(error.message || '登录失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('登出错误:', error);
    }
  };

  if (!isLoaded) {
    return <div className="p-8">Clerk 加载中...</div>;
  }

  if (isSignedIn && user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">已登录</h1>
        <div className="mb-4">
          <p><strong>用户ID:</strong> {user.id}</p>
          <p><strong>邮箱:</strong> {user.emailAddresses[0]?.emailAddress}</p>
          <p><strong>姓名:</strong> {user.firstName} {user.lastName}</p>
          <p><strong>角色:</strong> {(user.publicMetadata as any)?.role || '未设置'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          登出
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Clerk 测试登录</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入你在 Clerk Dashboard 创建的邮箱"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入你在 Clerk Dashboard 创建的密码"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>使用你在 Clerk Dashboard 创建的管理员账户登录</p>
        <p>确保在 Public Metadata 中设置了 role: "admin"</p>
      </div>
    </div>
  );
}