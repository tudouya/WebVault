# Requirements - Submit Page UI

## Status
- **Phase**: Requirements  
- **Status**: Complete
- **Date Created**: 2025-08-18
- **Last Updated**: 2025-08-18

## Introduction

基于设计图 `9_Submit.png` 实现WebVault网站提交页面界面。该页面作为用户提交网站资源的入口，采用三步骤工作流程：Details(详细信息) → Payment(付费) → Publish(发布)。第一步骤包含完整的网站信息收集表单，支持文本输入、下拉选择、富文本编辑和文件上传等多种交互形式。

## Alignment with Product Vision

此需求支持CLAUDE.md中定义的产品目标：
- **提交审核工作流** - 通过规范化的提交表单实现用户网站提交功能
- **用户友好体验** - 分步骤的表单设计，降低用户填写负担，提升完成率
- **网站管理核心功能** - 收集完整网站信息为后续审核和展示提供数据基础
- **质量控制机制** - 通过必填字段和格式验证确保提交内容质量

## Requirements

### Requirement 1 - 页面布局和导航

**User Story:** 作为用户，我希望看到清晰的页面结构和步骤指示，以便了解提交流程的当前进度和剩余步骤

#### Acceptance Criteria
1. WHEN 用户访问提交页面 THEN 系统 SHALL 在页面顶部显示导航栏，包含Directory品牌Logo和主要导航菜单
2. WHEN 页面加载 THEN 系统 SHALL 在主标题区域显示"Submit"页面标题和三步骤进度指示器
3. WHEN 进度指示器显示时 THEN 系统 SHALL 突出显示当前步骤"Details"(第1步)，并显示后续步骤"Payment"(第2步)和"Publish"(第3步)
4. WHEN 用户查看导航栏 THEN 系统 SHALL 显示Homepage、Dashboard、Settings、Submit等导航选项
5. IF 用户点击右上角用户头像 THEN 系统 SHALL 显示用户菜单或个人资料选项

### Requirement 2 - 基础信息输入表单

**User Story:** 作为用户，我希望能够输入网站的基本信息（链接、名称等），以便系统能够收集网站的核心数据

#### Acceptance Criteria  
1. WHEN 表单加载 THEN 系统 SHALL 在左侧显示"Link"输入框，占位符文本为"Enter the link to your product"
2. WHEN 用户输入链接时 THEN 系统 SHALL 验证URL格式的有效性，无效时显示错误提示
3. WHEN 表单加载 THEN 系统 SHALL 在右侧显示"Name"输入框，占位符文本为"Enter the name of your product"
4. WHEN 用户输入名称时 THEN 系统 SHALL 要求名称长度在3-100字符之间，超出范围时显示错误信息
5. WHEN 用户离开必填字段为空时 THEN 系统 SHALL 显示红色边框和"此字段为必填项"提示

### Requirement 3 - 分类和标签选择

**User Story:** 作为用户，我希望能够为我的网站选择合适的分类和标签，以便其他用户更容易发现我的网站

#### Acceptance Criteria
1. WHEN 表单加载 THEN 系统 SHALL 在左侧显示"Categories"下拉选择器，默认显示"Select categories"
2. WHEN 用户点击分类下拉框 THEN 系统 SHALL 展开显示可用分类列表（Finance、Travel、Education等）
3. WHEN 用户选择分类时 THEN 系统 SHALL 更新下拉框显示选中的分类名称
4. WHEN 表单加载 THEN 系统 SHALL 在右侧显示"Tags"下拉选择器，默认显示"Select tags"
5. WHEN 用户点击标签下拉框 THEN 系统 SHALL 展开显示可用标签列表，支持多选
6. WHEN 用户选择多个标签时 THEN 系统 SHALL 在下拉框内显示已选标签数量或标签名称

### Requirement 4 - 描述文本输入

**User Story:** 作为用户，我希望能够输入网站的简短描述，以便向其他用户说明网站的主要功能和价值

#### Acceptance Criteria
1. WHEN 表单加载 THEN 系统 SHALL 显示"Description"多行文本输入框，占位符为"Enter a brief description of your product"
2. WHEN 用户输入描述时 THEN 系统 SHALL 限制字符数在10-500字符之间
3. WHEN 用户输入时 THEN 系统 SHALL 实时显示字符计数器（如"120/500"）
4. WHEN 描述超过字符限制时 THEN 系统 SHALL 显示红色警告文本和阻止继续输入
5. WHEN 用户输入HTML标签时 THEN 系统 SHALL 自动转义特殊字符防止XSS攻击

