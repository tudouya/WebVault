import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Globe,
  FolderTree,
  Tags,
  Bookmark,
  FileText,
  Settings,
  Database,
  PlusSquare,
} from "lucide-react"

export type AdminNavItem = {
  title: string
  href: string
  icon: LucideIcon
  description?: string
}

export const adminNavItems: AdminNavItem[] = [
  {
    title: "概览",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "网站管理",
    href: "/admin/websites",
    icon: Globe,
  },
  {
    title: "提交网站",
    href: "/admin/submit",
    icon: PlusSquare,
  },
  {
    title: "分类管理",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    title: "标签管理",
    href: "/admin/tags",
    icon: Tags,
  },
  {
    title: "收藏集",
    href: "/admin/collections",
    icon: Bookmark,
  },
  {
    title: "博客内容",
    href: "/admin/blog",
    icon: FileText,
  },
  {
    title: "系统设置",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    title: "数据库查看",
    href: "/admin/db-viewer",
    icon: Database,
  },
]
