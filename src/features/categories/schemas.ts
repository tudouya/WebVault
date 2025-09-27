import { z } from "zod"

import type { CategoryStatus } from "./types"

const statusSchema = z.enum(["active", "inactive", "hidden"] as const satisfies CategoryStatus[])

const normalizedString = (max: number, field: string) =>
  z
    .string()
    .trim()
    .max(max, `${field}长度需在 ${max} 个字符内`)

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .union([schema, z.literal(""), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === "") return undefined
      if (value === null) return null
      return value as z.infer<T>
    })

const parentIdSchema = z
  .union([
    z.string().min(1, "父分类无效"),
    z.null(),
    z.literal(""),
  ])
  .transform((value) => (value === "" ? null : value))

export const categoryPayloadSchema = z.object({
  name: normalizedString(60, "名称").min(1, "名称不能为空"),
  slug: emptyToUndefined(normalizedString(60, "slug").regex(/^[a-z0-9-]+$/, "slug 仅能包含小写字母、数字与连字符")),
  description: emptyToUndefined(normalizedString(200, "描述")),
  parentId: parentIdSchema.optional(),
  displayOrder: z.coerce.number({ message: "排序必须为数字" }).int("排序必须为整数").min(0, "排序不可为负数").optional(),
  icon: emptyToUndefined(normalizedString(60, "图标")),
  status: statusSchema.default("active"),
})

export const categoryCreateSchema = categoryPayloadSchema

export type CategoryCreateSchema = z.infer<typeof categoryCreateSchema>

export const categoryUpdateSchema = categoryPayloadSchema
  .extend({
    status: statusSchema.optional(),
  })
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "缺少需要更新的字段",
        path: [],
      })
    }
  })

export type CategoryUpdateSchema = z.infer<typeof categoryUpdateSchema>

export const categoryFormSchema = categoryPayloadSchema.extend({
  displayOrder: z.coerce.number({ message: "排序必须为数字" })
    .int("排序必须为整数")
    .min(0, "排序不可为负数")
    .default(0),
})

export type CategoryFormValues = z.output<typeof categoryFormSchema>
export type CategoryFormInput = z.input<typeof categoryFormSchema>
