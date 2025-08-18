/**
 * Submission Form - Main Website Submission Form Component
 * 
 * 实现网站提交的核心表单组件，提供基础的两列布局结构和完整的表单框架。
 * 使用shadcn/ui Form组件建立表单基础，集成useSubmissionForm hook处理表单状态。
 * 
 * Requirements:
 * - 1: 页面布局和导航 (清晰的页面结构和步骤指示)
 * - 7: 表单提交和验证 (表单提交和明确反馈)
 * - 11: 交互效果和状态反馈 (悬停效果、聚焦状态、过渡动画、验证动画)
 * 
 * Features:
 * - 基于shadcn/ui Form的响应式两列布局
 * - 集成表单验证和错误处理
 * - 蜜罐字段防机器人提交
 * - 加载状态和提交反馈
 * - 丰富的交互效果：悬停、聚焦、shake动画、实时反馈
 * 
 * @version 1.1.0
 * @created 2025-08-18
 * @updated 2025-08-18 (添加交互效果和状态反馈)
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

// 导入业务逻辑
import { useSubmissionForm } from '../hooks/useSubmissionForm';
import { SubmissionFormData, VALIDATION_CONSTANTS } from '../schemas/submission-schemas';

// 导入现有的子组件
import { 
  StepIndicator,
  TextareaField, 
  CategorySelect, 
  TagsMultiSelect, 
  FileUploadField,
  SubmitButton
} from './';
import { SubmissionSuccessModal } from './SubmissionSuccessModal';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * SubmissionForm组件属性
 */
export interface SubmissionFormProps {
  /** 表单标题 */
  title?: string;
  /** 表单描述 */
  description?: string;
  /** 提交成功回调 */
  onSubmitSuccess?: (result: any) => void;
  /** 提交失败回调 */
  onSubmitError?: (error: string) => void;
  /** 是否显示步骤指示器 */
  showStepIndicator?: boolean;
  /** 当前步骤（用于步骤指示器） */
  currentStep?: number;
  /** 表单className */
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * SubmissionForm - 网站提交表单主组件
 * 
 * 实现完整的网站提交表单，包含基础信息、分类标签、文件上传等功能。
 * 采用两列布局结构，左侧为主要表单字段，右侧为辅助信息和操作。
 */
export function SubmissionForm({
  title = '提交网站',
  description = '分享优质网站资源，让更多人发现有价值的内容',
  onSubmitSuccess,
  onSubmitError,
  showStepIndicator = true,
  currentStep = 1,
  className = '',
}: SubmissionFormProps) {
  
  // ========================================================================
  // Hooks and State
  // ========================================================================
  
  const {
    form,
    isSubmitting,
    isValid,
    isDirty,
    hasErrors,
    submitError,
    handleSubmit,
    clearError,
    validateUrl,
    validateFile,
  } = useSubmissionForm({
    onSubmitSuccess: (result) => {
      // 存储提交结果并显示成功模态框
      setSubmissionResult(result);
      setShowSuccessModal(true);
      
      // 调用外部成功回调
      onSubmitSuccess?.(result);
    },
    onSubmitError: (error) => {
      // 调用外部错误回调
      onSubmitError?.(error);
    },
    debug: process.env.NODE_ENV === 'development',
    enableToast: true, // 启用Toast通知
    toastMessages: {
      success: '网站提交成功！正在跳转到付费确认页面...',
      error: '提交失败，请检查表单内容并重试',
      loading: '正在提交网站信息，请稍候...'
    },
  });

  // 交互状态管理
  const [shakingFields, setShakingFields] = React.useState<Set<string>>(new Set());
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [submissionResult, setSubmissionResult] = React.useState<any>(null);

  // ========================================================================
  // Event Handlers  
  // ========================================================================

  /**
   * 处理表单提交
   */
  const onSubmit = async (data: SubmissionFormData) => {
    try {
      // 如果表单有错误，触发shake动画
      if (hasErrors) {
        triggerFieldShake(Object.keys(form.formState.errors));
        return;
      }
      
      await handleSubmit(data);
    } catch (error) {
      console.error('[SubmissionForm] Submit error:', error);
    }
  };

  /**
   * 处理错误清理
   */
  const handleErrorClear = () => {
    clearError();
  };

  /**
   * 处理成功模态框关闭
   */
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setSubmissionResult(null);
  };

