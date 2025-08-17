# Implementation Plan - Blog Page UI

## Task Overview

博客页面UI实现采用MVP方式，分2个阶段完成。严格按照需求文档和简化设计文档执行，专注于核心功能的快速交付。每个任务都是原子化的，涉及1-3个相关文件，可在15-30分钟内完成。

## Steering Document Compliance

**遵循 structure.md 约定**：
- 在 `src/features/blog/` 下组织所有博客相关文件
- 复用 `src/components/ui/` 基础组件
- 遵循 Feature First Architecture 模式

**遵循 tech.md 技术模式**：
- 使用 Zustand + nuqs 状态管理模式
- 基于 shadcn/ui 组件构建
- Next.js 15 App Router 路由结构
- TypeScript 严格模式类型定义

## Atomic Task Requirements

每个任务必须满足以下原子化标准：
- **文件范围**: 涉及1-3个相关文件
- **时间限制**: 15-30分钟可完成
- **单一目标**: 一个可测试的具体成果
- **明确文件**: 指定确切的文件路径
- **代理友好**: 清晰的输入输出要求

## Tasks

### Phase 1: MVP基础实现

- [x] 1. 创建博客类型定义文件
  - 文件: `src/features/blog/types/index.ts`
  - 定义 `BlogCardData` 接口和 `BlogCategoryType` 常量
  - 基于设计文档的简化数据模型
  - 导出所有博客相关类型定义
  - _Requirements: 1.1, 2.2_
  - _Leverage: src/features/websites/types/website.ts 参考结构_

- [x] 2. 创建博客状态管理store
  - 文件: `src/features/blog/stores/blog-store.ts`
  - 基于 collection-store.ts 模式实现 Zustand store
  - 包含分页、分类筛选、加载状态管理
  - 集成 nuqs URL状态同步功能
  - _Requirements: 2.4, 3.3_
  - _Leverage: src/features/websites/stores/collection-store.ts_

- [x] 3. 创建静态分类常量和工具函数
  - 文件: `src/features/blog/constants/categories.ts`
  - 定义6个预定义分类: ['All', 'Lifestyle', 'Technologies', 'Design', 'Travel', 'Growth']
  - 创建分类相关的工具函数（验证、筛选等）
  - 导出分类类型和常量
  - _Requirements: 2.2_
  - _Leverage: 无需复用，新创建_

- [x] 4. 创建BlogCard组件
  - 文件: `src/features/blog/components/BlogCard.tsx`
  - 基于 CollectionCard.tsx 模式创建博客文章卡片
  - 包含封面图、标题、作者信息、发布时间
  - 实现悬停效果和无障碍性支持
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - _Leverage: src/features/websites/components/CollectionCard.tsx_

- [x] 5. 创建CategoryFilter组件
  - 文件: `src/features/blog/components/CategoryFilter.tsx`
  - 基于6个静态分类创建筛选标签栏
  - 实现激活状态和悬停效果
  - 支持移动端触摸滑动
  - _Requirements: 2.1, 2.5, 10.1-10.6_
  - _Leverage: src/features/websites/components/FilterTabs.tsx 参考_

- [x] 6. 创建BlogGrid布局组件
  - 文件: `src/features/blog/components/BlogGrid.tsx`
  - 实现响应式网格布局 (3列/2列/1列)
  - 集成加载状态和错误处理
  - 包含空状态显示逻辑
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 12.2_
  - _Leverage: src/features/websites/components/CollectionGrid.tsx_

- [x] 7. 创建模拟博客数据
  - 文件: `src/features/blog/data/mockBlogs.ts`
  - 创建符合 BlogCardData 接口的示例数据
  - 包含6篇不同分类的博客文章数据
  - 提供数据获取和筛选的工具函数
  - _Requirements: 1.3, 2.2_
  - _Leverage: src/features/websites/data/mockCollections.ts_

- [x] 8. 创建博客页面路由文件
  - 文件: `src/app/(public)/blog/page.tsx`
  - 实现博客页面的基础布局结构
  - 集成页面标题、CategoryFilter、BlogGrid 组件
  - 连接状态管理和数据获取
  - _Requirements: 1.1, 1.2_
  - _Leverage: src/app/(public)/collection/page.tsx 参考_

- [x] 9. 集成现有Pagination组件
  - 文件: `src/app/(public)/blog/page.tsx` (修改)
  - 引入并配置现有的 Pagination 组件
  - 连接分页状态到 blog-store
  - 实现分页导航和URL同步
  - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7_
  - _Leverage: src/features/websites/components/Pagination.tsx_

- [x] 10. 添加页面加载状态和错误处理
  - 文件: `src/features/blog/components/BlogLoadingStates.tsx`
  - 创建博客专用的加载状态组件
  - 实现错误边界和重试机制
  - 添加空状态和网络错误提示
  - _Requirements: 7.3, 7.5_
  - _Leverage: src/features/websites/components/LoadingStates.tsx_

### Phase 2: 集成和优化

