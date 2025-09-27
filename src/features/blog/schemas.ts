import { z } from "zod"

import { BLOG_POST_STATUSES } from "./types"

const statusSchema = z.enum(BLOG_POST_STATUSES)

const normalizedString = (max: number, field: string) =>
  z
    .string()
    .trim()
    .min(1, `${field}不能为空`)
    .max(max, `${field}长度需在 ${max} 个字符内`)

const optionalNormalizedString = (max: number, field: string) =>
  z
    .union([
      z.string().trim().max(max, `${field}长度需在 ${max} 个字符内`),
      z.literal(""),
      z.undefined(),
      z.null(),
    ])
    .transform((value) => {
      if (!value) return undefined
      if (value === "") return undefined
      return value
    })

const slugSchema = z
  .string()
  .trim()
  .min(1, "slug 不能为空")
  .max(160, "slug 长度需在 160 个字符内")
  .regex(/^[a-z0-9-]+$/, "slug 仅能包含小写字母、数字与连字符")

const optionalSlugSchema = z
  .union([slugSchema, z.literal(""), z.undefined(), z.null()])
  .transform((value) => {
    if (!value) return undefined
    if (value === "") return undefined
    return value
  })

const rawTagsSchema = z
  .union([
    z.array(z.string().trim()),
    z.string().trim(),
    z.undefined(),
    z.null(),
  ])
  .transform((value) => {
    if (!value) return undefined
    if (Array.isArray(value)) {
      const normalized = value.map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      return normalized.length ? Array.from(new Set(normalized)) : undefined
    }
    const segments = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
    return segments.length ? Array.from(new Set(segments)) : undefined
  })

const publishedAtSchema = z
  .union([
    z
      .string()
      .datetime({
        message: "发布时间需为 ISO 8601 格式",
      }),
    z.literal(""),
    z.undefined(),
    z.null(),
  ])
  .transform((value) => {
    if (!value) return undefined
    if (value === "") return undefined
    return value
  })

const basePayloadSchema = z.object({
  title: normalizedString(200, "标题"),
  slug: optionalSlugSchema,
  summary: optionalNormalizedString(500, "摘要"),
  content: normalizedString(100000, "内容"),
  coverImage: optionalNormalizedString(500, "封面图"),
  authorId: optionalNormalizedString(120, "作者标识"),
  tags: rawTagsSchema,
  status: statusSchema.default("draft"),
  publishedAt: publishedAtSchema,
})

export const blogPostCreateSchema = basePayloadSchema
  .superRefine((data, ctx) => {
    if (data.status === "published" && !data.publishedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publishedAt"],
        message: "发布状态必须提供发布时间",
      })
    }
  })
  .transform((data) => ({
    ...data,
    tags: data.tags ?? [],
  }))

export type BlogPostCreateInput = z.infer<typeof blogPostCreateSchema>

export const blogPostUpdateSchema = basePayloadSchema
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "缺少需要更新的字段",
      })
    }

    if (data.status === "published" && !data.publishedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publishedAt"],
        message: "发布状态必须提供发布时间",
      })
    }
  })

export type BlogPostUpdateInput = z.infer<typeof blogPostUpdateSchema>

export const blogPostStatusSchema = z
  .object({
    status: statusSchema,
    publishedAt: publishedAtSchema,
  })
  .superRefine((data, ctx) => {
    if (data.status === "published" && !data.publishedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publishedAt"],
        message: "发布状态必须提供发布时间",
      })
    }
  })

export type BlogPostStatusInput = z.infer<typeof blogPostStatusSchema>
