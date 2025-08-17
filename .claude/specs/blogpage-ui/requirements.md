# Requirements - Blog Page UI

## Status
- **Phase**: Requirements  
- **Status**: Complete
- **Date Created**: 2025-08-16
- **Last Updated**: 2025-08-16

## Requirements Document

## Introduction

本规格定义博客页面UI界面的实现需求，参照设计图 `design/11_Blog_list.png` 创建一个功能完整的博客列表展示页面。该页面将作为WebVault平台的博客模块核心界面，提供博客文章的浏览、筛选和分页功能，支持响应式设计和用户交互。

博客页面将成为平台内容营销的重要入口，为用户提供优质的网站推荐文章和技术见解，增强平台的内容价值和用户粘性。

## Alignment with Product Vision

### 支持产品愿景目标

**核心功能目标对齐**：
- **博客系统 (Blog System)**：直接实现网站推荐文章的创作和发布展示界面
- **内容管理系统**：提供博客内容的前台展示和用户浏览体验
- **用户管理**：支持访客浏览和管理员内容管理的用户体验

**目标用户价值**：
- **访客用户**：提供优质博客内容浏览体验，支持分类筛选和搜索功能
- **管理员**：通过博客界面验证内容展示效果，支持内容运营策略
- **系统管理员**：监控博客页面访问数据，了解用户偏好和平台活跃度

### 技术架构对齐

遵循 CLAUDE.md 中定义的：
- **Feature First Architecture**：在 `src/features/blog/` 模块下组织所有博客相关组件
- **Next.js 15 App Router**：使用 `src/app/(public)/blog/` 路由结构
- **shadcn/ui 设计系统**：保持与现有页面一致的UI组件库和设计风格
- **响应式设计**：支持所有设备尺寸的最佳浏览体验

## Requirements

### Requirement 1: 博客列表展示界面

**User Story:** 作为浏览博客的网站访客，我希望能够快速浏览最新的博客文章列表，以便发现优质的网站推荐资源并提升我的技术视野

#### Acceptance Criteria

1. WHEN 用户首次访问 `/blog` 页面 THEN 系统 SHALL 在2秒内渲染包含6篇文章的响应式网格布局
2. IF 页面成功加载 THEN 系统 SHALL 显示页面标题 "Read our latest blog posts"
3. WHEN 页面渲染完成 THEN 系统 SHALL 展示6篇最新博客文章，每篇文章显示为独立卡片
4. IF 文章卡片正常显示 THEN 系统 SHALL 包含高质量封面图、文章标题、作者头像、作者名称和相对发布时间
5. WHEN 用户点击任意文章卡片 THEN 系统 SHALL 导航到 `/blog/[slug]` 详情页面并保持URL状态

### Requirement 2: 文章分类筛选系统

**User Story:** 作为寻找特定内容的博客读者，我希望能够按文章分类进行筛选，以便快速定位到感兴趣的技术领域内容

#### Acceptance Criteria

1. IF 页面核心内容加载完成 THEN 系统 SHALL 在页面标题下方显示水平排列的分类筛选标签栏
2. WHEN 筛选标签栏渲染 THEN 系统 SHALL 包含 "All", "Lifestyle", "Technologies", "Design", "Travel", "Growth" 六个预定义分类选项
3. IF 用户点击 "All" 标签 THEN 系统 SHALL 显示所有类别的博客文章并将 "All" 标签设为激活状态
4. WHEN 用户选择特定分类标签 THEN 系统 SHALL 过滤显示该分类文章并通过API调用 `/api/blog?category={selected}` 获取数据
5. IF 用户选择任意分类 THEN 系统 SHALL 通过背景色和字体颜色变化高亮显示当前选中标签

### Requirement 3: 分页导航系统

**User Story:** 作为探索历史内容的博客读者，我希望能够通过分页功能浏览更多博客文章，以便发现更丰富的网站推荐资源

#### Acceptance Criteria

1. IF 文章总数超过6篇 AND 需要分页时 THEN 系统 SHALL 在页面底部Newsletter区域上方显示分页控件
2. WHEN 分页控件渲染 THEN 系统 SHALL 包含当前页码、相邻页码数字、左右导航箭头和页面间距点符号
3. IF 用户点击特定页码数字 THEN 系统 SHALL 在1秒内跳转到对应页面并通过API `/api/blog?page={number}` 更新文章列表
4. WHEN 用户点击左箭头按钮 AND 当前不是第一页 THEN 系统 SHALL 导航到上一页并更新URL参数
5. WHEN 用户点击右箭头按钮 AND 当前不是最后一页 THEN 系统 SHALL 导航到下一页并更新URL参数
6. IF 当前页面为第一页 THEN 系统 SHALL 将左箭头按钮设为禁用状态并降低视觉优先级
7. IF 当前页面为最后一页 THEN 系统 SHALL 将右箭头按钮设为禁用状态并降低视觉优先级