### Requirement 5 - 富文本编辑器(Introduction)

**User Story:** 作为用户，我希望能够使用富文本编辑器编写详细的网站介绍，支持格式化文本和Markdown语法

#### Acceptance Criteria  
1. WHEN 富文本编辑器加载 THEN 系统 SHALL 显示"Introduction"编辑器，右上角标注"(Markdown supported)"
2. WHEN 编辑器工具栏显示时 THEN 系统 SHALL 提供格式化按钮：加粗(B)、斜体(I)、删除线(S)、链接、代码块、列表、引用等
3. WHEN 用户点击格式化按钮时 THEN 系统 SHALL 应用相应的Markdown格式到选中文本
4. WHEN 用户输入Markdown语法时 THEN 系统 SHALL 提供实时预览或语法高亮
5. WHEN 编辑器内容为空时 THEN 系统 SHALL 显示占位符文本"Enter your content here..."
6. WHEN 用户输入内容时 THEN 系统 SHALL 支持撤销/重做操作和键盘快捷键

### Requirement 6 - 文件上传功能

**User Story:** 作为用户，我希望能够上传网站图标和主图片，以便为网站提供视觉展示素材

#### Acceptance Criteria
1. WHEN 页面加载 THEN 系统 SHALL 显示两个文件上传区域："Icon"(左侧)和"Image"(右侧)
2. WHEN 上传区域显示时 THEN 系统 SHALL 在每个区域标注支持的文件格式"(It's PNG or JPEG, max 5MB)"
3. WHEN 用户拖拽文件到上传区域时 THEN 系统 SHALL 显示视觉反馈（边框高亮或背景变化）
4. WHEN 用户松开拖拽文件时 THEN 系统 SHALL 验证文件格式和大小，符合要求则上传，否则显示错误信息
5. WHEN 用户点击上传区域时 THEN 系统 SHALL 打开文件选择对话框，限制文件类型为PNG和JPEG
6. WHEN 文件上传成功时 THEN 系统 SHALL 在上传区域显示文件预览缩略图
7. WHEN 文件上传失败时 THEN 系统 SHALL 显示具体错误信息（如"文件过大"、"格式不支持"等）

### Requirement 7 - 表单提交和验证

**User Story:** 作为用户，我希望能够提交表单并获得明确的反馈，以便知道提交是否成功以及下一步操作

#### Acceptance Criteria
1. WHEN 页面底部显示时 THEN 系统 SHALL 显示紫色"Submit"按钮，位于表单左下角
2. WHEN 用户点击Submit按钮时 THEN 系统 SHALL 验证所有必填字段是否已填写
3. WHEN 存在验证错误时 THEN 系统 SHALL 阻止表单提交，滚动到第一个错误字段并高亮显示
4. WHEN 表单验证通过时 THEN 系统 SHALL 显示提交loading状态，按钮文本变为"Submitting..."并禁用
5. WHEN 提交成功时 THEN 系统 SHALL 导航到下一步骤"Payment"或显示成功消息
6. WHEN 提交失败时 THEN 系统 SHALL 显示错误提示信息，保持用户已填写的内容
7. WHEN 表单底部显示时 THEN 系统 SHALL 显示免责声明"No worries, you can change these information later"

### Requirement 8 - 响应式设计和可访问性

**User Story:** 作为用户，我希望在不同设备上都能正常使用提交表单，包括键盘导航和屏幕阅读器支持

#### Acceptance Criteria  
1. WHEN 在移动设备浏览时 THEN 系统 SHALL 将两列布局调整为单列，保持适当的间距
2. WHEN 在平板设备浏览时 THEN 系统 SHALL 保持两列布局但调整元素间距适应屏幕尺寸
3. WHEN 用户使用键盘导航时 THEN 系统 SHALL 支持Tab键顺序遍历所有可交互元素
4. WHEN 元素获得焦点时 THEN 系统 SHALL 显示清晰的焦点指示器（蓝色边框或高亮）
5. WHEN 使用屏幕阅读器时 THEN 系统 SHALL 为所有表单字段提供appropriate的aria-label和描述
6. WHEN 在触摸设备上使用时 THEN 系统 SHALL 确保所有按钮和交互区域最小尺寸为44px

## Non-Functional Requirements

