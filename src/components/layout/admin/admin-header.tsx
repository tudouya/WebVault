"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SignOutButton, useUser } from "@clerk/nextjs"
import { Plus } from "lucide-react"

export function AdminHeader() {
  const { user } = useUser()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex flex-1 items-center gap-3">
        <Input
          placeholder="搜索后台内容..."
          className="hidden max-w-md md:flex"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          快速创建
        </Button>
        <div className="hidden flex-col items-end text-xs font-medium leading-tight sm:flex">
          <span className="text-muted-foreground">当前用户</span>
          <span>{user?.emailAddresses?.[0]?.emailAddress ?? "未登录"}</span>
        </div>
        <SignOutButton>
          <Button size="sm" variant="ghost">
            退出登录
          </Button>
        </SignOutButton>
      </div>
    </header>
  )
}
