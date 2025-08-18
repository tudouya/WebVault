# Implementation Plan - Submit Page UI

## Status
- **Phase**: Tasks
- **Status**: Complete  
- **Date Created**: 2025-08-18
- **Last Updated**: 2025-08-18

## Task Overview
基于已验证的设计文档实现Submit Page UI的完整功能，采用渐进式开发方式：首先建立基础架构和类型系统，然后实现核心组件，最后完成页面集成和优化。严格复用现有代码模式，最小化新组件开发。

## Steering Document Compliance
任务分解遵循 structure.md 的Feature-First架构约定和 tech.md 的技术标准：
- 创建 `src/features/submissions/` 功能模块，遵循现有模块结构
- 使用现有的React Hook Form + Zod + shadcn/ui技术栈
- 完全复用 `useAuthForm.ts` 的表单管理模式
- 利用现有的安全验证基础设施 (`detectMaliciousContent`, `safeStringValidator`)
- 遵循现有的错误处理和状态管理模式

## Atomic Task Requirements
**每个任务符合原子化执行标准：**
- **文件范围**: 涉及1-3个相关文件
- **时间限制**: 15-30分钟内完成
- **单一目的**: 每个任务一个可测试的结果
- **明确文件**: 指定确切的创建/修改文件路径
- **代理友好**: 清晰的输入/输出，最少的上下文切换

## Task Format Guidelines
- 使用复选框格式: `- [ ] 任务编号. 任务描述`
- **指定文件**: 明确包含创建/修改的文件路径
- **包含实现细节** 作为项目符号
- 使用需求引用: `_Requirements: X.Y, Z.A_`
- 使用现有代码引用: `_Leverage: path/to/file.ts, path/to/component.tsx_`
- 专注编码任务（不包含部署、用户测试等）
- **避免宽泛术语**: 任务标题中不使用"系统"、"集成"、"完整"等词

## Good vs Bad Task Examples
❌ **避免的任务（过于宽泛）**:
- "实现提交系统" (影响多个文件，多种目的)
- "添加文件上传功能" (模糊范围，无文件规范)  
- "构建完整的表单" (过大，多个组件)

✅ **良好的任务（原子化）**:
- "创建SubmissionFormData类型定义在types/submission.ts中"
- "在schemas/submission-schemas.ts中添加Zod验证规则，复用现有安全工具"
- "创建StepIndicator组件在components/StepIndicator.tsx中，使用shadcn/ui样式"

## Tasks

- [x] 1. Create submissions feature module base directories
  - File: Create directory `src/features/submissions/`
  - Create subdirectories: `components/`, `hooks/`, `types/`, `schemas/`
  - Purpose: Establish feature module basic directory structure
  - _Requirements: 1_
  - _Leverage: src/features/auth/, src/features/websites/ directory structure_

- [x] 2. Create SubmissionFormData core type definitions
  - File: `src/features/submissions/types/submission.ts`
  - Define SubmissionFormData interface with link, name, description, introduction fields
  - Define submission status enum (draft, submitted, pending, approved, rejected)
  - Purpose: Provide core TypeScript types for submission functionality
  - _Requirements: 2, 3, 4, 5, 6_
  - _Leverage: src/features/websites/types/ existing type definition patterns_

- [x] 3. Create file upload related type definitions
  - File: `src/features/submissions/types/file-upload.ts`
  - Define FileUploadState interface (file, preview, uploading, error states)
  - Define file validation types (SupportedFileType, UploadProgress)
  - Purpose: Provide type support for file upload functionality
  - _Requirements: 6_
  - _Leverage: existing state management type patterns_

- [x] 4. Create form validation schema foundation
  - File: `src/features/submissions/schemas/submission-schemas.ts`
  - Import existing security tools: `detectMaliciousContent`, `safeStringValidator`
  - Define basic submissionFormSchema structure
  - Purpose: Establish form validation foundation architecture
  - _Requirements: 7_
  - _Leverage: src/features/websites/schemas/index.ts_

