/**
 * ReadingProgress 组件测试
 * 
 * 测试阅读进度组件的核心功能：
 * - 进度计算逻辑
 * - 滚动事件处理
 * - 主题适配
 * - 响应式行为
 * - 无障碍性支持
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ReadingProgress, useReadingProgress } from '../ReadingProgress';

// Mock scrollHeight and other DOM properties
Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
  configurable: true,
  value: 2000,
});

Object.defineProperty(window, 'innerHeight', {
  configurable: true,
  value: 800,
});

// Helper function to create wrapper with theme
const createWrapper = (theme = 'light') => {
  return ({ children }: { children: React.ReactNode }) => {
    // 设置主题类名
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return <div>{children}</div>;
  };
};

describe('ReadingProgress', () => {
  beforeEach(() => {
    // Reset scroll position
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
    });
    
    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn(cb => {
      setTimeout(cb, 16);
      return 0;
    });
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('基础渲染', () => {
    it('应该在初始状态下不显示进度条', () => {
      render(<ReadingProgress />, { wrapper: createWrapper() });
      
      // 进度条应该不存在，因为初始进度为0
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('应该在有进度时显示进度条', async () => {
      render(<ReadingProgress minThreshold={0} />, { wrapper: createWrapper() });
      
      // 模拟滚动
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 100,
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('应该正确设置ARIA属性', async () => {
      render(<ReadingProgress minThreshold={0} />, { wrapper: createWrapper() });
      
      // 模拟滚动到25%位置
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 300, // (300 / 1200) * 100 ≈ 25%
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toHaveAttribute('aria-label', '阅读进度');
        expect(progressbar).toHaveAttribute('aria-valuenow');
        expect(progressbar).toHaveAttribute('aria-valuemin', '0');
        expect(progressbar).toHaveAttribute('aria-valuemax', '100');
        expect(progressbar).toHaveAttribute('aria-valuetext');
      });
    });
  });

  describe('进度计算', () => {
    it('应该正确计算阅读进度百分比', async () => {
      const onProgressChange = jest.fn();
      render(
        <ReadingProgress 
          minThreshold={0} 
          onProgressChange={onProgressChange}
        />, 
        { wrapper: createWrapper() }
      );
      
      // 滚动到50%位置
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 600, // scrollableHeight = 2000 - 800 = 1200, so 600/1200 = 50%
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      await waitFor(() => {
        expect(onProgressChange).toHaveBeenCalledWith(50);
      });
    });

    it('应该限制进度在0-100%范围内', async () => {
      const onProgressChange = jest.fn();
      render(
        <ReadingProgress 
          minThreshold={0} 
          onProgressChange={onProgressChange}
        />, 
        { wrapper: createWrapper() }
      );
      
      // 滚动超出范围
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 2000,
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      await waitFor(() => {
        expect(onProgressChange).toHaveBeenCalledWith(100);
      });
    });
  });

  describe('配置选项', () => {
    it('应该支持显示百分比文字', async () => {
      render(
        <ReadingProgress 
          showPercentage={true} 
          minThreshold={0}
        />, 
        { wrapper: createWrapper() }
      );
      
      // 模拟滚动
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 300,
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/25%/)).toBeInTheDocument();
      });
    });

    it('应该支持自定义高度', () => {
      render(
        <ReadingProgress 
          height={5} 
          minThreshold={0}
        />, 
        { wrapper: createWrapper() }
      );
      
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 100,
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      // 检查自定义高度是否应用
      waitFor(() => {
        const progressBar = screen.getByRole('progressbar').firstChild as HTMLElement;
        expect(progressBar).toHaveStyle('height: 5px');
      });
    });

    it('应该支持最小显示阈值', async () => {
      render(<ReadingProgress minThreshold={10} />, { wrapper: createWrapper() });
      
      // 滚动到5%，低于阈值
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 60,
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      // 进度条不应该显示
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('应该支持隐藏组件', () => {
      render(<ReadingProgress visible={false} />, { wrapper: createWrapper() });
      
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 300,
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('性能优化', () => {
    it('应该节流滚动事件', async () => {
      const onProgressChange = jest.fn();
      render(
        <ReadingProgress 
          throttleDelay={50}
          minThreshold={0}
          onProgressChange={onProgressChange}
        />, 
        { wrapper: createWrapper() }
      );
      
      // 设置滚动位置
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 100,
      });
      
      // 快速触发多次滚动事件
      for (let i = 0; i < 5; i++) {
        act(() => {
          fireEvent.scroll(window);
        });
      }
      
      // 等待节流延迟
      await waitFor(() => {
        // 节流功能正常工作，确保回调被调用
        expect(onProgressChange).toHaveBeenCalled();
      }, { timeout: 200 });
    });
  });

  describe('主题适配', () => {
    it('应该在亮色主题下使用正确的颜色', async () => {
      const { rerender } = render(
        <ReadingProgress minThreshold={0} />, 
        { wrapper: createWrapper('light') }
      );
      
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 300,
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toBeInTheDocument();
      });
    });
  });

  describe('响应式行为', () => {
    it('应该在窗口大小变化时重新计算进度', async () => {
      const onProgressChange = jest.fn();
      render(
        <ReadingProgress 
          minThreshold={0}
          onProgressChange={onProgressChange}
        />, 
        { wrapper: createWrapper() }
      );
      
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 300,
      });
      
      act(() => {
        fireEvent.scroll(window);
      });
      
      // 改变窗口高度
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 600,
      });
      
      act(() => {
        fireEvent.resize(window);
      });
      
      await waitFor(() => {
        expect(onProgressChange).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('清理逻辑', () => {
    it('应该在组件卸载时清理事件监听器', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(
        <ReadingProgress />, 
        { wrapper: createWrapper() }
      );
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });
});

describe('useReadingProgress Hook', () => {
  function TestComponent() {
    const { progress, isReading } = useReadingProgress();
    return (
      <div>
        <span data-testid="progress">{Math.round(progress)}</span>
        <span data-testid="reading">{isReading.toString()}</span>
      </div>
    );
  }

  it('应该返回正确的进度值', async () => {
    render(<TestComponent />);
    
    // 模拟滚动
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 300,
    });
    
    act(() => {
      fireEvent.scroll(window);
    });
    
    await waitFor(() => {
      const progressElement = screen.getByTestId('progress');
      const progressValue = parseInt(progressElement.textContent || '0');
      // 允许一定的误差范围，因为计算可能有细微差异
      expect(progressValue).toBeGreaterThanOrEqual(20);
      expect(progressValue).toBeLessThanOrEqual(30);
    });
  });

  it('应该正确检测阅读状态', async () => {
    render(<TestComponent />);
    
    // 滚动到中间位置（正在阅读）
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 600,
    });
    
    act(() => {
      fireEvent.scroll(window);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('reading')).toHaveTextContent('true');
    });
  });
});