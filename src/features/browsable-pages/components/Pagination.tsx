/**
 * 通用分页导航组件
 * 
 * 为BrowsablePageLayout提供分页导航功能，支持：
 * - 页码数字显示和导航
 * - 下一页箭头导航
 * - 页面切换时滚动到顶部
 * - 响应式设计和移动端优化
 * - 完全受控组件，不依赖特定store
 * 
 * 需求引用:
 * - 需求6.1: 内容超过单页显示限制时在内容区域底部显示分页控件
 * - 需求6.3: 用户点击页码时导航到对应页面并更新内容显示
 * - 需求6.6: 分页切换时平滑滚动到页面顶部
 */

import React from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  /** 当前页码 */
  currentPage: number;
  /** 总页数 */
  totalPages: number;
  /** 总项目数 */
  totalItems: number;
  /** 每页项目数 */
  itemsPerPage: number;
  /** 显示多少个页码数字，默认为5 */
  showPageNumbers?: number;
  /** 页面变更回调 */
  onPageChange: (page: number) => void;
  /** 自定义CSS类名 */
  className?: string;
  /** 页面切换时是否滚动到顶部 */
  scrollToTop?: boolean;
  /** 滚动目标元素选择器或引用 */
  scrollTarget?: string | HTMLElement;
}

/**
 * 平滑滚动到页面顶部或指定元素
 */
const scrollToElement = (target?: string | HTMLElement) => {
  let element: HTMLElement | null = null;
  
  if (typeof target === 'string') {
    element = document.querySelector(target);
  } else if (target instanceof HTMLElement) {
    element = target;
  }
  
  // 如果没有指定目标，滚动到页面顶部
  if (!element) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  
  // 滚动到指定元素
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * 通用分页导航组件
 * 
 * 功能特性：
 * - 显示页码数字和下一页箭头导航
 * - 自动处理禁用状态（最后一页禁用下一页按钮）
 * - 页面切换时可选的滚动到顶部功能
 * - 响应式设计，移动端优化
 * - 完全受控，适用于任何分页场景
 */
export function Pagination({ 
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  showPageNumbers = 5, 
  onPageChange,
  className,
  scrollToTop = true,
  scrollTarget,
}: PaginationProps) {
  // 确保有合理的默认值
  const safeTotalPages = Math.max(totalPages, 1);
  const safeCurrentPage = Math.max(Math.min(currentPage, safeTotalPages), 1);

  // 如果只有一页或没有数据，不显示分页
  if (safeTotalPages <= 1 || totalItems === 0) {
    return null;
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= safeTotalPages && page !== safeCurrentPage) {
      onPageChange(page);
      
      // 需求6.6: 分页切换时平滑滚动到页面顶部
      if (scrollToTop) {
        // 使用setTimeout确保页面内容更新后再滚动
        setTimeout(() => {
          scrollToElement(scrollTarget);
        }, 100);
      }
    }
  };

  const handleNextPage = () => {
    if (safeCurrentPage < safeTotalPages) {
      handlePageChange(safeCurrentPage + 1);
    }
  };

  // 计算显示的页码范围
  const getPageRange = () => {
    const half = Math.floor(showPageNumbers / 2);
    let start = Math.max(1, safeCurrentPage - half);
    let end = Math.min(safeTotalPages, start + showPageNumbers - 1);
    
    // 调整开始位置，确保显示足够的页码
    if (end - start + 1 < showPageNumbers) {
      start = Math.max(1, end - showPageNumbers + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const pageRange = getPageRange();
  const isLastPage = safeCurrentPage >= safeTotalPages;

  return (
    <div 
      className={cn(
        "flex items-center justify-center gap-2 py-6",
        className
      )}
      role="navigation"
      aria-label="分页导航"
    >
      {/* 页码数字按钮 */}
      <div className="flex items-center gap-1">
        {/* 显示第一页（如果不在当前范围内） */}
        {pageRange[0] > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(1)}
              className={cn(
                "w-10 h-10 p-0 text-sm font-medium",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label="转到第1页"
            >
              1
            </Button>
            {pageRange[0] > 2 && (
              <span className="px-2 text-muted-foreground text-sm">...</span>
            )}
          </>
        )}

        {/* 当前范围的页码 */}
        {pageRange.map((page) => (
          <Button
            key={page}
            variant={page === safeCurrentPage ? "default" : "ghost"}
            size="sm"
            onClick={() => handlePageChange(page)}
            className={cn(
              "w-10 h-10 p-0 text-sm font-medium",
              page === safeCurrentPage
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-label={page === safeCurrentPage ? `当前页 ${page}` : `转到第${page}页`}
            aria-current={page === safeCurrentPage ? "page" : undefined}
          >
            {page}
          </Button>
        ))}

        {/* 显示最后一页（如果不在当前范围内） */}
        {pageRange[pageRange.length - 1] < safeTotalPages && (
          <>
            {pageRange[pageRange.length - 1] < safeTotalPages - 1 && (
              <span className="px-2 text-muted-foreground text-sm">...</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(safeTotalPages)}
              className={cn(
                "w-10 h-10 p-0 text-sm font-medium",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label={`转到第${safeTotalPages}页`}
            >
              {safeTotalPages}
            </Button>
          </>
        )}
      </div>

      {/* 下一页箭头按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNextPage}
        disabled={isLastPage}
        className={cn(
          "w-10 h-10 p-0 ml-2",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
        aria-label={isLastPage ? "已是最后一页" : "下一页"}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* 页面信息（移动端隐藏） */}
      <div className="hidden sm:flex items-center ml-4 text-sm text-muted-foreground">
        第 {safeCurrentPage} 页，共 {safeTotalPages} 页
        <span className="mx-2">•</span>
        共 {totalItems.toLocaleString()} 项
      </div>
    </div>
  );
}

export default Pagination;