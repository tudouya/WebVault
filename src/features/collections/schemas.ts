import { z } from "zod"

const normalizedString = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label}不能为空`)
    .max(max, `${label}长度需在 ${max} 个字符内`)

const emptyToOptional = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .union([schema, z.literal(""), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === "") return undefined
      if (value === null) return null
      return value as z.infer<T>
    })

const booleanLike = z.union([
  z.boolean(),
  z
    .string()
    .trim()
    .transform((value) => {
      const normalized = value.toLowerCase()
      if (["true", "1", "yes", "on"].includes(normalized)) return true
      if (["false", "0", "no", "off"].includes(normalized)) return false
      throw new Error("布尔值格式不正确")
    }),
])

export const collectionItemSchema = z.object({
  websiteId: normalizedString(64, "网站 ID"),
  note: emptyToOptional(normalizedString(200, "备注")),
  position: z.coerce
    .number()
    .int("排序值需为整数")
    .min(0, "排序值不能为负数")
    .optional(),
})

export const collectionPayloadSchema = z.object({
  name: normalizedString(80, "名称"),
  slug: emptyToOptional(
    normalizedString(80, "slug").regex(/^[a-z0-9-]+$/, "slug 仅能包含小写字母、数字与连字符")
  ),
  description: emptyToOptional(normalizedString(500, "描述")),
  coverImage: emptyToOptional(z.string().url("封面地址需为合法 URL")),
  isFeatured: booleanLike.optional().default(false),
  displayOrder: z.coerce
    .number()
    .int("排序需为整数")
    .min(0, "排序不可为负")
    .optional(),
})

export const collectionCreateSchema = collectionPayloadSchema.extend({
  items: z
    .array(collectionItemSchema)
    .max(200, "单个集合最多包含 200 个网站")
    .optional(),
})

export type CollectionCreateSchema = z.infer<typeof collectionCreateSchema>

export const collectionFormSchema = collectionPayloadSchema
export type CollectionFormInput = z.input<typeof collectionFormSchema>
export type CollectionFormValues = z.output<typeof collectionFormSchema>

export const collectionUpdateSchema = collectionPayloadSchema
  .partial()
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "缺少需要更新的字段",
      })
    }
  })

export type CollectionUpdateSchema = z.infer<typeof collectionUpdateSchema>

export const collectionItemsReplaceSchema = z.object({
  items: z
    .array(collectionItemSchema)
    .max(200, "单个集合最多包含 200 个网站"),
})

export type CollectionItemsReplaceSchema = z.infer<typeof collectionItemsReplaceSchema>

export const collectionQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("分页页码需为整数")
    .min(1, "页码不能小于 1")
    .default(1),
  pageSize: z.coerce
    .number()
    .int("分页大小需为整数")
    .min(1, "分页大小不能小于 1")
    .max(100, "分页大小不能超过 100")
    .default(20),
  search: z
    .string()
    .trim()
    .max(100, "搜索关键词过长")
    .optional()
    .transform((value) => (value ? value : undefined)),
  featured: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined
      if (value === "all") return "all" as const
      return value === "true"
    }),
  orderBy: z
    .enum(["recent", "name", "order"])
    .default("recent"),
})

export type CollectionQuerySchema = z.infer<typeof collectionQuerySchema>