### Requirement 4: 博客文章卡片设计

**User Story:** 作为访客用户，我希望文章卡片信息丰富且视觉吸引人，以便快速判断内容质量

#### Acceptance Criteria

1. WHEN 文章卡片渲染 THEN 系统 SHALL 显示高质量的封面图片
2. WHEN 显示文章信息 THEN 系统 SHALL 包含标题、作者头像、作者名称和发布时间
3. WHEN 显示文章标题 THEN 系统 SHALL 限制在2行内显示，超出部分用省略号
4. WHEN 显示发布时间 THEN 系统 SHALL 使用相对时间格式（如 "20d AHEAD"）
5. WHEN 卡片悬停 THEN 系统 SHALL 提供视觉反馈效果

### Requirement 5: 响应式布局设计

**User Story:** 作为移动端用户，我希望博客页面在各种设备上都能正常显示，以便随时浏览内容

#### Acceptance Criteria

1. WHEN 桌面端访问 THEN 系统 SHALL 使用3列网格布局展示文章
2. WHEN 平板端访问 THEN 系统 SHALL 使用2列网格布局展示文章
3. WHEN 移动端访问 THEN 系统 SHALL 使用单列布局展示文章
4. WHEN 屏幕尺寸变化 THEN 系统 SHALL 平滑过渡到对应布局
5. WHEN 移动端显示 THEN 系统 SHALL 保持所有功能的可用性

### Requirement 6: Newsletter订阅组件

**User Story:** 作为潜在订阅者，我希望能够订阅博客更新通知，以便及时获得最新内容

#### Acceptance Criteria

1. WHEN 页面滚动到底部 THEN 系统 SHALL 显示Newsletter订阅区域
2. WHEN 显示订阅区域 THEN 系统 SHALL 包含标题 "Join the Community"
3. WHEN 显示订阅表单 THEN 系统 SHALL 包含邮箱输入框和订阅按钮
4. WHEN 用户输入有效邮箱 THEN 系统 SHALL 启用订阅按钮
5. WHEN 用户点击订阅按钮 THEN 系统 SHALL 处理订阅请求并显示结果反馈

### Requirement 7: 页面性能和加载

**User Story:** 作为任何用户，我希望博客页面快速加载，以便获得流畅的浏览体验

#### Acceptance Criteria

1. WHEN 页面首次加载 THEN 系统 SHALL 在3秒内完成核心内容渲染
2. WHEN 图片加载 THEN 系统 SHALL 使用懒加载技术优化性能
3. WHEN 页面切换 THEN 系统 SHALL 显示适当的加载状态指示
4. WHEN 网络较慢 THEN 系统 SHALL 优先加载文本内容，图片逐步加载
5. WHEN 发生加载错误 THEN 系统 SHALL 显示友好的错误提示信息

## Non-Functional Requirements

### Performance
- 页面首屏渲染时间不超过2秒
- 图片懒加载实现，提升页面加载速度
- 分页导航响应时间不超过1秒
- 支持图片压缩和WebP格式优化

### Security
- 用户输入内容需进行XSS防护
- 邮箱订阅数据需要加密传输
- API调用需要适当的速率限制
- 图片上传需要文件类型和大小验证

### Reliability
- 99%的页面可用性保证
- 网络错误时提供离线缓存内容
- 数据库连接失败时的降级处理
- 自动重试机制处理临时性故障

### Usability
- 符合WCAG 2.1 AA级别无障碍标准
- 支持键盘导航和屏幕阅读器
- 提供明确的视觉层次和对比度
- 加载状态和错误状态的友好提示

## Technical Specifications

### API Endpoints
- **博客列表**: `GET /api/blog?page={number}&category={slug}&limit=6`
- **分类列表**: `GET /api/blog/categories`
- **Newsletter订阅**: `POST /api/newsletter/subscribe`

### State Management
- 使用 Zustand store 管理博客页面状态 (`src/features/blog/stores/blog-store.ts`)
- URL 状态同步使用 Nuqs 库管理查询参数
- 页面状态包含：当前页码、选中分类、加载状态、错误状态

