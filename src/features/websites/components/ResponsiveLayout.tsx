/**
 * ResponsiveLayout 组件
 * 
 * 提供响应式布局优化，专门处理移动端和平板端的用户体验
 * 支持侧边栏折叠、汉堡菜单、触摸友好的交互体验
 * 
 * 需求引用:
 * - 11.0: 布局和间距系统 - 断点系统和响应式布局
 * - 12.0: 交互效果和动画 - 平滑过渡动画和触摸交互
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Menu, X, Filter } from 'lucide-react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Button } from '@/components/ui/button';

/**
 * 断点配置 - 基于Tailwind CSS断点系统
 */
const BREAKPOINTS = {
  mobile: 768,   // < 768px
  tablet: 1024,  // 768px - 1024px 
  desktop: 1024  // > 1024px
} as const;

/**
 * ResponsiveLayout组件属性接口
 */
export interface ResponsiveLayoutProps {
  /**
   * 子组件内容
   */
  children: React.ReactNode;
  
  /**
   * 侧边栏内容
   */
  sidebar?: React.ReactNode;
  
  /**
   * 导航栏内容
   */
  header?: React.ReactNode;
  
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 是否显示侧边栏
   * @default true
   */
  showSidebar?: boolean;
  
  /**
   * 侧边栏宽度（桌面端）
   * @default 256
   */
  sidebarWidth?: number;
  
  /**
   * 是否启用移动端汉堡菜单
   * @default true
   */
  enableMobileMenu?: boolean;
  
  /**
   * 侧边栏标题
   * @default '筛选器'
   */
  sidebarTitle?: string;
  
  /**
   * 移动端侧边栏打开时的回调
   */
  onMobileSidebarOpen?: () => void;
  
  /**
   * 移动端侧边栏关闭时的回调
   */
  onMobileSidebarClose?: () => void;
  
  /**
   * 屏幕尺寸变化时的回调
   */
  onBreakpointChange?: (breakpoint: 'mobile' | 'tablet' | 'desktop') => void;
}

/**
 * 屏幕尺寸检测Hook
 */
function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS.mobile) {
        setBreakpoint('mobile');
      } else if (width < BREAKPOINTS.tablet) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    // 初始化
    updateBreakpoint();

    // 添加监听器
    window.addEventListener('resize', updateBreakpoint);
    
    return () => {
      window.removeEventListener('resize', updateBreakpoint);
    };
  }, []);

  return breakpoint;
}

/**
 * 移动端侧边栏组件
 */
interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  sidebarWidth: number;
}

function MobileSidebar({ isOpen, onClose, title, children, sidebarWidth }: MobileSidebarProps) {
  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <Collapsible.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* 遮罩层 */}
      <Collapsible.Content
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden",
          "transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 侧边栏主体 */}
      <Collapsible.Content
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-background border-r border-border lg:hidden",
          "transform transition-transform duration-300 ease-in-out",
          "shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          width: `${sidebarWidth}px`,
        }}
        aria-label="移动端侧边栏"
      >
        <div className="flex h-full flex-col">
          {/* 头部区域 - 触摸友好设计 */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            
            {/* 关闭按钮 - 确保最小44px触摸目标 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={cn(
                "h-11 w-11 rounded-lg", // 44px触摸目标
                "hover:bg-muted active:scale-95",
                "transition-all duration-200 ease-in-out"
              )}
              aria-label="关闭侧边栏"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

/**
 * 桌面端侧边栏组件
 */
interface DesktopSidebarProps {
  children: React.ReactNode;
  title: string;
  sidebarWidth: number;
  className?: string;
}

function DesktopSidebar({ children, title, sidebarWidth, className }: DesktopSidebarProps) {
  return (
    <aside 
      className={cn(
        "hidden lg:block fixed left-0 top-0 z-30 h-full",
        "bg-gradient-to-b from-primary/5 to-primary/10 border-r border-border",
        "transition-all duration-300 ease-in-out",
        className
      )}
      style={{
        width: `${sidebarWidth}px`,
      }}
      aria-label="桌面端侧边栏"
    >
      <div className="flex h-full flex-col">
        {/* 头部区域 */}
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {title}
          </h2>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </aside>
  );
}

/**
 * 移动端筛选按钮组件
 */
interface MobileFilterButtonProps {
  onClick: () => void;
  isActive: boolean;
}

function MobileFilterButton({ onClick, isActive }: MobileFilterButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={isActive ? "default" : "outline"}
      className={cn(
        // 触摸友好尺寸 - 最小44px高度
        "h-11 px-4 rounded-lg",
        "inline-flex items-center gap-2",
        // 平滑交互动画
        "hover:scale-105 active:scale-95",
        "transition-all duration-200 ease-in-out",
        "transform-gpu", // 硬件加速
        // 移动端优化
        "touch-manipulation", // 禁用双击缩放
        "lg:hidden" // 仅在移动端显示
      )}
      aria-label="打开筛选面板"
    >
      <Filter className="h-4 w-4" />
      <span className="text-sm font-medium">筛选器</span>
    </Button>
  );
}

/**
 * 汉堡菜单按钮组件
 */
interface HamburgerButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

function HamburgerButton({ onClick, isOpen }: HamburgerButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        // 触摸友好尺寸
        "h-11 w-11 rounded-lg lg:hidden",
        // 平滑交互动画
        "hover:bg-muted active:scale-95",
        "transition-all duration-200 ease-in-out",
        "transform-gpu"
      )}
      aria-label={isOpen ? "关闭菜单" : "打开菜单"}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <Menu className="h-5 w-5" />
      )}
    </Button>
  );
}

