import { NextRequest, NextResponse } from 'next/server';
import { collectionsService } from '@/lib/services/collectionsService';
import type { CollectionListParams } from '@/features/collections/types';

export const runtime = 'edge';

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/**
 * GET /api/collections
 * 获取集合列表，支持搜索、筛选、分页和排序
 *
 * 查询参数:
 * - search: 搜索关键词
 * - page: 页码 (默认: 1)
 * - pageSize: 每页数量 (默认: 12, 最大: 100)
 * - featured: 是否精选 (true/false/all, 默认: all)
 * - orderBy: 排序方式 (recent/name/order, 默认: recent)
 */
export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { searchParams } = new URL(request.url);

  try {
    // 解析查询参数
    const params: CollectionListParams = {
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: Math.min(parseInt(searchParams.get('pageSize') || '12'), 100),
      featured: parseFeaturedParam(searchParams.get('featured')),
      orderBy: parseOrderByParam(searchParams.get('orderBy')),
    };

    // 调用 service 获取数据
    const result = await collectionsService.list(params);

    const totalPages = result.total > 0 ? Math.ceil(result.total / result.pageSize) : 0;
    const hasMore = totalPages > 0 && result.page < totalPages;

    return respondSuccess({
      requestId,
      data: result.items,
      meta: {
        page: result.page,
        per_page: result.pageSize,
        total: result.total,
        total_pages: totalPages,
        has_more: hasMore,
      },
      links: buildPaginationLinks(new URL(request.url), result.page, result.pageSize, totalPages),
    });
  } catch (error) {
    console.error('GET /api/collections error:', error);

    return respondError({
      status: 500,
      code: 'internal_error',
      message: '获取集合列表失败',
      requestId,
      errors: {
        detail: [error instanceof Error ? error.message : '未知错误'],
      },
    });
  }
}

/**
 * 解析 featured 参数
 */
function parseFeaturedParam(value: string | null): boolean | 'all' {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return 'all';
}

/**
 * 解析 orderBy 参数
 */
function parseOrderByParam(value: string | null): 'recent' | 'name' | 'order' {
  if (value === 'name') return 'name';
  if (value === 'order') return 'order';
  return 'recent';
}

/**
 * 成功响应
 */
function respondSuccess({
  requestId,
  data,
  meta,
  links,
}: {
  requestId: string;
  data: unknown;
  meta: Record<string, unknown>;
  links: { next: string | null; prev: string | null };
}) {
  return NextResponse.json(
    {
      code: 0,
      message: 'ok',
      data,
      meta,
      links,
      requestId,
      timestamp: formatTimestamp(),
    },
    {
      headers: {
        'X-Request-Id': requestId,
      },
    }
  );
}

/**
 * 错误响应
 */
function respondError({
  status,
  code,
  message,
  requestId,
  errors,
}: {
  status: number;
  code: string;
  message: string;
  requestId: string;
  errors?: Record<string, string[]>;
}) {
  return NextResponse.json(
    {
      status,
      code,
      message,
      errors,
      requestId,
      timestamp: formatTimestamp(),
    },
    {
      status,
      headers: {
        'X-Request-Id': requestId,
      },
    }
  );
}

/**
 * 格式化时间戳
 */
function formatTimestamp(): string {
  const parts = TIMESTAMP_FORMATTER.formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>;
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
}

/**
 * 构建分页链接
 */
function buildPaginationLinks(url: URL, page: number, pageSize: number, totalPages: number) {
  const hasPrev = page > 1;
  const hasNext = totalPages > 0 && page < totalPages;

  return {
    prev: hasPrev ? buildLink(url, page - 1, pageSize) : null,
    next: hasNext ? buildLink(url, page + 1, pageSize) : null,
  };
}

/**
 * 构建链接
 */
function buildLink(url: URL, page: number, pageSize: number) {
  const nextUrl = new URL(url.toString());
  nextUrl.searchParams.set('page', String(page));
  nextUrl.searchParams.set('pageSize', String(pageSize));
  return `${nextUrl.pathname}${nextUrl.search}`;
}