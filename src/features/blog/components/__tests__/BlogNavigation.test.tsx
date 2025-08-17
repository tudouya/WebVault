/**
 * BlogNavigation组件单元测试
 * 
 * 测试覆盖范围:
 * - 基础渲染和props处理
 * - 面包屑导航功能
 * - 返回按钮交互
 * - 分类标签显示
 * - 响应式布局
 * - 无障碍性支持
 * - 路由导航集成
 * - 动画样式应用
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { BlogNavigation, BlogNavigationProps } from '../BlogNavigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock router functions
const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('BlogNavigation', () => {
  // 默认测试props
  const defaultProps: BlogNavigationProps = {
    article: {
      title: '深入理解React状态管理',
      category: 'Technologies',
      slug: 'react-state-management'
    }
  };

  // 长标题测试props
  const longTitleProps: BlogNavigationProps = {
    article: {
      title: '这是一个非常长的博客文章标题，用于测试文本截断功能是否正常工作',
      category: 'Lifestyle',
      slug: 'very-long-title-article'
    }
  };

  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();
    
    // 设置router mock的默认返回值
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  describe('基础渲染', () => {
    it('应该正确渲染所有导航元素', () => {
      render(<BlogNavigation {...defaultProps} />);
      
      // 检查返回按钮
      expect(screen.getByLabelText('返回博客列表')).toBeInTheDocument();
      
      // 检查面包屑导航
      const breadcrumbNav = screen.getByLabelText('面包屑导航');
      expect(breadcrumbNav).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Blog')).toBeInTheDocument();
      
      // 在面包屑中查找Technologies
      const technologiesInBreadcrumb = within(breadcrumbNav).getByText('Technologies');
      expect(technologiesInBreadcrumb).toBeInTheDocument();
      
      // 检查文章标题
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('深入理解React状态管理');
      
      // 检查分类标签
      expect(screen.getByText('分类:')).toBeInTheDocument();
      expect(screen.getByLabelText('查看Technologies分类的所有文章')).toBeInTheDocument();
    });

    it('应该应用正确的CSS动画类', () => {
      const { container } = render(<BlogNavigation {...defaultProps} />);
      
      // 检查主容器动画类
      const navElement = container.querySelector('nav');
      expect(navElement).toHaveClass('blog-category-filter-fade-in');
      
      // 检查面包屑动画类
      const breadcrumbContainer = screen.getByLabelText('面包屑导航');
      expect(breadcrumbContainer).toHaveClass('blog-content-fade-in');
      
      // 检查标题动画类
      const titleElement = screen.getByRole('heading', { level: 1 });
      expect(titleElement).toHaveClass('blog-content-fade-in');
      
      // 检查分类标签动画类
      const categoryTag = screen.getByLabelText('查看Technologies分类的所有文章');
      expect(categoryTag).toHaveClass('blog-category-tag-active');
    });

    it('应该支持自定义className', () => {
      const customClass = 'custom-navigation';
      const { container } = render(
        <BlogNavigation {...defaultProps} className={customClass} />
      );
      
      const navElement = container.querySelector('nav');
      expect(navElement).toHaveClass(customClass);
    });
  });

  describe('面包屑导航', () => {
    it('应该正确构建面包屑层次结构', () => {
      render(<BlogNavigation {...defaultProps} />);
      
      const breadcrumbItems = screen.getAllByRole('listitem');
      expect(breadcrumbItems).toHaveLength(4);
      
      // 验证面包屑顺序
      expect(breadcrumbItems[0]).toHaveTextContent('Home');
      expect(breadcrumbItems[1]).toHaveTextContent('Blog');
      expect(breadcrumbItems[2]).toHaveTextContent('Technologies');
      expect(breadcrumbItems[3]).toHaveTextContent('深入理解React状态管理');
    });

    it('应该为当前页面设置正确的aria-current属性', () => {
      render(<BlogNavigation {...defaultProps} />);
      
      // 在面包屑中查找当前页面元素
      const currentPageElement = screen.getByText((content, element) => {
        return (
          content === '深入理解React状态管理' && 
          element?.getAttribute('aria-current') === 'page'
        );
      });
      expect(currentPageElement).toHaveAttribute('aria-current', 'page');
    });

    it('应该处理面包屑点击事件', async () => {
      const user = userEvent.setup();
      render(<BlogNavigation {...defaultProps} />);
      
      // 点击Blog面包屑
      const blogBreadcrumb = screen.getByText('Blog');
      await user.click(blogBreadcrumb);
      
      expect(mockPush).toHaveBeenCalledWith('/blog');
    });

    it('应该支持自定义面包屑点击回调', async () => {
      const user = userEvent.setup();
      const mockBreadcrumbClick = jest.fn();
      
      render(
        <BlogNavigation 
          {...defaultProps} 
          onBreadcrumbClick={mockBreadcrumbClick}
        />
      );
      
      // 点击Home面包屑
      const homeBreadcrumb = screen.getByText('Home');
      await user.click(homeBreadcrumb);
      
      expect(mockBreadcrumbClick).toHaveBeenCalledWith('/');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('应该显示Home图标', () => {
      render(<BlogNavigation {...defaultProps} />);
      
      // Home链接应该包含图标
      const homeButton = screen.getByLabelText('导航到Home');
      expect(homeButton).toBeInTheDocument();
    });
  });

  describe('返回按钮功能', () => {
    it('应该处理默认返回按钮点击', async () => {
      const user = userEvent.setup();
      render(<BlogNavigation {...defaultProps} />);
      
      const backButton = screen.getByLabelText('返回博客列表');
      await user.click(backButton);
      
      expect(mockPush).toHaveBeenCalledWith('/blog');
    });

    it('应该支持自定义返回按钮回调', async () => {
      const user = userEvent.setup();
      const mockBackClick = jest.fn();
      
      render(
        <BlogNavigation 
          {...defaultProps} 
          onBackClick={mockBackClick}
        />
      );
      
      const backButton = screen.getByLabelText('返回博客列表');
      await user.click(backButton);
      
      expect(mockBackClick).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('应该在移动端显示简化文本', () => {
      render(<BlogNavigation {...defaultProps} />);
      
      const backButton = screen.getByLabelText('返回博客列表');
      
      // 应该有两个span，一个显示完整文本，一个显示简化文本
      expect(backButton.querySelector('.hidden.sm\\:inline')).toHaveTextContent('返回博客列表');
      expect(backButton.querySelector('.sm\\:hidden')).toHaveTextContent('返回');
    });
  });

  describe('文章标题处理', () => {
    it('应该显示完整的短标题', () => {
      render(<BlogNavigation {...defaultProps} />);
      
      const titleElement = screen.getByRole('heading', { level: 1 });
      expect(titleElement).toHaveTextContent('深入理解React状态管理');
      expect(titleElement).toHaveAttribute('title', '深入理解React状态管理');
    });

    it('应该截断过长的标题', () => {
      render(<BlogNavigation {...longTitleProps} />);
      
      const titleElement = screen.getByRole('heading', { level: 1 });
      // 标题应该显示完整文本（在H1中）
      expect(titleElement).toHaveTextContent(longTitleProps.article.title);
      
      // 验证面包屑中的标题截断（在面包屑导航中查找）
      const breadcrumbList = screen.getByLabelText('面包屑导航');
      expect(breadcrumbList).toBeInTheDocument();
      
      // 在面包屑中找到被截断的标题元素
      const truncatedTitleInBreadcrumb = breadcrumbList.querySelector('[aria-current="page"]');
      expect(truncatedTitleInBreadcrumb).toBeInTheDocument();
    });

    it('应该应用正确的响应式标题样式', () => {
      render(<BlogNavigation {...defaultProps} />);
      
      const titleElement = screen.getByRole('heading', { level: 1 });
      expect(titleElement).toHaveClass(
        'text-2xl', 'md:text-3xl', 'lg:text-4xl', 'font-bold'
      );
    });
  });

  describe('分类标签功能', () => {
    it('应该正确显示分类标签', () => {
      render(<BlogNavigation {...defaultProps} />);
      
      const categoryLink = screen.getByLabelText('查看Technologies分类的所有文章');
      expect(categoryLink).toHaveTextContent('Technologies');
      expect(categoryLink).toHaveAttribute('href', '/blog?category=Technologies');
    });

    it('应该应用正确的分类标签样式', () => {
      render(<BlogNavigation {...defaultProps} />);
      
      const categoryLink = screen.getByLabelText('查看Technologies分类的所有文章');
      expect(categoryLink).toHaveClass(
        'blog-category-tag',
        'rounded-[20px]',
        'bg-[#8B5CF6]',
        'text-white'
      );
    });

    it('应该处理不同的分类类型', () => {
      const lifestyleProps = {
        ...defaultProps,
        article: { ...defaultProps.article, category: 'Lifestyle' }
      };
      
      render(<BlogNavigation {...lifestyleProps} />);
      
      const categoryLink = screen.getByLabelText('查看Lifestyle分类的所有文章');
      expect(categoryLink).toHaveTextContent('Lifestyle');
      expect(categoryLink).toHaveAttribute('href', '/blog?category=Lifestyle');
    });
  });

  describe('响应式设计', () => {
    it('应该应用正确的响应式间距类', () => {
      const { container } = render(<BlogNavigation {...defaultProps} />);
      
      // 检查响应式margin类
      const elements = container.querySelectorAll('.mb-4.md\\:mb-6, .mb-6.md\\:mb-8');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('应该在面包屑中应用文本截断', () => {
      const { container } = render(<BlogNavigation {...longTitleProps} />);
      
      // 检查是否有truncate类的元素
      const truncateElements = container.querySelectorAll('.truncate');
      expect(truncateElements.length).toBeGreaterThan(0);
    });
  });

  describe('无障碍性支持', () => {
    it('应该提供正确的ARIA标签', () => {
      render(<BlogNavigation {...defaultProps} />);
      
      // 检查主导航的aria-label
      expect(screen.getByLabelText('博客文章导航')).toBeInTheDocument();
      
      // 检查面包屑导航的aria-label
      expect(screen.getByLabelText('面包屑导航')).toBeInTheDocument();
      
      // 检查返回按钮的aria-label
      expect(screen.getByLabelText('返回博客列表')).toBeInTheDocument();
    });

    it('应该支持键盘导航', () => {
      render(<BlogNavigation {...defaultProps} />);
      
      // 检查焦点可见性样式
      const focusableElements = screen.getAllByRole('button');
      focusableElements.forEach(element => {
        expect(element).toHaveClass('focus-visible:outline-none');
      });
    });

    it('应该为链接提供描述性标签', () => {
      render(<BlogNavigation {...defaultProps} />);
      
      // 检查分类链接的aria-label
      expect(screen.getByLabelText('查看Technologies分类的所有文章')).toBeInTheDocument();
      
      // 检查面包屑导航的aria-label
      expect(screen.getByLabelText('导航到Home')).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    it('应该处理缺失的分类信息', () => {
      const propsWithInvalidCategory = {
        ...defaultProps,
        article: { ...defaultProps.article, category: 'invalid-category' }
      };
      
      // 不应该抛出错误
      expect(() => {
        render(<BlogNavigation {...propsWithInvalidCategory} />);
      }).not.toThrow();
    });

    it('应该处理空标题', () => {
      const propsWithEmptyTitle = {
        ...defaultProps,
        article: { ...defaultProps.article, title: '' }
      };
      
      // 不应该抛出错误
      expect(() => {
        render(<BlogNavigation {...propsWithEmptyTitle} />);
      }).not.toThrow();
    });
  });
});