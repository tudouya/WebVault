/**
 * TagsMultiSelect Component
 * 
 * 标签多选组件，为网站提交表单提供标签多选功能。用户可以从可用标签列表中
 * 选择多个标签，以便更好地描述和分类提交的网站。
 * 
 * 功能特性:
 * - 基于shadcn/ui Select组件的多选标签选择器
 * - "Select tags"默认占位符文本
 * - 显示已选标签数量或标签名称
 * - 支持标签添加/移除操作
 * - 集成React Hook Form表单验证
 * - 错误状态显示和验证反馈
 * - 响应式设计和无障碍访问
 * 
 * 需求引用: 3 (分类和标签选择)
 * 任务ID: 13
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, X } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * 标签选项接口
 */
export interface TagOption {
  /** 标签值 */
  value: string;
  
  /** 标签显示标签 */
  label: string;
  
  /** 标签颜色 */
  color?: string;
  
  /** 标签是否禁用 */
  disabled?: boolean;
}

/**
 * TagsMultiSelect组件属性接口
 */
export interface TagsMultiSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  /** 表单控制器实例 */
  control: Control<TFieldValues>;
  
  /** 字段名称 */
  name: TName;
  
  /** 字段标签文本 */
  label?: string;
  
  /** 占位符文本 */
  placeholder?: string;
  
  /** 帮助文本 */
  description?: string;
  
  /** 是否必填字段 */
  required?: boolean;
  
  /** 是否禁用选择器 */
  disabled?: boolean;
  
  /** 自定义样式类名 */
  className?: string;
  
  /** 可选标签列表 */
  options?: TagOption[];
  
  /** 最大选择数量 */
  maxSelection?: number;
  
  /** 标签变更回调函数 */
  onValueChange?: (value: string[]) => void;
}

// ============================================================================
// Mock Data - 模拟标签数据
// ============================================================================

