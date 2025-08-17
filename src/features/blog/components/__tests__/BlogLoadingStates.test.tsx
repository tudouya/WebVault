import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { 
  BlogLoadingSpinner,
  BlogCardSkeleton,
  BlogErrorState,
  BlogEmptyState,
  BlogNetworkStatus,
  useBlogLoadingState
} from '../BlogLoadingStates';

// 模拟网络状态
const mockNavigator = {
  onLine: true
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true
});

// 测试组件 - 使用加载状态Hook
const TestComponent = ({ 
  shouldError = false,
  shouldEmpty = false,
  retryFn
}: {
  shouldError?: boolean;
  shouldEmpty?: boolean;
  retryFn?: () => void;
}) => {
  const {
    loading,
    error,
    isEmpty,
    startLoading,
    stopLoading,
    setErrorState,
    setEmptyState,
    clearState,
    retry
  } = useBlogLoadingState();

  React.useEffect(() => {
    if (shouldError) {
      setErrorState('Test error');
    } else if (shouldEmpty) {
      setEmptyState();
    }
  }, [shouldError, shouldEmpty, setErrorState, setEmptyState]);

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error">{error ? String(error) : 'No Error'}</div>
      <div data-testid="empty">{isEmpty ? 'Empty' : 'Not Empty'}</div>
      <button onClick={startLoading}>Start Loading</button>
      <button onClick={stopLoading}>Stop Loading</button>
      <button onClick={() => setErrorState('Manual error')}>Set Error</button>
      <button onClick={setEmptyState}>Set Empty</button>
      <button onClick={clearState}>Clear State</button>
      <button onClick={() => retry(retryFn)}>Retry</button>
    </div>
  );
};

