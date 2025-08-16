# Implementation Plan - 过滤浏览页面功能 (Browsable Pages Feature)

## Task Overview

通过配置驱动架构为WebVault创建三个核心浏览页面：集合详情页、分类浏览页、标签浏览页。采用BrowsablePageLayout统一组件和BrowsablePageConfig配置接口实现90%+代码复用，打造高效、可维护的浏览体验。

核心特性：
- **配置驱动架构**：BrowsablePageConfig接口驱动页面渲染逻辑
- **统一布局组件**：BrowsablePageLayout作为三个页面的统一容器  
- **组件复用**：WebsiteGrid、WebsiteCard、Pagination等现有组件的最大化复用
- **状态管理**：browsable-page-store.ts的统一状态管理架构
- **URL状态同步**：nuqs库实现筛选条件与URL参数的同步

## Steering Document Compliance

### 开发标准 (CLAUDE.md)
- **Next.js 15 App Router**: 使用App Router架构，集合页面SSR，分类/标签页面CSR混合策略
- **TypeScript严格模式**: 所有组件和Hook使用TypeScript严格类型约束
- **Feature-First架构**: 使用`src/features/browsable-pages/`统一功能模块组织
- **shadcn/ui + Tailwind**: 复用现有响应式UI组件和样式系统
- **Zustand状态管理**: 复用homepage-store.ts架构模式
- **nuqs URL状态**: 用nuqs库实现筛选条件与URL参数同步

### 文件组织结构
```
src/features/browsable-pages/           # 统一功能模块目录
├── components/                         # 页面组件
├── hooks/                             # 数据获取Hooks
├── stores/                            # 状态管理
├── types/                             # 类型定义
└── index.ts                           # 模块导出

src/app/(public)/                      # 路由页面
├── collection/[slug]/page.tsx         # 集合详情页
├── category/page.tsx                  # 分类浏览页
└── tag/page.tsx                       # 标签浏览页
```

## Atomic Task Requirements

**每个任务必须满足原子性要求：**
- **独立性**: 可独立完成，无阻塞依赖
- **时间范围**: 15-30分钟内完成
- **明确目标**: 每个任务有明确的交付物
- **可测试性**: 具备清晰的验收条件和成功标准
- **Agent友好**: 提供具体的文件路径、接口定义和实现指导

## Task Format Guidelines

- 使用格式: `- [ ] 任务编号. 任务标题`
- **验收条件**: 明确具体的完成标准和成功指标
- **技术依赖**: 列出使用的现有文件和组件
- 标注 `_Requirements: X.Y, Z.A_` 关联需求文档条目
- 标注 `_Leverage: path/to/file.ts, path/to/component.tsx_` 引用现有资源
- 每个任务都有具体的文件路径和核心实现逻辑指导
- **风险等级**: 高风险("高")、中风险("中")、低风险("低")

## Tasks

### Phase 1: 核心类型定义和配置

- [x] 1. 创建browsable-pages功能模块类型定义
  - File: `src/features/browsable-pages/types/index.ts`
  - 定义BrowsablePageConfig接口驱动页面配置结构
  - 定义BrowsablePageData接口统一数据返回格式
  - 定义FilterParams接口扩展现有筛选参数
  - 定义PageType类型：'collection' | 'category' | 'tag'
  - _Requirements: 1.1, 2.1, 3.1, 7.1_
  - _Leverage: src/features/websites/types/filters.ts, src/features/websites/types/website.ts_

- [x] 2. 创建页面配置类型接口
  - File: `src/features/browsable-pages/types/page-config.ts`
  - 定义BrowsablePageConfig接口的详细结构
  - 定义SortOption、FilterOption接口和相关类型
  - 包含页面特有配置：enableSorting、showAdBanner等标志位
  - 定义错误配置的默认配置常量DEFAULT_PAGE_CONFIG
  - _Requirements: 1.1, 2.1, 3.1_
  - _Leverage: src/features/websites/types/filters.ts_

