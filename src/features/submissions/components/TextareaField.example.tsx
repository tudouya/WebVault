'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { TextareaField, TextareaFieldWithConfig, TEXTAREA_CONFIGS } from './TextareaField'

// Example form schema
const exampleSchema = z.object({
  description: z.string()
    .min(TEXTAREA_CONFIGS.description.minLength!, 'Description is too short')
    .max(TEXTAREA_CONFIGS.description.maxLength!, 'Description is too long'),
  introduction: z.string()
    .min(TEXTAREA_CONFIGS.introduction.minLength!, 'Introduction is too short')
    .max(TEXTAREA_CONFIGS.introduction.maxLength!, 'Introduction is too long')
    .optional(),
  comment: z.string()
    .max(TEXTAREA_CONFIGS.comment.maxLength!, 'Comment is too long')
    .optional(),
})

type ExampleFormData = z.infer<typeof exampleSchema>

export function TextareaFieldExample() {
  const form = useForm<ExampleFormData>({
    resolver: zodResolver(exampleSchema),
    defaultValues: {
      description: '',
      introduction: '',
      comment: '',
    },
  })

  const onSubmit = (data: ExampleFormData) => {
    console.log('Form submitted:', data)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">TextareaField 组件示例</h1>
        <p className="text-muted-foreground">
          演示不同配置的多行文本输入组件的使用方法
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Description field with predefined config */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <TextareaFieldWithConfig
                configType="description"
                label="网站描述"
                {...field}
                error={form.formState.errors.description?.message}
              />
            )}
          />

          {/* Introduction field with predefined config */}
          <FormField
            control={form.control}
            name="introduction"
            render={({ field }) => (
              <TextareaFieldWithConfig
                configType="introduction"
                label="详细介绍"
                {...field}
                error={form.formState.errors.introduction?.message}
              />
            )}
          />

          {/* Comment field with custom config */}
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <TextareaField
                label="备注信息"
                config={{
                  maxLength: 300,
                  rows: 3,
                  showCounter: true,
                  placeholder: "请输入备注信息...",
                  description: "可选的备注信息，供内部参考使用",
                  required: false,
                }}
                {...field}
                error={form.formState.errors.comment?.message}
              />
            )}
          />

          <Button type="submit" className="w-full">
            提交表单
          </Button>
        </form>
      </Form>

      {/* Display current form values */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">当前表单值：</h3>
        <pre className="text-sm text-muted-foreground">
          {JSON.stringify(form.watch(), null, 2)}
        </pre>
      </div>
    </div>
  )
}

// Standalone component examples
export function StandaloneExamples() {
  const [value, setValue] = React.useState('')

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">独立组件示例</h2>
        <p className="text-muted-foreground">
          不使用 React Hook Form 的独立组件使用示例
        </p>
      </div>

      {/* Basic textarea with counter */}
      <TextareaField
        label="基础多行文本输入"
        config={{
          maxLength: 500,
          showCounter: true,
          placeholder: "输入你的文本内容...",
          description: "最多可输入500个字符",
        }}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      {/* Description configuration */}
      <TextareaFieldWithConfig
        configType="description"
        label="网站描述配置"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      {/* Introduction configuration */}
      <TextareaFieldWithConfig
        configType="introduction"
        label="详细介绍配置"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  )
}

export default TextareaFieldExample