- [x] 11. 集成NewsletterSection组件
  - 文件: `src/app/(public)/blog/page.tsx` (修改)
  - 在页面底部集成现有的 NewsletterSection 组件
  - 确保正确的间距和布局位置
  - 验证订阅功能在博客页面的正常工作
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - _Leverage: src/features/websites/components/NewsletterSection.tsx_

- [x] 12. 实现图片懒加载优化
  - 文件: `src/features/blog/components/BlogCard.tsx` (修改)
  - 使用 Next.js Image 组件替换普通 img 标签
  - 配置图片懒加载和占位符
  - 实现图片加载失败的默认处理
  - _Requirements: 7.2, 9.2_
  - _Leverage: Next.js Image 组件最佳实践_

- [x] 13. 添加响应式布局优化
  - 文件: `src/features/blog/components/BlogGrid.tsx` (修改)
  - 优化移动端和平板端的网格布局
  - 确保间距和断点符合设计规范
  - 验证所有设备上的功能可用性
  - _Requirements: 5.5, 12.2_
  - _Leverage: 现有响应式设计模式_

- [x] 14. 创建BlogCard单元测试
  - 文件: `src/features/blog/components/__tests__/BlogCard.test.tsx`
  - 测试组件渲染、点击事件、悬停效果
  - 验证无障碍性属性和键盘导航
  - 测试图片加载失败的处理
  - _Requirements: 4.1-4.5_
  - _Leverage: src/features/websites/components/__tests__/CollectionCard.test.tsx_

- [x] 15. 创建博客store单元测试
  - 文件: `src/features/blog/stores/__tests__/blog-store.test.ts`
  - 测试状态管理、分页逻辑、分类筛选
  - 验证URL状态同步功能
  - 测试错误处理和加载状态
  - _Requirements: 2.4, 3.3_
  - _Leverage: src/features/websites/stores/__tests__/collection-store.test.ts_

- [x] 16. 创建博客主题配色系统
  - 文件: `src/features/blog/styles/theme.ts`
  - 实现设计文档定义的完整配色系统
  - 定义主题色彩变量：`#8B5CF6`, `#F9FAFB`, `#FFFFFF` 等
  - 创建分类标签配色和卡片阴影配置
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - _Leverage: 现有主题系统模式_

- [x] 17. 实现字体和排版规范
  - 文件: `src/features/blog/styles/typography.ts`
  - 定义页面标题：48px/700/1.2，文章标题：20px/600/1.4
  - 配置作者名称：14px/500，发布时间：14px/400
  - 创建分类标签字体规范：14px/500
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  - _Leverage: 现有字体系统配置_

- [x] 18. 添加页面SEO优化
  - 文件: `src/app/(public)/blog/page.tsx` (修改)
  - 添加页面元数据（title, description）
  - 配置OpenGraph和Twitter卡片
  - 实现JSON-LD结构化数据
  - _Requirements: 7.1_
  - _Leverage: 现有页面的SEO模式_

- [x] 19. 实现键盘导航支持
  - 文件: `src/features/blog/components/CategoryFilter.tsx` (修改)
  - 添加箭头键导航分类标签
  - 实现Tab键顺序和焦点管理
  - 确保Enter/Space键激活标签
  - _Requirements: 无障碍性章节_
  - _Leverage: 现有组件的无障碍性模式_

- [x] 20. 实现BlogCard stagger动画效果
  - 文件: `src/features/blog/components/BlogCard.tsx` (修改)
  - 实现文章卡片的stagger进入动画
  - 配置每个卡片延迟100ms的动画效果
  - 添加悬停时的translateY(-4px)效果
  - _Requirements: 13.1, 13.3_
  - _Leverage: src/features/websites/styles/animations.css_

- [x] 21. 添加CategoryFilter切换动画
  - 文件: `src/features/blog/components/CategoryFilter.tsx` (修改)
  - 实现分类切换的fade-in动画，持续300ms
  - 添加标签悬停的transition: all 0.2s ease
  - 优化移动端触摸反馈动画
  - _Requirements: 13.2, 13.5_
  - _Leverage: 现有组件的过渡动画模式_

- [x] 22. 实现精确的布局间距系统
  - 文件: `src/app/(public)/blog/page.tsx` (修改)
  - 实现页面标题上方80px间距，下方32px间距
  - 配置分类标签栏：标题下方24px间距，与网格间距48px
  - 设置Newsletter区域：文章网格下方80px间距
  - _Requirements: 12.3, 12.4, 12.5_
  - _Leverage: 现有页面布局的间距模式_

- [x] 23. 创建错误边界组件
  - 文件: `src/features/blog/components/BlogErrorBoundary.tsx`
  - 基于现有ErrorBoundary创建博客专用错误边界
  - 实现友好的错误提示和重试按钮
  - 添加错误日志记录功能
  - _Requirements: API错误处理章节_
  - _Leverage: src/features/websites/components/ErrorBoundary.tsx_

**注意事项**：
- 所有任务都遵循现有的代码规范和文件组织模式
- 优先复用现有组件和工具，避免重复造轮子
- 每个任务完成后需要验证功能正常且无TypeScript错误
- 测试任务确保覆盖核心功能和边界情况