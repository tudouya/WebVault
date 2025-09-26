"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { adminNavItems } from "@/config/admin-navigation"
import { cn } from "@/lib/utils"

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden border-r bg-background lg:block lg:w-64">
      <div className="flex h-16 items-center border-b px-6 text-lg font-semibold">
        WebVault 控制台
      </div>
      <nav className="flex flex-col gap-1 px-2 py-4">
        {adminNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                "text-muted-foreground hover:bg-muted hover:text-foreground",
                isActive && "bg-muted text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
