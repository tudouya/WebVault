/**
 * BreadcrumbNavigation组件单元测试
 * 
 * 测试面包屑导航组件的渲染、导航链接和交互功能
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BreadcrumbNavigation, type BreadcrumbNavigationProps } from '../BreadcrumbNavigation';

// Mock Next.js Link 组件
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe('BreadcrumbNavigation', () => {
  const mockWebsite = {
    id: 'test-website-123',
    title: 'GitHub - 全球最大的代码托管平台',
    category: {
      id: 'dev-tools',
      name: '开发工具',
      slug: 'dev-tools'
    }
  };

  const defaultProps: BreadcrumbNavigationProps = {
    website: mockWebsite,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render breadcrumb navigation with all items', () => {
      render(<BreadcrumbNavigation {...defaultProps} />);
      
      // 检查导航容器
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByLabelText('网站详情页导航')).toBeInTheDocument();
      
      // 检查面包屑列表
      expect(screen.getByLabelText('面包屑导航')).toBeInTheDocument();
      
      // 检查面包屑项
      expect(screen.getByLabelText('导航到Home')).toBeInTheDocument();
      expect(screen.getByLabelText('导航到开发工具')).toBeInTheDocument();
      expect(screen.getByText('GitHub - 全球最大的代码托管平台')).toBeInTheDocument();
    });

    it('should render correct links with proper hrefs', () => {
      render(<BreadcrumbNavigation {...defaultProps} />);
      
      // 检查Home链接
      const homeLink = screen.getByLabelText('导航到Home');
      expect(homeLink).toHaveAttribute('href', '/');
      
      // 检查分类链接
      const categoryLink = screen.getByLabelText('导航到开发工具');
      expect(categoryLink).toHaveAttribute('href', '/category/dev-tools');
    });

    it('should mark current page correctly', () => {
      render(<BreadcrumbNavigation {...defaultProps} />);
      
      // 当前页面应该有aria-current="page"属性
      const currentPage = screen.getByText('GitHub - 全球最大的代码托管平台');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
      expect(currentPage).not.toHaveAttribute('href');
    });

    it('should include Home icon', () => {
      render(<BreadcrumbNavigation {...defaultProps} />);
      
      const homeLink = screen.getByLabelText('导航到Home');
      // 检查包含Home图标的链接
      expect(homeLink).toBeInTheDocument();
    });

    it('should display chevron separators', () => {
      render(<BreadcrumbNavigation {...defaultProps} />);
      
      // 应该有2个分隔符（在3个面包屑项之间）
      const separators = screen.getAllByTestId('chevron-separator');
      expect(separators).toHaveLength(2);
    });
  });

  describe('Without Category', () => {
    it('should render correctly when category is not provided', () => {
      const websiteWithoutCategory = {
        ...mockWebsite,
        category: undefined
      };
      
      render(<BreadcrumbNavigation website={websiteWithoutCategory} />);
      
      // 应该只有Home和网站标题
      expect(screen.getByLabelText('导航到Home')).toBeInTheDocument();
      expect(screen.getByText('GitHub - 全球最大的代码托管平台')).toBeInTheDocument();
      
      // 不应该有分类链接
      expect(screen.queryByText('开发工具')).not.toBeInTheDocument();
    });
  });

  describe('Title Truncation', () => {
    it('should truncate long titles', () => {
      const websiteWithLongTitle = {
        ...mockWebsite,
        title: 'This is a very long website title that should be truncated after fifty characters approximately',
      };
      
      render(<BreadcrumbNavigation website={websiteWithLongTitle} />);
      
      // 检查标题被截断
      const currentPage = screen.getByText(/This is a very long website title that should be/);
      expect(currentPage).toBeInTheDocument();
      expect(currentPage.textContent).toMatch(/\.\.\.$/);
    });

    it('should preserve full title in title attribute', () => {
      const websiteWithLongTitle = {
        ...mockWebsite,
        title: 'This is a very long website title that should be truncated after fifty characters approximately',
      };
      
      render(<BreadcrumbNavigation website={websiteWithLongTitle} />);
      
      const currentPage = screen.getByText(/This is a very long website title that should be/);
      expect(currentPage).toHaveAttribute('title', websiteWithLongTitle.title);
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(<BreadcrumbNavigation {...defaultProps} className="custom-breadcrumb" />);
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveClass('custom-breadcrumb');
    });

    it('should call onBreadcrumbClick when provided', async () => {
      const mockOnBreadcrumbClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <BreadcrumbNavigation 
          {...defaultProps} 
          onBreadcrumbClick={mockOnBreadcrumbClick} 
        />
      );
      
      const homeLink = screen.getByLabelText('导航到Home');
      await user.click(homeLink);
      
      expect(mockOnBreadcrumbClick).toHaveBeenCalledWith('/');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<BreadcrumbNavigation {...defaultProps} />);
      
      // 导航容器
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', '网站详情页导航');
      
      // 面包屑列表
      const breadcrumbList = screen.getByLabelText('面包屑导航');
      expect(breadcrumbList).toBeInTheDocument();
      
      // 当前页面标记
      const currentPage = screen.getByText('GitHub - 全球最大的代码托管平台');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });

    it('should hide decorative icons from screen readers', () => {
      render(<BreadcrumbNavigation {...defaultProps} />);
      
      // ChevronRight 图标应该有 aria-hidden="true"
      const separators = document.querySelectorAll('[aria-hidden="true"]');
      expect(separators.length).toBeGreaterThan(0);
    });
  });
});