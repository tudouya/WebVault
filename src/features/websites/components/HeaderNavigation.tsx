"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
  { label: "Submit", href: "/submit" },
  { label: "Studio", href: "/studio" },
]

// 移动端菜单组件
interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
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
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="block text-foreground hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-border">
            <Button variant="default" className="w-full">
              Sign In
            </Button>
          </div>
        </nav>
      </div>
    </div>
  )
}

// 桌面端导航组件
const DesktopNavigation = () => (
  <nav className="hidden md:flex items-center space-x-8">
    {navigationItems.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {item.label}
      </Link>
    ))}
  </nav>
)

// 主要的HeaderNavigation组件
export const HeaderNavigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

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
            <DesktopNavigation />

            {/* 右侧按钮区域 */}
            <div className="flex items-center space-x-4">
              {/* 桌面端登录按钮 */}
              <Button 
                variant="default" 
                size="sm"
                className="hidden md:inline-flex"
              >
                Sign In
              </Button>

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
      <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
    </>
  )
}

export default HeaderNavigation