/**
 * Submission data type definitions
 * 
 * Defines the complete submission workflow types including form data,
 * status management, and step-by-step submission process.
 */

/**
 * Submission status enumeration
 * 
 * Represents the complete lifecycle of a website submission:
 * - draft: User is still filling out the form
 * - submitted: User has submitted the form for review
 * - pending: Under admin review
 * - approved: Approved and published as a website
 * - rejected: Rejected with reason
 */
export type SubmissionStatus = 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected';

/**
 * Submission step enumeration
 * 
 * Represents the three-step submission workflow:
 * - details: Basic website information input
 * - payment: Payment processing (if required)
 * - publish: Final review and publication
 */
export type SubmissionStep = 'details' | 'payment' | 'publish';

/**
 * Core submission form data interface
 * 
 * Contains all fields required for website submission form,
 * following the requirements for basic information, categorization,
 * and content creation.
 */
export interface SubmissionFormData {
  /** Website URL - required, validated for format */
  link: string;
  
  /** Website display name - required, 3-100 characters */
  name: string;
  
  /** Short website description - required, 10-500 characters */
  description: string;
  
  /** Detailed website introduction - rich text with Markdown support */
  introduction: string;
  
  /** Selected category ID for website classification */
  category_id?: string;
  
  /** Selected tags for website categorization */
  tags?: string[];
  
  /** Website icon/favicon upload */
  icon_file?: File;
  
  /** Website main image upload */
  image_file?: File;
  
  /** Uploaded icon URL (after processing) */
  icon_url?: string;
  
  /** Uploaded image URL (after processing) */
  image_url?: string;
  
  /** Contact email for submission follow-up */
  contact_email?: string;
  
  /** Additional notes from submitter */
  notes?: string;
}

/**
 * Submission entity interface
 * 
 * Complete submission record including form data,
 * status tracking, and metadata.
 */
export interface Submission {
  /** Unique submission identifier */
  id: string;
  
  /** Current submission status */
  status: SubmissionStatus;
  
  /** Current step in submission workflow */
  current_step: SubmissionStep;
  
  /** Form data content */
  form_data: SubmissionFormData;
  
  /** Submitter user ID (if authenticated) */
  user_id?: string;
  
  /** Admin user ID who reviewed (if applicable) */
  reviewed_by?: string;
  
  /** Review notes from admin */
  review_notes?: string;
  
  /** Rejection reason (if status is rejected) */
  rejection_reason?: string;
  
  /** Created website ID (if approved and published) */
  website_id?: string;
  
  /** Payment information (if payment step is required) */
  payment_info?: {
    amount: number;
    currency: string;
    payment_method: string;
    transaction_id?: string;
    payment_status: 'pending' | 'completed' | 'failed';
  };
  
  /** Creation timestamp */
  created_at: string;
  
  /** Last update timestamp */
  updated_at: string;
  
  /** Submission deadline (if applicable) */
  expires_at?: string;
}

/**
 * Submission creation input interface
 */
export interface SubmissionCreateInput {
  form_data: Partial<SubmissionFormData>;
  user_id?: string;
  current_step?: SubmissionStep;
  contact_email?: string;
}

/**
 * Submission update input interface
 */
export interface SubmissionUpdateInput {
  id: string;
  form_data?: Partial<SubmissionFormData>;
  status?: SubmissionStatus;
  current_step?: SubmissionStep;
  review_notes?: string;
  rejection_reason?: string;
  payment_info?: Submission['payment_info'];
}

/**
 * Submission filters interface for admin management
 */
export interface SubmissionFilters {
  status?: SubmissionStatus;
  current_step?: SubmissionStep;
  user_id?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

/**
 * Submission validation result interface
 */
export interface SubmissionValidationResult {
  isValid: boolean;
  errors: {
    field: keyof SubmissionFormData;
    message: string;
  }[];
  warnings?: {
    field: keyof SubmissionFormData;
    message: string;
  }[];
}

/**
 * File upload result interface
 */
export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  file_info?: {
    name: string;
    size: number;
    type: string;
  };
}

/**
 * Submission workflow step interface
 */
export interface SubmissionWorkflowStep {
  step: SubmissionStep;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isAccessible: boolean;
}

/**
 * Submission pagination interface
 */
export interface SubmissionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Submission list response interface
 */
export interface SubmissionListResponse {
  submissions: Submission[];
  pagination: SubmissionPagination;
  filters: SubmissionFilters;
}