import { eq, inArray, type InferSelectModel } from 'drizzle-orm';
import { websites } from '@/lib/db/schema/websites';
import { websiteTags } from '@/lib/db/schema/website-tags';
import { tags as tagsTable } from '@/lib/db/schema/tags';
import { WebsiteDTOSchema, type WebsiteDTO } from '@/lib/validations/websites';

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

export interface ListParams {
  page?: number;
  pageSize?: number;
  query?: string;
  category?: string;
  tags?: string[];
  includeAds?: boolean;
}

export interface ListResult {
  items: WebsiteDTO[];
  page: number;
  pageSize: number;
  total: number;
}

export const websitesService = {
  async list(params: ListParams = {}): Promise<ListResult> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE, query, category, tags, includeAds = true } = params;
    const normalizedPageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, pageSize));
    const normalizedPage = Math.max(1, page);

    const adapter = await tryImportD1Adapter();

    if (!adapter?.listWebsitesD1) {
      throw new Error('D1 database adapter not available');
    }

    try {
      const { rows, total, resolvedPage, pageSize: effectivePageSize } = await adapter.listWebsitesD1({
        page: normalizedPage,
        pageSize: normalizedPageSize,
        query,
        category,
        tags,
        includeAds,
      });

      const tagMap = await loadTagsForWebsites(adapter, rows.map((row) => String(row.id)));
      const dtoItems = rows
        .map((row) => mapDbRowToDTO(row, tagMap.get(String(row.id))))
        .map(validateDTO);

      const effectivePage = typeof resolvedPage === 'number' ? resolvedPage : normalizedPage;
      const finalPageSize = typeof effectivePageSize === 'number' ? effectivePageSize : normalizedPageSize;

      return {
        items: dtoItems,
        page: effectivePage,
        pageSize: finalPageSize,
        total: Number(total ?? dtoItems.length)
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to load websites from database');
    }
  },

  async getById(id: string): Promise<WebsiteDTO | null> {
    const adapter = await tryImportD1Adapter();

    if (!adapter?.getWebsiteByIdD1) {
      throw new Error('D1 database adapter not available');
    }

    try {
      const row = await adapter.getWebsiteByIdD1(id);

      if (!row) {
        return null;
      }

      const tagMap = await loadTagsForWebsites(adapter, [String(row.id)]);
      return validateDTO(mapDbRowToDTO(row, tagMap.get(String(row.id))));
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to load website from database');
    }
  },
};

type WebsiteDbRow = InferSelectModel<typeof websites>;

const STATUS_VALUES: WebsiteDTO['status'][] = ['draft', 'published'];

function normalizeStatus(value: unknown): WebsiteDTO['status'] {
  if (typeof value === 'string' && (STATUS_VALUES as string[]).includes(value)) {
    return value as WebsiteDTO['status'];
  }
  return 'published';
}

function validateDTO(dto: WebsiteDTO): WebsiteDTO {
  return WebsiteDTOSchema.parse(dto);
}

function mapDbRowToDTO(row: WebsiteDbRow, tagNames?: string[]): WebsiteDTO {
  const createdAt = row.createdAt ?? new Date().toISOString();
  const updatedAt = row.updatedAt ?? createdAt;

  return {
    id: String(row.id),
    title: row.title,
    description: row.description ?? undefined,
    url: row.url,
    favicon_url: row.faviconUrl ?? undefined,
    screenshot_url: row.screenshotUrl ?? undefined,
    tags: Array.isArray(tagNames) ? [...new Set(tagNames.filter((tag): tag is string => Boolean(tag)))] : [],
    category: row.categoryId ?? undefined,
    isAd: coerceBool(row.isAd),
    adType: row.adType ?? undefined,
    rating: typeof row.rating === 'number' ? row.rating : undefined,
    visit_count: typeof row.visitCount === 'number' ? row.visitCount : 0,
    is_featured: coerceBool(row.isFeatured),
    status: normalizeStatus(row.status),
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

function coerceBool(v: unknown, defaultValue = false): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const normalized = v.toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }
  return defaultValue;
}

type D1AdapterModule = typeof import('@/lib/db/adapters/d1');

async function tryImportD1Adapter(): Promise<D1AdapterModule | null> {
  try {
    const mod: D1AdapterModule = await import('@/lib/db/adapters/d1');
    return mod;
  } catch {
    return null;
  }
}

async function loadTagsForWebsites(adapter: D1AdapterModule, websiteIds: string[]): Promise<Map<string, string[]>> {
  if (!adapter?.getD1Db || !websiteIds.length) {
    return new Map();
  }

  try {
    const db = adapter.getD1Db();
    const rows = await db
      .select({
        websiteId: websiteTags.websiteId,
        tagName: tagsTable.name,
      })
      .from(websiteTags)
      .innerJoin(tagsTable, eq(tagsTable.id, websiteTags.tagId))
      .where(inArray(websiteTags.websiteId, websiteIds));

    const map = new Map<string, string[]>();
    for (const row of rows) {
      const key = String(row.websiteId);
      const list = map.get(key) ?? [];
      if (row.tagName && !list.includes(row.tagName)) {
        list.push(row.tagName);
      }
      map.set(key, list);
    }
    return map;
  } catch {
    return new Map();
  }
}