describe('BlogLoadingStates', () => {
  describe('BlogLoadingSpinner', () => {
    it('应该渲染默认的加载旋转器', () => {
      render(<BlogLoadingSpinner />);
      
      expect(screen.getByText('Loading blog posts...')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('应该支持不同尺寸', () => {
      const { rerender } = render(<BlogLoadingSpinner size="sm" />);
      expect(document.querySelector('.w-4.h-4')).toBeInTheDocument();

      rerender(<BlogLoadingSpinner size="lg" />);
      expect(document.querySelector('.w-8.h-8')).toBeInTheDocument();
    });

    it('应该支持自定义文本', () => {
      render(<BlogLoadingSpinner text="Custom loading text" />);
      expect(screen.getByText('Custom loading text')).toBeInTheDocument();
    });

    it('应该支持隐藏文本', () => {
      render(<BlogLoadingSpinner text="" />);
      expect(screen.queryByText('Loading blog posts...')).not.toBeInTheDocument();
    });
  });

  describe('BlogCardSkeleton', () => {
    it('应该渲染单个骨架屏', () => {
      render(<BlogCardSkeleton />);
      
      expect(document.querySelector('.blog-card-skeleton')).toBeInTheDocument();
    });

    it('应该渲染多个骨架屏', () => {
      render(<BlogCardSkeleton count={3} />);
      
      const skeletons = document.querySelectorAll('.blog-card-skeleton');
      expect(skeletons).toHaveLength(3);
    });

    it('应该显示占位图标', () => {
      render(<BlogCardSkeleton />);
      
      // 应该包含文件图标作为占位符
      expect(document.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('BlogErrorState', () => {
    it('应该显示默认错误状态', () => {
      render(<BlogErrorState />);
      
      expect(screen.getByText('出现了一些问题')).toBeInTheDocument();
      expect(screen.getByText('博客页面遇到意外错误，请尝试重新加载')).toBeInTheDocument();
      expect(screen.getByText('重新加载')).toBeInTheDocument();
    });

    it('应该显示网络错误状态', () => {
      render(<BlogErrorState type="network" />);
      
      expect(screen.getByText('网络连接问题')).toBeInTheDocument();
      expect(screen.getByText('无法加载博客文章，请检查网络连接后重试')).toBeInTheDocument();
    });

    it('应该显示数据错误状态', () => {
      render(<BlogErrorState type="data" />);
      
      expect(screen.getByText('数据加载失败')).toBeInTheDocument();
      expect(screen.getByText('博客文章暂时无法显示，请稍后重试')).toBeInTheDocument();
    });

    it('应该显示权限错误状态', () => {
      render(<BlogErrorState type="permission" />);
      
      expect(screen.getByText('访问权限不足')).toBeInTheDocument();
      expect(screen.getByText('您没有权限访问这些博客内容')).toBeInTheDocument();
      expect(screen.getByText('返回首页')).toBeInTheDocument();
    });

    it('应该调用重试回调', async () => {
      const user = userEvent.setup();
      const onRetry = jest.fn();
      
      render(<BlogErrorState onRetry={onRetry} />);
      
      await user.click(screen.getByText('重新加载'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('应该调用返回首页回调', async () => {
      const user = userEvent.setup();
      const onGoHome = jest.fn();
      
      render(<BlogErrorState onGoHome={onGoHome} />);
      
      await user.click(screen.getByText('返回首页'));
      expect(onGoHome).toHaveBeenCalledTimes(1);
    });

    it('应该显示自定义错误信息', () => {
      render(<BlogErrorState error="Custom error message" />);
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });

  describe('BlogEmptyState', () => {
    it('应该显示默认空状态', () => {
      render(<BlogEmptyState />);
      
      expect(screen.getByText('暂无博客文章')).toBeInTheDocument();
      expect(screen.getByText(/没有符合当前筛选条件的博客文章/)).toBeInTheDocument();
      expect(screen.getByText('返回首页')).toBeInTheDocument();
    });

    it('应该显示重置筛选按钮', () => {
      const onResetFilters = jest.fn();
      
      render(<BlogEmptyState onResetFilters={onResetFilters} />);
      
      expect(screen.getByText('重置筛选条件')).toBeInTheDocument();
    });

    it('应该调用重置筛选回调', async () => {
      const user = userEvent.setup();
      const onResetFilters = jest.fn();
      
      render(<BlogEmptyState onResetFilters={onResetFilters} />);
      
      await user.click(screen.getByText('重置筛选条件'));
      expect(onResetFilters).toHaveBeenCalledTimes(1);
    });

    it('应该支持自定义标题和描述', () => {
      render(
        <BlogEmptyState 
          title="自定义标题" 
          description="自定义描述文本" 
        />
      );
      
      expect(screen.getByText('自定义标题')).toBeInTheDocument();
      expect(screen.getByText('自定义描述文本')).toBeInTheDocument();
    });

    it('应该支持隐藏搜索建议', () => {
      render(<BlogEmptyState showSearchSuggestion={false} />);
      
      expect(screen.queryByText('重置筛选条件')).not.toBeInTheDocument();
      expect(screen.queryByText('返回首页')).not.toBeInTheDocument();
    });
  });

  describe('BlogNetworkStatus', () => {
    beforeEach(() => {
      mockNavigator.onLine = true;
    });

    it('在线状态下应该正常显示子组件', () => {
      render(
        <BlogNetworkStatus>
          <div>Online Content</div>
        </BlogNetworkStatus>
      );
      
      expect(screen.getByText('Online Content')).toBeInTheDocument();
    });

    it('离线状态下应该显示网络错误', async () => {
      // 模拟离线状态
      mockNavigator.onLine = false;
      
      render(
        <BlogNetworkStatus>
          <div>Online Content</div>
        </BlogNetworkStatus>
      );

      // 触发离线事件
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByText('网络连接问题')).toBeInTheDocument();
      });
    });

    it('应该监听网络状态变化', async () => {
      render(
        <BlogNetworkStatus>
          <div>Online Content</div>
        </BlogNetworkStatus>
      );

      // 模拟离线
      act(() => {
        mockNavigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByText('网络连接问题')).toBeInTheDocument();
      });

      // 模拟重新上线
      act(() => {
        mockNavigator.onLine = true;
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(screen.getByText('Online Content')).toBeInTheDocument();
      });
    });
  });

  describe('useBlogLoadingState Hook', () => {
    it('应该提供正确的初始状态', () => {
      render(<TestComponent />);
      
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('error')).toHaveTextContent('No Error');
      expect(screen.getByTestId('empty')).toHaveTextContent('Not Empty');
    });

    it('应该正确管理加载状态', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);
      
      await user.click(screen.getByText('Start Loading'));
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
      
      await user.click(screen.getByText('Stop Loading'));
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    it('应该正确管理错误状态', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);
      
      await user.click(screen.getByText('Set Error'));
      expect(screen.getByTestId('error')).toHaveTextContent('Manual error');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    it('应该正确管理空状态', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);
      
      await user.click(screen.getByText('Set Empty'));
      expect(screen.getByTestId('empty')).toHaveTextContent('Empty');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('error')).toHaveTextContent('No Error');
    });

    it('应该清除所有状态', async () => {
      const user = userEvent.setup();
      render(<TestComponent shouldError={true} />);
      
      // 确认有错误状态
      expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      
      await user.click(screen.getByText('Clear State'));
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('error')).toHaveTextContent('No Error');
      expect(screen.getByTestId('empty')).toHaveTextContent('Not Empty');
    });

    it('应该支持重试功能', async () => {
      const user = userEvent.setup();
      const retryFn = jest.fn();
      
      render(<TestComponent retryFn={retryFn} />);
      
      await user.click(screen.getByText('Retry'));
      expect(retryFn).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    });

    it('应该处理异步重试函数的错误', async () => {
      const user = userEvent.setup();
      const retryFn = jest.fn().mockRejectedValue(new Error('Retry failed'));
      
      render(<TestComponent retryFn={retryFn} />);
      
      await user.click(screen.getByText('Retry'));
      
      // 等待异步错误处理
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Retry failed');
      });
    });
  });
});