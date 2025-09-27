import { z } from "zod"

import { WEBSITE_REVIEW_STATUSES } from "@/features/websites/types/admin"
import type { WebsiteStatus } from "@/features/websites/types"

const AD_TYPES = ["banner", "sponsored", "featured", "premium"] as const

const statusSchema = z.enum(["active", "inactive", "pending", "rejected"] as const satisfies WebsiteStatus[])
const reviewStatusSchema = z.enum(WEBSITE_REVIEW_STATUSES)
const adTypeSchema = z.enum(AD_TYPES).optional()

const normalizedString = (max: number, field: string) =>
  z
    .string()
    .trim()
    .min(1, `${field}不能为空`)
    .max(max, `${field}长度需在 ${max} 个字符内`)

const optionalNormalizedString = (max: number, field: string) =>
  z
    .union([z.string().trim().max(max, `${field}长度需在 ${max} 个字符内`), z.literal(""), z.undefined(), z.null()])
    .transform((value) => {
      if (value === undefined) return undefined
      if (value === null) return undefined
      if (value === "") return undefined
      return value
    })

const optionalIdSchema = z
  .union([z.string().trim().min(1, "ID 无效"), z.literal(""), z.undefined(), z.null()])
  .transform((value) => {
    if (value === undefined) return undefined
    if (value === null) return null
    if (value === "") return undefined
    return value
  })

const optionalSlugSchema = z
  .union([
    z
      .string()
      .trim()
      .min(1, "slug 不能为空")
      .max(160, "slug 长度需在 160 个字符内")
      .regex(/^[a-z0-9-]+$/, "slug 仅能包含小写字母、数字与连字符"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ])
  .transform((value) => {
    if (!value || value === "") return undefined
    return value
  })

const nullableUrlSchema = z
  .union([
    z.string().trim().url("请输入有效的 URL"),
    z.literal(""),
    z.null(),
    z.undefined(),
  ])
  .transform((value) => {
    if (value === undefined) return undefined
    if (value === "") return null
    return value
  })

const tagIdsSchema = z
  .union([z.array(z.string().trim()), z.string().trim(), z.undefined(), z.null()])
  .transform((value) => {
    if (value === undefined) return undefined
    if (value === null) return []
    const raw = Array.isArray(value) ? value : value.split(",")
    const normalized = raw
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    return Array.from(new Set(normalized))
  })

const collectionIdsSchema = z
  .union([z.array(z.string().trim()), z.string().trim(), z.undefined(), z.null()])
  .transform((value) => {
    if (value === undefined) return undefined
    if (value === null) return []
    const raw = Array.isArray(value) ? value : value.split(",")
    const normalized = raw
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    return Array.from(new Set(normalized))
  })

const ratingSchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === null || value === "") return undefined
    const numberValue = typeof value === "number" ? value : Number(value)
    if (Number.isNaN(numberValue)) return undefined
    return numberValue
  })
  .refine(
    (value) => value === undefined || (value >= 0 && value <= 5),
    "评分需在 0 到 5 之间"
  )

const visitCountSchema = z
  .union([z.number(), z.string(), z.undefined(), z.null()])
  .transform((value) => {
    if (value === undefined || value === null || value === "") return undefined
    const numberValue = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(numberValue)) return 0
    return Math.max(0, Math.floor(numberValue))
  })

const booleanSchema = z
  .union([z.boolean(), z.string(), z.number(), z.undefined(), z.null()])
  .transform((value) => {
    if (value === undefined || value === null) return undefined
    if (typeof value === "boolean") return value
    if (typeof value === "number") return value !== 0
    const normalized = value.trim().toLowerCase()
    if (["true", "1", "yes", "on"].includes(normalized)) return true
    if (["false", "0", "no", "off"].includes(normalized)) return false
    return undefined
  })

const basePayloadSchema = z.object({
  title: normalizedString(200, "网站标题"),
  url: z.string().trim().url("请输入有效的网址"),
  slug: optionalSlugSchema,
  description: optionalNormalizedString(2000, "网站描述"),
  categoryId: optionalIdSchema,
  tagIds: tagIdsSchema,
  collectionIds: collectionIdsSchema,
  isAd: booleanSchema,
  adType: adTypeSchema,
  rating: ratingSchema,
  visitCount: visitCountSchema,
  isFeatured: booleanSchema,
  isPublic: booleanSchema,
  status: statusSchema.optional(),
  reviewStatus: reviewStatusSchema.optional(),
  faviconUrl: nullableUrlSchema,
  screenshotUrl: nullableUrlSchema,
  notes: optionalNormalizedString(2000, "备注"),
  submittedBy: optionalNormalizedString(120, "提交人"),
  submissionId: optionalIdSchema,
})

export const websiteAdminCreateSchema = basePayloadSchema
  .superRefine((data, ctx) => {
    if (data.isAd && !data.adType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "广告网站需指定广告类型",
        path: ["adType"],
      })
    }
  })
  .transform((data) => ({
    ...data,
    tagIds: data.tagIds ?? [],
    collectionIds: data.collectionIds ?? [],
    isAd: data.isAd ?? false,
    adType: data.isAd ? data.adType : undefined,
    visitCount: data.visitCount ?? 0,
    isFeatured: data.isFeatured ?? false,
    isPublic: data.isPublic ?? true,
    status: data.status ?? "active",
    reviewStatus: data.reviewStatus ?? "pending",
  }))

export type WebsiteAdminCreateInput = z.infer<typeof websiteAdminCreateSchema>

export const websiteAdminUpdateSchema = basePayloadSchema.partial().superRefine((data, ctx) => {
  if (Object.keys(data).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "缺少需要更新的字段",
    })
  }

  if (data.isAd === true && !data.adType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["adType"],
      message: "广告网站需指定广告类型",
    })
  }
})

export type WebsiteAdminUpdateInput = z.infer<typeof websiteAdminUpdateSchema>

export const websiteStatusUpdateSchema = z
  .object({
    status: statusSchema.optional(),
    reviewStatus: reviewStatusSchema.optional(),
    isFeatured: booleanSchema,
    isPublic: booleanSchema,
    notes: optionalNormalizedString(2000, "备注"),
  })
  .superRefine((data, ctx) => {
    const keys = Object.keys(data).filter((key) => data[key as keyof typeof data] !== undefined)
    if (!keys.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "缺少需要更新的字段",
      })
    }
  })

export type WebsiteStatusUpdateInput = z.infer<typeof websiteStatusUpdateSchema>

export const websiteBulkReviewSchema = z.object({
  ids: z.array(z.string().trim().min(1, "网站 ID 无效")).min(1, "至少需要选择一个网站"),
  reviewStatus: reviewStatusSchema.refine(
    (value) => value !== "pending",
    "批量审核状态不可选择待审核"
  ),
  notes: optionalNormalizedString(2000, "审核备注"),
})

export type WebsiteBulkReviewInput = z.infer<typeof websiteBulkReviewSchema>