### Performance
- 页面初始加载时间应在2秒内完成
- 文件上传应支持断点续传，大文件上传时显示进度条
- 表单验证应实时响应，单次验证响应时间在200ms内
- 富文本编辑器应支持大量文本输入，不出现明显的输入延迟

### Security  
- 所有用户输入应进行XSS防护，特殊字符自动转义
- 文件上传应验证文件真实类型，防止恶意文件上传
- 表单提交应包含CSRF令牌防护
- 上传的文件应进行病毒扫描（后端实现）

### Reliability
- 网络中断时应保存用户已填写的表单数据到本地存储
- 页面刷新后应恢复用户之前的填写内容
- 上传失败时应提供重试机制
- 表单提交失败时应保留用户输入，避免重新填写

### Usability
- 错误信息应使用友好易懂的语言，避免技术术语
- 每个输入字段应提供清晰的标签和帮助文本
- 进度指示器应让用户了解整个提交流程的进度
- 加载状态应提供明确的视觉反馈

## Visual Design Requirements

### Requirement 9 - 精确配色和主题系统

**User Story:** 作为用户，我希望看到与整站一致的现代化配色方案，提供专业可信的视觉体验

#### Acceptance Criteria
1. WHEN 页面加载时 THEN 系统 SHALL 使用主背景色 `#F9FAFB` 和卡片背景色 `#FFFFFF`
2. WHEN 显示Submit按钮时 THEN 系统 SHALL 使用主要强调色 `#8B5CF6`（紫色）作为背景
3. WHEN 显示输入框和下拉框时 THEN 系统 SHALL 使用边框颜色 `#E5E7EB`，聚焦时使用紫色边框
4. WHEN 显示文本内容时 THEN 系统 SHALL 使用分层文本颜色：
   - 主标题和标签：`#111827`
   - 正文和输入文本：`#374151`
   - 占位符文本：`#6B7281`
   - 辅助说明文字：`#9CA3AF`
5. WHEN 显示错误状态时 THEN 系统 SHALL 使用红色强调色 `#EF4444` 作为边框和错误文本

### Requirement 10 - 布局和间距规范

**User Story:** 作为用户，我希望表单布局整齐美观，信息层次清晰，便于快速理解和填写

#### Acceptance Criteria  
1. WHEN 表单布局时 THEN 系统 SHALL 使用居中的容器布局，最大宽度为1200px
2. WHEN 显示表单字段时 THEN 系统 SHALL 使用两列布局，每列之间间距为24px
3. WHEN 显示字段标签时 THEN 系统 SHALL 在输入框上方保持8px间距
4. WHEN 显示输入框时 THEN 系统 SHALL 使用44px高度，内边距为12px
5. WHEN 显示文件上传区域时 THEN 系统 SHALL 使用最小120px高度，圆角为8px
6. WHEN 移动端显示时 THEN 系统 SHALL 调整为单列布局，保持16px的水平边距

### Requirement 11 - 交互效果和状态反馈

**User Story:** 作为用户，我希望界面交互自然流畅，有清晰的状态反馈，便于理解当前操作结果

#### Acceptance Criteria
1. WHEN 用户悬停可交互元素时 THEN 系统 SHALL 提供subtle的hover效果（颜色变化或阴影）
2. WHEN 用户聚焦输入框时 THEN 系统 SHALL 显示蓝色聚焦环和smooth的过渡动画
3. WHEN 文件拖拽到上传区域时 THEN 系统 SHALL 显示虚线边框和背景色变化
4. WHEN 表单验证失败时 THEN 系统 SHALL 使用shake动画吸引用户注意错误字段
5. WHEN 用户输入内容时 THEN 系统 SHALL 提供实时的字符计数和验证反馈

### Requirement 12 - 字体和排版系统

**User Story:** 作为用户，我希望看到清晰易读的字体排版，确保长时间填写表单时的舒适体验

#### Acceptance Criteria  
1. WHEN 显示页面标题时 THEN 系统 SHALL 使用32px粗体字体
2. WHEN 显示字段标签时 THEN 系统 SHALL 使用14px中等粗细字体
3. WHEN 显示输入框文本时 THEN 系统 SHALL 使用14px常规字体，行高为1.5
4. WHEN 显示帮助文本时 THEN 系统 SHALL 使用12px字体，颜色为辅助色
5. WHEN 显示按钮文字时 THEN 系统 SHALL 使用14px中等粗细白色字体