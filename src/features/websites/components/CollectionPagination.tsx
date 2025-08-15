import React from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CollectionPaginationProps {
  className?: string;
  showPageNumbers?: number; // 显示多少个页码数字，默认为5
  
  // 分页状态 - 直接接收props而不依赖store
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  
  // 分页控制回调
  onPageChange?: (page: number) => void;
}

/**
 * 集合页面分页导航组件
 * 
 * 专门为集合索引页面设计的分页组件，与collection-store集成
 * 功能特性：
 * - 独立于homepage-store，支持collection页面的分页需求
 * - 显示页码数字和下一页箭头导航
 * - 自动处理禁用状态（最后一页禁用下一页按钮）
 * - 页面切换时保持筛选和排序状态
 * - 响应式设计，移动端优化
 * - 支持URL状态同步和浏览器历史记录
 */
export function CollectionPagination({ 
  className, 
  showPageNumbers = 5,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange 
}: CollectionPaginationProps) {
  // 确保有合理的默认值和边界检查
  const safeTotalPages = Math.max(totalPages, 1);
  const safeTotalItems = Math.max(totalItems, 0);
  const safeCurrentPage = Math.max(Math.min(currentPage, safeTotalPages), 1);
  const safeItemsPerPage = Math.max(itemsPerPage, 1);

  // 如果只有一页或没有数据，不显示分页
  if (safeTotalPages <= 1 || safeTotalItems === 0) {
    return null;
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= safeTotalPages && page !== safeCurrentPage) {
      onPageChange?.(page);
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
        "pagination-transition", // 添加分页过渡动画效果
        className
      )}
      role="navigation"
      aria-label="集合分页导航"
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
        共 {safeTotalItems.toLocaleString()} 个集合
      </div>
    </div>
  );
}

export default CollectionPagination;