- [x] 5. Add file validation and URL validation functions
  - File: `src/features/submissions/schemas/submission-schemas.ts` (extend)
  - Implement validateUploadFile and validateWebsiteUrl functions
  - Add complete submissionFormSchema definition
  - Create zodResolver and default values
  - Purpose: Complete form validation schema design
  - _Requirements: 6, 2_
  - _Leverage: src/features/auth/schemas/auth-schemas.ts validation patterns_

- [x] 6. Create useSubmissionForm Hook basic structure
  - File: `src/features/submissions/hooks/useSubmissionForm.ts`
  - Copy useAuthForm.ts interface definitions and basic structure
  - Adapt to SubmissionFormData type
  - Implement basic form initialization logic
  - Purpose: Establish form state management foundation
  - _Requirements: 7_
  - _Leverage: src/features/auth/hooks/useAuthForm.ts (reuse architecture)_

- [x] 7. Implement useSubmissionForm submit and error handling logic
  - File: `src/features/submissions/hooks/useSubmissionForm.ts` (extend)
  - Implement handleSubmit, handleError, clearError core methods
  - Add state management logic (isSubmitting, submitError)
  - Purpose: Complete form Hook core functionality
  - _Requirements: 7_
  - _Leverage: src/features/auth/hooks/useAuthForm.ts error handling patterns_

- [x] 8. Create StepIndicator component
  - File: `src/features/submissions/components/StepIndicator.tsx`
  - Use shadcn/ui Card and Button components to create step indicator
  - Implement current step highlight (Details active state)
  - Display three steps: Details, Payment, Publish
  - Purpose: Provide submission process progress indication
  - _Requirements: 1_
  - _Leverage: src/components/ui/card.tsx, src/components/ui/button.tsx_

- [x] 9. Create basic FileUploadField component
  - File: `src/features/submissions/components/FileUploadField.tsx`
  - Create basic file selection input (click upload)
  - Implement file format and size validation
  - Display file selection state and error messages
  - Purpose: Provide basic file upload interface
  - _Requirements: 6_
  - _Leverage: src/components/ui/input.tsx, src/components/ui/label.tsx_

- [x] 10. Add drag-and-drop basic functionality to FileUploadField
  - File: `src/features/submissions/components/FileUploadField.tsx` (extend)
  - Implement drag area event listeners (dragover, drop, dragleave)
  - Add visual feedback during drag (border highlight)
  - Handle basic validation of dragged files
  - Purpose: Support dragging files to upload area
  - _Requirements: 6, 11_
  - _Leverage: existing event handling patterns_

- [x] 11. Add file preview functionality to FileUploadField
  - File: `src/features/submissions/components/FileUploadField.tsx` (extend)
  - Implement thumbnail preview for image files
  - Add filename and size display
  - Implement file removal functionality
  - Purpose: Provide upload file preview confirmation for users
  - _Requirements: 6_
  - _Leverage: URL.createObjectURL API_

- [x] 12. Create CategorySelect component
  - File: `src/features/submissions/components/CategorySelect.tsx`
  - Use shadcn/ui Select component to implement category selection
  - Integrate form validation and error display
  - Support "Select categories" placeholder text
  - Purpose: Provide category selection functionality
  - _Requirements: 3_
  - _Leverage: src/components/ui/select.tsx, src/components/ui/form.tsx_

- [x] 13. Create TagsMultiSelect component
  - File: `src/features/submissions/components/TagsMultiSelect.tsx`
  - Use shadcn/ui Select component to implement multi-select tags
  - Display selected tag count or tag names
  - Support "Select tags" placeholder
  - Purpose: Provide tag multi-selection functionality
  - _Requirements: 3_
  - _Leverage: src/components/ui/select.tsx_

- [x] 14. Create TextareaField component
  - File: `src/features/submissions/components/TextareaField.tsx`
  - Create multi-line text input based on shadcn/ui styles
  - Implement character counter functionality
  - Support different configurations for description and introduction fields
  - Purpose: Provide text content input interface
  - _Requirements: 4, 5_
  - _Leverage: src/components/ui/form.tsx, existing input styles_

