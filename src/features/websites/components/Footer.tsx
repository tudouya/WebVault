/**
 * Footer 组件
 * 
 * 页面底部信息展示，包含平台描述、社交媒体链接、功能分栏和版权信息
 * 符合设计图要求的精确配色和响应式布局
 * 
 * 需求引用:
 * - 8.0: 页脚信息展示 - 包含描述、社交链接、功能分栏和版权信息
 * 
 * 设计参考: 1_homepage.png - 页面底部白色背景的Footer区域
 */

'use client';

import React from 'react';
import {
  Search,
  Github,
  Twitter,
  Instagram,
  Youtube,
  ExternalLink
} from 'lucide-react';

/**
 * Footer组件属性
 */
interface FooterProps {
  /**
   * 自定义CSS类名
   */
  className?: string;
}

/**
 * 社交媒体链接配置
 */
const SOCIAL_LINKS = [
  {
    name: 'Twitter',
    href: 'https://twitter.com',
    icon: Twitter,
    label: '在Twitter上关注我们'
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: Instagram,
    label: '在Instagram上关注我们'
  },
  {
    name: 'GitHub',
    href: 'https://github.com',
    icon: Github,
    label: '查看我们的GitHub'
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com',
    icon: Youtube,
    label: '订阅我们的YouTube频道'
  }
] as const;

/**
 * 功能链接分栏配置
 */
const FOOTER_LINKS = {
  PRODUCT: {
    title: 'PRODUCT',
    links: [
      { name: 'Search', href: '/search' },
      { name: 'Collection', href: '/collection' },
      { name: 'Category', href: '/category' },
      { name: 'Tag', href: '/tag' }
    ]
  },
  RESOURCES: {
    title: 'RESOURCES',
    links: [
      { name: 'Blog', href: '/blog' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Submit', href: '/submit' },
      { name: 'Studio', href: '/studio' }
    ]
  },
  PAGES: {
    title: 'PAGES',
    links: [
      { name: 'Home 2', href: '/home-2' },
      { name: 'Home 3', href: '/home-3' },
      { name: 'Collection 1', href: '/collection-1' },
      { name: 'Collection 2', href: '/collection-2' }
    ]
  },
  COMPANY: {
    title: 'COMPANY',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Sitemap', href: '/sitemap' }
    ]
  }
} as const;

/**
 * Footer 页脚组件
 * 
 * 提供网站底部信息展示，包含平台描述、社交媒体链接、功能分栏导航和版权信息
 * 响应式设计，在移动端采用垂直堆叠布局
 */
export function Footer({ className = '' }: FooterProps) {
  return (
    <footer 
      className={`bg-card border-t border-border ${className}`}
      aria-label="页脚"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 主要内容区域 */}
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Logo和描述区域 */}
          <div className="space-y-8 xl:col-span-1">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground">
                <span className="text-sm font-bold text-background">DIR</span>
              </div>
              <span className="text-xl font-bold text-foreground">Directory</span>
            </div>

            {/* 平台描述 */}
            <p className="text-base text-muted-foreground leading-6 max-w-md">
              This is a demo site for Midirs, the best directory website template
            </p>

            {/* 社交媒体链接 */}
            <div className="flex space-x-6">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                  aria-label={social.label}
                >
                  <social.icon 
                    className="h-6 w-6" 
                    style={{ color: '#4B5563' }}
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>

            {/* Built with Midirs */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Built with</span>
              <span className="inline-flex items-center space-x-1 font-medium">
                <span className="inline-block h-4 w-4 rounded bg-primary"></span>
                <span>Midirs</span>
              </span>
            </div>
          </div>

          {/* 功能链接分栏 */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              {/* PRODUCT 分栏 */}
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                  {FOOTER_LINKS.PRODUCT.title}
                </h3>
                <ul className="mt-4 space-y-4">
                  {FOOTER_LINKS.PRODUCT.links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-base text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* RESOURCES 分栏 */}
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                  {FOOTER_LINKS.RESOURCES.title}
                </h3>
                <ul className="mt-4 space-y-4">
                  {FOOTER_LINKS.RESOURCES.links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-base text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-8">
              {/* PAGES 分栏 */}
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                  {FOOTER_LINKS.PAGES.title}
                </h3>
                <ul className="mt-4 space-y-4">
                  {FOOTER_LINKS.PAGES.links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-base text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* COMPANY 分栏 */}
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                  {FOOTER_LINKS.COMPANY.title}
                </h3>
                <ul className="mt-4 space-y-4">
                  {FOOTER_LINKS.COMPANY.links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-base text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 底部版权信息 */}
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-base text-muted-foreground xl:text-center">
            Copyright © 2025 All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;