# Task Commands - Homepage UI Implementation

## Status  
- **Phase**: Commands
- **Status**: Complete
- **Date Created**: 2025-08-14
- **Last Updated**: 2025-08-14

## Command Overview
基于优化后的任务分解，生成24个独立的实现命令。每个命令都是原子化的，可以单独执行，具有明确的输入、输出和成功标准。

## Command Format
每个命令遵循以下格式：
```
/task-<number> <description>
Input: <具体输入要求>
Output: <预期输出文件>
Success Criteria: <完成标准>
Dependencies: <依赖的前置任务>
```

---

## 阶段1：基础设置和类型定义

### /task-1 创建Website数据类型定义
**Input**: 
- 设计文档中的Website数据模型规范
- TypeScript严格模式要求

**Output**: 
- `src/features/websites/types/website.ts`

**Success Criteria**:
- 定义完整的Website接口包含所有业务字段
- 包含id、title、description、url、tags、status、isAd等字段
- 支持广告类型(sponsored/featured/premium)和评分系统
- 通过TypeScript编译检查

**Dependencies**: 无

---

### /task-2 创建Category和Filter类型定义
**Input**:
- 分类层次结构需求(Group1-5)
- 筛选功能需求规范

**Output**: 
- `src/features/websites/types/category.ts`
- `src/features/websites/types/filters.ts`

**Success Criteria**:
- Category接口支持父子关系(parentId, children)
- FilterState接口包含categories、tags、sortBy、searchQuery字段
- 完整的类型导出和模块声明
- 通过TypeScript编译检查

**Dependencies**: 无

---

### /task-3 创建状态管理Store
**Input**:
- Zustand v5.0.7和nuqs v2.4.3的API文档
- 搜索、筛选、分页状态需求

**Output**:
- `src/features/websites/stores/homepage-store.ts`

**Success Criteria**:
- 使用Zustand创建状态管理包含搜索、筛选、分页状态
- 集成nuqs实现URL状态同步
- 提供actions用于状态更新
- 状态变更能够同步到URL参数

**Dependencies**: Tasks 1-2

---

### /task-4 创建表单验证Schemas
**Input**:
- Zod v4.0.17和@hookform/resolvers v5.2.1文档
- 搜索表单和邮箱订阅验证需求

**Output**:
- `src/features/websites/schemas/index.ts`

**Success Criteria**:
- 定义搜索表单的Zod schema
- 定义邮箱订阅表单的验证规则
- 配置React Hook Form resolvers
- 提供TypeScript类型推导

**Dependencies**: Tasks 1-2

---

## 阶段2：基础UI组件实现

### /task-5 创建HeaderNavigation组件
**Input**:
- 设计图中的导航栏布局要求
- shadcn/ui Button组件和HSL主题系统

**Output**:
- `src/features/websites/components/HeaderNavigation.tsx`

**Success Criteria**:
- 实现顶部导航栏包含WebVault Logo
- 导航菜单项(Home、Search、Collection等)
- 使用主要强调色#8B5CF6的登录按钮
- 响应式布局支持移动端

**Dependencies**: Tasks 3-4

---

### /task-6 创建HeroSection组件
**Input**:
- 主标题"The Best Directory Website Template"设计
- React Hook Form v7.62.0集成要求

**Output**:
- `src/features/websites/components/HeroSection.tsx`

**Success Criteria**:
- 实现标题、副标题和搜索框区域
- 集成React Hook Form处理搜索表单
- 使用精确的字体大小和间距(8pt网格)
- 搜索按钮使用紫色主题色

**Dependencies**: Tasks 3-4

---

### /task-7 创建WebsiteCard组件
**Input**:
- 网站卡片设计规范(16px圆角、阴影效果)
- shadcn/ui Card组件样式系统

**Output**:
- `src/features/websites/components/WebsiteCard.tsx`

**Success Criteria**:
- 实现网站信息卡片包含图标、标题、描述
- 使用彩色圆角图标和标签pills
- Visit Website按钮使用次要强调色#2563EB
- 悬停效果和AD标记支持

**Dependencies**: Tasks 1-2

---

