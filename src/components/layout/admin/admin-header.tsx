"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@clerk/nextjs"
import { Plus } from "lucide-react"

export function AdminHeader() {
  const { user } = useUser()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (isSigningOut) return
    setIsSigningOut(true)

    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: {
          "Accept": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Sign-out failed with status ${response.status}`)
      }

      const payload = (await response.json().catch(() => null)) as
        | { data?: { redirectUrl?: string } }
        | null

      const redirectUrl = payload?.data?.redirectUrl ?? "/sign-in"
      window.location.assign(redirectUrl)
    } catch (error) {
      console.error("退出登录失败", error)
      setIsSigningOut(false)
    }
  }

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
        <Button type="button" size="sm" variant="ghost" onClick={handleSignOut} disabled={isSigningOut}>
          {isSigningOut ? "退出中..." : "退出登录"}
        </Button>
      </div>
    </header>
  )
}
