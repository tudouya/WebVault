# WebVault 错误汇总报告

## 总体情况
- **TypeScript 类型错误**: 65 个
- **ESLint 警告**: 170+ 个 (全部设置为 warn)
- **ESLint 配置**: 大部分规则已降级为 warn，避免构建失败

## TypeScript 类型错误 (65个)

### 严重程度分类

#### 1. 高优先级 - 类型不匹配错误 (20+个)
这些错误会影响运行时行为：

**websiteDetailService.ts (最多错误)**
- `WebsiteCardData` 与 `Website` 类型不兼容
- `category` 字段类型不匹配 (string vs Category object)
- `visit_count` vs `visitCount` 属性名不一致
- 缺失属性: `status`, `is_public`, `image_url`
- pricing 对象中多余的 `currency` 字段

**日期类型错误**
- `useCollectionDetail.ts`: Date 类型不能赋值给 string | number

**未定义的类型/变量**
- `SearchPage.tsx`: `FilterState` 类型未定义
- `BrowsablePageErrorBoundary.tsx`: `BrowsablePageErrorContext` 未定义

#### 2. 中优先级 - 可能为 undefined 的值 (10+个)
- 函数调用时对象可能为 undefined
- 必需属性可能为 undefined
- 索引类型不能为 undefined

#### 3. 低优先级 - 属性名拼写/命名不一致 (15+个)
- `visit_count` vs `visitCount`
- snake_case vs camelCase 混用

## ESLint 警告分类

### 1. 未使用的变量/导入 (@typescript-eslint/no-unused-vars) - 80+个
最常见的问题，包括：
- 已定义但未使用的变量
- 已导入但未使用的组件
- 函数参数未使用

**高频文件**：
- `browsable-pages/` 模块: 30+ 个
- `websites/` 模块: 40+ 个
- stores 文件: 20+ 个

### 2. React 相关警告 - 20+个
- `react/no-unescaped-entities`: 未转义的引号字符
- `react-hooks/exhaustive-deps`: useEffect 依赖项问题
- `react/display-name`: 组件缺少 displayName
- `import/no-anonymous-default-export`: 匿名默认导出

### 3. TypeScript any 类型使用 (@typescript-eslint/no-explicit-any) - 25+个
主要集中在：
- `stores/` 文件中的错误处理
- `hooks/` 中的性能优化相关代码
- `services/` 中的 API 调用

### 4. 其他警告
- `@typescript-eslint/no-namespace`: 使用了 namespace
- `prefer-const`: 应该使用 const
- 各种未使用的工具函数和类型定义

## 问题根源分析

### 1. 数据模型不一致
- 前端使用 camelCase，但某些地方还在使用 snake_case
- `WebsiteCardData`, `Website`, `WebsiteDetailData` 类型定义不统一
- Category 有时是字符串，有时是对象

### 2. 代码重构遗留
- 大量未使用的导入和变量表明代码经过多次重构
- 旧的 mock 数据和测试代码未清理
- store 中的一些 action 和 state 已不再使用

### 3. 类型定义不完整
- 很多地方使用 any 来避免类型错误
- 某些接口和类型定义缺失或不完整
- URL 状态管理库 (nuqs) 的类型定义问题

## 修复建议优先级

### 第一阶段 - 修复关键类型错误
1. 统一 Website 相关的类型定义
2. 修复 websiteDetailService.ts 中的所有类型错误
3. 解决未定义的类型和变量

### 第二阶段 - 清理未使用代码
1. 删除所有未使用的导入
2. 删除未使用的变量和函数
3. 清理 mock 数据和示例代码

### 第三阶段 - 改善代码质量
1. 替换所有 any 类型为具体类型
2. 修复 React 相关警告
3. 统一命名规范 (全部使用 camelCase)

### 第四阶段 - 恢复 ESLint 规则
1. 将 warn 规则逐步改回 error
2. 确保所有代码符合严格的类型检查