### /task-8 创建TagPill组件
**Input**:
- 标签设计系统(6px圆角、多颜色背景)
- 点击筛选交互需求

**Output**:
- `src/features/websites/components/TagPill.tsx`

**Success Criteria**:
- 实现小的彩色标签pills组件
- 支持不同类别使用不同颜色
- 点击触发筛选功能
- 使用精确的配色系统

**Dependencies**: Tasks 3-4

---

### /task-9 创建SidebarFilters组件基础结构
**Input**:
- 侧边栏设计(256px固定宽度)
- "All Categories"按钮样式

**Output**:
- `src/features/websites/components/SidebarFilters.tsx`

**Success Criteria**:
- 实现左侧固定宽度侧边栏布局
- "All Categories"按钮使用紫色背景
- 基础筛选区域容器结构
- 为后续交互功能预留接口

**Dependencies**: Tasks 3-4

---

## 阶段3：交互功能组件

### /task-10 实现分类折叠树组件
**Input**:
- @radix-ui/react-collapsible v1.1.12 API
- Group1-5层次结构数据

**Output**:
- `src/features/websites/components/CategoryTree.tsx`

**Success Criteria**:
- 使用Collapsible实现分类树折叠展开
- 支持多层级分类结构显示
- 分类点击触发筛选状态更新
- 展开/折叠动画效果

**Dependencies**: Tasks 2, 3, 9

---

### /task-11 实现筛选下拉选择器
**Input**:
- @radix-ui/react-select v2.2.6组件API
- "Select Tags"和排序功能需求

**Output**:
- `src/features/websites/components/FilterSelects.tsx`

**Success Criteria**:
- 实现"Select Tags"多选下拉组件
- "Sort by Time listed"排序选择器
- 选择变更触发状态管理更新
- Reset按钮清除所有筛选

**Dependencies**: Tasks 2, 3

---

### /task-12 创建WebsiteGrid组件
**Input**:
- 响应式网格布局要求(桌面3列、平板2列、移动1列)
- 24px卡片间距规范

**Output**:
- `src/features/websites/components/WebsiteGrid.tsx`

**Success Criteria**:
- 实现响应式网站卡片网格容器
- 集成WebsiteCard组件显示
- 支持loading状态和空数据状态
- 使用Tailwind CSS Grid系统

**Dependencies**: Tasks 7, 8

---

### /task-13 实现搜索功能集成
**Input**:
- 搜索防抖处理需求
- 状态管理和URL同步要求

**Output**:
- `src/features/websites/hooks/useWebsiteSearch.ts`

**Success Criteria**:
- 创建搜索逻辑的自定义Hook
- 实现搜索防抖处理(300ms)
- 与homepage-store状态管理集成
- URL参数同步更新

**Dependencies**: Tasks 3, 4, 6

---

### /task-14 创建Pagination组件
**Input**:
- 分页UI设计(页码数字+箭头导航)
- URL状态同步需求

**Output**:
- `src/features/websites/components/Pagination.tsx`

**Success Criteria**:
- 实现页码数字和下一页箭头
- 当前页高亮和禁用状态处理
- 页面切换触发URL更新
- 使用Lucide React箭头图标

**Dependencies**: Tasks 3, 12

---

### /task-15 创建NewsletterSection组件
**Input**:
- "Join the Community"订阅区域设计
- React Hook Form邮箱验证要求

**Output**:
- `src/features/websites/components/NewsletterSection.tsx`

**Success Criteria**:
- 实现订阅标题、描述和邮箱输入框
- 集成React Hook Form和Zod邮箱验证
- 订阅按钮提交状态管理
- 成功/错误消息显示

**Dependencies**: Tasks 4

---

### /task-16 创建Footer组件
**Input**:
- 页脚布局设计(社交图标+链接分栏)
- Lucide React图标库和精确配色

**Output**:
- `src/features/websites/components/Footer.tsx`

**Success Criteria**:
- 实现页脚信息和版权声明
- 社交媒体图标使用#4B5563颜色
- 功能链接分栏(Product、Resources、Pages、Company)
- 响应式布局适配

**Dependencies**: 无

---

## 阶段4：主页面整合

### /task-17 创建HomePage组件基础结构
**Input**:
- 页面整体布局架构设计
- HeaderNavigation和HeroSection组件

