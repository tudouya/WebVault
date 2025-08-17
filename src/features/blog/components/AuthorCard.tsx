"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Twitter, 
  Github, 
  Linkedin, 
  Globe, 
  Mail, 
  UserPlus, 
  FileText, 
  Heart, 
  Users 
} from "lucide-react";
import type { BlogAuthorDetail } from "../types/detail";

interface AuthorCardProps {
  /** 作者详细信息 */
  author: BlogAuthorDetail;
  
  /** 自定义样式类 */
  className?: string;
  
  /** 关注按钮点击回调 */
  onFollowClick?: (authorId: string) => void;
  
  /** 社交链接点击回调 */
  onSocialClick?: (platform: string, url: string) => void;
  
  /** 是否已关注该作者 */
  isFollowing?: boolean;
  
  /** 是否显示关注按钮 */
  showFollowButton?: boolean;
  
  /** 是否显示统计信息 */
  showStats?: boolean;
}

/**
 * 社交平台图标映射
 */
const socialIcons = {
  twitter: Twitter,
  github: Github,
  linkedin: Linkedin,
  website: Globe,
  email: Mail,
} as const;

/**
 * 社交平台显示名称映射
 */
const socialLabels = {
  twitter: 'Twitter',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  website: 'Website',
  email: 'Email',
} as const;

/**
 * 作者信息卡片组件
 * 
 * 在博客详情页面右侧展示作者信息，包含作者头像、姓名、简介和社交链接
 * 支持关注功能和作者统计数据展示（如文章数、关注者数量等）
 * 
 * 功能特性:
 * - 圆形作者头像展示，支持懒加载和错误回退
 * - 作者姓名和简介信息展示
 * - 社交媒体链接按钮（Twitter, GitHub, LinkedIn, Website, Email）
 * - 关注/取消关注按钮，支持状态切换
 * - 作者统计数据：文章数、获赞数、关注者数
 * - 悬停效果和过渡动画
 * - 无障碍访问支持（键盘导航、屏幕阅读器）
 * - 响应式设计，适配移动端和桌面端
 * 
 * @example
 * ```tsx
 * <AuthorCard 
 *   author={blogAuthor}
 *   showFollowButton={true}
 *   showStats={true}
 *   onFollowClick={(authorId) => handleFollow(authorId)}
 *   onSocialClick={(platform, url) => window.open(url, '_blank')}
 * />
 * ```
 */
const AuthorCard = React.memo(function AuthorCard({
  author,
  className,
  onFollowClick,
  onSocialClick,
  isFollowing = false,
  showFollowButton = true,
  showStats = true,
}: AuthorCardProps) {
  // 头像加载错误状态
  const [avatarError, setAvatarError] = useState(false);
  
  // 关注按钮加载状态
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // 处理头像加载错误
  const handleAvatarError = useCallback(() => {
    setAvatarError(true);
  }, []);

  // 处理关注按钮点击
  const handleFollowClick = useCallback(async () => {
    if (!onFollowClick || isFollowLoading) return;
    
    setIsFollowLoading(true);
    try {
      await onFollowClick(author.name); // 使用作者名称作为ID的简化实现
    } finally {
      setIsFollowLoading(false);
    }
  }, [onFollowClick, author.name, isFollowLoading]);

  // 处理社交链接点击
  const handleSocialClick = useCallback((platform: string, url: string) => {
    if (onSocialClick) {
      onSocialClick(platform, url);
    } else {
      // 默认行为：在新窗口打开链接
      if (platform === 'email') {
        window.location.href = `mailto:${url}`;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  }, [onSocialClick]);

  // 格式化数量显示（如 1.2k, 5.8k）
  const formatCount = useCallback((count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
    return `${Math.floor(count / 1000)}k`;
  }, []);

  // 渲染社交链接按钮
  const renderSocialLinks = () => {
    if (!author.socialLinks) return null;
    
    const socialEntries = Object.entries(author.socialLinks).filter(([, url]) => url);
    
    if (socialEntries.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {socialEntries.map(([platform, url]) => {
          const IconComponent = socialIcons[platform as keyof typeof socialIcons];
          const label = socialLabels[platform as keyof typeof socialLabels];
          
          if (!IconComponent || !url) return null;

          return (
            <Button
              key={platform}
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
              onClick={() => handleSocialClick(platform, url)}
              title={`Visit ${label}`}
              aria-label={`Visit ${author.name}'s ${label}`}
            >
              <IconComponent className="w-3 h-3 mr-1" />
              {label}
            </Button>
          );
        })}
      </div>
    );
  };

  // 渲染统计信息
  const renderStats = () => {
    if (!showStats || !author.stats) return null;

    const stats = [
      {
        icon: FileText,
        label: 'Posts',
        value: author.stats.postsCount,
        color: 'text-blue-600',
      },
      {
        icon: Heart,
        label: 'Likes',
        value: author.stats.totalLikes,
        color: 'text-red-500',
      },
      {
        icon: Users,
        label: 'Followers',
        value: author.stats.followersCount,
        color: 'text-green-600',
      },
    ];

    return (
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Icon className={cn("w-4 h-4", color)} />
            </div>
            <div className="text-lg font-semibold text-foreground">
              {formatCount(value)}
            </div>
            <div className="text-xs text-muted-foreground">
              {label}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card 
      className={cn(
        "w-full bg-white dark:bg-card border shadow-sm",
        "transition-all duration-300 hover:shadow-md hover:shadow-primary/5",
        className
      )}
    >
      <CardHeader className="pb-4">
        {/* 作者头像和基本信息 */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* 作者头像 */}
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted ring-4 ring-background shadow-sm">
            {author.avatar && !avatarError ? (
              <Image
                src={author.avatar}
                alt={`${author.name}'s avatar`}
                fill
                className="object-cover"
                sizes="80px"
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                onError={handleAvatarError}
                unoptimized={false}
              />
            ) : (
              /* 默认头像占位符 */
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-2xl font-bold text-primary">
                {author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* 作者姓名 */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-1">
              {author.name}
            </h3>
            
            {/* 作者简介 */}
            {author.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {author.bio}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* 关注按钮 */}
        {showFollowButton && (
          <Button
            onClick={handleFollowClick}
            disabled={isFollowLoading}
            variant={isFollowing ? "outline" : "default"}
            className="w-full transition-all duration-200"
            aria-label={isFollowing ? `Unfollow ${author.name}` : `Follow ${author.name}`}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {isFollowLoading ? (
              <span className="flex items-center">
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-2" />
                {isFollowing ? 'Unfollowing...' : 'Following...'}
              </span>
            ) : (
              <span>{isFollowing ? 'Following' : 'Follow'}</span>
            )}
          </Button>
        )}

        {/* 社交链接 */}
        {renderSocialLinks()}

        {/* 作者统计信息 */}
        {renderStats()}
      </CardContent>
    </Card>
  );
});

export { AuthorCard };
export default AuthorCard;