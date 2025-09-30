'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { WebsiteCardData } from '../types/website';
import type { WebsiteDTO } from '@/lib/validations/websites';
import {
  mapWebsiteDtoToCard,
  normalizeWebsiteListMeta,
  extractApiErrorMessage,
} from '../utils';

interface UseHomepageWebsitesOptions {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string | null;
  featuredOnly?: boolean;
  includeAds?: boolean;
  minRating?: number;
  enabled?: boolean;
}

interface UseHomepageWebsitesResult {
  websites: WebsiteCardData[];
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  refresh: () => void;
}

interface ApiSuccessPayload {
  code: number;
  message: string;
  data: WebsiteDTO[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
    has_more?: boolean;
  };
}

export function useHomepageWebsites(options: UseHomepageWebsitesOptions): UseHomepageWebsitesResult {
  const {
    page,
    pageSize,
    search,
    categoryId,
    featuredOnly,
    includeAds = true,
    minRating,
    enabled = true,
  } = options;

  const [websites, setWebsites] = useState<WebsiteCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [resolvedPage, setResolvedPage] = useState(page);
  const [resolvedPageSize, setResolvedPageSize] = useState(pageSize);
  const [hasMore, setHasMore] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const refresh = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return () => {
        abortRef.current?.abort();
        abortRef.current = null;
      };
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));

    if (search && search.trim().length > 0) {
      params.set('query', search.trim());
    }

    if (categoryId) {
      params.set('category', categoryId);
    }

    if (typeof featuredOnly === 'boolean') {
      params.set('featured', String(featuredOnly));
    }

    if (typeof includeAds === 'boolean') {
      params.set('includeAds', String(includeAds));
    }

    if (typeof minRating === 'number' && Number.isFinite(minRating)) {
      params.set('minRating', String(minRating));
    }

    setIsLoading(true);
    setError(null);

    const fetchWebsites = async () => {
      try {
        const response = await fetch(`/api/websites?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('响应格式无效');
        }

        const payload = (await response.json()) as ApiSuccessPayload | Record<string, unknown>;

        if ('code' in payload && payload.code === 0 && Array.isArray(payload.data)) {
          if (requestIdRef.current !== requestId) {
            return;
          }
          setWebsites(payload.data.map(mapWebsiteDtoToCard));
          const meta = normalizeWebsiteListMeta(payload.meta, {
            page,
            pageSize,
            total: payload.data.length,
          });

          setResolvedPage(meta.page);
          setResolvedPageSize(meta.pageSize);
          setTotal(meta.total);
          setTotalPages(meta.totalPages);
          setHasMore(meta.hasMore);
          setError(null);
        } else {
          const message = extractApiErrorMessage(payload) ?? '网站数据加载失败';
          throw new Error(message);
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        if (requestIdRef.current !== requestId) {
          return;
        }
        const message = err instanceof Error ? err.message : '网站数据加载失败';
        setWebsites([]);
        setTotal(0);
        setTotalPages(0);
        setHasMore(false);
        setError(message);
      } finally {
        if (!controller.signal.aborted && requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    };

    fetchWebsites();

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [page, pageSize, search, categoryId, featuredOnly, includeAds, minRating, refreshToken, enabled]);

  return useMemo(() => ({
    websites,
    isLoading,
    error,
    page: resolvedPage,
    pageSize: resolvedPageSize,
    total,
    totalPages,
    hasMore,
    refresh,
  }), [websites, isLoading, error, resolvedPage, resolvedPageSize, total, totalPages, hasMore, refresh]);
}
