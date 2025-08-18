# SubmitButton 组件使用示例

## 功能概述
SubmitButton 组件是为表单提交设计的紫色主题按钮，支持：
- 加载状态显示（"Submit" → "Submitting..."）
- 禁用状态处理（表单验证失败时）
- 免责声明显示
- 与 React Hook Form 和 useSubmissionForm 集成

## 基础使用

```tsx
import { SubmitButton } from '@/features/submissions/components';

function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // 表单提交逻辑
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  return (
    <form>
      {/* 其他表单字段 */}
      <SubmitButton
        isSubmitting={isSubmitting}
        isFormValid={isValid}
        onClick={handleSubmit}
      />
    </form>
  );
}
```

## 与 useSubmissionForm 集成

```tsx
import { useSubmissionForm } from '@/features/submissions/hooks';
import { FormSubmitButton } from '@/features/submissions/components';

function SubmissionForm() {
  const { 
    form, 
    isSubmitting, 
    isValid, 
    hasErrors, 
    handleSubmit 
  } = useSubmissionForm({
    onSubmitSuccess: (result) => {
      router.push('/submit/payment');
    }
  });

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {/* 表单字段 */}
      <FormSubmitButton
        isSubmitting={isSubmitting}
        isFormValid={isValid && !hasErrors}
        type="submit"
      />
    </form>
  );
}
```

## 组件变体

1. **SubmitButton** - 完整功能版本，包含免责声明
2. **BasicSubmitButton** - 简化版本，仅包含按钮功能
3. **FormSubmitButton** - 表单专用版本，默认 type="submit"

## 样式特征

- 紫色主题：`bg-purple-600` 正常状态，`bg-purple-700` hover 状态
- 加载状态：显示旋转图标，按钮变为 `bg-purple-500`，光标变为 `wait`
- 禁用状态：`bg-purple-300` 背景，不可点击
- 响应式设计：最小宽度 120px，内间距 px-6 py-3

## 无障碍访问

- `aria-label` 属性提供屏幕阅读器支持
- `aria-disabled` 属性指示禁用状态
- 键盘导航支持
- 高对比度焦点状态

## 数据测试

- 主按钮：`data-testid="submit-button"`
- 免责声明：`data-testid="submit-disclaimer"`