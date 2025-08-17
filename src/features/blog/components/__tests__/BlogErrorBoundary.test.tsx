import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { 
  BlogErrorBoundary, 
  BlogErrorType,
  detectBlogErrorType,
  useBlogErrorHandler,
  withBlogErrorBoundary 
} from '../BlogErrorBoundary';

// 测试组件 - 会抛出错误的组件
const ThrowError = ({ shouldThrow, errorMessage }: { shouldThrow: boolean; errorMessage?: string }) => {
  if (shouldThrow) {
    throw new Error(errorMessage || 'Test error');
  }
  return <div>No Error</div>;
};

// 测试组件 - 带有错误边界的组件
const ComponentWithErrorBoundary = withBlogErrorBoundary(ThrowError);

describe('BlogErrorBoundary', () => {
  // 抑制控制台错误输出，因为我们故意触发错误
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  describe('错误类型检测', () => {
    it('应该正确检测网络错误', () => {
      const networkError = new Error('Network request failed');
      expect(detectBlogErrorType(networkError)).toBe(BlogErrorType.NETWORK);

      const fetchError = new Error('Fetch timeout');
      expect(detectBlogErrorType(fetchError)).toBe(BlogErrorType.NETWORK);

      const connectionError = new Error('Connection refused');
      expect(detectBlogErrorType(connectionError)).toBe(BlogErrorType.NETWORK);
    });

    it('应该正确检测API错误', () => {
      const apiError = new Error('Blog API endpoint not found');
      expect(detectBlogErrorType(apiError)).toBe(BlogErrorType.API);

      const blogError = new Error('Failed to load blog posts');
      expect(detectBlogErrorType(blogError)).toBe(BlogErrorType.API);

      const categoryError = new Error('Invalid category specified');
      expect(detectBlogErrorType(categoryError)).toBe(BlogErrorType.API);
    });

    it('应该正确检测数据错误', () => {
      const jsonError = new Error('Invalid JSON response');
      expect(detectBlogErrorType(jsonError)).toBe(BlogErrorType.DATA);

      const parseError = new Error('Failed to parse blog data');
      expect(detectBlogErrorType(parseError)).toBe(BlogErrorType.DATA);

      const syntaxError = new SyntaxError('Unexpected token');
      expect(detectBlogErrorType(syntaxError)).toBe(BlogErrorType.DATA);
    });

    it('应该正确检测权限错误', () => {
      const permissionError = new Error('Permission denied');
      expect(detectBlogErrorType(permissionError)).toBe(BlogErrorType.PERMISSION);

      const unauthorizedError = new Error('Unauthorized access');
      expect(detectBlogErrorType(unauthorizedError)).toBe(BlogErrorType.PERMISSION);

      const forbiddenError = new Error('Forbidden resource');
      expect(detectBlogErrorType(forbiddenError)).toBe(BlogErrorType.PERMISSION);
    });

    it('应该检测未知错误类型', () => {
      const unknownError = new Error('Something went wrong');
      expect(detectBlogErrorType(unknownError)).toBe(BlogErrorType.UNKNOWN);
    });
  });

  describe('错误边界渲染', () => {
    it('在没有错误时应该正常渲染子组件', () => {
      render(
        <BlogErrorBoundary>
          <ThrowError shouldThrow={false} />
        </BlogErrorBoundary>
      );

      expect(screen.getByText('No Error')).toBeInTheDocument();
    });

    it('在发生错误时应该显示错误UI', () => {
      render(
        <BlogErrorBoundary level="component">
          <ThrowError shouldThrow={true} errorMessage="Test error message" />
        </BlogErrorBoundary>
      );

      expect(screen.getByText('博客内容加载失败')).toBeInTheDocument();
      expect(screen.getByText('重试')).toBeInTheDocument();
    });

    it('应该显示不同级别的错误UI - 页面级', () => {
      render(
        <BlogErrorBoundary level="page">
          <ThrowError shouldThrow={true} errorMessage="Page level error" />
        </BlogErrorBoundary>
      );

      expect(screen.getByText('博客页面出错')).toBeInTheDocument();
      expect(screen.getByText('重新加载')).toBeInTheDocument();
      expect(screen.getByText('博客首页')).toBeInTheDocument();
    });

    it('应该显示不同级别的错误UI - 区块级', () => {
      render(
        <BlogErrorBoundary level="section">
          <ThrowError shouldThrow={true} errorMessage="Section level error" />
        </BlogErrorBoundary>
      );

      expect(screen.getByText('博客页面出错')).toBeInTheDocument();
      expect(screen.getByText('重新加载')).toBeInTheDocument();
    });

    it('应该根据错误类型显示不同的错误信息', () => {
      render(
        <BlogErrorBoundary level="page">
          <ThrowError shouldThrow={true} errorMessage="Network connection failed" />
        </BlogErrorBoundary>
      );

      expect(screen.getByText('网络连接问题')).toBeInTheDocument();
      expect(screen.getByText('无法加载博客文章，请检查网络连接后重试')).toBeInTheDocument();
    });
  });

  describe('错误恢复功能', () => {
    it('重试按钮应该能重置错误状态', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const { rerender } = render(
        <BlogErrorBoundary level="component">
          <ThrowError shouldThrow={shouldThrow} />
        </BlogErrorBoundary>
      );

      // 确认显示错误UI
      expect(screen.getByText('博客内容加载失败')).toBeInTheDocument();

      // 模拟修复错误
      shouldThrow = false;

      // 点击重试按钮
      await user.click(screen.getByText('重试'));

      // 重新渲染不抛出错误的组件
      rerender(
        <BlogErrorBoundary level="component">
          <ThrowError shouldThrow={shouldThrow} />
        </BlogErrorBoundary>
      );

      // 应该显示正常内容
      expect(screen.getByText('No Error')).toBeInTheDocument();
    });

    it('应该支持自定义重试回调', async () => {
      const user = userEvent.setup();
      const onRetry = jest.fn();

      render(
        <BlogErrorBoundary level="section" onRetry={onRetry}>
          <ThrowError shouldThrow={true} />
        </BlogErrorBoundary>
      );

      await user.click(screen.getByText('重新加载'));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('高阶组件', () => {
    it('应该正确包装组件并处理错误', () => {
      render(<ComponentWithErrorBoundary shouldThrow={false} />);
      expect(screen.getByText('No Error')).toBeInTheDocument();
    });

    it('应该为包装的组件添加错误处理', () => {
      render(<ComponentWithErrorBoundary shouldThrow={true} />);
      expect(screen.getByText('博客内容加载失败')).toBeInTheDocument();
    });

    it('应该设置正确的displayName', () => {
      expect(ComponentWithErrorBoundary.displayName).toBe('withBlogErrorBoundary(ThrowError)');
    });
  });

  describe('错误处理Hook', () => {
    it('useBlogErrorHandler应该提供错误处理函数', () => {
      let errorHandler: (error: Error) => void;

      const TestComponent = () => {
        errorHandler = useBlogErrorHandler();
        return <div>Test Component</div>;
      };

      render(<TestComponent />);

      expect(errorHandler!).toBeDefined();
      expect(typeof errorHandler!).toBe('function');
    });
  });

  describe('错误边界属性', () => {
    it('应该设置正确的data属性', () => {
      const { container } = render(
        <BlogErrorBoundary level="section">
          <ThrowError shouldThrow={true} errorMessage="Network error" />
        </BlogErrorBoundary>
      );

      const errorBoundary = container.querySelector('[data-error-boundary="blog"]');
      expect(errorBoundary).toBeInTheDocument();
      expect(errorBoundary).toHaveAttribute('data-error-type', 'network');
      expect(errorBoundary).toHaveAttribute('data-error-level', 'section');
    });

    it('应该应用自定义className', () => {
      const { container } = render(
        <BlogErrorBoundary level="component" className="custom-error-class">
          <ThrowError shouldThrow={true} />
        </BlogErrorBoundary>
      );

      expect(container.firstChild).toHaveClass('custom-error-class');
    });
  });

  describe('错误回调', () => {
    it('应该调用onError回调', () => {
      const onError = jest.fn();

      render(
        <BlogErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} errorMessage="Custom error" />
        </BlogErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });
  });
});