### Responsive Breakpoints
- **Desktop**: 1024px+ (3列网格布局)
- **Tablet**: 768-1023px (2列网格布局)  
- **Mobile**: <768px (单列布局)

### Performance Optimization
- 使用 Next.js Image 组件进行图片优化
- 图片懒加载触发距离：视窗底部200px
- 首屏 LCP (Largest Contentful Paint) < 2.5秒
- CLS (Cumulative Layout Shift) < 0.1

### Error Handling Scenarios

#### API错误处理
1. **网络请求失败**:
   - WHEN API请求失败 THEN 系统 SHALL 显示"暂时无法加载内容，请稍后重试"提示
   - WHEN 超时错误发生 THEN 系统 SHALL 提供"重新加载"按钮选项

2. **数据加载错误**:
   - IF 网络连接中断 THEN 系统 SHALL 显示缓存内容（如果可用）
   - WHEN 服务器返回500错误 THEN 系统 SHALL 显示通用错误页面并记录错误日志

#### 资源加载错误
1. **图片加载失败**:
   - WHEN 文章封面图加载失败 THEN 系统 SHALL 显示默认占位图
   - IF 作者头像加载失败 THEN 系统 SHALL 显示默认用户头像

2. **内容加载错误**:
   - WHEN 分页数据为空 THEN 系统 SHALL 显示"暂无更多内容"提示
   - IF 分类筛选无结果 THEN 系统 SHALL 显示"该分类下暂无文章"消息

## Visual Design Requirements

### Requirement 8: 精确配色系统

**User Story:** 作为用户，我希望看到统一的现代化配色方案，以便获得专业愉悦的浏览体验

#### Acceptance Criteria

1. WHEN 页面加载时 THEN 系统 SHALL 使用页面主背景色 `#F9FAFB` 和内容区背景色 `#FFFFFF`
2. WHEN 显示主要交互按钮时 THEN 系统 SHALL 使用主要强调色 `#8B5CF6` (分类标签激活态、订阅按钮)
3. WHEN 展示文章卡片时 THEN 系统 SHALL 使用卡片背景色 `#FFFFFF` 配合 `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`
4. WHEN 显示文本内容时 THEN 系统 SHALL 使用分层文本颜色：
   - 页面主标题：`#111827`
   - 文章标题：`#1F2937`
   - 正文文本：`#374151` 
   - 辅助文本（作者、时间）：`#6B7281`
   - 分类标签文字：`#4B5563`
5. WHEN 展示分类标签时 THEN 系统 SHALL 使用标签配色：
   - 默认标签：背景 `#F3F4F6`，文字 `#4B5563`
   - 激活标签：背景 `#8B5CF6`，文字 `#FFFFFF`
   - 悬停状态：背景 `#E5E7EB`，文字 `#374151`

### Requirement 9: 博客文章卡片视觉设计

**User Story:** 作为用户，我希望博客文章卡片具有清晰的视觉层次和吸引人的设计，以便快速获取信息

#### Acceptance Criteria

1. WHEN 文章卡片显示时 THEN 系统 SHALL 使用圆角矩形白色卡片容器 `border-radius: 12px` 配合微妙阴影
2. WHEN 卡片展示封面图片时 THEN 系统 SHALL 在卡片顶部显示 `aspect-ratio: 16:10` 的高质量图片，支持图片懒加载
3. WHEN 展示文章信息时 THEN 系统 SHALL 在图片下方显示文章标题，限制最多2行文字并显示省略号
4. WHEN 显示作者信息时 THEN 系统 SHALL 在底部展示圆形作者头像、作者名称和发布时间的水平布局
5. WHEN 用户悬停卡片时 THEN 系统 SHALL 提供 `transform: translateY(-4px)` 和阴影加深的视觉反馈
6. WHEN 卡片布局时 THEN 系统 SHALL 确保所有卡片高度一致，使用 `grid-template-rows: 1fr` 对齐

### Requirement 10: 分类筛选标签设计

**User Story:** 作为用户，我希望分类筛选标签易于识别和操作，以便快速切换不同内容类别

#### Acceptance Criteria

