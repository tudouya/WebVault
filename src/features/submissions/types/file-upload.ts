/**
 * File Upload Type Definitions
 * 
 * 为WebVault网站提交页面文件上传功能提供完整的类型支持。
 * 包含文件状态管理、验证类型、进度跟踪等核心类型定义。
 * 
 * 需求引用: 6 (文件上传功能)
 * 技术栈: TypeScript + React Hook Form + Zod
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

// ============================================================================
// Core File Upload Types
// ============================================================================

/**
 * 支持的文件类型枚举
 * 
 * 根据需求仅支持PNG和JPEG格式，最大5MB限制
 */
export type SupportedFileType = 'image/png' | 'image/jpeg' | 'image/jpg';

/**
 * 文件上传区域类型
 * 
 * 区分Icon和Image两种上传区域，用于不同的处理逻辑
 */
export type FileUploadArea = 'icon' | 'image';

/**
 * 文件验证错误类型
 * 
 * 涵盖文件上传过程中可能出现的各种错误情况
 */
export type FileValidationError = 
  | 'FILE_TOO_LARGE'           // 文件超过5MB限制
  | 'INVALID_FILE_TYPE'        // 不支持的文件格式
  | 'UPLOAD_FAILED'            // 上传过程失败
  | 'NETWORK_ERROR'            // 网络连接错误
  | 'SERVER_ERROR'             // 服务器处理错误
  | 'FILE_CORRUPTED'           // 文件损坏或格式错误
  | 'DUPLICATE_FILE'           // 重复文件上传
  | 'PERMISSION_DENIED'        // 权限不足
  | 'QUOTA_EXCEEDED'           // 存储配额超限
  | 'UNKNOWN_ERROR';           // 未知错误

/**
 * 文件上传状态
 * 
 * 完整的文件上传生命周期状态管理
 */
export type FileUploadStatus = 
  | 'idle'                     // 初始状态，等待用户操作
  | 'selecting'                // 用户正在选择文件
  | 'validating'               // 正在验证文件
  | 'uploading'                // 正在上传
  | 'processing'               // 服务端正在处理
  | 'completed'                // 上传完成
  | 'error'                    // 上传失败
  | 'cancelled';               // 用户取消上传

// ============================================================================
// File Upload State Management
// ============================================================================

/**
 * 文件上传状态接口
 * 
 * 管理单个文件的完整上传状态，包括文件信息、进度、预览等
 */
export interface FileUploadState {
  /** 选中的文件对象 */
  file: File | null;
  
  /** 文件预览URL (blob URL或base64) */
  preview: string | null;
  
  /** 当前上传状态 */
  status: FileUploadStatus;
  
  /** 上传进度 (0-100) */
  progress: number;
  
  /** 错误信息 */
  error: FileValidationError | null;
  
  /** 错误详细信息 (用户友好的描述) */
  errorMessage: string | null;
  
  /** 上传完成后的文件URL */
  uploadedUrl: string | null;
  
  /** 文件元数据 */
  metadata: {
    /** 文件名称 */
    name: string;
    /** 文件大小 (字节) */
    size: number;
    /** 文件类型 */
    type: string;
    /** 最后修改时间 */
    lastModified: Date;
    /** 图片尺寸 (如果是图片) */
    dimensions?: {
      width: number;
      height: number;
    };
  } | null;
  
  /** 上传开始时间 */
  uploadStartTime: Date | null;
  
  /** 上传完成时间 */
  uploadEndTime: Date | null;
  
  /** 是否可以重试 */
  canRetry: boolean;
  
  /** 重试次数 */
  retryCount: number;
}

/**
 * 文件上传进度信息
 * 
 * 详细的上传进度跟踪，支持速度计算和时间估算
 */
export interface UploadProgress {
  /** 已上传字节数 */
  loaded: number;
  
  /** 文件总字节数 */
  total: number;
  
  /** 上传百分比 (0-100) */
  percentage: number;
  
  /** 上传速度 (字节/秒) */
  speed: number;
  
  /** 剩余时间估算 (秒) */
  remainingTime: number;
  
  /** 上传开始时间 */
  startTime: Date;
  
  /** 当前时间 */
  currentTime: Date;
}

// ============================================================================
// File Validation Types
// ============================================================================

/**
 * 文件验证配置
 * 
 * 定义文件上传的验证规则和限制
 */
export interface FileValidationConfig {
  /** 支持的文件类型 */
  allowedTypes: SupportedFileType[];
  
  /** 最大文件大小 (字节) */
  maxSize: number;
  
  /** 最小文件大小 (字节) */
  minSize: number;
  