- [x] 3. 创建配置工厂函数
  - File: `src/features/browsable-pages/types/config-factory.ts`
  - 实现createCollectionPageConfig函数生成集合页面配置
  - 实现createCategoryPageConfig函数生成分类页面配置
  - 实现createTagPageConfig函数生成标签页面配置
  - 包含配置验证和默认值处理逻辑
  - _Requirements: 1.1, 2.1, 3.1, 9.1_
  - _Leverage: src/features/websites/types/collection.ts, src/features/websites/types/category.ts_

### Phase 2: 状态管理和数据获取

- [x] 4. 创建统一页面状态store
  - File: `src/features/browsable-pages/stores/browsable-page-store.ts`
  - 使用Zustand创建BrowsablePageState状态管理
  - 实现setConfig、loadData、updateFilters、setPage等actions
  - 包含loading、error状态管理
  - 集成URL状态同步逻辑
  - _Requirements: 7.1, 7.2, 8.1_
  - _Leverage: src/features/websites/stores/homepage-store.ts, src/features/websites/stores/collection-store.ts_

- [x] 5. 创建统一数据获取Hook
  - File: `src/features/browsable-pages/hooks/useBrowsablePageData.ts`
  - 实现useBrowsablePageData Hook连接store和API
  - 实现配置驱动的数据获取逻辑
  - 实现fetchDataByConfig函数根据页面类型调用不同API
  - 包含错误处理和重试逻辑
  - _Requirements: 7.1, 7.5, 8.1, 8.2_
  - _Leverage: src/features/websites/hooks/useWebsiteSearch.ts_

- [x] 6. 创建集合数据Hook
  - File: `src/features/browsable-pages/hooks/useCollectionDetail.ts`
  - 实现useCollectionDetail Hook处理集合页面特有逻辑
  - 集成现有collection-store状态管理
  - 处理集合数据获取、错误处理和加载状态
  - 支持服务端渲染的数据预加载
  - _Requirements: 1.1, 1.5, 8.3_
  - _Leverage: src/features/websites/stores/collection-store.ts_

- [x] 7. 创建分类筛选Hook
  - File: `src/features/browsable-pages/hooks/useCategoryWebsites.ts`
  - 实现useCategoryWebsites Hook处理分类页面筛选逻辑
  - 集成现有FilterState筛选和API调用
  - 实现分类数据的缓存和状态管理
  - 包含筛选条件变更的数据重新获取逻辑
  - _Requirements: 2.1, 2.3, 7.3_
  - _Leverage: src/features/websites/types/filters.ts, src/features/websites/hooks/useWebsiteSearch.ts_

- [x] 8. 创建标签筛选Hook
  - File: `src/features/browsable-pages/hooks/useTagWebsites.ts`  
  - 实现useTagWebsites Hook处理标签页面筛选逻辑
  - 支持多标签同时筛选
  - 实现标签数据的缓存和状态管理以及错误处理
  - 包含标签筛选URL参数同步
  - _Requirements: 3.1, 3.3, 7.3_
  - _Leverage: src/features/websites/types/filters.ts_

### Phase 3: 核心UI组件

- [x] 9. 创建PageHeader页面标题组件
  - File: `src/features/browsable-pages/components/PageHeader.tsx`
  - 根据页面类型显示COLLECTION/CATEGORY/TAG标识
  - 支持标题和副标题的动态渲染
  - 使用统一的布局和响应式设计
  - 包含SEO优化的heading结构
  - _Requirements: 9.1, 9.5_
  - _Leverage: src/features/websites/components/HeroSection.tsx_

- [x] 10. 创建FilterTabs筛选标签组件
  - File: `src/features/browsable-pages/components/FilterTabs.tsx`
  - 实现筛选标签的选中、非选中、悬停状态
  - 使用样式变量#8B5CF6作为选中状态的背景色
  - 支持"All"默认选项和动态筛选标签
  - 包含hover和active状态的视觉反馈
  - _Requirements: 2.2, 3.2, 10.1, 10.2, 10.4_
  - _Leverage: src/components/ui/button.tsx_

