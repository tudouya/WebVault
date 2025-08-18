/**
 * CategorySelect Component
 * 
 * 分类选择组件，为网站提交表单提供分类选择功能。用户可以从可用分类列表中
 * 选择合适的分类，以便其他用户更容易发现网站。
 * 
 * 功能特性:
 * - 基于shadcn/ui Select组件的分类下拉选择器
 * - "Select categories"默认占位符文本
 * - 集成React Hook Form表单验证
 * - 错误状态显示和验证反馈
 * - 支持必填字段标识
 * - 响应式设计和无障碍访问
 * 
 * 需求引用: 3 (分类和标签选择)
 * 任务ID: 12
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { getAllMockCategories } from '../../websites/data/mockWebsites';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * CategorySelect组件属性接口
 */
export interface CategorySelectProps<
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
  
  /** 分类变更回调函数 */
  onValueChange?: (value: string) => void;
}

/**
 * 分类选项接口
 */
export interface CategoryOption {
  /** 分类值 */
  value: string;
  
  /** 分类显示标签 */
  label: string;
  
  /** 分类是否禁用 */
  disabled?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 获取可用分类选项列表
 * 从模拟数据中提取分类并转换为选项格式
 * 
 * @returns 分类选项数组
 */
const getCategoryOptions = (): CategoryOption[] => {
  const categories = getAllMockCategories();
  
  return categories.map(category => ({
    value: category,
    label: category,
    disabled: false,
  }));
};

/**
 * 验证分类值是否有效
 * 
 * @param value - 待验证的分类值
 * @returns 是否为有效分类
 */
const isValidCategory = (value: string): boolean => {
  const availableCategories = getAllMockCategories();
  return availableCategories.includes(value);
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * CategorySelect 分类选择组件
 * 
 * 提供分类选择功能的表单字段组件，支持验证和错误显示
 * 
 * @template TFieldValues - 表单数据类型
 * @template TName - 字段名称类型
 */
export const CategorySelect = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label = "Categories",
  placeholder = "Select categories",
  description,
  required = false,
  disabled = false,
  className,
  onValueChange,
}: CategorySelectProps<TFieldValues, TName>) => {
  // ============================================================================
  // State and Data
  // ============================================================================
  
  const categoryOptions = React.useMemo(() => getCategoryOptions(), []);
  
  // ============================================================================
  // Event Handlers
  // ============================================================================
  
  const handleValueChange = React.useCallback((value: string) => {
    // 触发自定义回调
    if (onValueChange) {
      onValueChange(value);
    }
  }, [onValueChange]);
  
  // ============================================================================
  // Validation Rules
  // ============================================================================
  
  const validationRules = React.useMemo(() => ({
    ...(required && {
      required: {
        value: true,
        message: "请选择网站分类",
      },
    }),
    validate: {
      validCategory: (value: string) => {
        if (!value) return required ? "请选择网站分类" : true;
        return isValidCategory(value) || "选择的分类无效，请重新选择";
      },
    },
  }), [required]);
  
  // ============================================================================
  // Render Component
  // ============================================================================
  
  return (
    <FormField
      control={control}
      name={name}
      rules={validationRules}
      render={({ field, fieldState }) => (
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
          
          {/* Select Control */}
          <FormControl>
            <Select
              value={field.value || ""}
              onValueChange={(value) => {
                field.onChange(value);
                handleValueChange(value);
              }}
              disabled={disabled}
            >
              <SelectTrigger
                className={cn(
                  "w-full",
                  fieldState.error && "border-destructive focus:ring-destructive",
                )}
                aria-describedby={description ? `${name}-description` : undefined}
                aria-invalid={!!fieldState.error}
              >
                <SelectValue 
                  placeholder={placeholder}
                  className={cn(
                    !field.value && "text-muted-foreground"
                  )}
                />
              </SelectTrigger>
              
              <SelectContent>
                {categoryOptions.length > 0 ? (
                  categoryOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className="cursor-pointer"
                    >
                      {option.label}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem
                    value=""
                    disabled
                    className="text-muted-foreground cursor-not-allowed"
                  >
                    暂无可用分类
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
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
          
          {/* Error Message */}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
};

// ============================================================================
// Component Display Name
// ============================================================================

CategorySelect.displayName = 'CategorySelect';

// ============================================================================
// Default Export
// ============================================================================

export default CategorySelect;

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * 导出工具函数以供外部使用
 */
export const CategorySelectUtils = {
  getCategoryOptions,
  isValidCategory,
} as const;