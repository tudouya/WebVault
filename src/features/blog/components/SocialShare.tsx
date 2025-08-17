/**
 * SocialShare 组件
 * 
 * 社交媒体分享组件，支持多个平台的分享和一键复制链接功能
 * 提供悬停动画效果、响应式设计和无障碍性支持
 * 
 * 需求引用:
 * - 5.1: 提供常用社交平台的分享按钮（微信、QQ、微博、Twitter等）
 * - 5.2: 打开对应的分享界面，预填充文章标题、摘要和链接
 * - 5.3: 提供一键复制文章链接的功能并显示复制成功提示
 * 
 * 技术特性:
 * - 基于 shadcn/ui Button 和 Tooltip 组件
 * - 支持主题切换和暗色模式
 * - 响应式设计，移动端和桌面端适配
 * - 完整的键盘导航和无障碍性支持
 * - TypeScript 严格类型定义
 */

'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Twitter, 
  MessageCircle, 
  Share2, 
  Copy, 
  CheckCircle,
  ExternalLink,
  Facebook,
  Linkedin
} from 'lucide-react';

// 导入 shadcn/ui 组件
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

/**
 * SocialShare 组件属性接口
 */
export interface SocialShareProps {
  /**
   * 文章标题
   */
  title: string;
  
  /**
   * 分享URL
   */
  url: string;
  
  /**
   * 文章摘要/描述
   */
  description?: string;
  
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 显示模式：compact（紧凑）| expanded（展开）
   * @default 'expanded'
   */
  variant?: 'compact' | 'expanded';
  
  /**
   * 按钮大小
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  
  /**
   * 是否显示分享标题
   * @default true
   */
  showTitle?: boolean;
  
  /**
   * 复制成功回调函数
   */
  onCopySuccess?: () => void;
  
  /**
   * 分享按钮点击回调函数
   */
  onShare?: (platform: string, url: string) => void;
}

/**
 * 社交平台配置接口
 */
interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  shareUrl: (title: string, url: string, description?: string) => string;
  ariaLabel: string;
}

/**
 * 社交平台配置
 */
