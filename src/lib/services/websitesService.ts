import { eq, inArray, type InferSelectModel } from 'drizzle-orm';
import { mockWebsites } from '@/features/websites/data/mockWebsites';
import type { WebsiteCardData } from '@/features/websites/types/website';
import { websites } from '@/lib/db/schema/websites';
import { websiteTags } from '@/lib/db/schema/website-tags';
import { tags as tagsTable } from '@/lib/db/schema/tags';
import { WebsiteDTOSchema, type WebsiteDTO } from '@/lib/validations/websites';

export interface ListParams {
  page?: number;
  pageSize?: number;
  query?: string;
  category?: string;
  featured?: boolean;
  includeAds?: boolean;
  minRating?: number;
}

export interface ListResult {
  items: WebsiteDTO[];
  page: number;
  pageSize: number;
  total: number;
}

export const websitesService = {
  async list(params: ListParams = {}): Promise<ListResult> {
    const { page = 1, pageSize = 12, query, category, featured, includeAds = true, minRating } = params;
    // Force D1 adapter usage - try D1 first regardless of environment detection
    const adapter = await tryImportD1Adapter();
    console.log('D1 adapter import result:', !!adapter, !!adapter?.listWebsitesD1);
    if (adapter?.listWebsitesD1) {
      try {
        console.log('Attempting to use D1 database for websites list');
        const { rows, total } = await adapter.listWebsitesD1({
          page,
          pageSize,
          query,
          category,
          featured,
          includeAds,
          minRating,
        });
        const tagMap = await loadTagsForWebsites(adapter, rows.map((row) => String(row.id)));
        const dtoItems = rows
          .map((row) => mapDbRowToDTO(row, tagMap.get(String(row.id))))
          .map(validateDTO);
        console.log('D1 database query successful, returned', dtoItems.length, 'items');
        return { items: dtoItems, page, pageSize, total: Number(total ?? dtoItems.length) };
      } catch (error) {
        console.log('D1 database query failed, falling back to mock:', error);
      }
    }

    // SQLite 分支已移除（D1-only）

    // Fallback to mocks
    let items = mockWebsites.slice();

    if (query) {
      const q = query.toLowerCase();
      items = items.filter(w =>
        (w.title?.toLowerCase().includes(q) || '') ||
        (w.description?.toLowerCase().includes(q) || '') ||
        (w.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    if (category) {
      items = items.filter(w => w.category === category);
    }

    if (featured !== undefined) {
      items = items.filter(w => Boolean(w.is_featured) === Boolean(featured));
    }

    if (!includeAds) {
      items = items.filter(w => !w.isAd);
    }

    if (minRating !== undefined) {
      items = items.filter(w => (w.rating || 0) >= minRating);
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    const dtoItems = pageItems.map(mapWebsiteCardToDTO).map(validateDTO);

    return {
      items: dtoItems,
      page,
      pageSize,
      total,
    };
  },

  async getById(id: string): Promise<WebsiteDTO | null> {
    // Force D1 adapter usage - try D1 first regardless of environment detection
    const adapter = await tryImportD1Adapter();
    if (adapter?.getWebsiteByIdD1) {
      try {
        console.log('Attempting to use D1 database for getById:', id);
        const row = await adapter.getWebsiteByIdD1(id);
        if (!row) {
          console.log('D1 database query returned no result for id:', id);
          return null;
        }
        console.log('D1 database query successful for id:', id);
        const tagMap = await loadTagsForWebsites(adapter, [String(row.id)]);
        return validateDTO(mapDbRowToDTO(row, tagMap.get(String(row.id))));
      } catch (error) {
        console.log('D1 database query failed for id:', id, error);
      }
    }

    // SQLite 分支已移除（D1-only）

    const found = mockWebsites.find(w => w.id === id);
    if (!found) return null;
    return validateDTO(mapWebsiteCardToDTO(found));
  },
};

type WebsiteCardSource = WebsiteCardData | WebsiteDTO;

type WebsiteDbRow = InferSelectModel<typeof websites>;

const STATUS_VALUES: WebsiteDTO['status'][] = ['active', 'inactive', 'pending', 'rejected'];

function normalizeStatus(value: unknown): WebsiteDTO['status'] {
  if (typeof value === 'string' && (STATUS_VALUES as string[]).includes(value)) {
    return value as WebsiteDTO['status'];
  }
  return 'active';
}

function mapWebsiteCardToDTO(source: WebsiteCardSource): WebsiteDTO {
  const created = 'created_at' in source && source.created_at
    ? source.created_at
    : new Date().toISOString();
  const updated = 'updated_at' in source && source.updated_at
    ? source.updated_at
    : created;

  const screenshot = 'screenshot_url' in source && source.screenshot_url
    ? source.screenshot_url
    : 'image_url' in source
      ? source.image_url
      : undefined;

  const visitCount = 'visit_count' in source && typeof source.visit_count === 'number'
    ? source.visit_count
    : 'visitCount' in source && typeof source.visitCount === 'number'
      ? source.visitCount
      : 0;

  return {
    id: String(source.id),
    title: source.title,
    description: source.description || undefined,
    url: source.url,
    favicon_url: source.favicon_url || undefined,
    screenshot_url: screenshot,
    tags: extractTags(source),
    category: extractCategory(source),
    isAd: 'isAd' in source ? Boolean(source.isAd) : false,
    adType: 'adType' in source ? source.adType : undefined,
    rating: typeof source.rating === 'number' ? source.rating : undefined,
    visit_count: visitCount,
    is_featured: 'is_featured' in source ? Boolean(source.is_featured) : false,
    is_public: 'is_public' in source ? Boolean(source.is_public) : true,
    status: normalizeStatus('status' in source ? source.status : undefined),
    created_at: created,
    updated_at: updated,
  };
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
    is_public: coerceBool(row.isPublic, true),
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

type MaybeTaggedSource = {
  tags?: unknown
  category?: unknown
  category_id?: unknown
}

function extractTags(source: WebsiteCardSource): string[] {
  const candidate = (source as MaybeTaggedSource).tags
  if (!Array.isArray(candidate)) return []
  return candidate.filter((item): item is string => typeof item === 'string')
}

function extractCategory(source: WebsiteCardSource): string | undefined {
  const withCategory = source as MaybeTaggedSource
  if (typeof withCategory.category === 'string') {
    return withCategory.category
  }
  if (typeof withCategory.category_id === 'string') {
    return withCategory.category_id
  }
  return undefined
}

type D1AdapterModule = typeof import('@/lib/db/adapters/d1');

async function tryImportD1Adapter(): Promise<D1AdapterModule | null> {
  try {
    console.log('Attempting to import adapter: @/lib/db/adapters/d1');
    const mod: D1AdapterModule = await import('@/lib/db/adapters/d1');
    console.log('Adapter import successful:', Object.keys(mod));
    return mod;
  } catch (e) {
    console.log('Adapter import failed:', e);
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
  } catch (error) {
    console.log('loadTagsForWebsites failed', error);
    return new Map();
  }
}
