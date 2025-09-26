"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth, useUser } from "@clerk/nextjs"

// Logo组件
const Logo = () => (
  <Link href="/" className="flex items-center space-x-2">
    <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
      <span className="text-primary-foreground font-bold text-sm">WV</span>
    </div>
    <span className="text-xl font-bold text-foreground">WebVault</span>
  </Link>
)

// 导航项配置
const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Home5", href: "/home5" },
  { label: "Search", href: "/search" },
  { label: "Collection", href: "/collection" },
  { label: "Category", href: "/category" },
  { label: "Tag", href: "/tag" },
  { label: "Blog", href: "/blog" },
  { label: "Pricing", href: "/pricing" },
  { label: "Submit", href: "/admin/submit" },
  { label: "Studio", href: "/studio" },
]

// 移动端菜单组件
interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  currentPath: string
}

const MobileMenu = ({ isOpen, onClose, currentPath }: MobileMenuProps) => {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const userEmail = user?.emailAddresses?.[0]?.emailAddress

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        <nav className="mt-6 space-y-4">
          {navigationItems.map((item) => {
            const isActive = currentPath === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "block transition-colors",
                  isActive 
                    ? "text-primary font-medium" 
                    : "text-foreground hover:text-primary"
                )}
              >
                {item.label}
              </Link>
            )
          })}
          <div className="pt-4 border-t border-border">
            {isSignedIn ? (
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/admin">
                  <User className="h-4 w-4" />
                  <span>{userEmail ?? "进入后台"}</span>
                </Link>
              </Button>
            ) : (
              <Button variant="default" className="w-full" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            )}
          </div>
        </nav>
      </div>
    </div>
  )
}

// 桌面端导航组件
interface DesktopNavigationProps {
  currentPath: string
}

const DesktopNavigation = ({ currentPath }: DesktopNavigationProps) => (
  <nav className="hidden md:flex items-center space-x-8">
    {navigationItems.map((item) => {
      const isActive = currentPath === item.href
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm transition-colors",
            isActive 
              ? "text-primary font-medium" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      )
    })}
  </nav>
)

// 主要的HeaderNavigation组件
export const HeaderNavigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const userEmail = user?.emailAddresses?.[0]?.emailAddress

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // 防止背景滚动
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Logo />

            {/* 桌面端导航 */}
            <DesktopNavigation currentPath={pathname} />

            {/* 右侧按钮区域 */}
            <div className="flex items-center space-x-4">
              {/* 桌面端登录按钮 */}
              {isSignedIn ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:inline-flex gap-2"
                  asChild
                >
                  <Link href="/admin">
                    <User className="h-4 w-4" />
                    <span className="max-w-[140px] truncate">{userEmail ?? "进入后台"}</span>
                  </Link>
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  size="sm"
                  className="hidden md:inline-flex"
                  asChild
                >
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              )}

              {/* 移动端菜单按钮 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 移动端菜单 */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} currentPath={pathname} />
    </>
  )
}

export default HeaderNavigation
