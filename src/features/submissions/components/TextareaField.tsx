'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export interface TextareaFieldConfig {
  /** Maximum character limit */
  maxLength?: number
  /** Minimum character limit */
  minLength?: number
  /** Default rows for the textarea */
  rows?: number
  /** Show character counter */
  showCounter?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Help text to display */
  description?: string
  /** Whether the field is required */
  required?: boolean
}

export interface TextareaFieldProps 
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Field label */
  label?: string
  /** Field configuration */
  config?: TextareaFieldConfig
  /** Current value */
  value?: string
  /** Value change handler */
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  /** Error message */
  error?: string
}

// Predefined configurations for common use cases
export const TEXTAREA_CONFIGS = {
  description: {
    maxLength: 500,
    minLength: 10,
    rows: 3,
    showCounter: true,
    placeholder: "Enter a brief description of your product",
    description: "简短描述网站的主要功能，帮助用户了解网站价值",
    required: true,
  },
  introduction: {
    maxLength: 5000,
    minLength: 50,
    rows: 8,
    showCounter: true,
    placeholder: "Enter your content here...",
    description: "详细介绍网站内容，支持 Markdown 格式",
    required: false,
  },
  notes: {
    maxLength: 1000,
    rows: 4,
    showCounter: true,
    placeholder: "添加备注信息（可选）...",
    description: "为管理员提供额外的说明信息",
    required: false,
  },
} as const

export type TextareaConfigType = keyof typeof TEXTAREA_CONFIGS

const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ 
    className,
    label,
    config = {},
    value = "",
    onChange,
    error,
    disabled,
    ...props 
  }, ref) => {
    const {
      maxLength,
      minLength,
      rows = 4,
      showCounter = true,
      placeholder,
      description,
      required = false,
    } = config

    // Character count calculations
    const currentLength = value.length
    const isOverLimit = maxLength ? currentLength > maxLength : false
    const isUnderMinimum = minLength ? currentLength < minLength : false

    // Counter text and styling
    const getCounterText = () => {
      if (!showCounter) return null
      
      if (maxLength) {
        return `${currentLength}/${maxLength}`
      }
      
      if (minLength) {
        return `最少 ${minLength} 字符 (当前 ${currentLength})`
      }
      
      return `${currentLength} 字符`
    }

    const getCounterClassName = () => {
      if (isOverLimit) return "text-destructive"
      if (isUnderMinimum && currentLength > 0) return "text-amber-600 dark:text-amber-400"
      return "text-muted-foreground"
    }

    return (
      <FormItem>
        {label && (
          <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
            {label}
          </FormLabel>
        )}
        <FormControl>
          <div className="space-y-2">
            <Textarea
              ref={ref}
              className={cn(
                "resize-none",
                isOverLimit && "border-destructive focus-visible:ring-destructive",
                isUnderMinimum && currentLength > 0 && "border-amber-500 focus-visible:ring-amber-500",
                className
              )}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              disabled={disabled}
              rows={rows}
              maxLength={maxLength}
              aria-invalid={isOverLimit || !!error}
              aria-describedby={
                description ? `${props.id}-description` : undefined
              }
              {...props}
            />
            
            {/* Counter and validation info */}
            {showCounter && (
              <div className="flex justify-between items-center text-xs">
                <div className="space-y-1">
                  {isUnderMinimum && currentLength > 0 && (
                    <p className="text-amber-600 dark:text-amber-400">
                      还需要至少 {minLength - currentLength} 个字符
                    </p>
                  )}
                  {isOverLimit && (
                    <p className="text-destructive">
                      超出 {currentLength - maxLength} 个字符
                    </p>
                  )}
                </div>
                <span className={getCounterClassName()}>
                  {getCounterText()}
                </span>
              </div>
            )}
          </div>
        </FormControl>
        
        {description && !error && (
          <FormDescription id={`${props.id}-description`}>
            {description}
          </FormDescription>
        )}
        
        {error && <FormMessage>{error}</FormMessage>}
      </FormItem>
    )
  }
)

TextareaField.displayName = "TextareaField"

// Convenience component for predefined configurations
export const TextareaFieldWithConfig = React.forwardRef<
  HTMLTextAreaElement,
  Omit<TextareaFieldProps, 'config'> & { 
    configType: TextareaConfigType
  }
>(({ configType, ...props }, ref) => {
  const config = TEXTAREA_CONFIGS[configType]
  
  return (
    <TextareaField
      ref={ref}
      config={config}
      {...props}
    />
  )
})

TextareaFieldWithConfig.displayName = "TextareaFieldWithConfig"

export { TextareaField }