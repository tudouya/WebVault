import { z } from 'zod';

export const WebsiteDTOSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url(),
  favicon_url: z.string().url().optional().or(z.literal("")),
  screenshot_url: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  isAd: z.boolean().default(false),
  adType: z.string().optional(),
  visit_count: z.number().int().nonnegative().optional(),
  status: z.enum(['draft', 'published']).default('published'),
  created_at: z.string(),
  updated_at: z.string(),
});

export type WebsiteDTO = z.infer<typeof WebsiteDTOSchema>;

export const WebsiteListResponseSchema = z.object({
  items: z.array(WebsiteDTOSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().nonnegative(),
});

export type WebsiteListResponseDTO = z.infer<typeof WebsiteListResponseSchema>;

