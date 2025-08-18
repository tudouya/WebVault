/**
 * Submission Success Modal Component
 * 
 * 提交成功确认模态框，提供清晰的成功反馈和下一步指引。
 * 支持自动跳转和手动操作，增强用户体验。
 * 
 * Requirements:
 * - 28: Add basic error handling and user feedback (成功反馈消息)
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface SubmissionSuccessModalProps {
  /** 是否显示模态框 */
  isOpen: boolean;
  /** 关闭模态框回调 */
  onClose?: () => void;
  /** 提交ID */
  submissionId?: string;
  /** 网站名称 */
  websiteName?: string;
  /** 下一步操作回调 */
  onNext?: () => void;
  /** 自动跳转延时（秒），设为0禁用自动跳转 */
  autoRedirectDelay?: number;
  /** 下一步按钮文本 */
  nextButtonText?: string;
  /** 自定义成功消息 */
  successMessage?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * SubmissionSuccessModal - 网站提交成功确认模态框
 * 
 * 显示提交成功的确认信息，提供下一步操作指引和自动跳转功能。
 */
export function SubmissionSuccessModal({
  isOpen,
  onClose,
  submissionId,
  websiteName,
  onNext,
  autoRedirectDelay = 5,
  nextButtonText = '继续到付费确认',
  successMessage = '您的网站信息已成功提交！',
}: SubmissionSuccessModalProps) {
  
  // ========================================================================
  // State
  // ========================================================================
  
  const [countdown, setCountdown] = useState(autoRedirectDelay);
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(autoRedirectDelay > 0);

  // ========================================================================
  // Effects
  // ========================================================================
  
  /**
   * 自动跳转倒计时
   */
  useEffect(() => {
    if (!isOpen || autoRedirectDelay <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsAutoRedirecting(false);
          onNext?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, autoRedirectDelay, onNext]);

  /**
   * 重置状态当模态框打开时
   */
  useEffect(() => {
    if (isOpen) {
      setCountdown(autoRedirectDelay);
      setIsAutoRedirecting(autoRedirectDelay > 0);
    }
  }, [isOpen, autoRedirectDelay]);

  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * 处理立即继续
   */
  const handleContinueNow = () => {
    setIsAutoRedirecting(false);
    onNext?.();
  };

  /**
   * 处理取消自动跳转
   */
  const handleCancelAutoRedirect = () => {
    setIsAutoRedirecting(false);
    setCountdown(0);
  };

  // ========================================================================
  // Render
  // ========================================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-300"
        onClick={onClose}
      />
      
      {/* 模态框内容 */}
      <Card className="relative w-full max-w-md mx-4 animate-in zoom-in-95 duration-300">
        <CardHeader className="text-center pb-4">
          {/* 成功图标 */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500 delay-150">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <CardTitle className="text-xl font-bold text-foreground">
            提交成功！
          </CardTitle>
          
          <CardDescription className="text-base text-card-foreground mt-2">
            {successMessage}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 提交详情 */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            {websiteName && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">网站名称:</span>
                <span className="font-medium">{websiteName}</span>
              </div>
            )}
            
            {submissionId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">提交编号:</span>
                <span className="font-mono text-xs bg-background px-2 py-1 rounded">
                  {submissionId}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">提交时间:</span>
              <span className="text-xs">
                {new Date().toLocaleString('zh-CN')}
              </span>
            </div>
          </div>

          {/* 下一步说明 */}
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>接下来您需要选择提交套餐并完成付费</p>
            <p className="text-xs">付费完成后，您的网站将进入审核队列</p>
          </div>

          {/* 自动跳转倒计时 */}
          {isAutoRedirecting && countdown > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
              <Clock className="w-4 h-4" />
              <span>
                {countdown} 秒后自动跳转到付费页面
              </span>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {isAutoRedirecting ? (
              <>
                <Button
                  onClick={handleContinueNow}
                  className="flex-1"
                  size="lg"
                >
                  立即继续
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelAutoRedirect}
                  className="flex-1"
                  size="lg"
                >
                  取消自动跳转
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleContinueNow}
                  className="flex-1"
                  size="lg"
                >
                  {nextButtonText}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                {onClose && (
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    size="lg"
                  >
                    稍后处理
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default SubmissionSuccessModal;