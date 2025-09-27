import { z } from "zod"

import type { TagStatus } from "./types/tag"

const statusSchema = z.enum(["active", "inactive"] as const satisfies TagStatus[])

const normalizedString = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label}不能为空`)
    .max(max, `${label}长度需在 ${max} 个字符内`)

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .union([schema, z.literal(""), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === "") return undefined
      if (value === null) return null
      return value as z.infer<T>
    })

export const tagPayloadSchema = z.object({
  name: normalizedString(40, "名称"),
  slug: emptyToUndefined(
    normalizedString(60, "slug").regex(/^[a-z0-9-]+$/, "slug 仅能包含小写字母、数字与连字符")
  ),
  description: emptyToUndefined(normalizedString(200, "描述")),
  color: emptyToUndefined(
    z
      .string()
      .trim()
      .regex(/^#?[0-9a-fA-F]{3,8}$/i, "颜色值需为 Hex 格式")
  ),
  status: statusSchema.default("active"),
})

export const tagCreateSchema = tagPayloadSchema
export type TagCreateSchema = z.infer<typeof tagCreateSchema>

export const tagUpdateSchema = tagPayloadSchema
  .partial()
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "缺少需要更新的字段",
      })
    }
  })

export type TagUpdateSchema = z.infer<typeof tagUpdateSchema>

export const tagFormSchema = tagPayloadSchema.extend({
  color: emptyToUndefined(
    z
      .string()
      .trim()
      .regex(/^#?[0-9a-fA-F]{6}$/i, "请提供 6 位 Hex 颜色值")
  ),
})

export type TagFormValues = z.output<typeof tagFormSchema>
export type TagFormInput = z.input<typeof tagFormSchema>
