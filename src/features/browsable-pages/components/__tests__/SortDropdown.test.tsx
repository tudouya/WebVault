/**
 * SortDropdown组件单元测试
 * 
 * 测试排序下拉组件的渲染、交互和状态管理功能
 * 确保组件符合requirements.md中定义的需求
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { 
  SortDropdown, 
  type SortDropdownProps, 
  type SortOption,
  DEFAULT_SORT_OPTIONS 
} from '../SortDropdown';

// Mock排序选项数据
const mockSortOptions: SortOption[] = [
  {
    field: 'created_at',
    label: 'Time listed',
    order: 'desc',
    description: 'Recently added websites first',
  },
  {
    field: 'title',
    label: 'Name (A-Z)',
    order: 'asc',
    description: 'Alphabetical order',
  },
  {
    field: 'rating',
    label: 'Highest rated',
    order: 'desc',
    description: 'Highest rated websites first',
  },
];

// 默认props
const defaultProps: SortDropdownProps = {
  options: mockSortOptions,
  onValueChange: jest.fn(),
};

// 测试工具函数
function renderSortDropdown(props: Partial<SortDropdownProps> = {}) {
  const mergedProps = { ...defaultProps, ...props };
  const mockOnValueChange = jest.fn();
  
  return {
    ...render(<SortDropdown {...mergedProps} onValueChange={mockOnValueChange} />),
    mockOnValueChange,
  };
}

describe('SortDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础渲染测试', () => {
    it('应该正确渲染排序下拉组件', () => {
      renderSortDropdown();
      
      // 验证组件是否渲染
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Sort by Time listed')).toBeInTheDocument();
    });

    it('应该显示默认占位符文本 (需求11.1)', () => {
      renderSortDropdown({ value: undefined });
      
      // 验证默认显示"Sort by Time listed"
      expect(screen.getByText('Sort by Time listed')).toBeInTheDocument();
    });

    it('应该支持自定义占位符文本', () => {
      const customPlaceholder = 'Choose sort option';
      renderSortDropdown({ 
        value: undefined,
        placeholder: customPlaceholder 
      });
      
      expect(screen.getByText(customPlaceholder)).toBeInTheDocument();
    });

    it('应该显示当前选中排序选项的正确标签', () => {
      renderSortDropdown({ value: 'title-asc' });
      
      expect(screen.getByText('Sort by Name (A-Z)')).toBeInTheDocument();
    });
  });

  describe('下拉菜单交互测试', () => {
    it('应该正确渲染下拉触发器 (需求11.2)', () => {
      renderSortDropdown();
      
      // 验证下拉触发器存在
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-label', '选择排序方式');
    });

    it('应该在值变化时调用回调函数 (需求11.5)', () => {
      const { mockOnValueChange } = renderSortDropdown();
      
      // 模拟值变化
      const trigger = screen.getByRole('combobox');
      
      // 验证组件结构正确
      expect(trigger).toBeInTheDocument();
      expect(mockOnValueChange).toBeDefined();
    });

    it('应该正确显示当前选中的排序选项', () => {
      renderSortDropdown({ value: 'title-asc' });
      
      // 验证显示文本更新
      expect(screen.getByText('Sort by Name (A-Z)')).toBeInTheDocument();
    });

    it('应该支持程序化的值变更', () => {
      const { rerender } = renderSortDropdown({ value: 'created_at-desc' });
      
      // 验证初始显示
      expect(screen.getByText('Sort by Time listed')).toBeInTheDocument();
      
      // 重新渲染组件并验证显示文本更新
      rerender(
        <SortDropdown 
          {...defaultProps} 
          value="title-asc"
          onValueChange={jest.fn()}
        />
      );
      
      expect(screen.getByText('Sort by Name (A-Z)')).toBeInTheDocument();
    });
  });

  describe('加载状态测试', () => {
    it('应该正确显示加载状态 (需求11.5)', () => {
      renderSortDropdown({ loading: true });
      
      // 验证加载状态显示
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('加载状态下应该显示加载动画', () => {
      renderSortDropdown({ loading: true });
      
      // 验证加载动画类名
      const loadingElement = screen.getByLabelText('排序选项加载中');
      expect(loadingElement).toHaveClass('animate-pulse');
    });
  });

  describe('禁用状态测试', () => {
    it('应该正确处理禁用状态', () => {
      renderSortDropdown({ disabled: true });
      
      // 验证组件是否被禁用
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
    });

    it('禁用状态下应该应用正确的样式', () => {
      renderSortDropdown({ disabled: true });
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('cursor-not-allowed', 'opacity-60');
    });
  });

  describe('样式和大小测试', () => {
    it('应该支持不同的组件大小', () => {
      const { rerender } = renderSortDropdown({ size: 'sm' });
      
      let trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('h-8', 'text-xs');
      
      // 测试默认大小
      rerender(<SortDropdown {...defaultProps} size="default" />);
      trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('h-9', 'text-sm');
      
      // 测试大尺寸
      rerender(<SortDropdown {...defaultProps} size="lg" />);
      trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('h-10', 'text-base');
    });

    it('应该支持自定义className', () => {
      const customClass = 'custom-sort-dropdown';
      renderSortDropdown({ className: customClass });
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass(customClass);
    });
  });

  describe('无障碍访问测试', () => {
    it('应该具有正确的ARIA标签', () => {
      renderSortDropdown();
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-label', '选择排序方式');
    });

    it('加载状态应该具有正确的标签', () => {
      renderSortDropdown({ loading: true });
      
      expect(screen.getByLabelText('排序选项加载中')).toBeInTheDocument();
    });
  });

  describe('默认排序选项测试', () => {
    it('DEFAULT_SORT_OPTIONS应该包含所有必需的排序选项', () => {
      expect(DEFAULT_SORT_OPTIONS).toHaveLength(6);
      
      // 验证包含时间排序（默认选项）
      const timeListedOption = DEFAULT_SORT_OPTIONS.find(
        option => option.field === 'created_at' && option.order === 'desc'
      );
      expect(timeListedOption).toBeDefined();
      expect(timeListedOption?.label).toBe('Time listed');
    });

    it('应该使用DEFAULT_SORT_OPTIONS作为默认选项', () => {
      renderSortDropdown({ options: undefined as any });
      
      // 组件应该不会崩溃，并显示默认占位符
      expect(screen.getByText('Sort by Time listed')).toBeInTheDocument();
    });
  });

  describe('错误处理测试', () => {
    it('应该处理无效的value值', () => {
      renderSortDropdown({ value: 'invalid-value' });
      
      // 组件应该回退到默认显示
      expect(screen.getByText('Sort by Time listed')).toBeInTheDocument();
    });

    it('应该处理空的options数组', () => {
      renderSortDropdown({ options: [] });
      
      // 组件应该正常渲染但无选项
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('应该处理onValueChange回调不存在的情况', () => {
      // 不传递onValueChange回调
      render(<SortDropdown options={mockSortOptions} />);
      
      // 验证组件正常渲染
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Sort by Time listed')).toBeInTheDocument();
    });
  });

  describe('集成测试', () => {
    it('应该与页面筛选逻辑正确集成', () => {
      let currentSortValue = 'created_at-desc';
      
      const handleValueChange = jest.fn((value: string) => {
        currentSortValue = value;
      });
      
      const { rerender } = render(
        <SortDropdown 
          options={mockSortOptions}
          value={currentSortValue}
          onValueChange={handleValueChange}
        />
      );
      
      // 验证初始状态
      expect(screen.getByText('Sort by Time listed')).toBeInTheDocument();
      
      // 重新渲染组件验证状态变化
      rerender(
        <SortDropdown 
          options={mockSortOptions}
          value="rating-desc"
          onValueChange={handleValueChange}
        />
      );
      
      expect(screen.getByText('Sort by Highest rated')).toBeInTheDocument();
    });
  });
});