- [x] 11. 创建SortDropdown排序下拉组件
  - File: `src/features/browsable-pages/components/SortDropdown.tsx`
  - 使用shadcn/ui Select组件实现排序下拉菜单
  - 默认显示"Sort by Time listed"选项
  - 支持排序选项的动态渲染和状态管理
  - 包含加载状态和错误处理
  - _Requirements: 2.2, 3.2, 11.1, 11.2, 11.5_
  - _Leverage: @radix-ui/react-select, src/components/ui/select.tsx_

- [x] 12. 创建AdBanner广告显示组件
  - File: `src/features/browsable-pages/components/AdBanner.tsx`
  - 支持广告内容的条件性显示
  - 支持广告配置：sidebar、inline两种展示方式
  - 包含广告数据获取、错误处理和默认状态
  - 兼容响应式布局要求
  - _Requirements: 1.4, 2.1, 3.1, 5.6_

### Phase 4: 统一布局组件实现

- [x] 13. 创建BrowsablePageLayout核心布局组件
  - File: `src/features/browsable-pages/components/BrowsablePageLayout.tsx`
  - 实现配置驱动的页面布局容器
  - 根据BrowsablePageConfig条件性渲染各个子组件
  - 集成PageHeader、FilterTabs、SortDropdown、AdBanner
  - 使用现有WebsiteGrid组件作为内容展示区域
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_
  - _Leverage: src/features/websites/components/WebsiteGrid.tsx_

- [x] 14. 在BrowsablePageLayout中集成筛选控制逻辑
  - File: `src/features/browsable-pages/components/BrowsablePageLayout.tsx` (扩展task 13)
  - 实现FilterControls容器组件的业务逻辑
  - 集成筛选状态管理和响应式布局
  - 条件性渲染FilterTabs：当filterType !== 'none'时显示
  - 条件性渲染SortDropdown：当enableSorting为true时显示
  - _Requirements: 2.2, 3.2, 5.1_
  - _Leverage: src/features/browsable-pages/components/FilterTabs.tsx, src/features/browsable-pages/components/SortDropdown.tsx_

- [x] 15. 在BrowsablePageLayout中集成内容展示逻辑
  - File: `src/features/browsable-pages/components/BrowsablePageLayout.tsx` (扩展task 13-14)
  - 集成WebsiteGrid组件作为筛选结果的展示区域
  - 处理loading、error、empty状态的用户界面显示
  - 集成AdBanner的条件性渲染
  - 实现响应式布局和广告位置的自适应调整
  - _Requirements: 4.1, 5.1, 5.6_
  - _Leverage: src/features/websites/components/WebsiteGrid.tsx_

- [x] 16. 在BrowsablePageLayout中集成分页导航
  - File: `src/features/browsable-pages/components/BrowsablePageLayout.tsx` (扩展task 13-15)
  - 集成现有Pagination组件
  - 条件性渲染分页：当enablePagination为true时显示
  - 实现分页与URL参数的同步
  - 实现页面切换时的页面顶部滚动逻辑
  - _Requirements: 6.1, 6.3, 6.6_
  - _Leverage: src/features/websites/components/Pagination.tsx_

### Phase 5: 具体页面组件实现

- [x] 17. 创建CollectionDetailPage集合详情页组件
  - File: `src/features/browsable-pages/components/CollectionDetailPage.tsx`
  - 使用BrowsablePageLayout和createCollectionPageConfig
  - 集成useCollectionDetail Hook处理数据获取
  - 支持服务端渲染的数据预加载和错误处理
  - 实现集合特有的SEO meta信息
  - _Requirements: 1.1, 1.2, 1.5, 1.6_
  - _Leverage: src/features/browsable-pages/components/BrowsablePageLayout.tsx_

- [x] 18. 创建CategoryBrowsePage分类浏览页组件
  - File: `src/features/browsable-pages/components/CategoryBrowsePage.tsx`
  - 使用BrowsablePageLayout和createCategoryPageConfig
  - 集成useCategoryWebsites Hook处理分类筛选
  - 实现分类筛选标签的缓存和状态管理
  - 包含URL状态同步的浏览器前进后退支持
  - _Requirements: 2.1, 2.2, 2.5_
  - _Leverage: src/features/browsable-pages/components/BrowsablePageLayout.tsx_

