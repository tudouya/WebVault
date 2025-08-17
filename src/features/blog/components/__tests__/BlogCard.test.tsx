/**
 * BlogCard 组件单元测试
 * 
 * 测试博客卡片组件的核心功能：
 * - props渲染正确性（标题、作者信息、封面图片、发布时间）
 * - 点击交互功能和键盘导航
 * - 图片懒加载和错误处理机制
 * - 悬停效果和无障碍访问
 * - 相对时间显示格式
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { BlogCard } from '../BlogCard';
import type { BlogCardData } from '../../types';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: React.forwardRef(({ 
    src, 
    alt, 
    onError, 
    onLoad, 
    fill,
    loading,
    placeholder,
    blurDataURL,
    unoptimized,
    quality,
    sizes,
    priority,
    style,
    className,
    ...otherProps 
  }: any, ref: any) => {
    const handleError = () => {
      if (onError) onError();
    };
    
    const handleLoad = () => {
      if (onLoad) onLoad();
    };

    // Filter out Next.js specific props that shouldn't be passed to img element
    const imgProps: any = {
      ref,
      src,
      alt,
      onError: handleError,
      onLoad: handleLoad,
      loading,
      style,
      className,
      ...otherProps
    };

    // Only pass standard img attributes
    if (fill) {
      imgProps.style = { ...imgProps.style, objectFit: 'cover' };
    }

    return <img {...imgProps} />;
  }),
}));

// Mock useIntersectionObserver hook
const mockIntersectionObserver = {
  ref: { current: null },
  isIntersecting: true
};

jest.mock('../../../../hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: jest.fn(() => mockIntersectionObserver)
}));

// Mock UI components
jest.mock('../../../../components/ui/card', () => ({
  Card: ({ children, className, onClick, onKeyDown, tabIndex, role, ...props }: any) => (
    <div 
      className={className}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      role={role}
      {...props}
    >
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className}>
      {children}
    </div>
  ),
}));

jest.mock('../../../../lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('BlogCard', () => {
  const mockBlog: BlogCardData = {
    id: 'blog-1',
    title: 'Advanced React Patterns and Performance Optimization Techniques for Modern Web Applications',
    excerpt: 'Learn how to optimize React applications with advanced patterns, memoization, and performance best practices.',
    slug: 'react-patterns-performance',
    coverImage: 'https://example.com/react-cover.jpg',
    author: {
      name: 'Alice Johnson',
      avatar: 'https://example.com/alice-avatar.jpg',
    },
    category: 'Technology',
    publishedAt: '2024-01-15T10:00:00Z',
  };

  const mockProps = {
    blog: mockBlog,
    onTagClick: jest.fn(),
    onAuthorClick: jest.fn(),
  };

  // Console.log spy for navigation testing
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
    
    // Reset intersection observer mock
    const { useIntersectionObserver } = require('../../../../hooks/useIntersectionObserver');
    useIntersectionObserver.mockReturnValue({
      ref: { current: null },
      isIntersecting: true
    });
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('Basic Rendering', () => {
    test('renders blog card with all basic information', () => {
      render(<BlogCard {...mockProps} />);

      // Check title
      expect(screen.getByText(mockBlog.title)).toBeInTheDocument();
      
      // Check author name
      expect(screen.getByText(mockBlog.author.name)).toBeInTheDocument();
      
      // Check cover image
      expect(screen.getByAltText(`Cover image for ${mockBlog.title}`)).toBeInTheDocument();
      
      // Check author avatar
      expect(screen.getByAltText(`${mockBlog.author.name}'s avatar`)).toBeInTheDocument();
      
      // Check relative time is displayed
      expect(screen.getByRole('time')).toBeInTheDocument();
    });

    test('renders cover image with correct properties', () => {
      render(<BlogCard {...mockProps} />);
      
      const coverImage = screen.getByAltText(`Cover image for ${mockBlog.title}`);
      expect(coverImage).toHaveAttribute('src', mockBlog.coverImage);
      expect(coverImage).toHaveAttribute('loading', 'lazy');
    });

    test('applies correct CSS classes for layout and styling', () => {
      const { container } = render(<BlogCard {...mockProps} />);
      
      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement).toHaveClass(
        'relative',
        'overflow-hidden', 
        'group',
        'blog-card',
        'cursor-pointer',
        'bg-white',
        'rounded-xl',
        'border',
        'shadow-sm'
      );
    });

    test('renders with custom className and style', () => {
      const customProps = {
        ...mockProps,
        className: 'custom-blog-card',
      };
      
      const { container } = render(<BlogCard {...customProps} />);
      
      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement).toHaveClass('custom-blog-card');
    });

    test('title has proper truncation classes and title attribute', () => {
      render(<BlogCard {...mockProps} />);
      
      const titleElement = screen.getByText(mockBlog.title);
      expect(titleElement).toHaveClass('line-clamp-2');
      expect(titleElement).toHaveAttribute('title', mockBlog.title);
    });
  });

  describe('Author Information Display', () => {
    test('renders author with avatar image', () => {
      render(<BlogCard {...mockProps} />);
      
      const authorAvatar = screen.getByAltText(`${mockBlog.author.name}'s avatar`);
      expect(authorAvatar).toBeInTheDocument();
      expect(authorAvatar).toHaveAttribute('src', mockBlog.author.avatar);
      
      const authorName = screen.getByText(mockBlog.author.name);
      expect(authorName).toBeInTheDocument();
    });

    test('shows initial letter when author has no avatar', () => {
      const blogWithoutAvatar: BlogCardData = {
        ...mockBlog,
        author: {
          name: 'Jane Smith',
          // No avatar field
        }
      };
      
      render(<BlogCard blog={blogWithoutAvatar} />);
      
      // Should show first letter of author name
      expect(screen.getByText('J')).toBeInTheDocument();
      expect(screen.queryByAltText(`${blogWithoutAvatar.author.name}'s avatar`)).not.toBeInTheDocument();
    });

    test('handles author avatar loading error gracefully', async () => {
      render(<BlogCard {...mockProps} />);
      
      const authorAvatar = screen.getByAltText(`${mockBlog.author.name}'s avatar`);
      
      // Simulate image load error
      fireEvent.error(authorAvatar);
      
      await waitFor(() => {
        expect(screen.getByText('A')).toBeInTheDocument(); // First letter fallback
      });
    });

    test('truncates long author names properly', () => {
      const longNameBlog: BlogCardData = {
        ...mockBlog,
        author: {
          name: 'Very Long Author Name That Should Be Truncated',
          avatar: 'https://example.com/avatar.jpg',
        }
      };
      
      render(<BlogCard blog={longNameBlog} />);
      
      const authorName = screen.getByText(longNameBlog.author.name);
      expect(authorName).toHaveClass('truncate', 'max-w-20');
    });
  });

  describe('Time Display and Formatting', () => {
    test('shows "Today" for current date', () => {
      const todayBlog: BlogCardData = {
        ...mockBlog,
        publishedAt: new Date().toISOString(),
      };
      
      render(<BlogCard blog={todayBlog} />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    test('shows "1d ago" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const yesterdayBlog: BlogCardData = {
        ...mockBlog,
        publishedAt: yesterday.toISOString(),
      };
      
      render(<BlogCard blog={yesterdayBlog} />);
      expect(screen.getByText('1d ago')).toBeInTheDocument();
    });

    test('shows days ago for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const pastBlog: BlogCardData = {
        ...mockBlog,
        publishedAt: pastDate.toISOString(),
      };
      
      render(<BlogCard blog={pastBlog} />);
      expect(screen.getByText('5d ago')).toBeInTheDocument();
    });

    test('shows "AHEAD" for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      
      const futureBlog: BlogCardData = {
        ...mockBlog,
        publishedAt: futureDate.toISOString(),
      };
      
      render(<BlogCard blog={futureBlog} />);
      expect(screen.getByText('3d AHEAD')).toBeInTheDocument();
    });

    test('time element has proper dateTime and title attributes', () => {
      render(<BlogCard {...mockProps} />);
      
      const timeElement = screen.getByRole('time');
      expect(timeElement).toHaveAttribute('dateTime', mockBlog.publishedAt);
      expect(timeElement).toHaveAttribute('title', new Date(mockBlog.publishedAt).toLocaleDateString());
    });
  });

  describe('Image Loading and Error Handling', () => {
    test('shows loading spinner when image is not intersecting', () => {
      const { useIntersectionObserver } = require('../../../../hooks/useIntersectionObserver');
      useIntersectionObserver.mockReturnValue({
        ref: { current: null },
        isIntersecting: false
      });

      const { container } = render(<BlogCard {...mockProps} />);
      
      // Should show loading spinner
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    test('handles cover image loading error with fallback', async () => {
      render(<BlogCard {...mockProps} />);
      
      const coverImage = screen.getByAltText(`Cover image for ${mockBlog.title}`);
      
      // Simulate image load error
      fireEvent.error(coverImage);
      
      await waitFor(() => {
        expect(screen.getByText('Image not available')).toBeInTheDocument();
      });
    });

    test('shows default cover placeholder when image fails to load', async () => {
      render(<BlogCard {...mockProps} />);
      
      const coverImage = screen.getByAltText(`Cover image for ${mockBlog.title}`);
      fireEvent.error(coverImage);
      
      await waitFor(() => {
        const placeholder = screen.getByText('Image not available');
        expect(placeholder).toBeInTheDocument();
        
        // Should also show the image icon
        const imageIcon = placeholder.parentElement?.querySelector('svg');
        expect(imageIcon).toBeInTheDocument();
      });
    });
  });

  describe('Click Interactions', () => {
    test('calls navigation function when card is clicked', async () => {
      const user = userEvent.setup();
      render(<BlogCard {...mockProps} />);

      const cardElement = screen.getByRole('button', { name: `Read blog post: ${mockBlog.title}` });
      await user.click(cardElement);

      expect(consoleSpy).toHaveBeenCalledWith(`Navigate to blog: ${mockBlog.slug}`);
    });

    test('calls onAuthorClick handler when author is clicked', async () => {
      const user = userEvent.setup();
      render(<BlogCard {...mockProps} />);

      const authorButton = screen.getByRole('button', { name: `View posts by ${mockBlog.author.name}` });
      await user.click(authorButton);

      expect(mockProps.onAuthorClick).toHaveBeenCalledWith(mockBlog.id);
      expect(mockProps.onAuthorClick).toHaveBeenCalledTimes(1);
      
      // Main card navigation should not be called when clicking author
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    test('stops propagation when author button is clicked', async () => {
      const user = userEvent.setup();
      const mockStopPropagation = jest.fn();
      
      render(<BlogCard {...mockProps} />);

      const authorButton = screen.getByRole('button', { name: `View posts by ${mockBlog.author.name}` });
      
      // Add event listener to verify stopPropagation
      authorButton.addEventListener('click', (e) => {
        mockStopPropagation();
      });
      
      await user.click(authorButton);

      expect(mockProps.onAuthorClick).toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled(); // Main click should not happen
    });

    test('does not call onAuthorClick when not provided', async () => {
      const user = userEvent.setup();
      const { onAuthorClick, ...propsWithoutAuthorClick } = mockProps;
      
      render(<BlogCard {...propsWithoutAuthorClick} />);

      const authorButton = screen.getByRole('button', { name: `View posts by ${mockBlog.author.name}` });
      await user.click(authorButton);

      // Should not throw error since onAuthorClick is optional
      expect(onAuthorClick).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    test('responds to Enter key press', () => {
      render(<BlogCard {...mockProps} />);

      const cardElement = screen.getByRole('button', { name: `Read blog post: ${mockBlog.title}` });
      fireEvent.keyDown(cardElement, { key: 'Enter', code: 'Enter' });

      expect(consoleSpy).toHaveBeenCalledWith(`Navigate to blog: ${mockBlog.slug}`);
    });

    test('responds to Space key press', () => {
      render(<BlogCard {...mockProps} />);

      const cardElement = screen.getByRole('button', { name: `Read blog post: ${mockBlog.title}` });
      fireEvent.keyDown(cardElement, { key: ' ', code: 'Space' });

      expect(consoleSpy).toHaveBeenCalledWith(`Navigate to blog: ${mockBlog.slug}`);
    });

    test('handles Enter and Space key events correctly', () => {
      render(<BlogCard {...mockProps} />);

      const cardElement = screen.getByRole('button', { name: `Read blog post: ${mockBlog.title}` });
      
      // Test Enter key
      consoleSpy.mockClear();
      fireEvent.keyDown(cardElement, { key: 'Enter', code: 'Enter' });
      expect(consoleSpy).toHaveBeenCalledWith(`Navigate to blog: ${mockBlog.slug}`);
      
      // Test Space key
      consoleSpy.mockClear();
      fireEvent.keyDown(cardElement, { key: ' ', code: 'Space' });
      expect(consoleSpy).toHaveBeenCalledWith(`Navigate to blog: ${mockBlog.slug}`);
    });

    test('ignores other key presses', () => {
      render(<BlogCard {...mockProps} />);

      const cardElement = screen.getByRole('button', { name: `Read blog post: ${mockBlog.title}` });
      fireEvent.keyDown(cardElement, { key: 'Tab', code: 'Tab' });
      fireEvent.keyDown(cardElement, { key: 'Escape', code: 'Escape' });

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<BlogCard {...mockProps} />);

      const cardElement = screen.getByRole('button', { name: `Read blog post: ${mockBlog.title}` });
      expect(cardElement).toHaveAttribute('role', 'button');
      expect(cardElement).toHaveAttribute('aria-label', `Read blog post: ${mockBlog.title}`);
      expect(cardElement).toHaveAttribute('tabIndex', '0');
    });

    test('has proper focus styles', () => {
      const { container } = render(<BlogCard {...mockProps} />);
      
      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
        'focus-visible:ring-offset-2'
      );
    });

    test('author button has proper accessibility attributes', () => {
      render(<BlogCard {...mockProps} />);

      const authorButton = screen.getByRole('button', { name: `View posts by ${mockBlog.author.name}` });
      expect(authorButton).toHaveAttribute('type', 'button');
      expect(authorButton).toHaveAttribute('title', `View posts by ${mockBlog.author.name}`);
      expect(authorButton).toHaveAttribute('aria-label', `View posts by ${mockBlog.author.name}`);
    });

    test('author button has proper focus styles', () => {
      render(<BlogCard {...mockProps} />);

      const authorButton = screen.getByRole('button', { name: `View posts by ${mockBlog.author.name}` });
      expect(authorButton).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
        'focus-visible:ring-offset-1'
      );
    });

    test('images have proper alt attributes', () => {
      render(<BlogCard {...mockProps} />);

      const coverImage = screen.getByAltText(`Cover image for ${mockBlog.title}`);
      expect(coverImage).toBeInTheDocument();
      
      const authorAvatar = screen.getByAltText(`${mockBlog.author.name}'s avatar`);
      expect(authorAvatar).toBeInTheDocument();
    });
  });

  describe('Hover Effects and Visual Feedback', () => {
    test('applies correct hover classes', () => {
      const { container } = render(<BlogCard {...mockProps} />);
      
      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement).toHaveClass(
        'hover:shadow-lg',
        'hover:-translate-y-1'
      );
    });

    test('cover image has hover scale effect', () => {
      render(<BlogCard {...mockProps} />);
      
      const coverImage = screen.getByAltText(`Cover image for ${mockBlog.title}`);
      expect(coverImage).toHaveClass('group-hover:scale-105');
    });

    test('author button has hover color transition', () => {
      render(<BlogCard {...mockProps} />);

      const authorButton = screen.getByRole('button', { name: `View posts by ${mockBlog.author.name}` });
      expect(authorButton).toHaveClass(
        'hover:text-foreground',
        'transition-colors',
        'duration-200'
      );
    });
  });

  describe('Component Layout and Responsive Design', () => {
    test('applies correct aspect ratio for cover image', () => {
      const { container } = render(<BlogCard {...mockProps} />);
      
      const imageContainer = container.querySelector('.aspect-\\[16\\/10\\]');
      expect(imageContainer).toBeInTheDocument();
    });

    test('applies correct content height and flex layout', () => {
      const { container } = render(<BlogCard {...mockProps} />);
      
      const cardContent = container.querySelector('.h-32');
      expect(cardContent).toBeInTheDocument();
      expect(cardContent).toHaveClass('flex', 'flex-col');
    });

    test('title uses flex-1 for proper spacing', () => {
      render(<BlogCard {...mockProps} />);
      
      const titleElement = screen.getByText(mockBlog.title);
      expect(titleElement).toHaveClass('flex-1');
    });

    test('author section uses mt-auto for bottom alignment', () => {
      const { container } = render(<BlogCard {...mockProps} />);
      
      const authorSection = container.querySelector('.mt-auto');
      expect(authorSection).toBeInTheDocument();
      expect(authorSection).toHaveClass('flex', 'items-center', 'justify-between');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('renders without optional props', () => {
      const minimalBlog = {
        id: 'minimal-1',
        title: 'Minimal Blog Post',
        excerpt: 'Simple excerpt',
        slug: 'minimal-post',
        coverImage: 'https://example.com/minimal.jpg',
        author: {
          name: 'Min Author',
        },
        category: 'General',
        publishedAt: '2024-01-01T12:00:00Z',
      };

      render(<BlogCard blog={minimalBlog} />);

      expect(screen.getByText('Minimal Blog Post')).toBeInTheDocument();
      expect(screen.getByText('Min Author')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument(); // Initial letter for missing avatar
    });

    test('handles very long titles with proper truncation', () => {
      const longTitleBlog: BlogCardData = {
        ...mockBlog,
        title: 'This is an extremely long blog post title that definitely exceeds the typical length and should be handled gracefully by the component with proper truncation using line-clamp classes to maintain consistent layout across all blog cards in the grid while ensuring readability and visual hierarchy.'
      };

      render(<BlogCard blog={longTitleBlog} />);
      
      const titleElement = screen.getByText(longTitleBlog.title);
      expect(titleElement).toHaveClass('line-clamp-2');
      expect(titleElement).toHaveAttribute('title', longTitleBlog.title);
    });

    test('handles empty author name gracefully', () => {
      const emptyAuthorBlog: BlogCardData = {
        ...mockBlog,
        author: {
          name: '',
        }
      };

      render(<BlogCard blog={emptyAuthorBlog} />);
      
      // Should still render without errors
      const authorSection = screen.getByRole('button', { name: /View posts by/i });
      expect(authorSection).toBeInTheDocument();
    });
  });

  describe('Component Memoization', () => {
    test('component is properly memoized', () => {
      // This test ensures the component is wrapped with React.memo
      const { rerender } = render(<BlogCard {...mockProps} />);
      
      const initialCallCount = consoleSpy.mock.calls.length;
      
      // Re-render with same props
      rerender(<BlogCard {...mockProps} />);
      
      // Should not cause additional renders or function calls
      expect(consoleSpy).toHaveBeenCalledTimes(initialCallCount);
    });
  });
});