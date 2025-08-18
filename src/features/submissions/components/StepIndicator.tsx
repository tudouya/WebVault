/**
 * StepIndicator Component
 * 
 * 显示网站提交流程的步骤进度指示器，包含三个步骤：Details → Payment → Publish。
 * 使用shadcn/ui组件系统构建，支持当前步骤高亮显示。
 * 
 * Requirements:
 * - 1.2: 显示三步骤进度指示器
 * - 1.3: 突出显示当前步骤"Details"(第1步)
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import * as React from 'react';
import { cn } from '../../../lib/utils';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { SubmissionStep } from '../types/submission';
import { Check } from 'lucide-react';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * 步骤状态枚举
 */
export type StepStatus = 'completed' | 'current' | 'upcoming';

/**
 * 步骤信息接口
 */
export interface StepInfo {
  /** 步骤ID */
  id: SubmissionStep;
  /** 步骤标题 */
  title: string;
  /** 步骤描述 */
  description: string;
  /** 步骤状态 */
  status: StepStatus;
  /** 步骤编号 */
  number: number;
  /** 是否可点击 */
  clickable?: boolean;
}

/**
 * StepIndicator组件属性接口
 */
export interface StepIndicatorProps {
  /** 当前步骤 */
  currentStep: SubmissionStep;
  /** 已完成的步骤列表 */
  completedSteps?: SubmissionStep[];
  /** 步骤点击处理器 */
  onStepClick?: (step: SubmissionStep) => void;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 步骤配置常量
 * 
 * 定义三个提交步骤的标题、描述和顺序
 */
const STEP_CONFIG: Record<SubmissionStep, Omit<StepInfo, 'status' | 'clickable'>> = {
  details: {
    id: 'details',
    number: 1,
    title: 'Details',
    description: '填写网站基本信息',
  },
  payment: {
    id: 'payment',
    number: 2,
    title: 'Payment',
    description: '选择付费方案',
  },
  publish: {
    id: 'publish',
    number: 3,
    title: 'Publish',
    description: '发布网站信息',
  },
};

/**
 * 步骤顺序数组
 */
const STEP_ORDER: SubmissionStep[] = ['details', 'payment', 'publish'];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 计算步骤状态
 * 
 * @param step 步骤ID
 * @param currentStep 当前步骤
 * @param completedSteps 已完成步骤列表
 * @returns 步骤状态
 */
function calculateStepStatus(
  step: SubmissionStep,
  currentStep: SubmissionStep,
  completedSteps: SubmissionStep[] = []
): StepStatus {
  if (completedSteps.includes(step)) {
    return 'completed';
  }
  
  if (step === currentStep) {
    return 'current';
  }
  
  return 'upcoming';
}

/**
 * 判断步骤是否可点击
 * 
 * @param step 步骤ID
 * @param currentStep 当前步骤
 * @param completedSteps 已完成步骤列表
 * @returns 是否可点击
 */
function isStepClickable(
  step: SubmissionStep,
  currentStep: SubmissionStep,
  completedSteps: SubmissionStep[] = []
): boolean {
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const stepIndex = STEP_ORDER.indexOf(step);
  
  // 已完成的步骤可点击
  if (completedSteps.includes(step)) {
    return true;
  }
  
  // 当前步骤可点击
  if (step === currentStep) {
    return true;
  }
  
  // 只有当前步骤之前的步骤可点击
  return stepIndex < currentStepIndex;
}

// ============================================================================
// Sub Components
// ============================================================================

/**
 * 步骤图标组件
 */
interface StepIconProps {
  status: StepStatus;
  number: number;
  className?: string;
}

function StepIcon({ status, number, className }: StepIconProps) {
  const baseClasses = "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200";
  
  switch (status) {
    case 'completed':
      return (
        <div className={cn(
          baseClasses,
          "bg-primary border-primary text-primary-foreground",
          className
        )}>
          <Check className="w-4 h-4" />
        </div>
      );
    
    case 'current':
      return (
        <div className={cn(
          baseClasses,
          "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
          className
        )}>
          <span className="text-sm font-semibold">{number}</span>
        </div>
      );
    
    case 'upcoming':
    default:
      return (
        <div className={cn(
          baseClasses,
          "bg-muted border-muted-foreground/30 text-muted-foreground",
          className
        )}>
          <span className="text-sm font-medium">{number}</span>
        </div>
      );
  }
}

/**
 * 步骤连接线组件
 */
interface StepConnectorProps {
  completed: boolean;
  className?: string;
}

function StepConnector({ completed, className }: StepConnectorProps) {
  return (
    <div className={cn(
      "flex-1 h-0.5 mx-4 transition-colors duration-200",
      completed 
        ? "bg-primary" 
        : "bg-muted-foreground/30",
      className
    )} />
  );
}

/**
 * 单个步骤组件
 */
interface SingleStepProps {
  step: StepInfo;
  onStepClick?: (step: SubmissionStep) => void;
  compact?: boolean;
  className?: string;
}

function SingleStep({ step, onStepClick, compact = false, className }: SingleStepProps) {
  const isClickable = step.clickable && onStepClick;
  
  const handleClick = () => {
    if (isClickable) {
      onStepClick(step.id);
    }
  };

  if (compact) {
    return (
      <Button
        variant={step.status === 'current' ? 'default' : 'ghost'}
        size="sm"
        onClick={handleClick}
        disabled={!isClickable}
        className={cn(
          "flex items-center gap-2 px-3 py-2",
          step.status === 'completed' && "text-primary",
          className
        )}
      >
        <StepIcon status={step.status} number={step.number} className="w-6 h-6" />
        <span className="text-sm font-medium">{step.title}</span>
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={!isClickable}
        className={cn(
          "mb-2 hover:bg-transparent",
          !isClickable && "cursor-default"
        )}
      >
        <StepIcon status={step.status} number={step.number} />
      </Button>
      
      <div className="space-y-1">
        <h3 className={cn(
          "text-sm font-medium transition-colors",
          step.status === 'current' 
            ? "text-foreground" 
            : step.status === 'completed'
            ? "text-primary"
            : "text-muted-foreground"
        )}>
          {step.title}
        </h3>
        
        <p className={cn(
          "text-xs transition-colors",
          step.status === 'current' 
            ? "text-muted-foreground" 
            : "text-muted-foreground/60"
        )}>
          {step.description}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * StepIndicator主组件
 * 
 * 显示网站提交流程的步骤进度，支持当前步骤高亮和步骤导航。
 * 
 * Usage:
 * ```tsx
 * // 基础用法
 * <StepIndicator currentStep="details" />
 * 
 * // 带已完成步骤
 * <StepIndicator 
 *   currentStep="payment" 
 *   completedSteps={['details']}
 *   onStepClick={(step) => navigateToStep(step)}
 * />
 * 
 * // 紧凑模式
 * <StepIndicator 
 *   currentStep="publish" 
 *   compact={true}
 * />
 * ```
 */
export function StepIndicator({
  currentStep,
  completedSteps = [],
  onStepClick,
  compact = false,
  className,
}: StepIndicatorProps) {
  // 计算步骤信息
  const steps: StepInfo[] = React.useMemo(() => {
    return STEP_ORDER.map(stepId => {
      const config = STEP_CONFIG[stepId];
      const status = calculateStepStatus(stepId, currentStep, completedSteps);
      const clickable = isStepClickable(stepId, currentStep, completedSteps);
      
      return {
        ...config,
        status,
        clickable,
      };
    });
  }, [currentStep, completedSteps]);

  if (compact) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <SingleStep
                step={step}
                onStepClick={onStepClick}
                compact={true}
              />
              {index < steps.length - 1 && (
                <div className="mx-2 text-muted-foreground/50">→</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <SingleStep
              step={step}
              onStepClick={onStepClick}
              className="flex-shrink-0"
            />
            
            {index < steps.length - 1 && (
              <StepConnector 
                completed={step.status === 'completed'}
                className="hidden sm:block"
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* 移动端连接线 */}
      <div className="sm:hidden mt-4 flex items-center justify-center">
        {steps.map((step, index) => (
          <React.Fragment key={`mobile-${step.id}`}>
            <div className={cn(
              "w-8 h-1 rounded-full transition-colors",
              step.status === 'completed' || step.status === 'current'
                ? "bg-primary"
                : "bg-muted"
            )} />
            {index < steps.length - 1 && (
              <div className="w-4 h-1 bg-muted-foreground/20" />
            )}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default StepIndicator;
export { calculateStepStatus, isStepClickable, STEP_CONFIG, STEP_ORDER };