const mockTags: TagOption[] = [
  { value: 'frontend', label: '前端开发', color: '#3b82f6' },
  { value: 'backend', label: '后端开发', color: '#10b981' },
  { value: 'design', label: '设计工具', color: '#f59e0b' },
  { value: 'productivity', label: '效率工具', color: '#8b5cf6' },
  { value: 'learning', label: '学习资源', color: '#ef4444' },
  { value: 'ai', label: '人工智能', color: '#06b6d4' },
  { value: 'opensource', label: '开源项目', color: '#84cc16' },
  { value: 'mobile', label: '移动开发', color: '#f97316' },
  { value: 'devops', label: 'DevOps', color: '#6366f1' },
  { value: 'database', label: '数据库', color: '#ec4899' },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 获取可用标签选项列表
 * 
 * @returns 标签选项数组
 */
const getTagOptions = (): TagOption[] => {
  return mockTags;
};

/**
 * 验证标签值数组是否有效
 * 
 * @param values - 待验证的标签值数组
 * @returns 是否为有效标签数组
 */
const isValidTags = (values: string[]): boolean => {
  const availableTags = getTagOptions().map(tag => tag.value);
  return values.every(value => availableTags.includes(value));
};

/**
 * 格式化已选标签显示文本
 * 
 * @param selectedTags - 已选标签数组
 * @param options - 标签选项列表
 * @param maxDisplay - 最大显示数量
 * @returns 格式化的显示文本
 */
const formatSelectedText = (
  selectedTags: string[], 
  options: TagOption[], 
  maxDisplay: number = 2
): string => {
  if (selectedTags.length === 0) {
    return '';
  }
  
  if (selectedTags.length <= maxDisplay) {
    const tagNames = selectedTags
      .map(value => options.find(option => option.value === value)?.label || value)
      .join(', ');
    return tagNames;
  }
  
  return `已选择 ${selectedTags.length} 个标签`;
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * TagsMultiSelect 标签多选组件
 * 
 * 提供标签多选功能的表单字段组件，支持验证和错误显示
 * 
 * @template TFieldValues - 表单数据类型
 * @template TName - 字段名称类型
 */
export const TagsMultiSelect = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label = "Tags",
  placeholder = "Select tags",
  description,
  required = false,
  disabled = false,
  className,
  options = getTagOptions(),
  maxSelection,
  onValueChange,
}: TagsMultiSelectProps<TFieldValues, TName>) => {
  // ============================================================================
  // State and Data
  // ============================================================================
  
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  // ============================================================================
  // Event Handlers
  // ============================================================================
  
  const handleValueChange = React.useCallback((values: string[]) => {
    // 触发自定义回调
    if (onValueChange) {
      onValueChange(values);
    }
  }, [onValueChange]);
  
  const toggleTag = React.useCallback((
    tagValue: string, 
    currentValues: string[], 
    onChange: (values: string[]) => void
  ) => {
    const isSelected = currentValues.includes(tagValue);
    let newValues: string[];
    
    if (isSelected) {
      // 移除标签
      newValues = currentValues.filter(value => value !== tagValue);
    } else {
      // 添加标签
      if (maxSelection && currentValues.length >= maxSelection) {
        return; // 达到最大选择数量
      }
      newValues = [...currentValues, tagValue];
    }
    
    onChange(newValues);
    handleValueChange(newValues);
  }, [maxSelection, handleValueChange]);
  
  const removeTag = React.useCallback((
    tagValue: string, 
    currentValues: string[], 
    onChange: (values: string[]) => void
  ) => {
    const newValues = currentValues.filter(value => value !== tagValue);
    onChange(newValues);
    handleValueChange(newValues);
  }, [handleValueChange]);
  
  // ============================================================================
  // Effects
  // ============================================================================
  
  // 点击外部关闭下拉菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // ============================================================================
  // Validation Rules
  // ============================================================================
  
  const validationRules = React.useMemo(() => ({
    ...(required && {
      required: {
        value: true,
        message: "请选择至少一个标签",
      },
    }),
    validate: {
      validTags: (values: string[]) => {
        if (!values || values.length === 0) {
          return required ? "请选择至少一个标签" : true;
        }
        return isValidTags(values) || "选择的标签无效，请重新选择";
      },
      maxSelection: (values: string[]) => {
        if (maxSelection && values && values.length > maxSelection) {
          return `最多只能选择 ${maxSelection} 个标签`;
        }
        return true;
      },
    },
  }), [required, maxSelection]);
  
  // ============================================================================
  // Render Component
  // ============================================================================
  
  return (
    <FormField
      control={control}
      name={name}
      rules={validationRules}
      render={({ field, fieldState }) => {
        const selectedValues = field.value || [];
        const displayText = formatSelectedText(selectedValues, options);
        
        return (
          <FormItem className={cn("space-y-2", className)}>
            {/* Label */}
            <FormLabel className="text-sm font-medium">
              {label}
              {required && (
                <span className="text-destructive ml-1" aria-label="必填字段">
                  *
                </span>
              )}
            </FormLabel>
            
            {/* Multi-Select Control */}
            <FormControl>
              <div className="relative" ref={dropdownRef}>
                {/* Trigger Button */}
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={isOpen}
                  className={cn(
                    "w-full justify-between text-left font-normal",
                    !displayText && "text-muted-foreground",
                    fieldState.error && "border-destructive focus:ring-destructive",
                  )}
                  onClick={() => setIsOpen(!isOpen)}
                  disabled={disabled}
                >
                  <span className="flex-1 truncate">
                    {displayText || placeholder}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                
                {/* Selected Tags Display */}
                {selectedValues.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedValues.map((value) => {
                      const option = options.find(opt => opt.value === value);
                      return (
                        <div
                          key={value}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                        >
                          {option?.color && (
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: option.color }}
                            />
                          )}
                          <span>{option?.label || value}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              removeTag(value, selectedValues, field.onChange);
                            }}
                            className="ml-1 hover:text-destructive"
                            disabled={disabled}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Dropdown Content */}
                {isOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-auto">
                    <div className="p-1">
                      {options.length > 0 ? (
                        options.map((option) => {
                          const isSelected = selectedValues.includes(option.value);
                          const canSelect = !maxSelection || selectedValues.length < maxSelection || isSelected;
                          
                          return (
                            <div
                              key={option.value}
                              className={cn(
                                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                                "hover:bg-accent hover:text-accent-foreground",
                                option.disabled && "pointer-events-none opacity-50",
                                !canSelect && !isSelected && "pointer-events-none opacity-50"
                              )}
                              onClick={() => {
                                if (!option.disabled && canSelect) {
                                  toggleTag(option.value, selectedValues, field.onChange);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                {option.color && (
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: option.color }}
                                  />
                                )}
                                <span>{option.label}</span>
                              </div>
                              
                              {isSelected && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          暂无可用标签
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </FormControl>
            
            {/* Description */}
            {description && (
              <p 
                id={`${name}-description`}
                className="text-xs text-muted-foreground"
              >
                {description}
              </p>
            )}
            
            {/* Max Selection Hint */}
            {maxSelection && (
              <p className="text-xs text-muted-foreground">
                最多可选择 {maxSelection} 个标签
              </p>
            )}
            
            {/* Error Message */}
            <FormMessage className="text-xs" />
          </FormItem>
        );
      }}
    />
  );
};

// ============================================================================
// Component Display Name
// ============================================================================

TagsMultiSelect.displayName = 'TagsMultiSelect';

// ============================================================================
// Default Export
// ============================================================================

export default TagsMultiSelect;

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * 导出工具函数以供外部使用
 */
export const TagsMultiSelectUtils = {
  getTagOptions,
  isValidTags,
  formatSelectedText,
} as const;