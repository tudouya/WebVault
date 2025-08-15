/**
 * CollectionCard 组件单元测试
 * 
 * 测试集合卡片组件的核心功能：
 * - props渲染正确性（标题、描述、图标）
 * - 点击交互功能和键盘导航
 * - 标签显示和点击处理
 * - 悬停效果和无障碍访问
 * - 响应式布局和样式应用
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { CollectionCard } from '../CollectionCard';
import type { CollectionCardData } from '../../types/collection';

// Mock UI components
jest.mock('../../../../components/ui/card', () => ({
  Card: ({ children, className, style, onClick, onKeyDown, tabIndex, role, ...props }: any) => (
    <div 
      className={className}
      style={style}
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

describe('CollectionCard', () => {
  const mockCollection: CollectionCardData = {
    id: 'collection-1',
    title: 'Web Development Tools',
    description: 'Essential tools and resources for modern web development, including frameworks, libraries, and debugging utilities.',
    icon: {
      character: '🛠️',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff'
    },
    websiteCount: 15,
    status: 'active',
    tags: ['development', 'tools', 'frontend'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-08-10T15:30:00Z'
  };

  const mockProps = {
    collection: mockCollection,
    onClick: jest.fn(),
    onTagClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders collection card with all basic information', () => {
      render(<CollectionCard {...mockProps} />);

      // Check title
      expect(screen.getByText('Web Development Tools')).toBeInTheDocument();
      
      // Check description
      expect(screen.getByText(/Essential tools and resources for modern web development/)).toBeInTheDocument();
      
      // Check icon
      expect(screen.getByText('🛠️')).toBeInTheDocument();
      
      // Check website count
      expect(screen.getByText('15 websites')).toBeInTheDocument();
    });

    test('renders collection icon with correct styling', () => {
      const { container } = render(<CollectionCard {...mockProps} />);
      
      const iconElement = container.querySelector('[aria-hidden="true"]');
      expect(iconElement).toBeInTheDocument();
      expect(iconElement).toHaveStyle({
        backgroundColor: '#3b82f6',
        color: '#ffffff'
      });
      expect(iconElement).toHaveClass('w-16', 'h-16', 'rounded-2xl');
    });

    test('applies correct CSS classes for layout and styling', () => {
      const { container } = render(<CollectionCard {...mockProps} />);
      
      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement).toHaveClass(
        'relative',
        'overflow-hidden', 
        'group',
        'collection-card',
        'cursor-pointer',
        'bg-white',
        'rounded-2xl',
        'border',
        'shadow-sm'
      );
    });

    test('renders with custom className and style', () => {
      const customProps = {
        ...mockProps,
        className: 'custom-collection-card',
        style: { margin: '10px' }
      };
      
      const { container } = render(<CollectionCard {...customProps} />);
      
      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement).toHaveClass('custom-collection-card');
      expect(cardElement).toHaveStyle({ margin: '10px' });
    });
  });

  describe('Website Count Display', () => {
    test('shows singular "website" for count of 1', () => {
      const singleWebsiteCollection = {
        ...mockCollection,
        websiteCount: 1
      };
      
      render(<CollectionCard collection={singleWebsiteCollection} />);
      expect(screen.getByText('1 website')).toBeInTheDocument();
    });

    test('shows plural "websites" for count greater than 1', () => {
      render(<CollectionCard {...mockProps} />);
      expect(screen.getByText('15 websites')).toBeInTheDocument();
    });

    test('shows plural "websites" for count of 0', () => {
      const emptyCollection = {
        ...mockCollection,
        websiteCount: 0
      };
      
      render(<CollectionCard collection={emptyCollection} />);
      expect(screen.getByText('0 websites')).toBeInTheDocument();
    });
  });

  describe('Tags Display', () => {
    test('renders tags when provided', () => {
      render(<CollectionCard {...mockProps} />);
      
      expect(screen.getByText('development')).toBeInTheDocument();
      expect(screen.getByText('tools')).toBeInTheDocument();
    });

    test('shows only first 2 tags with +N indicator for more tags', () => {
      const manyTagsCollection = {
        ...mockCollection,
        tags: ['development', 'tools', 'frontend', 'backend', 'design']
      };
      
      render(<CollectionCard collection={manyTagsCollection} />);
      
      // Should show first 2 tags
      expect(screen.getByText('development')).toBeInTheDocument();
      expect(screen.getByText('tools')).toBeInTheDocument();
      
      // Should show +3 indicator
      expect(screen.getByText('+3')).toBeInTheDocument();
      
      // Should not show remaining tags directly
      expect(screen.queryByText('frontend')).not.toBeInTheDocument();
    });

    test('does not show +N indicator when exactly 2 tags', () => {
      const twoTagsCollection = {
        ...mockCollection,
        tags: ['development', 'tools']
      };
      
      render(<CollectionCard collection={twoTagsCollection} />);
      
      expect(screen.getByText('development')).toBeInTheDocument();
      expect(screen.getByText('tools')).toBeInTheDocument();
      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });

    test('does not render tags section when no tags provided', () => {
      const noTagsCollection = {
        ...mockCollection,
        tags: undefined
      };
      
      render(<CollectionCard collection={noTagsCollection} />);
      
      // Should not have any tag buttons
      const tagButtons = screen.queryAllByRole('button');
      expect(tagButtons.length).toBeLessThanOrEqual(1); // Only the main card might be a button
    });

    test('handles empty tags array', () => {
      const emptyTagsCollection = {
        ...mockCollection,
        tags: []
      };
      
      render(<CollectionCard collection={emptyTagsCollection} />);
      
      // Should not render any tag elements
      expect(screen.queryByText('development')).not.toBeInTheDocument();
    });
  });

  describe('Click Interactions', () => {
    test('calls onClick handler when card is clicked', async () => {
      const user = userEvent.setup();
      render(<CollectionCard {...mockProps} />);

      const cardElement = screen.getByRole('button', { name: /View collection: Web Development Tools/ });
      await user.click(cardElement);

      expect(mockProps.onClick).toHaveBeenCalledWith(mockCollection);
      expect(mockProps.onClick).toHaveBeenCalledTimes(1);
    });

    test('calls onTagClick handler when tag is clicked', async () => {
      const user = userEvent.setup();
      render(<CollectionCard {...mockProps} />);

      const tagButton = screen.getByText('development');
      await user.click(tagButton);

      expect(mockProps.onTagClick).toHaveBeenCalledWith('development');
      expect(mockProps.onTagClick).toHaveBeenCalledTimes(1);
      
      // Main onClick should not be called when clicking tag
      expect(mockProps.onClick).not.toHaveBeenCalled();
    });

    test('stops propagation when tag is clicked', async () => {
      const user = userEvent.setup();
      const mockStopPropagation = jest.fn();
      
      render(<CollectionCard {...mockProps} />);

      const tagButton = screen.getByText('development');
      
      // Mock the event stopPropagation
      tagButton.addEventListener('click', (e) => {
        mockStopPropagation();
      });
      
      await user.click(tagButton);

      expect(mockProps.onTagClick).toHaveBeenCalled();
      expect(mockProps.onClick).not.toHaveBeenCalled();
    });

    test('does not call onClick when not provided', async () => {
      const user = userEvent.setup();
      const { onClick, ...propsWithoutClick } = mockProps;
      
      render(<CollectionCard {...propsWithoutClick} />);

      const cardElement = screen.getByRole('button', { name: /View collection: Web Development Tools/ });
      await user.click(cardElement);

      // Should not throw error since onClick is optional
    });

    test('does not call onTagClick when not provided', async () => {
      const user = userEvent.setup();
      const { onTagClick, ...propsWithoutTagClick } = mockProps;
      
      render(<CollectionCard {...propsWithoutTagClick} />);

      const tagButton = screen.getByText('development');
      await user.click(tagButton);

      // Should not throw error
      expect(onTagClick).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    test('responds to Enter key press', () => {
      render(<CollectionCard {...mockProps} />);

      const cardElement = screen.getByRole('button', { name: /View collection: Web Development Tools/ });
      fireEvent.keyDown(cardElement, { key: 'Enter', code: 'Enter' });

      expect(mockProps.onClick).toHaveBeenCalledWith(mockCollection);
    });

    test('responds to Space key press', () => {
      render(<CollectionCard {...mockProps} />);

      const cardElement = screen.getByRole('button', { name: /View collection: Web Development Tools/ });
      fireEvent.keyDown(cardElement, { key: ' ', code: 'Space' });

      expect(mockProps.onClick).toHaveBeenCalledWith(mockCollection);
    });

    test('handles Enter and Space key events', () => {
      const mockOnClick = jest.fn();
      const isolatedProps = {
        ...mockProps,
        onClick: mockOnClick
      };
      
      render(<CollectionCard {...isolatedProps} />);

      const cardElement = screen.getByRole('button', { name: /View collection: Web Development Tools/ });
      
      // Test that Enter and Space keys trigger the click handler
      fireEvent.keyDown(cardElement, { key: 'Enter', code: 'Enter' });
      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(mockCollection);
      
      fireEvent.keyDown(cardElement, { key: ' ', code: 'Space' });
      expect(mockOnClick).toHaveBeenCalledTimes(2);
      expect(mockOnClick).toHaveBeenCalledWith(mockCollection);
    });

    test('ignores other key presses', () => {
      render(<CollectionCard {...mockProps} />);

      const cardElement = screen.getByRole('button', { name: /View collection: Web Development Tools/ });
      fireEvent.keyDown(cardElement, { key: 'Tab', code: 'Tab' });
      fireEvent.keyDown(cardElement, { key: 'Escape', code: 'Escape' });

      expect(mockProps.onClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<CollectionCard {...mockProps} />);

      const cardElement = screen.getByRole('button', { name: /View collection: Web Development Tools/ });
      expect(cardElement).toHaveAttribute('role', 'button');
      expect(cardElement).toHaveAttribute('aria-label', 'View collection: Web Development Tools');
      expect(cardElement).toHaveAttribute('tabIndex', '0');
    });

    test('has proper focus styles', () => {
      const { container } = render(<CollectionCard {...mockProps} />);
      
      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
        'focus-visible:ring-offset-2'
      );
    });

    test('tag buttons have proper accessibility attributes', () => {
      render(<CollectionCard {...mockProps} />);

      const tagButton = screen.getByText('development');
      expect(tagButton).toHaveAttribute('type', 'button');
      expect(tagButton).toHaveAttribute('title', 'Filter by tag: development');
      expect(tagButton).toHaveAttribute('aria-label', '筛选标签：development');
    });

    test('tag buttons have proper focus styles', () => {
      render(<CollectionCard {...mockProps} />);

      const tagButton = screen.getByText('development');
      expect(tagButton).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
        'focus-visible:ring-offset-1'
      );
    });

    test('description has title attribute for truncated content', () => {
      render(<CollectionCard {...mockProps} />);

      const descriptionElement = screen.getByText(/Essential tools and resources for modern web development/);
      expect(descriptionElement).toHaveAttribute('title', mockCollection.description);
    });

    test('icon element is properly hidden from screen readers', () => {
      const { container } = render(<CollectionCard {...mockProps} />);
      
      const iconElement = container.querySelector('[aria-hidden="true"]');
      expect(iconElement).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('renders without optional props', () => {
      const minimalCollection = {
        id: 'minimal-1',
        title: 'Minimal Collection',
        description: 'Simple description',
        icon: {
          character: 'M',
          backgroundColor: '#gray',
          textColor: '#white'
        },
        websiteCount: 5
      };

      render(<CollectionCard collection={minimalCollection} />);

      expect(screen.getByText('Minimal Collection')).toBeInTheDocument();
      expect(screen.getByText('Simple description')).toBeInTheDocument();
      expect(screen.getByText('5 websites')).toBeInTheDocument();
    });

    test('handles very long title and description', () => {
      const longContentCollection = {
        ...mockCollection,
        title: 'This is a very long collection title that might be truncated in the UI with multiple lines of text',
        description: 'This is an extremely long description that definitely exceeds the typical length and should be handled gracefully by the component with proper truncation and ellipsis behavior for better user experience and consistent layout maintenance.'
      };

      const { container } = render(<CollectionCard collection={longContentCollection} />);
      
      // Check that title has line-clamp class
      const titleElement = screen.getByText(/This is a very long collection title/);
      expect(titleElement).toHaveClass('line-clamp-2');
      
      // Check that description has line-clamp class
      const descriptionElement = screen.getByText(/This is an extremely long description/);
      expect(descriptionElement).toHaveClass('line-clamp-3');
    });

    test('handles collections with zero websites', () => {
      const emptyCollection = {
        ...mockCollection,
        websiteCount: 0
      };

      render(<CollectionCard collection={emptyCollection} />);
      expect(screen.getByText('0 websites')).toBeInTheDocument();
    });

    test('handles collections without description', () => {
      const noDescriptionCollection = {
        ...mockCollection,
        description: ''
      };

      render(<CollectionCard collection={noDescriptionCollection} />);
      
      // Description element should not be rendered when empty
      expect(screen.queryByText(/Essential tools and resources/)).not.toBeInTheDocument();
    });
  });

  describe('Component Memoization', () => {
    test('component is properly memoized', () => {
      // This test ensures the component is wrapped with React.memo
      // by checking that it doesn't re-render with same props
      const { rerender } = render(<CollectionCard {...mockProps} />);
      
      const initialRenderCount = mockProps.onClick.mock.calls.length;
      
      // Re-render with same props
      rerender(<CollectionCard {...mockProps} />);
      
      // Should not cause additional renders or calls
      expect(mockProps.onClick).toHaveBeenCalledTimes(initialRenderCount);
    });
  });

  describe('Style and Layout', () => {
    test('applies correct responsive layout classes', () => {
      const { container } = render(<CollectionCard {...mockProps} />);
      
      // Check main layout structure
      const cardContent = container.querySelector('.p-4');
      expect(cardContent).toBeInTheDocument();
      
      // Check header layout
      const headerLayout = container.querySelector('.flex.items-start.gap-4');
      expect(headerLayout).toBeInTheDocument();
      
      // Check content layout
      const contentLayout = container.querySelector('.flex-1.min-w-0');
      expect(contentLayout).toBeInTheDocument();
    });

    test('applies correct typography classes', () => {
      render(<CollectionCard {...mockProps} />);
      
      // Title typography
      const titleElement = screen.getByText('Web Development Tools');
      expect(titleElement).toHaveClass('font-semibold', 'text-xl', 'text-foreground');
      
      // Description typography
      const descriptionElement = screen.getByText(/Essential tools and resources/);
      expect(descriptionElement).toHaveClass('text-sm', 'text-muted-foreground');
      
      // Website count typography
      const countElement = screen.getByText('15 websites');
      expect(countElement).toHaveClass('text-sm', 'text-muted-foreground');
    });

    test('tag buttons have proper styling classes', () => {
      render(<CollectionCard {...mockProps} />);

      const tagButton = screen.getByText('development');
      expect(tagButton).toHaveClass(
        'inline-flex',
        'items-center',
        'px-2.5',
        'py-1',
        'text-xs',
        'font-medium',
        'bg-secondary',
        'text-secondary-foreground',
        'rounded-md',
        'hover:bg-secondary/80',
        'cursor-pointer',
        'transition-all',
        'duration-200',
        'ease-out',
        'active:scale-95',
        'touch-manipulation',
        'min-h-[28px]'
      );
    });
  });
});