const socialPlatforms: SocialPlatform[] = [
  {
    id: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    color: 'hover:bg-blue-500 hover:text-white',
    shareUrl: (title, url, description) => 
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}${description ? `&via=${encodeURIComponent(description)}` : ''}`,
    ariaLabel: '分享到 Twitter'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'hover:bg-blue-600 hover:text-white',
    shareUrl: (title, url) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
    ariaLabel: '分享到 Facebook'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'hover:bg-blue-700 hover:text-white',
    shareUrl: (title, url, description) => 
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}${description ? `&summary=${encodeURIComponent(description)}` : ''}`,
    ariaLabel: '分享到 LinkedIn'
  },
  {
    id: 'weibo',
    name: '微博',
    icon: Share2,
    color: 'hover:bg-red-500 hover:text-white',
    shareUrl: (title, url) => 
      `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    ariaLabel: '分享到新浪微博'
  },
  {
    id: 'wechat',
    name: '微信',
    icon: MessageCircle,
    color: 'hover:bg-green-500 hover:text-white',
    shareUrl: () => '', // 微信需要特殊处理
    ariaLabel: '分享到微信（复制链接）'
  }
];

/**
 * 分享按钮组件
 */
interface ShareButtonProps {
  platform: SocialPlatform;
  title: string;
  url: string;
  description?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'compact' | 'expanded';
  onShare?: (platform: string, url: string) => void;
  onCopyForWechat?: () => void;
}

const ShareButton = React.memo<ShareButtonProps>(({ 
  platform, 
  title, 
  url, 
  description, 
  size = 'default',
  variant = 'expanded',
  onShare,
  onCopyForWechat
}) => {
  const handleClick = useCallback(() => {
    if (platform.id === 'wechat') {
      // 微信分享通过复制链接实现
      onCopyForWechat?.();
      return;
    }
    
    const shareUrl = platform.shareUrl(title, url, description);
    if (shareUrl) {
      // 记录分享事件
      onShare?.(platform.id, shareUrl);
      
      // 打开分享窗口
      window.open(
        shareUrl,
        '_blank',
        'width=600,height=400,scrollbars=yes,resizable=yes'
      );
    }
  }, [platform, title, url, description, onShare, onCopyForWechat]);

  const IconComponent = platform.icon;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          onClick={handleClick}
          className={cn(
            // 基础样式
            'transition-all duration-200 ease-in-out',
            'border border-border hover:border-border-hover',
            'bg-background hover:bg-accent',
            
            // 悬停动画效果
            'transform hover:scale-105 hover:shadow-md',
            'active:scale-95',
            
            // 平台特色样式
            platform.color,
            
            // 响应式设计
            variant === 'compact' ? 'p-2' : 'p-3',
            
            // 焦点状态
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
          aria-label={platform.ariaLabel}
        >
          <IconComponent 
            className={cn(
              size === 'sm' ? 'h-4 w-4' : 
              size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
            )} 
          />
          {variant === 'expanded' && (
            <span className="ml-2 text-sm font-medium">
              {platform.name}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        <p className="text-sm">{platform.ariaLabel}</p>
      </TooltipContent>
    </Tooltip>
  );
});
ShareButton.displayName = 'ShareButton';

/**
 * 复制链接按钮组件
 */
interface CopyLinkButtonProps {
  url: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'compact' | 'expanded';
  onCopySuccess?: () => void;
}

const CopyLinkButton = React.memo<CopyLinkButtonProps>(({ 
  url, 
  size = 'default',
  variant = 'expanded',
  onCopySuccess 
}) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onCopySuccess?.();
      
      // 2秒后重置状态
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制链接失败:', error);
      
      // 降级方案：创建临时输入框复制
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopied(true);
        onCopySuccess?.();
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('降级复制方案也失败了:', fallbackError);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }, [url, onCopySuccess]);

  const IconComponent = copied ? CheckCircle : Copy;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          onClick={handleCopy}
          disabled={copied}
          className={cn(
            // 基础样式
            'transition-all duration-200 ease-in-out',
            'border border-border hover:border-border-hover',
            'bg-background',
            
            // 成功状态样式
            copied 
              ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-200' 
              : 'hover:bg-accent hover:bg-slate-500 hover:text-white',
            
            // 悬停动画效果
            !copied && 'transform hover:scale-105 hover:shadow-md active:scale-95',
            
            // 响应式设计
            variant === 'compact' ? 'p-2' : 'p-3',
            
            // 焦点状态
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
          aria-label={copied ? '链接已复制' : '复制文章链接'}
        >
          <IconComponent 
            className={cn(
              size === 'sm' ? 'h-4 w-4' : 
              size === 'lg' ? 'h-6 w-6' : 'h-5 w-5',
              copied && 'text-green-600'
            )} 
          />
          {variant === 'expanded' && (
            <span className="ml-2 text-sm font-medium">
              {copied ? '已复制' : '复制链接'}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        <p className="text-sm">
          {copied ? '链接已复制到剪贴板' : '复制文章链接'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
});
CopyLinkButton.displayName = 'CopyLinkButton';

/**
 * SocialShare 社交分享组件
 * 
 * 提供完整的社交媒体分享功能，包括：
 * - 多个主流社交平台支持
 * - 一键复制链接功能
 * - 悬停动画和视觉反馈
 * - 响应式设计和无障碍性支持
 * - 完整的键盘导航支持
 */
export function SocialShare({
  title,
  url,
  description,
  className,
  variant = 'expanded',
  size = 'default',
  showTitle = true,
  onCopySuccess,
  onShare
}: SocialShareProps) {
  
  // 处理微信分享（通过复制链接）
  const handleWechatShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      onCopySuccess?.();
      // 可以显示微信分享提示
      console.log('链接已复制，请在微信中粘贴分享');
    } catch (error) {
      console.error('复制链接失败:', error);
    }
  }, [url, onCopySuccess]);

  return (
    <TooltipProvider>
      <div 
        className={cn(
          'social-share-container',
          'bg-card border border-border rounded-lg p-4',
          'transition-all duration-300 ease-in-out',
          className
        )}
        role="region"
        aria-label="社交分享"
      >
        {/* 分享标题 */}
        {showTitle && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
              分享文章
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              分享这篇精彩的文章给更多朋友
            </p>
          </div>
        )}

        {/* 分享按钮网格 */}
        <div 
          className={cn(
            'grid gap-3',
            variant === 'compact' 
              ? 'grid-cols-6 sm:grid-cols-8' 
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
          )}
          role="group"
          aria-label="社交平台分享按钮"
        >
          {/* 社交平台分享按钮 */}
          {socialPlatforms.map((platform) => (
            <ShareButton
              key={platform.id}
              platform={platform}
              title={title}
              url={url}
              description={description}
              size={size}
              variant={variant}
              onShare={onShare}
              onCopyForWechat={handleWechatShare}
            />
          ))}
          
          {/* 复制链接按钮 */}
          <CopyLinkButton
            url={url}
            size={size}
            variant={variant}
            onCopySuccess={onCopySuccess}
          />
        </div>

        {/* 底部提示信息 */}
        {variant === 'expanded' && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              选择平台分享，或复制链接手动分享
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * SocialShare 组件默认导出
 * 提供向后兼容性
 */
export default SocialShare;