- [x] 19. 创建TagBrowsePage标签浏览页组件
  - File: `src/features/browsable-pages/components/TagBrowsePage.tsx`
  - 使用BrowsablePageLayout和createTagPageConfig
  - 集成useTagWebsites Hook处理标签筛选
  - 支持多标签同时筛选的交互逻辑
  - 实现标签条件变更的URL参数同步
  - _Requirements: 3.1, 3.2, 3.5_
  - _Leverage: src/features/browsable-pages/components/BrowsablePageLayout.tsx_

### Phase 6: URL状态管理集成

- [x] 20. 集成nuqs URL状态同步到browsable-page-store
  - File: `src/features/browsable-pages/stores/browsable-page-store.ts` (扩展task 4)
  - 集成nuqs库实现筛选条件与URL同步
  - 实现URL参数变更触发数据重新获取逻辑
  - 实现浏览器前进后退的状态恢复
  - 处理URL参数无效的错误处理逻辑
  - _Requirements: 7.1, 7.2, 7.4, 7.7_
  - _Leverage: nuqs library, src/stores/url-state-hooks.ts_

- [x] 21. 创建URL参数解析和验证工具
  - File: `src/features/browsable-pages/utils/url-params.ts`
  - 实现parseCollectionParams解析集合页面URL参数
  - 实现parseCategoryParams解析分类页面筛选参数
  - 实现parseTagParams解析标签页面筛选参数
  - 使用Zod库进行参数验证和类型安全保障
  - _Requirements: 7.2, 7.7, 8.1_
  - _Leverage: zod library_

### Phase 7: 路由页面实现

- [x] 22. 创建集合详情页路由组件
  - File: `src/app/(public)/collection/[slug]/page.tsx`
  - 实现动态路由参数的获取和处理
  - 使用CollectionDetailPage组件渲染页面
  - 实现SSR数据预获取和缓存
  - 生成SEO meta标签
  - _Requirements: 1.1, 1.2_
  - _Leverage: src/features/browsable-pages/components/CollectionDetailPage.tsx_

- [x] 23. 创建分类浏览页路由组件
  - File: `src/app/(public)/category/page.tsx`
  - 处理URL筛选参数的解析和验证
  - 使用CategoryBrowsePage组件渲染页面
  - 实现CSR渲染策略支持动态筛选
  - 包含页面SEO优化
  - _Requirements: 2.1, 2.2_
  - _Leverage: src/features/browsable-pages/components/CategoryBrowsePage.tsx_

- [x] 24. 创建标签浏览页路由组件
  - File: `src/app/(public)/tag/page.tsx`
  - 处理标签URL参数解析
  - 使用TagBrowsePage组件渲染页面
  - 实现CSR渲染策略支持多标签筛选操作
  - 包含结构化数据和SEO标签
  - _Requirements: 3.1, 3.2_
  - _Leverage: src/features/browsable-pages/components/TagBrowsePage.tsx_

### Phase 8: 模块整合导出

- [x] 25. 创建browsable-pages模块统一导出
  - File: `src/features/browsable-pages/index.ts`
  - 导出所有核心组件、类型和Hook
  - 提供简洁的外部接口结构
  - 实现模块的清晰抽象边界
  - 兼容其他features模块的导入模式
  - _Requirements: All_
  - _Leverage: src/features/websites/index.ts_

- [x] 26. 将全局types模块扩展为browsable-pages类型
  - File: `src/types/index.ts` (如果存在则扩展)
  - 导出browsable-pages的核心类型定义
  - 兼容类型的向后兼容和版本管理
  - 实现类型的清晰导出和命名空间管理
  - _Requirements: All_
  - _Leverage: src/features/browsable-pages/types/index.ts_

### Phase 9: 错误处理和边界管理

- [x] 27. 创建browsable-pages错误边界组件
  - File: `src/features/browsable-pages/components/BrowsablePageErrorBoundary.tsx`
  - 实现页面级别错误捕获和优雅降级
  - 提供错误页面的用户友好展示
  - 包含错误报告和重新加载功能
  - 支持页面级别错误恢复
  - _Requirements: 8.6_
  - _Leverage: src/features/websites/components/ErrorBoundary.tsx_

