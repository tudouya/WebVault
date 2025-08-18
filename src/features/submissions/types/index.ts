// Submission Types
// 网站提交模块类型定义统一导出

// Export all submission-related types
export * from './submission';
export * from './file-upload';

// Re-export key types for convenience
export type {
  SubmissionFormData,
  Submission,
  SubmissionStatus,
  SubmissionStep,
  SubmissionCreateInput,
  SubmissionUpdateInput,
  SubmissionFilters,
  SubmissionValidationResult,
  FileUploadResult,
  SubmissionWorkflowStep,
  SubmissionPagination,
  SubmissionListResponse
} from './submission';

// Re-export file upload types for convenience
export type {
  FileUploadState,
  SupportedFileType,
  FileUploadArea,
  FileValidationError,
  FileUploadStatus,
  UploadProgress,
  FileValidationConfig,
  FileValidationResult,
  FileUploadActions,
  DragDropState,
  FileUploadResponse,
  BatchUploadResponse,
  UploadAreaState
} from './file-upload';