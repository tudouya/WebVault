export const navigationConfig = {
  mainNav: [
    {
      title: "首页",
      href: "/",
    },
    {
      title: "分类",
      href: "/category",
    },
    {
      title: "收藏集",
      href: "/collection",
    },
    {
      title: "标签",
      href: "/tag",
    },
    {
      title: "博客",
      href: "/blog",
    },
    {
      title: "搜索",
      href: "/search",
    },
  ],
  sidebarNav: [
    {
      title: "网站管理",
      items: [
        {
          title: "所有网站",
          href: "/",
          icon: "globe",
        },
        {
          title: "提交网站",
          href: "/submit",
          icon: "plus",
        },
      ],
    },
    {
      title: "分类浏览",
      items: [
        {
          title: "按分类",
          href: "/category",
          icon: "folder",
        },
        {
          title: "按标签",
          href: "/tag",
          icon: "tag",
        },
        {
          title: "收藏集",
          href: "/collection",
          icon: "bookmark",
        },
      ],
    },
    {
      title: "内容管理",
      items: [
        {
          title: "博客文章",
          href: "/blog",
          icon: "file-text",
        },
        {
          title: "搜索",
          href: "/search",
          icon: "search",
        },
      ],
    },
  ],
}

export type NavigationConfig = typeof navigationConfig