- [x] 15. Create SubmissionForm basic form structure
  - File: `src/features/submissions/components/SubmissionForm.tsx`
  - Use shadcn/ui Form component to establish form framework
  - Integrate useSubmissionForm hook
  - Implement basic two-column layout structure
  - Purpose: Establish overall form framework
  - _Requirements: 1, 7_
  - _Leverage: src/components/ui/form.tsx_

- [x] 16. Add basic information fields to SubmissionForm
  - File: `src/features/submissions/components/SubmissionForm.tsx` (extend)
  - Add Link input field (left column)
  - Add Name input field (right column)
  - Integrate form validation and error display
  - Purpose: Implement basic information collection
  - _Requirements: 2_
  - _Leverage: src/components/ui/input.tsx_

- [x] 17. Add category and tag fields to SubmissionForm
  - File: `src/features/submissions/components/SubmissionForm.tsx` (extend)
  - Integrate CategorySelect component (left column)
  - Integrate TagsMultiSelect component (right column)
  - Implement inter-field linked validation
  - Purpose: Implement category and tag selection
  - _Requirements: 3_
  - _Leverage: CategorySelect.tsx, TagsMultiSelect.tsx_

- [x] 18. Add content input fields to SubmissionForm
  - File: `src/features/submissions/components/SubmissionForm.tsx` (extend)
  - Add Description field (full width)
  - Add Introduction field (full width, Markdown support)
  - Implement character counting and validation feedback
  - Purpose: Implement content description input
  - _Requirements: 4, 5_
  - _Leverage: TextareaField.tsx_

- [x] 19. Add file upload fields to SubmissionForm
  - File: `src/features/submissions/components/SubmissionForm.tsx` (extend)
  - Add Icon upload field (left column)
  - Add Image upload field (right column)
  - Integrate file validation and upload status display
  - Purpose: Implement file upload functionality
  - _Requirements: 6_
  - _Leverage: FileUploadField.tsx_

- [x] 20. Create form submit button component
  - File: `src/features/submissions/components/SubmitButton.tsx`
  - Create Submit button (purple style)
  - Implement submit state and loading display
  - Add disabled state handling
  - Purpose: Provide form submission control
  - _Requirements: 7_
  - _Leverage: src/components/ui/button.tsx_

- [x] 21. Add submit button and action area to SubmissionForm
  - File: `src/features/submissions/components/SubmissionForm.tsx` (extend)
  - Integrate SubmitButton component (bottom-left position)
  - Add disclaimer text display
  - Handle form submit events
  - Purpose: Complete form submission functionality integration
  - _Requirements: 7_
  - _Leverage: SubmitButton.tsx_

- [x] 22. Create SubmitPage page component
  - File: `src/features/submissions/components/SubmitPage.tsx`
  - Combine StepIndicator and SubmissionForm components
  - Implement page overall layout and container styles
  - Add page title "Submit"
  - Purpose: Create complete submission page
  - _Requirements: 1, 8_
  - _Leverage: StepIndicator.tsx, SubmissionForm.tsx_

- [x] 23. Apply precise color system to SubmissionForm
  - File: `src/features/submissions/components/SubmissionForm.tsx` (style update)
  - Apply design colors: Submit button #8B5CF6, borders #E5E7EB
  - Ensure text color hierarchy: #111827, #374151, #6B7281
  - Purpose: Implement basic visual design
  - _Requirements: 9_
  - _Leverage: existing HSL theme variables_

- [x] 24. Add interactive effects to SubmissionForm
  - File: `src/features/submissions/components/SubmissionForm.tsx` (interaction enhancement)
  - Add hover and focus state styles
  - Implement visual feedback for form validation
  - Add smooth transition animations
  - Purpose: Enhance interactive experience
  - _Requirements: 11_
  - _Leverage: Tailwind CSS transition classes_

