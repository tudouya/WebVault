"use client"

import { Fragment, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { CategoryNode } from "../types"

interface CategoryTreePanelProps {
  categories: CategoryNode[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  expandInstruction?: { expand: boolean; nonce: number } | null
}

export function CategoryTreePanel({
  categories,
  selectedId,
  onSelect,
  expandInstruction,
}: CategoryTreePanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!expandInstruction) return
    const { expand } = expandInstruction
    if (expand) {
      setExpanded(collectAllIds(categories))
    } else {
      setExpanded(new Set())
    }
  }, [expandInstruction, categories])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="h-[540px] overflow-y-auto rounded-md border">
      <div className="p-3">
        {categories.map((node) => (
          <CategoryBranch
            key={node.id}
            node={node}
            level={0}
            selectedId={selectedId}
            expanded={expanded}
            onToggle={toggleExpand}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

interface CategoryBranchProps {
  node: CategoryNode
  level: number
  selectedId?: string | null
  expanded: Set<string>
  onToggle: (id: string) => void
  onSelect?: (id: string) => void
}

function CategoryBranch({
  node,
  level,
  selectedId,
  expanded,
  onToggle,
  onSelect,
}: CategoryBranchProps) {
  const hasChildren = Boolean(node.children && node.children.length)
  const isExpanded = expanded.has(node.id)
  const isSelected = node.id === selectedId

  const indentation = {
    paddingLeft: `${level * 16}px`,
  }

  return (
    <Fragment>
      <div
        className={cn(
          "flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted",
          isSelected && "bg-primary/10 text-primary"
        )}
        style={indentation}
      >
        <div className="flex flex-1 items-center gap-2">
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onToggle(node.id)}
            >
              {isExpanded ? "-" : "+"}
            </Button>
          )}
          {!hasChildren && <span className="inline-block h-6 w-6" />}
          <button
            type="button"
            className="flex flex-1 items-center justify-between text-left"
            onClick={() => onSelect?.(node.id)}
          >
            <span className="truncate font-medium">{node.name}</span>
            <span className="flex items-center gap-2">
              {typeof node.websiteCount === "number" && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {node.websiteCount}
                </span>
              )}
              <StatusBadge status={node.status} />
            </span>
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {node.children?.map((child) => (
            <CategoryBranch
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </Fragment>
  )
}

function StatusBadge({ status }: { status: CategoryNode["status"] }) {
  switch (status) {
    case "active":
      return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600">启用</span>
    case "inactive":
      return <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600">停用</span>
    case "hidden":
      return <span className="rounded-full bg-slate-400/10 px-2 py-0.5 text-xs text-slate-500">隐藏</span>
    default:
      return null
  }
}

function collectAllIds(nodes: CategoryNode[]): Set<string> {
  const set = new Set<string>()
  const walk = (items: CategoryNode[]) => {
    items.forEach((item) => {
      set.add(item.id)
      if (item.children?.length) {
        walk(item.children)
      }
    })
  }
  walk(nodes)
  return set
}