  /** 最大图片宽度 (像素) */
  maxWidth?: number;
  
  /** 最大图片高度 (像素) */
  maxHeight?: number;
  
  /** 最小图片宽度 (像素) */
  minWidth?: number;
  
  /** 最小图片高度 (像素) */
  minHeight?: number;
  
  /** 是否必须为正方形 */
  requireSquare?: boolean;
  
  /** 允许的宽高比范围 */
  aspectRatioRange?: {
    min: number;
    max: number;
  };
}

/**
 * 文件验证结果
 * 
 * 详细的文件验证反馈，包含错误和警告信息
 */
export interface FileValidationResult {
  /** 验证是否通过 */
  isValid: boolean;
  
  /** 错误列表 */
  errors: {
    type: FileValidationError;
    message: string;
    field?: 'size' | 'type' | 'dimensions' | 'content';
  }[];
  
  /** 警告列表 (不阻止上传但需要用户注意) */
  warnings: {
    type: string;
    message: string;
  }[];
  
  /** 文件信息摘要 */
  fileInfo: {
    name: string;
    size: number;
    type: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

// ============================================================================
// Upload Management Types
// ============================================================================

/**
 * 文件上传操作接口
 * 
 * 定义文件上传过程中可执行的操作
 */
export interface FileUploadActions {
  /** 选择文件 */
  selectFile: (file: File, area: FileUploadArea) => void;
  
  /** 移除文件 */
  removeFile: (area: FileUploadArea) => void;
  
  /** 开始上传 */
  startUpload: (area: FileUploadArea) => Promise<void>;
  
  /** 取消上传 */
  cancelUpload: (area: FileUploadArea) => void;
  
  /** 重试上传 */
  retryUpload: (area: FileUploadArea) => Promise<void>;
  
  /** 清除错误 */
  clearError: (area: FileUploadArea) => void;
  
  /** 重置状态 */
  resetState: (area: FileUploadArea) => void;
  
  /** 批量上传 */
  uploadAll: () => Promise<void>;
}

/**
 * 拖拽状态管理
 * 
 * 管理拖拽上传的视觉反馈状态
 */
export interface DragDropState {
  /** 是否正在拖拽中 */
  isDragging: boolean;
  
  /** 是否拖拽到上传区域上方 */
  isDragOver: boolean;
  
  /** 拖拽的文件数量 */
  draggedFileCount: number;
  
  /** 拖拽的文件是否有效 */
  hasValidFiles: boolean;
  
  /** 拖拽区域ID */
  activeDropZone: FileUploadArea | null;
}

// ============================================================================
// Upload Response Types
// ============================================================================

/**
 * 文件上传响应接口
 * 
 * 服务端文件上传操作的响应格式
 */
export interface FileUploadResponse {
  /** 操作是否成功 */
  success: boolean;
  
  /** 上传后的文件URL */
  url?: string;
  
  /** 文件唯一标识 */
  fileId?: string;
  
  /** 错误信息 */
  error?: {
    type: FileValidationError;
    message: string;
    details?: string;
  };
  
  /** 文件元数据 */
  metadata?: {
    name: string;
    size: number;
    type: string;
    dimensions?: {
      width: number;
      height: number;
    };
    uploadedAt: string;
  };
  
  /** 服务端处理信息 */
  processing?: {
    /** 是否进行了压缩 */
    compressed: boolean;
    /** 是否进行了格式转换 */
    converted: boolean;
    /** 原始文件大小 */
    originalSize: number;
    /** 处理后文件大小 */
    processedSize: number;
  };
}

/**
 * 批量上传响应接口
 */
export interface BatchUploadResponse {
  /** 整体操作是否成功 */
  success: boolean;
  
  /** 各文件上传结果 */
  results: {
    area: FileUploadArea;
    response: FileUploadResponse;
  }[];
  
  /** 成功上传数量 */
  successCount: number;
  
  /** 失败上传数量 */
  failedCount: number;
  
  /** 整体错误信息 */
  error?: string;
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * 上传区域UI状态
 * 
 * 管理上传组件的UI状态和用户交互
 */
export interface UploadAreaState {
  /** 是否显示预览 */
  showPreview: boolean;
  
  /** 是否显示进度条 */
  showProgress: boolean;
  
  /** 是否显示错误状态 */
  showError: boolean;
  
  /** 是否可以点击 */
  isClickable: boolean;
  
  /** 是否禁用状态 */
  isDisabled: boolean;
  
  /** 是否处于加载状态 */
  isLoading: boolean;
  
  /** 动画状态 */
  animationState: 'idle' | 'hover' | 'active' | 'success' | 'error';
  
  /** 提示文本 */
  hintText: string;
  
  /** 错误提示文本 */
  errorText: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 文件上传默认配置常量
 */
export const DEFAULT_FILE_VALIDATION_CONFIG: FileValidationConfig = {
  allowedTypes: ['image/png', 'image/jpeg', 'image/jpg'],
  maxSize: 5 * 1024 * 1024, // 5MB
  minSize: 1024, // 1KB
  maxWidth: 4096,
  maxHeight: 4096,
  minWidth: 16,
  minHeight: 16,
} as const;

/**
 * 文件上传错误消息常量
 */
export const FILE_UPLOAD_ERROR_MESSAGES: Record<FileValidationError, string> = {
  FILE_TOO_LARGE: '文件大小超过5MB限制',
  INVALID_FILE_TYPE: '仅支持PNG和JPEG格式的图片',
  UPLOAD_FAILED: '文件上传失败，请重试',
  NETWORK_ERROR: '网络连接失败，请检查网络后重试',
  SERVER_ERROR: '服务器处理失败，请稍后重试',
  FILE_CORRUPTED: '文件已损坏或格式错误',
  DUPLICATE_FILE: '文件已存在，请选择其他文件',
  PERMISSION_DENIED: '没有上传权限',
  QUOTA_EXCEEDED: '存储空间不足',
  UNKNOWN_ERROR: '上传过程中发生未知错误',
} as const;

/**
 * 文件上传提示文本常量
 */
export const FILE_UPLOAD_HINTS = {
  ICON: {
    DEFAULT: '点击上传或拖拽网站图标到此处',
    DRAG_OVER: '松开鼠标即可上传图标',
    UPLOADING: '正在上传图标...',
    SUCCESS: '图标上传成功',
    ERROR: '图标上传失败',
  },
  IMAGE: {
    DEFAULT: '点击上传或拖拽网站主图到此处',
    DRAG_OVER: '松开鼠标即可上传主图',
    UPLOADING: '正在上传主图...',
    SUCCESS: '主图上传成功',
    ERROR: '主图上传失败',
  },
  GENERAL: {
    FILE_FORMAT: '支持PNG或JPEG格式，最大5MB',
    DRAG_DROP: '支持拖拽上传',
    CLICK_TO_SELECT: '点击选择文件',
    PROCESSING: '正在处理文件...',
    RETRY: '点击重试',
    REMOVE: '移除文件',
  },
} as const;

// ============================================================================
// Type Guards & Utilities
// ============================================================================

/**
 * 检查文件类型是否支持
 */
export function isSupportedFileType(fileType: string): fileType is SupportedFileType {
  const supportedTypes: SupportedFileType[] = ['image/png', 'image/jpeg', 'image/jpg'];
  return supportedTypes.includes(fileType as SupportedFileType);
}

/**
 * 检查文件大小是否在限制范围内
 */
export function isValidFileSize(fileSize: number, config: FileValidationConfig = DEFAULT_FILE_VALIDATION_CONFIG): boolean {
  return fileSize >= config.minSize && fileSize <= config.maxSize;
}

/**
 * 格式化文件大小显示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * 生成文件预览URL
 */
export function generatePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * 清理文件预览URL
 */
export function revokePreviewUrl(url: string): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * 检查是否为图片文件
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * 验证文件名
 */
export function isValidFileName(fileName: string): boolean {
  // 检查文件名是否包含危险字符
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  return !dangerousChars.test(fileName) && fileName.length > 0 && fileName.length <= 255;
}

/**
 * 计算上传速度 (字节/秒)
 */
export function calculateUploadSpeed(uploadedBytes: number, elapsedSeconds: number): number {
  return elapsedSeconds > 0 ? uploadedBytes / elapsedSeconds : 0;
}

/**
 * 估算剩余上传时间 (秒)
 */
export function estimateRemainingTime(remainingBytes: number, speed: number): number {
  return speed > 0 ? remainingBytes / speed : Infinity;
}

/**
 * 创建默认文件上传状态
 */
export function createDefaultFileUploadState(): FileUploadState {
  return {
    file: null,
    preview: null,
    status: 'idle',
    progress: 0,
    error: null,
    errorMessage: null,
    uploadedUrl: null,
    metadata: null,
    uploadStartTime: null,
    uploadEndTime: null,
    canRetry: false,
    retryCount: 0,
  };
}

/**
 * 创建默认拖拽状态
 */
export function createDefaultDragDropState(): DragDropState {
  return {
    isDragging: false,
    isDragOver: false,
    draggedFileCount: 0,
    hasValidFiles: false,
    activeDropZone: null,
  };
}