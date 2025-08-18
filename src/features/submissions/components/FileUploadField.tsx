/**
 * FileUploadField Component
 * 
 * 基础文件上传组件，支持点击选择文件、拖拽上传、文件格式和大小验证、
 * 显示文件选择状态和错误信息。
 * 
 * 功能特性:
 * - 点击上传文件
 * - 拖拽上传文件 (支持拖拽区域视觉反馈)
 * - 文件格式和大小验证 (PNG/JPEG, 最大5MB)
 * - 文件预览缩略图
 * - 错误状态显示
 * - 基于shadcn/ui Input组件扩展
 * 
 * 需求引用: 6, 11 (文件上传功能, 拖拽上传)
 * 任务ID: 9, 10
 * 
 * @version 1.1.0
 * @created 2025-08-18
 * @updated 2025-08-18 (添加拖拽功能)
 */

import * as React from 'react';
const { useRef, useState, useCallback, useEffect } = React;
import { Upload, X, AlertCircle, Image, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileUploadState,
  FileValidationError,
  SupportedFileType,
  DEFAULT_FILE_VALIDATION_CONFIG,
  FILE_UPLOAD_ERROR_MESSAGES,
  isSupportedFileType,
  isValidFileSize,
  formatFileSize,
  generatePreviewUrl,
  revokePreviewUrl,
  createDefaultFileUploadState,
} from '../types/file-upload';

// ============================================================================
// Component Props Interface
// ============================================================================

export interface FileUploadFieldProps {
  /** 字段名称，用于表单 */
  name: string;
  
  /** 字段标签 */
  label: string;
  
  /** 占位符文本 */
  placeholder?: string;
  
  /** 帮助文本 */
  helperText?: string;
  
  /** 是否必填 */
  required?: boolean;
  
  /** 是否禁用 */
  disabled?: boolean;
  
  /** 错误信息 */
  error?: string;
  
  /** 文件变化回调 */
  onChange?: (file: File | null, preview: string | null) => void;
  
  /** 验证错误回调 */
  onValidationError?: (error: FileValidationError, message: string) => void;
  
  /** 自定义样式类名 */
  className?: string;
  
  /** 接受的文件类型 */
  accept?: string;
  
  /** 最大文件大小 (字节) */
  maxSize?: number;
}