/**
 * ResponsiveLayout 响应式布局组件
 * 
 * 提供跨设备一致的用户体验，包含：
 * - 移动端汉堡菜单和侧边栏折叠
 * - 平板端适配的布局调整
 * - 桌面端固定侧边栏布局
 * - 触摸友好的交互体验(最小44px触摸目标)
 * - 平滑的过渡动画效果
 */
export function ResponsiveLayout({
  children,
  sidebar,
  header,
  className,
  showSidebar = true,
  sidebarWidth = 256,
  enableMobileMenu = true,
  sidebarTitle = '筛选器',
  onMobileSidebarOpen,
  onMobileSidebarClose,
  onBreakpointChange,
}: ResponsiveLayoutProps) {
  // 响应式状态管理
  const breakpoint = useBreakpoint();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 断点变化回调
  useEffect(() => {
    onBreakpointChange?.(breakpoint);
    
    // 在非移动端自动关闭移动端侧边栏
    if (breakpoint !== 'mobile' && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [breakpoint, isMobileSidebarOpen, onBreakpointChange]);

  // 移动端侧边栏控制
  const handleMobileSidebarOpen = useCallback(() => {
    setIsMobileSidebarOpen(true);
    onMobileSidebarOpen?.();
  }, [onMobileSidebarOpen]);

  const handleMobileSidebarClose = useCallback(() => {
    setIsMobileSidebarOpen(false);
    onMobileSidebarClose?.();
  }, [onMobileSidebarClose]);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC键关闭移动端侧边栏
      if (event.key === 'Escape' && isMobileSidebarOpen) {
        handleMobileSidebarClose();
      }
      
      // Ctrl/Cmd + B 切换侧边栏 (仅移动端)
      if ((event.ctrlKey || event.metaKey) && event.key === 'b' && breakpoint === 'mobile') {
        event.preventDefault();
        if (isMobileSidebarOpen) {
          handleMobileSidebarClose();
        } else {
          handleMobileSidebarOpen();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileSidebarOpen, breakpoint, handleMobileSidebarOpen, handleMobileSidebarClose]);

  return (
    <div 
      className={cn(
        "min-h-screen bg-background",
        "relative overflow-hidden", // 防止移动端滚动问题
        className
      )}
    >
      {/* 头部导航栏 */}
      {header && (
        <div className="sticky top-0 z-40">
          {React.cloneElement(header as React.ReactElement, {
            // 为导航栏注入汉堡菜单按钮
            ...(enableMobileMenu && breakpoint === 'mobile' && {
              mobileMenuButton: (
                <HamburgerButton 
                  onClick={handleMobileSidebarOpen}
                  isOpen={isMobileSidebarOpen}
                />
              )
            })
          })}
        </div>
      )}

      <div className="relative flex">
        {/* 桌面端固定侧边栏 */}
        {showSidebar && sidebar && (
          <DesktopSidebar
            title={sidebarTitle}
            sidebarWidth={sidebarWidth}
          >
            {sidebar}
          </DesktopSidebar>
        )}

        {/* 移动端侧边栏 */}
        {showSidebar && sidebar && enableMobileMenu && (
          <MobileSidebar
            isOpen={isMobileSidebarOpen}
            onClose={handleMobileSidebarClose}
            title={sidebarTitle}
            sidebarWidth={sidebarWidth}
          >
            {sidebar}
          </MobileSidebar>
        )}

        {/* 主内容区域 */}
        <main 
          className={cn(
            "flex-1 min-h-0", // 防止flex子元素溢出
            // 响应式边距调整
            showSidebar && {
              'lg:ml-64': sidebarWidth === 256,
              [`lg:ml-[${sidebarWidth}px]`]: sidebarWidth !== 256,
            },
            // 内容区域内边距 - 基于8的倍数间距系统
            "px-4 py-6 sm:px-6 lg:px-8"
          )}
          style={{
            // 动态计算左边距以适应自定义侧边栏宽度
            ...(showSidebar && breakpoint === 'desktop' && {
              marginLeft: `${sidebarWidth}px`
            })
          }}
        >
          {/* 移动端筛选按钮 */}
          {showSidebar && sidebar && enableMobileMenu && breakpoint === 'mobile' && (
            <div className="mb-6">
              <MobileFilterButton
                onClick={handleMobileSidebarOpen}
                isActive={isMobileSidebarOpen}
              />
            </div>
          )}

          {/* 主要内容 */}
          <div 
            className={cn(
              "w-full transition-all duration-300 ease-in-out",
              // 内容区域最大宽度限制
              "max-w-full",
              // 响应式内容布局
              {
                'max-w-7xl mx-auto': breakpoint === 'desktop',
                'max-w-4xl mx-auto': breakpoint === 'tablet',
                'max-w-full': breakpoint === 'mobile'
              }
            )}
          >
            {children}
          </div>
        </main>
      </div>

      {/* 辅助功能增强 */}
      <div 
        id="responsive-layout-announcer" 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {isMobileSidebarOpen ? '侧边栏已打开' : ''}
        当前视图: {breakpoint === 'mobile' ? '移动端' : breakpoint === 'tablet' ? '平板端' : '桌面端'}
      </div>
    </div>
  );
}

/**
 * ResponsiveLayout组件默认导出
 */
export default ResponsiveLayout;