/**
 * FilterTabs组件单元测试
 * 
 * 测试筛选标签组件的各种功能和交互状态
 * 确保组件符合无障碍访问标准和设计要求
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FilterTabs, type FilterTabItem } from '../FilterTabs';

// 测试用的筛选标签数据
const mockCategoryItems: FilterTabItem[] = [
  {
    id: 'tech',
    label: 'Technology',
    value: 'technology',
    count: 15,
  },
  {
    id: 'design',
    label: 'Design',
    value: 'design',
    count: 8,
  },
  {
    id: 'business',
    label: 'Business',
    value: 'business',
    count: 12,
  },
  {
    id: 'disabled-cat',
    label: 'Disabled Category',
    value: 'disabled',
    count: 0,
    disabled: true,
  },
];

const mockTagItems: FilterTabItem[] = [
  {
    id: 'react',
    label: 'React',
    value: 'react',
    count: 25,
  },
  {
    id: 'nextjs',
    label: 'Next.js',
    value: 'nextjs',
    count: 18,
  },
];

describe('FilterTabs组件', () => {
  describe('基础渲染', () => {
    it('应该正确渲染筛选标签', () => {
      render(
        <FilterTabs
          items={mockCategoryItems}
          filterType="category"
        />
      );

      // 检查自动添加的"All Categories"选项
      expect(screen.getByRole('tab', { name: /all categories/i })).toBeInTheDocument();
      
      // 检查传入的标签项
      expect(screen.getByRole('tab', { name: /technology/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /design/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /business/i })).toBeInTheDocument();
    });

    it('应该根据filterType显示正确的"All"选项标签', () => {
      const { rerender } = render(
        <FilterTabs
          items={mockTagItems}
          filterType="tag"
        />
      );

      expect(screen.getByRole('tab', { name: /all tags/i })).toBeInTheDocument();

      rerender(
        <FilterTabs
          items={mockTagItems}
          filterType="collection"
        />
      );

      expect(screen.getByRole('tab', { name: /all collections/i })).toBeInTheDocument();
    });

    it('应该正确显示数量统计', () => {
      render(
        <FilterTabs
          items={mockCategoryItems}
          showCounts={true}
          filterType="category"
        />
      );

      // 检查数量统计是否显示
      expect(screen.getByText('15')).toBeInTheDocument(); // Technology count
      expect(screen.getByText('8')).toBeInTheDocument();  // Design count
      expect(screen.getByText('12')).toBeInTheDocument(); // Business count
    });
  });

  describe('选中状态', () => {
    it('应该正确显示默认选中的"All"选项', () => {
      render(
        <FilterTabs
          items={mockCategoryItems}
          filterType="category"
        />
      );

      const allTab = screen.getByRole('tab', { name: /all categories/i });
      expect(allTab).toHaveAttribute('aria-selected', 'true');
    });

    it('应该正确显示指定的选中项', () => {
      render(
        <FilterTabs
          items={mockCategoryItems}
          selectedValue="technology"
          filterType="category"
        />
      );

      const techTab = screen.getByRole('tab', { name: /technology/i });
      expect(techTab).toHaveAttribute('aria-selected', 'true');
      
      const allTab = screen.getByRole('tab', { name: /all categories/i });
      expect(allTab).toHaveAttribute('aria-selected', 'false');
    });

    it('应该在选中状态下应用正确的样式类', () => {
      render(
        <FilterTabs
          items={mockCategoryItems}
          selectedValue="design"
          filterType="category"
        />
      );

      const selectedTab = screen.getByRole('tab', { name: /design/i });
      expect(selectedTab).toHaveClass('bg-[#8B5CF6]');
      expect(selectedTab).toHaveClass('text-white');
    });
  });

  describe('交互功能', () => {
    it('应该响应标签点击事件', () => {
      const mockOnChange = jest.fn();
      
      render(
        <FilterTabs
          items={mockCategoryItems}
          onTabChange={mockOnChange}
          filterType="category"
        />
      );

      const techTab = screen.getByRole('tab', { name: /technology/i });
      fireEvent.click(techTab);

      expect(mockOnChange).toHaveBeenCalledWith('technology', expect.objectContaining({
        id: 'tech',
        label: 'Technology',
        value: 'technology',
      }));
    });

    it('应该支持点击"All"选项', () => {
      const mockOnChange = jest.fn();
      
      render(
        <FilterTabs
          items={mockCategoryItems}
          selectedValue="technology"
          onTabChange={mockOnChange}
          filterType="category"
        />
      );

      const allTab = screen.getByRole('tab', { name: /all categories/i });
      fireEvent.click(allTab);

      expect(mockOnChange).toHaveBeenCalledWith('', expect.objectContaining({
        id: 'all',
        label: 'All Categories',
        value: '',
        isDefault: true,
      }));
    });

    it('应该支持取消选中功能', () => {
      const mockOnChange = jest.fn();
      
      render(
        <FilterTabs
          items={mockCategoryItems}
          selectedValue="technology"
          onTabChange={mockOnChange}
          allowDeselect={true}
          filterType="category"
        />
      );

      const selectedTab = screen.getByRole('tab', { name: /technology/i });
      fireEvent.click(selectedTab);

      expect(mockOnChange).toHaveBeenCalledWith('', expect.objectContaining({
        id: 'all',
        label: 'All Categories',
        value: '',
        isDefault: true,
      }));
    });
  });

  describe('禁用状态', () => {
    it('应该正确处理禁用的标签项', () => {
      render(
        <FilterTabs
          items={mockCategoryItems}
          filterType="category"
        />
      );

      const disabledTab = screen.getByRole('tab', { name: /disabled category/i });
      expect(disabledTab).toBeDisabled();
      expect(disabledTab).toHaveClass('cursor-not-allowed');
    });

    it('不应该响应禁用标签的点击事件', () => {
      const mockOnChange = jest.fn();
      
      render(
        <FilterTabs
          items={mockCategoryItems}
          onTabChange={mockOnChange}
          filterType="category"
        />
      );

      const disabledTab = screen.getByRole('tab', { name: /disabled category/i });
      fireEvent.click(disabledTab);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('加载状态', () => {
    it('应该在加载时显示骨架屏', () => {
      render(
        <FilterTabs
          items={[]}
          loading={true}
          filterType="category"
        />
      );

      // 检查是否有骨架屏元素
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(4);

      // 检查加载标签文本
      expect(screen.getByLabelText('筛选标签加载中')).toBeInTheDocument();
    });

    it('不应该在加载状态下响应点击事件', () => {
      const mockOnChange = jest.fn();
      
      render(
        <FilterTabs
          items={mockCategoryItems}
          onTabChange={mockOnChange}
          loading={true}
          filterType="category"
        />
      );

      // 加载状态下点击不应该触发回调
      const skeletons = document.querySelectorAll('.animate-pulse');
      if (skeletons.length > 0) {
        fireEvent.click(skeletons[0]);
        expect(mockOnChange).not.toHaveBeenCalled();
      }
    });
  });

  describe('无障碍访问', () => {
    it('应该包含正确的ARIA属性', () => {
      render(
        <FilterTabs
          items={mockCategoryItems}
          selectedValue="technology"
          filterType="category"
        />
      );

      // 检查tablist role
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      expect(tablist).toHaveAttribute('aria-label', 'category 筛选标签');

      // 检查tab role和aria-selected
      const selectedTab = screen.getByRole('tab', { name: /technology/i });
      expect(selectedTab).toHaveAttribute('aria-selected', 'true');
      expect(selectedTab).toHaveAttribute('aria-controls', 'category-content');
      
      const unselectedTab = screen.getByRole('tab', { name: /design/i });
      expect(unselectedTab).toHaveAttribute('aria-selected', 'false');
    });

    it('应该支持键盘导航', () => {
      const mockOnChange = jest.fn();
      
      render(
        <FilterTabs
          items={mockCategoryItems}
          onTabChange={mockOnChange}
          filterType="category"
        />
      );

      const techTab = screen.getByRole('tab', { name: /technology/i });
      
      // 测试Enter键
      fireEvent.keyDown(techTab, { key: 'Enter', code: 'Enter' });
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      
      mockOnChange.mockClear();
      
      // 测试Space键
      fireEvent.keyDown(techTab, { key: ' ', code: 'Space' });
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('样式和布局', () => {
    it('应该应用自定义className', () => {
      render(
        <FilterTabs
          items={mockCategoryItems}
          className="custom-filter-tabs"
          filterType="category"
        />
      );

      const container = screen.getByRole('tablist');
      expect(container).toHaveClass('custom-filter-tabs');
    });

    it('应该正确显示悬停效果样式类', () => {
      render(
        <FilterTabs
          items={mockCategoryItems}
          filterType="category"
        />
      );

      const unselectedTab = screen.getByRole('tab', { name: /technology/i });
      expect(unselectedTab).toHaveClass('hover:scale-[1.02]');
    });
  });
});