**Output**:
- `src/features/websites/components/HomePage.tsx`

**Success Criteria**:
- 创建HomePage组件基础框架
- 集成HeaderNavigation和HeroSection
- 定义组件props接口
- 实现页面顶部区域布局

**Dependencies**: Tasks 5, 6

---

### /task-18 集成筛选和内容展示区域
**Input**:
- 侧边栏+主内容区响应式布局
- SidebarFilters、WebsiteGrid、Pagination组件

**Output**:
- 更新`src/features/websites/components/HomePage.tsx`

**Success Criteria**:
- 集成侧边栏筛选功能到主页
- 实现主内容区网站网格展示
- 添加分页导航功能
- 响应式布局(256px侧边栏+剩余空间内容区)

**Dependencies**: Tasks 9, 10, 11, 12, 14, 17

---

### /task-19 集成订阅和页脚区域
**Input**:
- NewsletterSection和Footer组件
- 完整页面状态管理连接

**Output**:
- 完成`src/features/websites/components/HomePage.tsx`

**Success Criteria**:
- 集成邮箱订阅区域到页面底部
- 添加Footer组件到页面末尾
- 连接所有状态管理逻辑
- 完整的页面布局和功能

**Dependencies**: Tasks 15, 16, 18

---

### /task-20 更新主页面路由
**Input**:
- 完整的HomePage组件
- 现有的page.tsx和metadata配置

**Output**:
- 更新`src/app/(public)/page.tsx`

**Success Criteria**:
- 替换现有简单实现为完整HomePage组件
- 保持Next.js 15 App Router SSR特性
- 保留现有metadata配置
- 确保路由正常工作

**Dependencies**: Task 19

---

## 阶段5：样式优化和响应式

### /task-21 实现响应式布局优化
**Input**:
- 移动端和平板端适配需求
- @radix-ui/react-collapsible折叠功能

**Output**:
- `src/features/websites/components/ResponsiveLayout.tsx`

**Success Criteria**:
- 实现移动端侧边栏折叠为抽屉
- 汉堡菜单和触摸友好交互(最小44px)
- 平板端布局优化
- Tailwind CSS断点系统使用

**Dependencies**: Tasks 19

---

### /task-22 添加交互动效和悬停效果
**Input**:
- 卡片悬停效果设计(translateY(-2px))
- CSS transitions和动画规范

**Output**:
- `src/features/websites/styles/animations.css`

**Success Criteria**:
- 实现卡片悬停阴影变化和位移
- smooth transition动画效果
- fade-in加载动画
- 交互元素hover状态优化

**Dependencies**: Tasks 7, 12

---

### /task-23 创建ErrorBoundary组件
**Input**:
- React错误边界模式
- 友好错误提示UI设计

**Output**:
- `src/features/websites/components/ErrorBoundary.tsx`

**Success Criteria**:
- 实现React错误边界组件
- 创建友好的错误提示界面
- 提供重试功能按钮
- 错误信息收集和上报机制

**Dependencies**: 无

---

### /task-24 创建LoadingStates组件
**Input**:
- 骨架屏loading设计
- 搜索和筛选加载指示器要求

**Output**:
- `src/features/websites/components/LoadingStates.tsx`

**Success Criteria**:
- 实现网站卡片骨架屏组件
- 搜索和筛选时的加载指示器
- 使用Tailwind CSS动画效果
- 与设计系统配色一致

**Dependencies**: Tasks 7

---

## Command Execution Notes

### 批量执行建议
1. **并行执行**: Tasks 1-2, Tasks 5-8, Tasks 10-11, Tasks 23-24
2. **顺序执行**: 每个阶段内部按依赖顺序执行
3. **验证点**: 每完成一个阶段后进行编译和基础功能测试

### 常见问题解决
- **类型错误**: 确保先完成Tasks 1-2再进行组件开发
- **状态管理**: Task 3必须在所有交互组件之前完成
- **样式问题**: 确保HSL主题系统正确配置

### 成功标准验证
每个任务完成后运行:
```bash
npm run type-check  # TypeScript编译检查
npm run lint        # 代码质量检查
```