  /**
   * 处理继续到下一步
   */
  const handleContinueToNext = () => {
    setShowSuccessModal(false);
    
    // 根据提交结果跳转
    if (submissionResult?.redirectUrl) {
      window.location.href = submissionResult.redirectUrl;
    } else {
      // 默认跳转到付费页面
      window.location.href = '/submit/payment';
    }
  };

  /**
   * 触发字段shake动画
   */
  const triggerFieldShake = (fieldNames: string[]) => {
    const newShakingFields = new Set(fieldNames);
    setShakingFields(newShakingFields);
    
    // 1秒后清除shake状态
    setTimeout(() => {
      setShakingFields(new Set());
    }, 1000);
  };

  // 监听表单错误变化，自动触发shake动画
  React.useEffect(() => {
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      triggerFieldShake(Object.keys(errors));
    }
  }, [form.formState.errors]);

  // ========================================================================
  // Render Helpers
  // ========================================================================

  /**
   * 获取字段的动画类名
   */
  const getFieldAnimationClass = (fieldName: string) => {
    const isShaking = shakingFields.has(fieldName);
    const hasFieldError = form.formState.errors[fieldName as keyof typeof form.formState.errors];
    
    return {
      // Shake动画
      'animate-shake': isShaking,
      // 过渡动画
      'transition-all duration-200 ease-in-out': true,
      // 错误状态样式
      'transform-gpu': isShaking,
    };
  };

  /**
   * 渲染步骤指示器
   */
  const renderStepIndicator = () => {
    if (!showStepIndicator) return null;

    return (
      <div className="mb-6 transition-all duration-300 ease-in-out">
        <StepIndicator 
          currentStep={currentStep}
          totalSteps={3}
          steps={[
            { label: '基本信息', description: '填写网站基本信息' },
            { label: '付费确认', description: '选择提交套餐' },
            { label: '提交完成', description: '等待审核结果' },
          ]}
        />
      </div>
    );
  };

  /**
   * 渲染表单头部
   */
  const renderFormHeader = () => (
    <CardHeader className="transition-all duration-200 ease-in-out">
      <CardTitle className="text-2xl font-bold text-foreground transition-colors duration-200">
        {title}
      </CardTitle>
      <CardDescription className="text-base text-card-foreground transition-colors duration-200">
        {description}
      </CardDescription>
      {submitError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              {/* 错误图标 */}
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center mt-0.5">
                <span className="text-destructive text-xs">!</span>
              </div>
              <div>
                <p className="text-destructive text-sm font-medium mb-1">
                  提交遇到问题
                </p>
                <p className="text-destructive/80 text-sm">
                  {submitError}
                </p>
                <p className="text-muted-foreground text-xs mt-2">
                  如果问题持续出现，请尝试刷新页面或联系客服
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleErrorClear}
              className="text-destructive hover:bg-destructive/10 transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
              aria-label="关闭错误提示"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </CardHeader>
  );

  /**
   * 渲染左侧主要表单字段
   */
  const renderLeftColumn = () => (
    <div className="space-y-6">
      {/* 网站链接 - 任务16：Link字段（左列） */}
      <div className={cn('transition-all duration-200 ease-in-out', getFieldAnimationClass('link'))}>
        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground transition-colors duration-200">
                Link <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter the link to your product" 
                  {...field}
                  className="h-11 min-h-[44px] bg-background border-border text-card-foreground placeholder:text-muted-foreground 
                           focus:ring-2 focus:ring-primary focus:border-primary 
                           hover:border-primary/50 hover:shadow-sm
                           transition-all duration-200 ease-in-out
                           focus:scale-[1.01] focus:shadow-md"
                />
              </FormControl>
              <FormDescription className="text-muted-foreground transition-opacity duration-200">
                请输入完整的网站地址，包含 http:// 或 https://
              </FormDescription>
              <FormMessage className="animate-in slide-in-from-top-1 duration-200" />
            </FormItem>
          )}
        />
      </div>

      {/* 网站描述 */}
      <div className={cn('transition-all duration-200 ease-in-out', getFieldAnimationClass('description'))}>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground transition-colors duration-200">
                Description <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <div className="hover:shadow-sm transition-all duration-200 rounded-md">
                  <TextareaField
                    {...field}
                    placeholder="Enter a brief description of your product"
                    configType="description"
                    className="focus:scale-[1.005] transition-all duration-200"
                  />
                </div>
              </FormControl>
              <FormDescription className="text-muted-foreground transition-opacity duration-200">
                {VALIDATION_CONSTANTS.MIN_DESCRIPTION_LENGTH}-{VALIDATION_CONSTANTS.MAX_DESCRIPTION_LENGTH} 个字符，描述网站的主要功能和特色
              </FormDescription>
              <FormMessage className="animate-in slide-in-from-top-1 duration-200" />
            </FormItem>
          )}
        />
      </div>

      {/* 详细介绍 */}
      <div className={cn('transition-all duration-200 ease-in-out', getFieldAnimationClass('introduction'))}>
        <FormField
          control={form.control}
          name="introduction"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium text-foreground transition-colors duration-200">
                  Introduction <span className="text-destructive">*</span>
                </FormLabel>
                <span className="text-xs text-muted-foreground transition-colors duration-200">
                  (Markdown supported)
                </span>
              </div>
              <FormControl>
                <div className="hover:shadow-sm transition-all duration-200 rounded-md">
                  <TextareaField
                    {...field}
                    placeholder="Enter your content here..."
                    configType="introduction"
                    className="focus:scale-[1.005] transition-all duration-200"
                  />
                </div>
              </FormControl>
              <FormDescription className="text-muted-foreground transition-opacity duration-200">
                {VALIDATION_CONSTANTS.MIN_INTRODUCTION_LENGTH}-{VALIDATION_CONSTANTS.MAX_INTRODUCTION_LENGTH} 个字符，支持 Markdown 格式
              </FormDescription>
              <FormMessage className="animate-in slide-in-from-top-1 duration-200" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  /**
   * 渲染右侧辅助字段
   */
  const renderRightColumn = () => (
    <div className="space-y-6">
      {/* 网站名称 - 任务16：Name字段（右列） */}
      <div className={cn('transition-all duration-200 ease-in-out', getFieldAnimationClass('name'))}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground transition-colors duration-200">
                Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter the name of your product" 
                  {...field}
                  maxLength={VALIDATION_CONSTANTS.MAX_NAME_LENGTH}
                  className="h-11 min-h-[44px] bg-background border-border text-card-foreground placeholder:text-muted-foreground 
                           focus:ring-2 focus:ring-primary focus:border-primary 
                           hover:border-primary/50 hover:shadow-sm
                           transition-all duration-200 ease-in-out
                           focus:scale-[1.01] focus:shadow-md"
                />
              </FormControl>
              <FormDescription className="text-muted-foreground transition-opacity duration-200">
                {VALIDATION_CONSTANTS.MIN_NAME_LENGTH}-{VALIDATION_CONSTANTS.MAX_NAME_LENGTH} 个字符，当前：{field.value?.length || 0} 个字符
              </FormDescription>
              <FormMessage className="animate-in slide-in-from-top-1 duration-200" />
            </FormItem>
          )}
        />
      </div>

      {/* 分类选择 - 任务17：CategorySelect组件（右列） */}
      <div className={cn('transition-all duration-200 ease-in-out', getFieldAnimationClass('category_id'))}>
        <div className="hover:shadow-sm transition-all duration-200 rounded-md">
          <CategorySelect
            control={form.control}
            name="category_id"
            label="Categories"
            placeholder="Select categories"
            description="选择最符合的网站分类"
            required={false}
          />
        </div>
      </div>

      {/* 标签选择 - 任务17：TagsMultiSelect组件（右列） */}
      <div className={cn('transition-all duration-200 ease-in-out', getFieldAnimationClass('tags'))}>
        <div className="hover:shadow-sm transition-all duration-200 rounded-md">
          <TagsMultiSelect
            control={form.control}
            name="tags"
            label="Tags"
            placeholder="Select tags"
            description="最多选择 10 个标签，帮助用户更好地找到网站"
            required={false}
            maxSelection={10}
          />
        </div>
      </div>

      {/* Icon上传字段（右列） - 任务19：文件上传功能 */}
      <div className={cn('transition-all duration-200 ease-in-out', getFieldAnimationClass('icon_file'))}>
        <FormField
          control={form.control}
          name="icon_file"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground transition-colors duration-200">
                Icon <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <div className="hover:shadow-md transition-all duration-200 rounded-md">
                  <FileUploadField
                    name="icon_file"
                    label=""
                    placeholder="上传网站图标 (PNG/JPEG, 最大5MB)"
                    helperText="It's PNG or JPEG, max 5MB"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    maxSize={VALIDATION_CONSTANTS.MAX_FILE_SIZE}
                    onChange={(file, preview) => {
                      field.onChange(file);
                    }}
                    onValidationError={(error, message) => {
                      console.warn('[Icon Upload] Validation error:', error, message);
                    }}
                    disabled={isSubmitting}
                    error={form.formState.errors.icon_file?.message}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-muted-foreground transition-opacity duration-200">
                推荐尺寸：64x64 或 128x128 像素
              </FormDescription>
              <FormMessage className="animate-in slide-in-from-top-1 duration-200" />
            </FormItem>
          )}
        />
      </div>

      {/* Image上传字段（右列） - 任务19：文件上传功能 */}
      <div className={cn('transition-all duration-200 ease-in-out', getFieldAnimationClass('image_file'))}>
        <FormField
          control={form.control}
          name="image_file"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground transition-colors duration-200">
                Image <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <div className="hover:shadow-md transition-all duration-200 rounded-md">
                  <FileUploadField
                    name="image_file"
                    label=""
                    placeholder="上传网站主图 (PNG/JPEG, 最大5MB)"
                    helperText="It's PNG or JPEG, max 5MB"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    maxSize={VALIDATION_CONSTANTS.MAX_FILE_SIZE}
                    onChange={(file, preview) => {
                      field.onChange(file);
                    }}
                    onValidationError={(error, message) => {
                      console.warn('[Image Upload] Validation error:', error, message);
                    }}
                    disabled={isSubmitting}
                    error={form.formState.errors.image_file?.message}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-muted-foreground transition-opacity duration-200">
                推荐尺寸：1200x630 像素，用于展示和分享
              </FormDescription>
              <FormMessage className="animate-in slide-in-from-top-1 duration-200" />
            </FormItem>
          )}
        />
      </div>

      {/* 联系邮箱 */}
      <div className={cn('transition-all duration-200 ease-in-out', getFieldAnimationClass('contact_email'))}>
        <FormField
          control={form.control}
          name="contact_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground transition-colors duration-200">
                联系邮箱
              </FormLabel>
              <FormControl>
                <Input 
                  type="email"
                  placeholder="your@email.com" 
                  {...field}
                  className="h-11 min-h-[44px] bg-background border-border text-card-foreground placeholder:text-muted-foreground 
                           focus:ring-2 focus:ring-primary focus:border-primary 
                           hover:border-primary/50 hover:shadow-sm
                           transition-all duration-200 ease-in-out
                           focus:scale-[1.01] focus:shadow-md"
                />
              </FormControl>
              <FormDescription className="text-muted-foreground transition-opacity duration-200">
                用于审核沟通和状态通知（可选）
              </FormDescription>
              <FormMessage className="animate-in slide-in-from-top-1 duration-200" />
            </FormItem>
          )}
        />
      </div>

      {/* 备注信息 */}
      <div className={cn('transition-all duration-200 ease-in-out', getFieldAnimationClass('notes'))}>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground transition-colors duration-200">
                备注信息
              </FormLabel>
              <FormControl>
                <div className="hover:shadow-sm transition-all duration-200 rounded-md">
                  <TextareaField
                    {...field}
                    placeholder="其他需要说明的信息（可选）"
                    configType="notes"
                    className="focus:scale-[1.005] transition-all duration-200"
                  />
                </div>
              </FormControl>
              <FormDescription className="text-muted-foreground transition-opacity duration-200">
                最多 {VALIDATION_CONSTANTS.MAX_NOTES_LENGTH} 个字符
              </FormDescription>
              <FormMessage className="animate-in slide-in-from-top-1 duration-200" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  /**
   * 渲染表单底部操作区
   */
  const renderFormFooter = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between pt-6 border-t border-border transition-all duration-300 space-y-4 sm:space-y-0">
      {/* 左侧：提交按钮和免责声明 */}
      <div className="flex flex-col transition-all duration-200 ease-in-out w-full sm:w-auto">
        <SubmitButton
          isSubmitting={isSubmitting}
          disabled={!isValid || hasErrors}
          isFormValid={isValid && !hasErrors}
          type="submit"
          submitText="Submit"
          submittingText="Submitting..."
          showDisclaimer={true}
          disclaimerText="No worries, you can change these information later"
          className="self-start w-full sm:w-auto min-h-[44px] hover:scale-105 active:scale-95 transition-all duration-200"
        />
      </div>
      
      {/* 右侧：其他操作和状态信息 */}
      <div className="flex flex-col sm:items-end space-y-3 transition-all duration-200 ease-in-out w-full sm:w-auto">
        {/* 表单状态信息 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-muted-foreground transition-colors duration-200">
          <span className="hover:text-foreground transition-colors duration-200">
            * 为必填项
          </span>
          {isDirty && (
            <span className="text-amber-600 animate-in fade-in-0 duration-300 hover:text-amber-700 transition-colors">
              表单有未保存的更改
            </span>
          )}
        </div>
        
        {/* 重置按钮 */}
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          disabled={isSubmitting || !isDirty}
          size="sm"
          className="min-h-[44px] w-full sm:w-auto transition-all duration-200 ease-in-out 
                     hover:scale-105 hover:shadow-md hover:border-primary/50
                     active:scale-95 
                     disabled:hover:scale-100 disabled:hover:shadow-none
                     focus:scale-105 focus:shadow-md focus:border-primary"
        >
          重置
        </Button>
      </div>
    </div>
  );

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <>
      <div className={`max-w-6xl mx-auto p-4 px-4 sm:p-6 bg-background transition-all duration-300 ease-in-out ${className}`}>
        {renderStepIndicator()}
        
        <Card className="bg-card border-border transition-all duration-200 ease-in-out hover:shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
              {renderFormHeader()}
              
              <CardContent className="space-y-0 p-4 sm:p-6">
                {/* 响应式布局：移动端单列，桌面端双列 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 transition-all duration-300 ease-in-out">
                  {/* 左侧：主要表单字段 */}
                  <div className="space-y-0">
                    <h3 className="text-lg font-semibold mb-4 text-foreground transition-colors duration-200">
                      基础信息
                    </h3>
                    {renderLeftColumn()}
                  </div>
                  
                  {/* 右侧：辅助字段 */}
                  <div className="space-y-0">
                    <h3 className="text-lg font-semibold mb-4 text-foreground transition-colors duration-200">
                      分类和资源
                    </h3>
                    {renderRightColumn()}
                  </div>
                </div>
                
                {/* 蜜罐字段（对用户不可见） */}
                <FormField
                  control={form.control}
                  name="honeypot"
                  render={({ field }) => (
                    <div className="hidden">
                      <Input {...field} tabIndex={-1} autoComplete="off" />
                    </div>
                  )}
                />
                
                {renderFormFooter()}
              </CardContent>
            </form>
          </Form>
        </Card>
      </div>

      {/* 成功提交模态框 */}
      <SubmissionSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        onNext={handleContinueToNext}
        submissionId={submissionResult?.submissionId}
        websiteName={form.getValues('name')}
        autoRedirectDelay={3}
        nextButtonText="继续到付费确认"
        successMessage="您的网站信息已成功提交！接下来请选择提交套餐并完成付费。"
      />
    </>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default SubmissionForm;

// 类型导出
export type { SubmissionFormProps };