1. WHEN 分类标签栏显示时 THEN 系统 SHALL 使用水平滚动的标签容器，支持触摸滑动
2. WHEN 展示单个标签时 THEN 系统 SHALL 使用圆角胶囊样式 `border-radius: 20px`，内边距 `12px 20px`
3. WHEN 标签处于默认状态时 THEN 系统 SHALL 使用浅灰背景和深灰文字，边框样式 `border: 1px solid #E5E7EB`
4. WHEN 标签被选中时 THEN 系统 SHALL 使用紫色背景 `#8B5CF6` 和白色文字，移除边框
5. WHEN 用户悬停标签时 THEN 系统 SHALL 提供 `transition: all 0.2s ease` 的平滑过渡效果
6. WHEN 移动端显示时 THEN 系统 SHALL 保持标签可点击性，最小触摸区域 44px

### Requirement 11: 分页控件视觉规范

**User Story:** 作为用户，我希望分页控件清晰直观，以便轻松导航到不同页面

#### Acceptance Criteria

1. WHEN 分页控件显示时 THEN 系统 SHALL 使用居中对齐的水平布局，页码间距离为8px
2. WHEN 展示页码数字时 THEN 系统 SHALL 使用圆形按钮样式，尺寸 `40px × 40px`
3. WHEN 页码处于默认状态时 THEN 系统 SHALL 使用透明背景，文字颜色 `#6B7281`
4. WHEN 页码为当前页时 THEN 系统 SHALL 使用紫色背景 `#8B5CF6` 和白色文字
5. WHEN 显示导航箭头时 THEN 系统 SHALL 使用一致的圆形按钮样式，禁用状态显示 `#D1D5DB` 背景
6. WHEN 用户悬停可点击页码时 THEN 系统 SHALL 显示 `#F3F4F6` 背景色过渡效果

### Requirement 12: 布局和间距系统

**User Story:** 作为用户，我希望页面布局整齐有序，信息密度适中，以便轻松浏览内容

#### Acceptance Criteria

1. WHEN 页面布局时 THEN 系统 SHALL 使用最大宽度 `1200px` 的居中容器，左右边距最小 `24px`
2. WHEN 显示博客文章网格时 THEN 系统 SHALL 使用响应式网格：
   - 桌面端：3列，列间距 `24px`
   - 平板端：2列，列间距 `20px`
   - 移动端：1列，左右边距 `16px`
3. WHEN 展示页面标题时 THEN 系统 SHALL 在标题上方保留 `80px` 间距，下方保留 `32px` 间距
4. WHEN 显示分类标签栏时 THEN 系统 SHALL 在标题下方保留 `24px` 间距，与文章网格间距 `48px`
5. WHEN 展示Newsletter区域时 THEN 系统 SHALL 在文章网格下方保留 `80px` 间距

### Requirement 13: 交互效果和动画

**User Story:** 作为用户，我希望界面交互自然流畅，有适当的视觉反馈，以便获得现代化的用户体验

#### Acceptance Criteria

1. WHEN 用户悬停可点击元素时 THEN 系统 SHALL 提供 `transition: all 0.2s ease` 的过渡动画
2. WHEN 用户点击分类筛选时 THEN 系统 SHALL 使用 `fade-in` 动画显示新内容，持续时间 `300ms`
3. WHEN 页面初始加载时 THEN 系统 SHALL 使用文章卡片的 `stagger` 动画效果，每个卡片延迟 `100ms`
4. WHEN 分页切换时 THEN 系统 SHALL 使用平滑的内容替换动画，避免布局跳动
5. WHEN 图片加载时 THEN 系统 SHALL 显示 `placeholder` 背景色渐变动画，直到图片完全加载

### Requirement 14: 字体和排版规范

**User Story:** 作为用户，我希望看到清晰易读的字体排版，以便舒适地阅读内容

#### Acceptance Criteria

1. WHEN 显示页面主标题时 THEN 系统 SHALL 使用字体大小 `48px`，字重 `700`，行高 `1.2`
2. WHEN 展示文章卡片标题时 THEN 系统 SHALL 使用字体大小 `20px`，字重 `600`，行高 `1.4`
3. WHEN 显示作者名称时 THEN 系统 SHALL 使用字体大小 `14px`，字重 `500`，颜色 `#374151`
4. WHEN 展示发布时间时 THEN 系统 SHALL 使用字体大小 `14px`，字重 `400`，颜色 `#6B7281`
5. WHEN 设置分类标签文字时 THEN 系统 SHALL 使用字体大小 `14px`，字重 `500`，确保可读性
6. WHEN 文字换行时 THEN 系统 SHALL 确保中英文混排的良好显示效果和合适的字间距