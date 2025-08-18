// Submission Components
// 网站提交组件统一导出

// Step Indicator Component
export { StepIndicator } from './StepIndicator';

// File Upload Components
export { default as FileUploadField } from './FileUploadField';

// Category Selection Component
export { CategorySelect, CategorySelectUtils } from './CategorySelect';

// Tags Multi-Selection Component
export { TagsMultiSelect, TagsMultiSelectUtils } from './TagsMultiSelect';

// Textarea Field Component
export { TextareaField, TextareaFieldWithConfig, TEXTAREA_CONFIGS } from './TextareaField';
export type { TextareaFieldProps, TextareaFieldConfig, TextareaConfigType } from './TextareaField';

// Submit Button Component
export { SubmitButton, BasicSubmitButton, FormSubmitButton, default as SubmitButtonDefault } from './SubmitButton';
export type { SubmitButtonProps } from './SubmitButton';

// Main Form Component
export { SubmissionForm, default as SubmissionFormDefault } from './SubmissionForm';
export type { SubmissionFormProps } from './SubmissionForm';

// Success Modal Component
export { SubmissionSuccessModal } from './SubmissionSuccessModal';
export type { SubmissionSuccessModalProps } from './SubmissionSuccessModal';

// Submit Page Component
export { SubmitPage, default as SubmitPageDefault } from './SubmitPage';
export type { SubmitPageProps } from './SubmitPage';

// 预留组件导出位置
// export { SubmissionSteps } from './SubmissionSteps';
// export { SubmissionPreview } from './SubmissionPreview';

// Placeholder export to make this a valid module
export const SUBMISSION_COMPONENTS_PLACEHOLDER = 'SUBMISSION_COMPONENTS';