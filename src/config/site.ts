export const siteConfig = {
  name: "WebVault",
  description: "网站目录管理平台，用于收藏、分类和管理工作生活中发现的优质网站资源",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og.jpg",
  links: {
    github: "https://github.com",
  },
}

export type SiteConfig = typeof siteConfig