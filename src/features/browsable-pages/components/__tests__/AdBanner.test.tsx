/**
 * AdBanner组件测试
 * 
 * 测试广告显示组件的各种状态和交互行为
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdBanner, type AdData } from '../AdBanner';

// Mock UI组件
jest.mock('../../../../components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={`${variant} ${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('../../../../components/ui/card', () => ({
  Card: ({ children, className, onClick, ...props }: any) => (
    <div 
      className={className} 
      onClick={onClick} 
      data-testid="ad-card"
      {...props}
    >
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  )
}));

// Mock 图标
jest.mock('lucide-react', () => ({
  AlertCircle: (props: any) => <div data-testid="alert-circle-icon" {...props} />,
  ExternalLink: (props: any) => <div data-testid="external-link-icon" {...props} />,
  X: (props: any) => <div data-testid="x-icon" {...props} />,
  Loader2: (props: any) => <div data-testid="loader2-icon" {...props} />
}));

// Mock LoadingStates组件
jest.mock('../../../websites/components/LoadingStates', () => ({
  LoadingSpinner: ({ text, size }: { text?: string; size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>
      {text}
    </div>
  )
}));

describe('AdBanner', () => {
  const mockAdData: AdData = {
    id: 'test-ad-001',
    title: 'Test Advertisement',
    description: 'This is a test advertisement description',
    imageUrl: 'https://example.com/ad-image.jpg',
    linkUrl: 'https://example.com/ad-link',
    source: 'Test Source',
    type: 'banner',
    openInNewTab: true
  };

  // Mock window.open 和 location.assign
  const mockWindowOpen = jest.fn();
  const mockLocationAssign = jest.fn();

  beforeEach(() => {
    // 清理和重置mocks
    mockWindowOpen.mockClear();
    mockLocationAssign.mockClear();
    
    // Mock window.open
    (global as any).window.open = mockWindowOpen;
    
    // Mock location assignment
    delete (global as any).window.location;
    (global as any).window.location = { 
      href: '',
      assign: mockLocationAssign
    };
  });

  describe('基础渲染', () => {
    it('当enabled为false时不渲染任何内容', () => {
      const { container } = render(
        <AdBanner 
          displayType="sidebar" 
          enabled={false}
          adData={mockAdData}
        />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('当enabled为true时渲染广告内容', () => {
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          adData={mockAdData}
        />
      );
      
      expect(screen.getByText('Test Advertisement')).toBeInTheDocument();
      expect(screen.getByText('This is a test advertisement description')).toBeInTheDocument();
      expect(screen.getByText('by Test Source')).toBeInTheDocument();
    });

    it('渲染sidebar类型的广告', () => {
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          adData={mockAdData}
        />
      );
      
      const adCard = screen.getByTestId('ad-card');
      expect(adCard).toHaveClass('w-full');
    });

    it('渲染inline类型的广告', () => {
      render(
        <AdBanner 
          displayType="inline" 
          enabled={true}
          adData={mockAdData}
        />
      );
      
      const adCard = screen.getByTestId('ad-card');
      expect(adCard).toHaveClass('max-w-md', 'mx-auto');
    });
  });

  describe('广告标签和功能', () => {
    it('显示SPONSORED标签当showAdLabel为true', () => {
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          adData={mockAdData}
          showAdLabel={true}
        />
      );
      
      expect(screen.getByText('SPONSORED')).toBeInTheDocument();
    });

    it('不显示SPONSORED标签当showAdLabel为false', () => {
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          adData={mockAdData}
          showAdLabel={false}
        />
      );
      
      expect(screen.queryByText('SPONSORED')).not.toBeInTheDocument();
    });

    it('显示关闭按钮当dismissible为true', () => {
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          adData={mockAdData}
          dismissible={true}
        />
      );
      
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('显示Learn More按钮当有linkUrl', () => {
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          adData={mockAdData}
        />
      );
      
      expect(screen.getByText('Learn More')).toBeInTheDocument();
      expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
    });
  });

  describe('交互行为', () => {
    it('点击广告时调用onAdClick回调', () => {
      const onAdClick = jest.fn();
      
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          adData={mockAdData}
          onAdClick={onAdClick}
        />
      );
      
      const adCard = screen.getByTestId('ad-card');
      fireEvent.click(adCard);
      
      expect(onAdClick).toHaveBeenCalledWith(mockAdData);
    });

    it('点击广告时在新标签页打开链接', () => {
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          adData={mockAdData}
        />
      );
      
      const adCard = screen.getByTestId('ad-card');
      fireEvent.click(adCard);
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com/ad-link',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('显示关闭按钮当dismissible为true', () => {
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          adData={mockAdData}
          dismissible={true}
        />
      );
      
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    it('显示错误状态当没有有效广告数据', () => {
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          // 没有提供adData或adSlot
        />
      );
      
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('Failed to load advertisement')).toBeInTheDocument();
    });

    it('显示自定义错误信息', () => {
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          errorMessage="Custom error message"
        />
      );
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('显示自定义占位符内容', () => {
      const placeholder = <div data-testid="custom-placeholder">Custom placeholder</div>;
      
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          placeholder={placeholder}
        />
      );
      
      expect(screen.getByTestId('custom-placeholder')).toBeInTheDocument();
      expect(screen.getByText('Custom placeholder')).toBeInTheDocument();
    });

    it('显示重试按钮在错误状态', () => {
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
        />
      );
      
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('响应式布局', () => {
    it('应用正确的CSS类名给sidebar类型', () => {
      const { container } = render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          adData={mockAdData}
          className="custom-class"
        />
      );
      
      const bannerContainer = container.firstChild as HTMLElement;
      expect(bannerContainer).toHaveClass('ad-banner', 'w-full', 'max-w-sm', 'custom-class');
    });

    it('应用正确的CSS类名给inline类型', () => {
      const { container } = render(
        <AdBanner 
          displayType="inline" 
          enabled={true}
          adData={mockAdData}
          className="custom-class"
        />
      );
      
      const bannerContainer = container.firstChild as HTMLElement;
      expect(bannerContainer).toHaveClass('ad-banner', 'w-full', 'custom-class');
    });
  });

  describe('图片处理', () => {
    it('渲染广告图片当提供imageUrl', () => {
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          adData={mockAdData}
        />
      );
      
      const image = screen.getByAltText('Test Advertisement');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/ad-image.jpg');
    });

    it('处理图片加载失败', () => {
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          adData={mockAdData}
        />
      );
      
      const image = screen.getByAltText('Test Advertisement');
      
      // 模拟图片加载失败
      fireEvent.error(image);
      
      expect(image.style.display).toBe('none');
    });
  });

  describe('数据验证', () => {
    it('显示错误当广告数据无效', () => {
      const invalidAdData = {
        description: 'Description only'
        // 缺少id和title
      } as AdData;
      
      render(
        <AdBanner 
          displayType="sidebar" 
          enabled={true}
          adData={invalidAdData}
        />
      );
      
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });
  });
});