- [x] 25. Implement responsive layout adaptation
  - File: `src/features/submissions/components/SubmissionForm.tsx` (layout update)
  - Implement mobile single-column layout (<768px)
  - Adjust file upload area mobile dimensions
  - Ensure minimum 44px touch areas
  - Purpose: Optimize mobile experience
  - _Requirements: 8, 10_
  - _Leverage: Tailwind CSS responsive breakpoints_

- [x] 26. Update route page to integrate SubmitPage
  - File: `src/app/(public)/submit/page.tsx`
  - Import and use new SubmitPage component
  - Remove existing WebsiteSubmitForm reference
  - Maintain Suspense wrapper and error handling
  - Purpose: Integrate new implementation into application
  - _Requirements: Route integration_
  - _Leverage: SubmitPage.tsx, existing page structure_

- [x] 27. Create API route basic structure
  - File: `src/app/api/submissions/route.ts`
  - Create POST method to handle form submission
  - Implement basic request validation and response format
  - Add error handling and status code management
  - Purpose: Provide backend interface for form submission
  - _Requirements: 7_
  - _Leverage: existing API route patterns_

- [x] 28. Add basic error handling and user feedback
  - File: `src/features/submissions/components/SubmissionForm.tsx` (error handling)
  - Implement user-friendly prompts for network errors
  - Add submission success feedback messages
  - Integrate toast notifications or modal confirmations
  - Purpose: Enhance user interaction experience
  - _Requirements: 7_
  - _Leverage: existing notification system_

- [x] 29. Update module export file
  - File: `src/features/submissions/index.ts`
  - Export main components: SubmitPage, SubmissionForm
  - Export core Hook: useSubmissionForm
  - Export type definitions: SubmissionFormData
  - Purpose: Provide clear module external interface
  - _Requirements: Code organization requirements_
  - _Leverage: src/features/auth/index.ts export patterns_

## Implementation Dependencies

### 文件创建顺序
1. **基础架构(Tasks 1-5)** → 2. **核心组件(Tasks 6-14)** → 3. **表单组装(Tasks 15-21)** → 4. **页面集成(Tasks 22-25)** → 5. **路由和API(Tasks 26-27)** → 6. **最终优化(Tasks 28-29)**

### 关键依赖关系
- `submission.ts`, `submission-schemas.ts` 必须在所有组件之前创建
- `useSubmissionForm.ts` 必须在表单组件之前创建
- 基础组件(Tasks 8-14)必须在表单组装(Task 15)之前创建
- `SubmitPage.tsx`组件必须在路由更新(Task 26)之前创建
- 所有核心功能必须在API集成(Task 27)之前创建

### 并行执行机会
- Tasks 1-3 可以并行执行（目录创建和类型定义）
- Tasks 8-14 可以并行执行（独立的UI组件）
- Tasks 23-25 可以并行执行（样式和响应式优化）
- Tasks 27-28 可以并行执行（API和错误处理）

### 测试和验证点
- Tasks 1-5完成后：类型定义和架构的编译验证
- Tasks 6-15完成后：完整表单的基础功能测试
- Tasks 16-25完成后：完整用户体验的集成测试
- Tasks 26-29完成后：最终的E2E测试和路由验证

## Code Quality Standards

### 每个任务的完成标准
- ✅ 编译无错误，类型检查通过
- ✅ 遵循项目的ESLint和Prettier配置
- ✅ 组件props有完整的TypeScript类型定义
- ✅ 错误处理适当，有用户友好的错误信息
- ✅ 可访问性属性正确实现
- ✅ 响应式设计在不同设备上正常工作

### 禁止的实现方式
- ❌ 创建与现有shadcn/ui重复的基础组件
- ❌ 忽略现有的安全验证工具
- ❌ 实现与useAuthForm架构不一致的表单管理
- ❌ 硬编码样式值，应使用主题变量
- ❌ 跳过表单验证或安全检查
- ❌ 创建不符合Feature-First架构的文件结构