// ============================================================================
// Main Component
// ============================================================================

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  name,
  label,
  placeholder = "点击选择图片文件",
  helperText = "支持PNG或JPEG格式，最大5MB",
  required = false,
  disabled = false,
  error,
  onChange,
  onValidationError,
  className,
  accept = ".png,.jpg,.jpeg,image/png,image/jpeg",
  maxSize = DEFAULT_FILE_VALIDATION_CONFIG.maxSize,
}) => {
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [uploadState, setUploadState] = useState<FileUploadState>(
    createDefaultFileUploadState()
  );
  
  // 拖拽状态管理
  const [isDragActive, setIsDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ============================================================================
  // File Validation Logic
  // ============================================================================
  
  const validateFile = useCallback((file: File): {
    isValid: boolean;
    error?: FileValidationError;
    message?: string;
  } => {
    // 检查文件类型
    if (!isSupportedFileType(file.type)) {
      return {
        isValid: false,
        error: 'INVALID_FILE_TYPE',
        message: FILE_UPLOAD_ERROR_MESSAGES.INVALID_FILE_TYPE,
      };
    }
    
    // 检查文件大小
    if (!isValidFileSize(file.size, { ...DEFAULT_FILE_VALIDATION_CONFIG, maxSize })) {
      return {
        isValid: false,
        error: 'FILE_TOO_LARGE',
        message: FILE_UPLOAD_ERROR_MESSAGES.FILE_TOO_LARGE,
      };
    }
    
    return { isValid: true };
  }, [maxSize]);
  
  // ============================================================================
  // File Handling Logic
  // ============================================================================
  
  const handleFileSelect = useCallback((file: File) => {
    // 清理之前的预览URL
    if (uploadState.preview) {
      revokePreviewUrl(uploadState.preview);
    }
    
    // 验证文件
    const validation = validateFile(file);
    
    if (!validation.isValid) {
      const newState: FileUploadState = {
        ...createDefaultFileUploadState(),
        status: 'error',
        error: validation.error || 'UNKNOWN_ERROR',
        errorMessage: validation.message || FILE_UPLOAD_ERROR_MESSAGES.UNKNOWN_ERROR,
      };
      
      setUploadState(newState);
      
      // 触发验证错误回调
      if (onValidationError && validation.error) {
        onValidationError(validation.error, validation.message || '');
      }
      
      // 通知父组件
      if (onChange) {
        onChange(null, null);
      }
      
      return;
    }
    
    // 生成预览URL
    const previewUrl = generatePreviewUrl(file);
    
    // 更新状态
    const newState: FileUploadState = {
      ...createDefaultFileUploadState(),
      file,
      preview: previewUrl,
      status: 'completed',
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified),
      },
    };
    
    setUploadState(newState);
    
    // 通知父组件
    if (onChange) {
      onChange(file, previewUrl);
    }
  }, [uploadState.preview, validateFile, onChange, onValidationError]);
  
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  
  const handleRemoveFile = useCallback(() => {
    // 清理预览URL
    if (uploadState.preview) {
      revokePreviewUrl(uploadState.preview);
    }
    
    // 重置状态
    setUploadState(createDefaultFileUploadState());
    
    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // 通知父组件
    if (onChange) {
      onChange(null, null);
    }
  }, [uploadState.preview, onChange]);
  
  const handleUploadAreaClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);
  
  // ============================================================================
  // Drag & Drop Event Handlers
  // ============================================================================
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    // 检查是否包含文件
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragActive(true);
    }
  }, [disabled]);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    // 设置拖拽效果
    e.dataTransfer.dropEffect = 'copy';
  }, [disabled]);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    // 只有当鼠标真正离开拖拽区域时才重置状态
    // 检查是否离开了当前元素的边界
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragActive(false);
    }
  }, [disabled]);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragActive(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    
    // 只处理第一个文件
    const file = files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [disabled, handleFileSelect]);
  
  // ============================================================================
  // Cleanup Effect
  // ============================================================================
  
  useEffect(() => {
    return () => {
      // 组件卸载时清理预览URL
      if (uploadState.preview) {
        revokePreviewUrl(uploadState.preview);
      }
    };
  }, [uploadState.preview]);
  
  // ============================================================================
  // Render Helpers
  // ============================================================================
  
  const getDisplayError = () => {
    return error || uploadState.errorMessage;
  };
  
  const hasError = () => {
    return !!(error || uploadState.error);
  };
  
  const hasFile = () => {
    return uploadState.file !== null;
  };
  
  const getFileDisplayName = () => {
    return uploadState.metadata?.name || '';
  };
  
  const getFileDisplaySize = () => {
    return uploadState.metadata ? formatFileSize(uploadState.metadata.size) : '';
  };
  
  // ============================================================================
  // Render Component
  // ============================================================================
  
  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-4 sm:p-6 min-h-[120px] sm:min-h-[140px] transition-colors cursor-pointer",
          "hover:border-primary hover:bg-primary/5",
          "focus-within:border-primary focus-within:bg-primary/5",
          hasError() && "border-destructive bg-destructive/5",
          hasFile() && "border-solid border-border bg-muted/30",
          disabled && "cursor-not-allowed opacity-60",
          // 拖拽状态样式
          isDragActive && !disabled && "border-primary bg-primary/10 border-solid"
        )}
        onClick={handleUploadAreaClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hidden File Input */}
        <Input
          ref={fileInputRef}
          id={name}
          name={name}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
          aria-describedby={helperText ? `${name}-help` : undefined}
        />
        
        {/* Upload Content */}
        {hasFile() && uploadState.preview ? (
          // File Preview State
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Preview Image */}
            <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted border">
              <img
                src={uploadState.preview}
                alt={`预览: ${getFileDisplayName()}`}
                className="w-full h-full object-cover"
                onError={() => {
                  // 如果预览图加载失败，显示文件图标
                  console.warn('Preview image failed to load');
                }}
              />
            </div>
            
            {/* File Info */}
            <div className="flex-grow min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {getFileDisplayName()}
              </p>
              <p className="text-xs text-muted-foreground">
                {getFileDisplaySize()}
              </p>
            </div>
            
            {/* Remove Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              disabled={disabled}
              className={cn(
                "flex-shrink-0 p-1 sm:p-2 rounded-full hover:bg-destructive/10 min-h-[44px] min-w-[44px] flex items-center justify-center",
                "text-muted-foreground hover:text-destructive transition-colors",
                disabled && "cursor-not-allowed opacity-50"
              )}
              aria-label="移除文件"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // Empty State
          <div className="text-center">
            <div className="flex justify-center mb-3">
              {hasError() ? (
                <AlertCircle className="w-8 h-8 text-destructive" />
              ) : (
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
              )}
            </div>
            
            <p className={cn(
              "text-sm font-medium mb-1",
              hasError() ? "text-destructive" : "text-foreground"
            )}>
              {hasError() ? "文件选择失败" : 
               isDragActive ? "松开鼠标放置文件" : 
               placeholder || "点击选择或拖拽图片文件"}
            </p>
            
            <p className="text-xs text-muted-foreground">
              {helperText}
            </p>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {getDisplayError() && (
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{getDisplayError()}</span>
        </div>
      )}
      
      {/* Helper Text */}
      {helperText && !getDisplayError() && (
        <p id={`${name}-help`} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
};

FileUploadField.displayName = 'FileUploadField';

export default FileUploadField;