/**
 * CategoryFilter Component Tests
 * 
 * 测试博客分类筛选标签组件的功能和交互行为
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryFilter } from '../CategoryFilter';
import { BLOG_CATEGORIES, BlogCategoryType } from '../../constants/categories';

// Mock函数
const mockOnCategoryChange = jest.fn();

// 默认测试属性
const defaultProps = {
  activeCategory: 'All' as BlogCategoryType,
  onCategoryChange: mockOnCategoryChange,
};

describe('CategoryFilter', () => {
  beforeEach(() => {
    mockOnCategoryChange.mockClear();
  });

  describe('基础渲染', () => {
    it('应该渲染所有预定义分类标签', () => {
      render(<CategoryFilter {...defaultProps} />);
      
      // 验证所有分类都被渲染
      BLOG_CATEGORIES.forEach((category) => {
        expect(screen.getByRole('tab', { name: category })).toBeInTheDocument();
      });
    });

    it('应该正确高亮当前激活的分类', () => {
      render(<CategoryFilter {...defaultProps} activeCategory="Technologies" />);
      
      const technologiesTab = screen.getByRole('tab', { name: 'Technologies' });
      expect(technologiesTab).toHaveAttribute('aria-selected', 'true');
    });

    it('应该为非激活分类设置正确的aria属性', () => {
      render(<CategoryFilter {...defaultProps} activeCategory="Technologies" />);
      
      const lifestyleTab = screen.getByRole('tab', { name: 'Lifestyle' });
      expect(lifestyleTab).toHaveAttribute('aria-selected', 'false');
      expect(lifestyleTab).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('交互功能', () => {
    it('点击分类标签时应该调用onCategoryChange', async () => {
      const user = userEvent.setup();
      render(<CategoryFilter {...defaultProps} />);
      
      const designTab = screen.getByRole('tab', { name: 'Design' });
      await user.click(designTab);
      
      expect(mockOnCategoryChange).toHaveBeenCalledWith('Design');
    });

    it('使用键盘Enter键应该触发分类切换', () => {
      render(<CategoryFilter {...defaultProps} />);
      
      const travelTab = screen.getByRole('tab', { name: 'Travel' });
      fireEvent.keyDown(travelTab, { key: 'Enter' });
      
      expect(mockOnCategoryChange).toHaveBeenCalledWith('Travel');
    });

    it('使用键盘空格键应该触发分类切换', () => {
      render(<CategoryFilter {...defaultProps} />);
      
      const growthTab = screen.getByRole('tab', { name: 'Growth' });
      fireEvent.keyDown(growthTab, { key: ' ' });
      
      expect(mockOnCategoryChange).toHaveBeenCalledWith('Growth');
    });

    it('其他按键不应该触发分类切换', () => {
      render(<CategoryFilter {...defaultProps} />);
      
      const lifestyleTab = screen.getByRole('tab', { name: 'Lifestyle' });
      fireEvent.keyDown(lifestyleTab, { key: 'Tab' });
      
      expect(mockOnCategoryChange).not.toHaveBeenCalled();
    });

    it('使用左箭头键应该切换到上一个分类', () => {
      render(<CategoryFilter {...defaultProps} activeCategory="Technologies" />);
      
      const technologiesTab = screen.getByRole('tab', { name: 'Technologies' });
      fireEvent.keyDown(technologiesTab, { key: 'ArrowLeft' });
      
      expect(mockOnCategoryChange).toHaveBeenCalledWith('Lifestyle');
    });

    it('使用右箭头键应该切换到下一个分类', () => {
      render(<CategoryFilter {...defaultProps} activeCategory="Design" />);
      
      const designTab = screen.getByRole('tab', { name: 'Design' });
      fireEvent.keyDown(designTab, { key: 'ArrowRight' });
      
      expect(mockOnCategoryChange).toHaveBeenCalledWith('Travel');
    });

    it('在第一个分类使用左箭头键应该循环到最后一个分类', () => {
      render(<CategoryFilter {...defaultProps} activeCategory="All" />);
      
      const allTab = screen.getByRole('tab', { name: 'All' });
      fireEvent.keyDown(allTab, { key: 'ArrowLeft' });
      
      expect(mockOnCategoryChange).toHaveBeenCalledWith('Growth');
    });

    it('在最后一个分类使用右箭头键应该循环到第一个分类', () => {
      render(<CategoryFilter {...defaultProps} activeCategory="Growth" />);
      
      const growthTab = screen.getByRole('tab', { name: 'Growth' });
      fireEvent.keyDown(growthTab, { key: 'ArrowRight' });
      
      expect(mockOnCategoryChange).toHaveBeenCalledWith('All');
    });

    it('使用上箭头键应该切换到上一个分类', () => {
      render(<CategoryFilter {...defaultProps} activeCategory="Design" />);
      
      const designTab = screen.getByRole('tab', { name: 'Design' });
      fireEvent.keyDown(designTab, { key: 'ArrowUp' });
      
      expect(mockOnCategoryChange).toHaveBeenCalledWith('Technologies');
    });

    it('使用下箭头键应该切换到下一个分类', () => {
      render(<CategoryFilter {...defaultProps} activeCategory="Travel" />);
      
      const travelTab = screen.getByRole('tab', { name: 'Travel' });
      fireEvent.keyDown(travelTab, { key: 'ArrowDown' });
      
      expect(mockOnCategoryChange).toHaveBeenCalledWith('Growth');
    });

    it('使用Home键应该跳转到第一个分类', () => {
      render(<CategoryFilter {...defaultProps} activeCategory="Growth" />);
      
      const growthTab = screen.getByRole('tab', { name: 'Growth' });
      fireEvent.keyDown(growthTab, { key: 'Home' });
      
      expect(mockOnCategoryChange).toHaveBeenCalledWith('All');
    });

    it('使用End键应该跳转到最后一个分类', () => {
      render(<CategoryFilter {...defaultProps} activeCategory="All" />);
      
      const allTab = screen.getByRole('tab', { name: 'All' });
      fireEvent.keyDown(allTab, { key: 'End' });
      
      expect(mockOnCategoryChange).toHaveBeenCalledWith('Growth');
    });
  });

  describe('无障碍性', () => {
    it('应该具有正确的role和aria-label', () => {
      render(<CategoryFilter {...defaultProps} />);
      
      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label', '博客分类筛选');
    });

    it('激活的标签应该有tabIndex为0', () => {
      render(<CategoryFilter {...defaultProps} activeCategory="All" />);
      
      const allTab = screen.getByRole('tab', { name: 'All' });
      expect(allTab).toHaveAttribute('tabIndex', '0');
    });

    it('每个标签都应该有正确的aria-controls属性', () => {
      render(<CategoryFilter {...defaultProps} />);
      
      BLOG_CATEGORIES.forEach((category) => {
        const tab = screen.getByRole('tab', { name: category });
        expect(tab).toHaveAttribute('aria-controls', 'blog-content');
      });
    });

    it('tablist容器应该有正确的aria-orientation属性', () => {
      render(<CategoryFilter {...defaultProps} />);
      
      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('每个标签都应该有合适的title属性提供额外上下文', () => {
      render(<CategoryFilter {...defaultProps} />);
      
      BLOG_CATEGORIES.forEach((category) => {
        const tab = screen.getByRole('tab', { name: category });
        expect(tab).toHaveAttribute('title', `选择${category}分类筛选博客文章`);
      });
    });
  });

  describe('样式应用', () => {
    it('应该支持自定义className', () => {
      const customClass = 'custom-filter-class';
      render(<CategoryFilter {...defaultProps} className={customClass} />);
      
      const container = screen.getByRole('tablist');
      expect(container).toHaveClass(customClass);
    });

    it('应该在容器上应用正确的基础类名', () => {
      render(<CategoryFilter {...defaultProps} />);
      
      const container = screen.getByRole('tablist');
      expect(container).toHaveClass('flex', 'gap-3', 'overflow-x-auto');
    });
  });

  describe('分类覆盖测试', () => {
    it('应该支持所有预定义的分类类型', () => {
      BLOG_CATEGORIES.forEach((category) => {
        const { unmount } = render(<CategoryFilter {...defaultProps} activeCategory={category} />);
        
        const activeTab = screen.getByRole('tab', { name: category });
        expect(activeTab).toHaveAttribute('aria-selected', 'true');
        
        // 清理组件，避免重复元素
        unmount();
      });
    });
  });
});