- [x] 28. 创建加载状态组件
  - File: `src/features/browsable-pages/components/BrowsablePageLoadingStates.tsx`
  - 创建页面加载状态的骨架屏展示
  - 实现筛选操作Loading状态指示器
  - 实现数据重新获取的加载提示
  - 兼容现有LoadingStates组件的设计语言
  - _Requirements: 8.1, 8.2_
  - _Leverage: src/features/websites/components/LoadingStates.tsx_

### Phase 10: 测试和文档

- [x] 29. 创建核心组件单元测试
  - File: `src/features/browsable-pages/components/__tests__/BrowsablePageLayout.test.tsx`
  - 测试配置驱动的组件渲染逻辑
  - 测试页面类型条件性渲染
  - 验证props传递和事件处理
  - 测试错误场景
  - _Leverage: src/features/websites/components/__tests__/CollectionCard.test.tsx_

- [x] 30. 创建Hook集成测试
  - File: `src/features/browsable-pages/hooks/__tests__/useBrowsablePageData.test.ts`
  - 测试数据获取和状态管理逻辑
  - 验证配置驱动的数据获取逻辑
  - 测试错误处理和重试逻辑
  - 模拟API调用和响应
  - _Leverage: React Testing Library hooks testing patterns_

- [x] 31. 创建模块使用文档
  - File: `src/features/browsable-pages/README.md`
  - 编写模块功能和使用说明
  - 包含BrowsablePageConfig配置指南
  - 提供组件使用示例和最佳实践
  - 说明API接口、Props接口和类型约束
  - _Requirements: All_

## Implementation Priority and Risk Assessment

### 高优先级 (关键路径)
1. **类型基础 (Tasks 1-3)** - 整个架构的基础依赖
2. **状态管理 (Tasks 4-5)** - 核心数据流的基础组件
3. **布局组件 (Tasks 13-16)** - 使用核心架构的关键组件

### 中优先级 (功能扩展) 
4. **页面组件 (Tasks 17-19)** - 具体功能的业务实现
5. **URL集成 (Tasks 20-21)** - 用户体验的关键功能
6. **路由页面 (Tasks 22-24)** - 最终交付物 

### 低优先级 (质量保障)
7. **模块导出 (Tasks 25-26)** -  架构完善
8. **错误处理 (Tasks 27-28)** - 鲁棒性提升
9. **测试文档 (Tasks 29-31)** - 质量保证和维护性

### 风险评估
- **高风险**: URL状态同步 (Task 20) - 复杂的状态同步逻辑
- **中风险**: 配置工厂 (Task 3) - 页面配置逻辑的正确性
- **低风险**: UI组件 (Tasks 9-12) - 相对独立的UI实现

## Quality Gates and Success Criteria

### 每个Phase完成标准
- [ ] 所有文件TypeScript类型检查通过
- [ ] 组件能够正确import和使用
- [ ] 分阶段功能的基本功能验证通过
- [ ] 现有功能无回归影响
- [ ] 遵循项目代码规范和lint检查通过

### 最终验收标准
- [ ] 三个页面功能完全可用并通过用户验收测试
- [ ] 筛选功能正常工作并通过用户体验测试
- [ ] URL状态同步的浏览器前进后退支持
- [ ] 响应式布局在多设备上正确显示
- [ ] 错误处理机制工作正常
- [ ] 组件复用率达到70%以上

- [ ] 页面性能Lighthouse评分达标

## Notes for Implementation

### 复用优先策略
- 优先使用现有WebsiteGrid、WebsiteCard、Pagination组件
- 分阶段使用现有状态管理模式 (Zustand + nuqs)
- 使用现有类型定义和API调用接口
- 遵循现有页面布局和样式设计语言

### 关键成功要素
- 使用配置驱动架构避免重复开发
- 确保条件性渲染的页面组件正确性
- 统一的错误处理和加载状态管理
- 确保URL参数同步的用户体验一致性