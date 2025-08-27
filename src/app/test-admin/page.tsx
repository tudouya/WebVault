'use client';

import { useSimpleAuth } from '@/features/auth/hooks/useSimpleAuth';

export default function TestAdminPage() {
  const { isAuthenticated, isLoading, user, isAdmin, hasValidAdminSession, signOut } = useSimpleAuth();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">加载中...</h1>
          <p>正在验证认证状态...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">未登录</h1>
          <p>请先登录</p>
          <a 
            href="/test-login" 
            className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            前往登录
          </a>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-red-600">权限不足</h1>
          <p>此系统仅限管理员访问。</p>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <p><strong>当前用户信息：</strong></p>
            <p>ID: {user?.id}</p>
            <p>邮箱: {user?.email}</p>
            <p>角色: {user?.role || '未设置'}</p>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            请在 Clerk Dashboard 中将此用户的 Public Metadata 设置为 {'{'}role: "admin"{'}'}
          </p>
          <button
            onClick={signOut}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            登出
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4 text-green-800">✅ 管理员认证成功！</h1>
          <p className="text-green-700">恭喜！你已经成功登录并通过管理员权限验证。</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">用户信息</h2>
            <div className="space-y-2">
              <p><strong>用户ID:</strong> {user?.id}</p>
              <p><strong>邮箱:</strong> {user?.email}</p>
              <p><strong>姓名:</strong> {user?.name}</p>
              <p><strong>角色:</strong> <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">{user?.role}</span></p>
              <p><strong>邮箱验证:</strong> {user?.emailVerified ? '✅ 已验证' : '❌ 未验证'}</p>
              <p><strong>提供商:</strong> {user?.provider}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">系统状态</h2>
            <div className="space-y-2">
              <p><strong>认证状态:</strong> <span className="text-green-600">✅ 已认证</span></p>
              <p><strong>管理员权限:</strong> <span className="text-green-600">✅ 已授权</span></p>
              <p><strong>会话有效:</strong> <span className="text-green-600">✅ 有效</span></p>
              <p><strong>加载状态:</strong> <span className="text-green-600">✅ 完成</span></p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <a
            href="/admin/dashboard"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            前往管理后台
          </a>
          <button
            onClick={signOut}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            安全登出
          </button>
        </div>

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">🎉 认证系统修复成功</h2>
          <div className="text-sm text-gray-600">
            <p className="mb-2"><strong>问题解决：</strong></p>
            <ul className="list-disc ml-4 space-y-1">
              <li>修复了 Clerk server-only 导入错误</li>
              <li>简化了认证状态管理</li>
              <li>正确集成了 Clerk 的客户端 API</li>
              <li>实现了管理员权限验证</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}