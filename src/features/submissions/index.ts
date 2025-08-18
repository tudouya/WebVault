// Submissions Feature Module
// 网站提交模块统一导出

// ===== 核心导出 (Core Exports) =====
// 主要组件 (Main Components)
export { SubmitPage, SubmissionForm } from './components'

// 核心Hook (Core Hook)
export { useSubmissionForm } from './hooks'

// 类型定义 (Type Definitions)
export type { SubmissionFormData } from './types'

// ===== 完整模块导出 (Full Module Exports) =====
// Types exports
export type * from './types'

// Schemas exports
export * from './schemas'

// Components exports
export * from './components'

// Hooks exports
export * from './hooks'

// Services exports
export * from './services'

// Stores exports
export * from './stores'