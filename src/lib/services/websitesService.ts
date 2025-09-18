import { mockWebsites } from '@/features/websites/data/mockWebsites';
import { getDbContext } from '@/lib/db/client';
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
    const { channel } = getDbContext();
    const isEdge = typeof (globalThis as any).EdgeRuntime !== 'undefined';

    console.log('WebsitesService.list debug:', { channel, isEdge });

    // Force D1 adapter usage - try D1 first regardless of environment detection
    const adapter = await tryImportAdapter<'d1'>('d1');
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
        const dtoItems = (rows as any[]).map(mapDbRowToDTO).map(validateDTO);
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
    const { channel } = getDbContext();
    const isEdge = typeof (globalThis as any).EdgeRuntime !== 'undefined';

    // Force D1 adapter usage - try D1 first regardless of environment detection
    const adapter = await tryImportAdapter<'d1'>('d1');
    if (adapter?.getWebsiteByIdD1) {
      try {
        console.log('Attempting to use D1 database for getById:', id);
        const row = await adapter.getWebsiteByIdD1(id);
        if (!row) {
          console.log('D1 database query returned no result for id:', id);
          return null;
        }
        console.log('D1 database query successful for id:', id);
        return validateDTO(mapDbRowToDTO(row));
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

function mapWebsiteCardToDTO(w: any): WebsiteDTO {
  const created = w.created_at || new Date().toISOString();
  const updated = w.updated_at || created;
  return {
    id: String(w.id),
    title: String(w.title),
    description: w.description || undefined,
    url: String(w.url),
    favicon_url: w.favicon_url || undefined,
    screenshot_url: w.screenshot_url || w.image_url || undefined,
    tags: Array.isArray(w.tags) ? w.tags : [],
    category: w.category || undefined,
    isAd: Boolean(w.isAd),
    adType: w.adType || undefined,
    rating: typeof w.rating === 'number' ? w.rating : undefined,
    visit_count: typeof w.visit_count === 'number' ? w.visit_count : 0,
    is_featured: Boolean(w.is_featured),
    is_public: w.is_public ?? true,
    status: w.status ?? 'active',
    created_at: created,
    updated_at: updated,
  };
}

function validateDTO(dto: WebsiteDTO): WebsiteDTO {
  return WebsiteDTOSchema.parse(dto);
}

function mapDbRowToDTO(row: any): WebsiteDTO {
  // Normalize DB columns to DTO shape (snake_case in DTO)
  return {
    id: String(row.id),
    title: String(row.title),
    description: row.description || undefined,
    url: String(row.url),
    favicon_url: row.favicon_url || row.faviconUrl || undefined,
    screenshot_url: row.screenshot_url || row.screenshotUrl || undefined,
    tags: typeof row.tags === 'string' ? safeParseTags(row.tags) : Array.isArray(row.tags) ? row.tags : [],
    category: row.category || row.category_id || undefined,
    isAd: coerceBool(row.isAd ?? row.is_ad),
    adType: row.adType || row.ad_type || undefined,
    rating: typeof row.rating === 'number' ? row.rating : undefined,
    visit_count: typeof row.visit_count === 'number' ? row.visit_count : (typeof row.visitCount === 'number' ? row.visitCount : 0),
    is_featured: coerceBool(row.is_featured ?? row.isFeatured),
    is_public: coerceBool(row.is_public ?? row.isPublic ?? true),
    status: row.status ?? 'active',
    created_at: row.created_at || row.createdAt || new Date().toISOString(),
    updated_at: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

function safeParseTags(val: string): string[] {
  try {
    const arr = JSON.parse(val);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function coerceBool(v: any): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true';
  return false;
}

async function tryImportAdapter<T extends 'd1'>(name: T): Promise<any | null> {
  try {
    console.log(`Attempting to import adapter: @/lib/db/adapters/${name}`);
    // Prefer real adapter filenames
    const mod = await import(`@/lib/db/adapters/${name}` as any);
    console.log('Adapter import successful:', Object.keys(mod));
    return mod;
  } catch (e) {
    console.log('Adapter import failed:', e);
    return null;
  }
}
