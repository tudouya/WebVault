/**
 * SocialAuthButtons Component Examples
 * 
 * 展示SocialAuthButtons组件的各种使用场景和配置选项
 * 提供开发者参考和最佳实践示例
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

import React from 'react';
import { 
  SocialAuthButtons,
  CompactSocialAuthButtons,
  StackedSocialAuthButtons 
} from './SocialAuthButtons';
import type { SocialProvider } from '../types';

// ============================================================================
// Basic Usage Examples
// ============================================================================

/**
 * 基础用法示例
 */
export function BasicSocialAuthExample() {
  const handleSuccess = (provider: SocialProvider, result: any) => {
    console.log(`${provider} login successful:`, result);
    // 处理登录成功逻辑
  };

  const handleError = (provider: SocialProvider, error: string) => {
    console.error(`${provider} login failed:`, error);
    // 处理登录失败逻辑
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-center">基础用法</h2>
      
      <SocialAuthButtons
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}

/**
 * 不同布局示例
 */
export function LayoutVariationsExample() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-center">布局变化</h2>
      
      {/* Grid Layout (默认) */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Grid Layout (默认)</h3>
        <SocialAuthButtons layout="grid" />
      </div>
      
      {/* Stack Layout */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Stack Layout</h3>
        <SocialAuthButtons layout="stack" />
      </div>
      
      {/* Inline Layout */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Inline Layout</h3>
        <SocialAuthButtons layout="inline" />
      </div>
    </div>
  );
}

/**
 * 不同尺寸示例
 */
export function SizeVariationsExample() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-center">尺寸变化</h2>
      
      {/* Small */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Small Size</h3>
        <SocialAuthButtons size="sm" />
      </div>
      
      {/* Default */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Default Size</h3>
        <SocialAuthButtons size="default" />
      </div>
      
      {/* Large */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Large Size</h3>
        <SocialAuthButtons size="lg" />
      </div>
    </div>
  );
}

/**
 * 不同变体示例
 */
export function VariantExample() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-center">按钮变体</h2>
      
      {/* Outline (默认) */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Outline (默认)</h3>
        <SocialAuthButtons variant="outline" />
      </div>
      
      {/* Default */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Default</h3>
        <SocialAuthButtons variant="default" />
      </div>
      
      {/* Ghost */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Ghost</h3>
        <SocialAuthButtons variant="ghost" />
      </div>
    </div>
  );
}

// ============================================================================
// Advanced Usage Examples
// ============================================================================

/**
 * 自定义提供商示例
 */
export function CustomProvidersExample() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-center">自定义提供商</h2>
      
      {/* 仅Google */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">仅Google登录</h3>
        <SocialAuthButtons 
          enabledProviders={['google']}
          layout="stack"
        />
      </div>
      
      {/* 仅GitHub */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">仅GitHub登录</h3>
        <SocialAuthButtons 
          enabledProviders={['github']}
          layout="stack"
        />
      </div>
    </div>
  );
}

/**
 * 便捷组件示例
 */
export function ConvenienceComponentsExample() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-center">便捷组件</h2>
      
      {/* Compact组件 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Compact Social Auth</h3>
        <div className="flex justify-center">
          <CompactSocialAuthButtons />
        </div>
      </div>
      
      {/* Stacked组件 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Stacked Social Auth</h3>
        <div className="max-w-md mx-auto">
          <StackedSocialAuthButtons />
        </div>
      </div>
    </div>
  );
}

/**
 * 加载状态示例
 */
export function LoadingStateExample() {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async (provider: SocialProvider) => {
    setIsLoading(true);
    
    // 模拟登录过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLoading(false);
    console.log(`${provider} login completed`);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-center">加载状态示例</h2>
      
      <SocialAuthButtons
        disabled={isLoading}
        onSuccess={(provider) => handleLogin(provider)}
      />
      
      {isLoading && (
        <p className="text-center text-muted-foreground">登录处理中...</p>
      )}
      
      <button
        onClick={() => setIsLoading(!isLoading)}
        className="w-full px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
      >
        切换加载状态
      </button>
    </div>
  );
}

/**
 * 错误处理示例
 */
export function ErrorHandlingExample() {
  const [error, setError] = React.useState<string | null>(null);

  const handleError = (provider: SocialProvider, errorMessage: string) => {
    setError(`${provider} 登录失败: ${errorMessage}`);
    
    // 3秒后自动清除错误
    setTimeout(() => setError(null), 3000);
  };

  const handleSuccess = (provider: SocialProvider) => {
    setError(null);
    console.log(`${provider} login successful`);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-center">错误处理示例</h2>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      <SocialAuthButtons
        onSuccess={handleSuccess}
        onError={handleError}
      />
      
      <p className="text-sm text-muted-foreground text-center">
        点击按钮测试错误处理（模拟失败场景）
      </p>
    </div>
  );
}

// ============================================================================
// Integration Examples
// ============================================================================

/**
 * 与表单集成示例
 */
export function FormIntegrationExample() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-center">表单集成示例</h2>
      
      {/* 邮箱登录表单 */}
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">邮箱</label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">密码</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="••••••"
          />
        </div>
        
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          邮箱登录
        </button>
      </form>
      
      {/* 分割线 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">或者</span>
        </div>
      </div>
      
      {/* 社交登录 */}
      <SocialAuthButtons />
    </div>
  );
}

/**
 * 模态框集成示例
 */
export function ModalIntegrationExample() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-center">模态框集成示例</h2>
      
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        打开登录模态框
      </button>
      
      {/* 简单模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">登录账户</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <SocialAuthButtons
              onSuccess={() => {
                setIsModalOpen(false);
                console.log('Login successful, modal closed');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Demo Page Component
// ============================================================================

/**
 * 完整演示页面
 */
export function SocialAuthButtonsDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            SocialAuthButtons 组件演示
          </h1>
          <p className="text-gray-600">
            展示社交认证按钮组件的各种配置和使用场景
          </p>
        </div>
        
        <BasicSocialAuthExample />
        <LayoutVariationsExample />
        <SizeVariationsExample />
        <VariantExample />
        <CustomProvidersExample />
        <ConvenienceComponentsExample />
        <LoadingStateExample />
        <ErrorHandlingExample />
        <FormIntegrationExample />
        <ModalIntegrationExample />
      </div>
    </div>
  );
}

export default SocialAuthButtonsDemo;