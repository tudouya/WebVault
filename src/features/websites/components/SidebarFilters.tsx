'use client'

import React from 'react'

import { Button } from '@/components/ui/button'
import type { CategoryNode } from '@/features/categories/types'
import { cn } from '@/lib/utils'
import { ChevronDown, X } from 'lucide-react'

interface SidebarFiltersProps {
  /** 分类树数据 */
  categories?: CategoryNode[]
  /** 当前选中分类 ID，null 表示全部分类 */
  selectedCategoryId?: string | null
  /** 分类选择回调 */
  onSelectCategory?: (categoryId: string | null) => void
  /** 分类加载错误 */
  errorMessage?: string | null
  /** 是否在移动端折叠 */
  isMobileCollapsed?: boolean
  /** 移动端折叠切换 */
  onMobileToggle?: () => void
  /** 加载状态 */
  isLoading?: boolean
  /** 自定义类名 */
  className?: string
}

export function SidebarFilters({
  categories: rawCategories,
  selectedCategoryId = null,
  onSelectCategory,
  errorMessage,
  isMobileCollapsed = true,
  onMobileToggle,
  isLoading = false,
  className,
}: SidebarFiltersProps) {
  const categories = React.useMemo(
    () => (Array.isArray(rawCategories) ? rawCategories : []),
    [rawCategories],
  )

  /**
   * 从后端返回的分类树中提取网站数量信息
   * 注意：后端(categoriesService)已经递归聚合了子分类的网站数量到websiteCount字段
   * 所以这里直接使用websiteCount，不需要再次聚合，避免重复计算
   */
  const categoryCountInfo = React.useMemo(() => {
    const map = new Map<string, number>()

    // 递归遍历分类树，直接使用后端计算好的websiteCount
    const traverseCategories = (nodes: CategoryNode[]) => {
      nodes.forEach((node) => {
        // 直接使用后端已经聚合好的数量（包含子分类）
        const count = typeof node.websiteCount === "number" ? node.websiteCount : 0
        map.set(node.id, count)

        // 递归处理子分类
        if (Array.isArray(node.children) && node.children.length > 0) {
          traverseCategories(node.children)
        }
      })
    }

    traverseCategories(categories)

    // 计算顶级分类的总数（不包含重复）
    const topLevelTotal = categories.reduce(
      (sum, node) => sum + (typeof node.websiteCount === "number" ? node.websiteCount : 0),
      0
    )

    return {
      map,
      total: topLevelTotal,
    }
  }, [categories])

  const totalCategoryCount = categoryCountInfo.total
  const categoryCountMap = categoryCountInfo.map

  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    setExpandedGroups((prev) => {
      const next = new Set<string>()

      categories.forEach((category) => {
        if (prev.has(category.id)) {
          next.add(category.id)
        }
      })

      if (next.size === 0 && categories[0]) {
        next.add(categories[0].id)
      }

      return next
    })
  }, [categories])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleCategorySelect = (categoryId: string | null) => {
    onSelectCategory?.(categoryId)
  }

  return (
    <div className={cn('relative', className)}>
      {/* 移动端遮罩层 */}
      {!isMobileCollapsed && (
        <div
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onMobileToggle}
          aria-hidden="true"
        />
      )}

      {/* 筛选面板主体 */}
      <div
        className={cn(
          'lg:block lg:space-y-6',
          'fixed left-0 top-0 z-30 h-full w-80 transform transition-transform duration-300 ease-in-out',
          'lg:relative lg:w-full lg:h-auto lg:transform-none',
          'bg-background border-r border-border lg:bg-transparent lg:border-r-0',
          isMobileCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0',
        )}
        aria-label="筛选和分类导航"
      >
        {/* 移动端头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border lg:hidden">
          <h3 className="text-lg font-semibold">筛选器</h3>
          <Button variant="ghost" size="icon" onClick={onMobileToggle} aria-label="关闭筛选面板">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 筛选内容 */}
        <div className="p-4 lg:p-0 space-y-6">
          {/* All Categories 按钮 */}
          <div>
            <Button
              variant={selectedCategoryId === null ? 'default' : 'outline'}
              className={cn(
                'w-full justify-start text-left h-auto py-3 px-4',
                selectedCategoryId === null
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border-border hover:bg-muted',
              )}
              onClick={() => handleCategorySelect(null)}
              disabled={isLoading}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <span className="font-medium">全部分类</span>
                <span
                  className={cn(
                    'inline-flex min-w-[2.25rem] justify-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-200',
                    selectedCategoryId === null
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {totalCategoryCount}
                </span>
              </div>
            </Button>
          </div>

          {/* 分类层次结构 */}
          <div className="space-y-1">
            {categories.map((group) => {
              const children = group.children ?? []
              const hasChildren = children.length > 0
              const isExpanded = expandedGroups.has(group.id)
              const groupCount = categoryCountMap.get(group.id) ?? 0

              return (
                <div key={group.id} className="space-y-1">
                  <button
                    className={cn(
                      'group flex w-full items-center justify-between py-3 px-4 text-sm font-semibold',
                      'bg-muted/30 hover:bg-muted/60 rounded-lg transition-all duration-200',
                      'border border-transparent hover:border-border/50',
                      hasChildren && isExpanded
                        ? 'text-foreground bg-muted/60 border-border/50 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => {
                      if (hasChildren) {
                        toggleGroup(group.id)
                      } else {
                        handleCategorySelect(group.id)
                      }
                    }}
                    disabled={isLoading}
                  >
                    <span className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors duration-200',
                          hasChildren && isExpanded ? 'bg-primary' : 'bg-muted-foreground/40',
                        )}
                      />
                      <span className="font-medium text-foreground">{group.name}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-200',
                          selectedCategoryId === group.id
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {groupCount}
                      </span>
                      {hasChildren ? (
                        <div className={cn('transition-transform duration-200', isExpanded && 'rotate-180')}>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 transition-colors duration-200',
                              isExpanded ? 'text-foreground' : 'text-muted-foreground',
                            )}
                          />
                        </div>
                      ) : (
                        selectedCategoryId === group.id ? (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        ) : null
                      )}
                    </span>
                  </button>

                  {hasChildren ? (
                    isExpanded && (
                      <div className="ml-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {children.map((child, index) => {
                          const childCount = categoryCountMap.get(child.id) ?? 0
                          return (
                            <button
                              key={child.id}
                              className={cn(
                                'flex w-full items-center gap-3 py-2.5 px-4 text-sm',
                                'rounded-md transition-all duration-200 text-left group relative',
                                selectedCategoryId === child.id
                                  ? 'text-primary font-medium bg-primary/10 border-l-2 border-primary shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                              )}
                              onClick={() => handleCategorySelect(child.id)}
                              disabled={isLoading}
                              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                            >
                              <div
                                className={cn(
                                  'w-3 h-px bg-border transition-colors duration-200',
                                  selectedCategoryId === child.id ? 'bg-primary/30' : 'group-hover:bg-border',
                                )}
                              />
                              <span className="flex-1">{child.name}</span>
                              <span
                                className={cn(
                                  'inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-200',
                                  selectedCategoryId === child.id
                                    ? 'bg-primary/15 text-primary'
                                    : 'bg-muted text-muted-foreground',
                                )}
                              >
                                {childCount}
                              </span>
                              {selectedCategoryId === child.id && (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )
                  ) : (
                    <div className="ml-2">
                      <button
                        className={cn(
                          'flex w-full items-center gap-3 py-2.5 px-4 text-sm',
                          'rounded-md transition-all duration-200 text-left group',
                          selectedCategoryId === group.id
                            ? 'text-primary font-medium bg-primary/10 border-l-2 border-primary shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                        )}
                        onClick={() => handleCategorySelect(group.id)}
                        disabled={isLoading}
                      >
                        <div
                          className={cn(
                            'w-3 h-px bg-border transition-colors duration-200',
                            selectedCategoryId === group.id ? 'bg-primary/30' : 'group-hover:bg-border',
                          )}
                        />
                        <span className="flex-1">{group.name}</span>
                        <span
                          className={cn(
                            'inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-200',
                            selectedCategoryId === group.id
                              ? 'bg-primary/15 text-primary'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {groupCount}
                        </span>
                        {selectedCategoryId === group.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {!isLoading && categories.length === 0 && !errorMessage && (
              <div className="rounded-md border border-dashed border-muted-foreground/40 px-4 py-6 text-center text-sm text-muted-foreground">
                暂无可用分类
              </div>
            )}
          </div>

          {errorMessage && !isLoading && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          {/* 重置按钮 */}
          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                handleCategorySelect(null)
                setExpandedGroups(() => {
                  if (categories[0]) {
                    return new Set([categories[0].id])
                  }
                  return new Set()
                })
              }}
              disabled={isLoading}
            >
              重置筛选
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SidebarFilters
