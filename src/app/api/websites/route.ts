import { NextResponse } from 'next/server';

import { websitesService } from '@/lib/services/websitesService';

export const runtime = 'edge';

function parseBool(v: string | null | undefined): boolean | undefined {
  if (v === null || v === undefined) return undefined;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  const pageRaw = url.searchParams.get('page') ?? '1';
  const pageSizeRaw = url.searchParams.get('pageSize') ?? '12';

  const parsedPage = Number(pageRaw);
  const parsedPageSize = Number(pageSizeRaw);

  if (!Number.isFinite(parsedPage) || !Number.isFinite(parsedPageSize)) {
    return respondError({
      status: 400,
      code: 'bad_request',
      message: '分页参数无效',
      requestId,
      errors: {
        page: ['page 必须为大于等于 1 的整数'],
        pageSize: ['pageSize 必须为大于等于 1 的整数'],
      },
    });
  }

  if (!Number.isInteger(parsedPage) || !Number.isInteger(parsedPageSize) || parsedPage < 1 || parsedPageSize < 1) {
    return respondError({
      status: 400,
      code: 'bad_request',
      message: '分页参数无效',
      requestId,
      errors: {
        page: ['page 必须为大于等于 1 的整数'],
        pageSize: ['pageSize 必须为大于等于 1 的整数'],
      },
    });
  }

  const page = Math.max(1, parsedPage);
  const MAX_PAGE_SIZE = 48;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parsedPageSize));

  const query = url.searchParams.get('query') ?? url.searchParams.get('q') ?? undefined;
  const categoryRaw = url.searchParams.get('category');
  // Filter out "undefined" string and convert to undefined
  const category = (categoryRaw && categoryRaw !== 'undefined') ? categoryRaw : undefined;
  const featured = parseBool(url.searchParams.get('featured'));
  const includeAds = parseBool(url.searchParams.get('includeAds')) ?? true;
  const minRating = url.searchParams.get('minRating') ? Number(url.searchParams.get('minRating')) : undefined;

  try {
    const result = await websitesService.list(
      { page, pageSize, query, category, featured, includeAds, minRating }
    );

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
      links: buildPaginationLinks(url, result.page, result.pageSize, totalPages),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '加载网站列表失败';
    return respondError({
      status: 500,
      code: 'internal_error',
      message: '加载网站列表失败',
      requestId,
      errors: {
        detail: [message],
      },
    });
  }
}

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

function formatTimestamp(): string {
  const parts = TIMESTAMP_FORMATTER.formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>;
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
}

function buildPaginationLinks(url: URL, page: number, pageSize: number, totalPages: number) {
  const hasPrev = page > 1;
  const hasNext = totalPages > 0 && page < totalPages;

  return {
    prev: hasPrev ? buildLink(url, page - 1, pageSize) : null,
    next: hasNext ? buildLink(url, page + 1, pageSize) : null,
  };
}

function buildLink(url: URL, page: number, pageSize: number) {
  const nextUrl = new URL(url.toString());
  nextUrl.searchParams.set('page', String(page));
  nextUrl.searchParams.set('pageSize', String(pageSize));
  return `${nextUrl.pathname}${nextUrl.search}`;
}
