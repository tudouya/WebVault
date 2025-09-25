"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSendResponse } from '@/lib/utils/jsend';
import { parseJSendFetch } from '@/lib/utils/jsend';

export interface UseApiOptions<P = Record<string, unknown>> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  immediate?: boolean;
  params?: P;
  headers?: HeadersInit;
  revalidate?: number | false;
}

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiReturn<T, P = Record<string, unknown>> extends UseApiState<T> {
  execute: (override?: Partial<UseApiOptions<P>>) => Promise<JSendResponse<T>>;
  refetch: () => Promise<JSendResponse<T>>;
}

export function useApiData<T, P = Record<string, unknown>>(
  endpoint: string,
  options: UseApiOptions<P> = {}
): UseApiReturn<T, P> {
  const {
    method = 'GET',
    immediate = false,
    params,
    headers,
    revalidate,
  } = options;

  const [state, setState] = useState<UseApiState<T>>({ data: null, loading: false, error: null });
  const optsRef = useRef({ method, params, headers, revalidate });

  useEffect(() => {
    optsRef.current = { method, params, headers, revalidate };
  }, [method, params, headers, revalidate]);

  const makeRequest = useCallback(async (override?: Partial<UseApiOptions<P>>): Promise<JSendResponse<T>> => {
    const final = { ...optsRef.current, ...(override || {}) };
    setState(s => ({ ...s, loading: true, error: null }));

    try {
      const fetchInit: RequestInit = {
        method: final.method,
        headers: {
          'Content-Type': 'application/json',
          ...(final.headers || {}),
        },
        ...(final.method !== 'GET' ? { body: final.params ? JSON.stringify(final.params) : undefined } : {}),
        // Next.js cache control via fetch options
        ...(typeof final.revalidate === 'number' ? { next: { revalidate: final.revalidate } } : {}),
      } as RequestInit;

      const res = await fetch(endpoint, fetchInit);
      const jsend = await parseJSendFetch<T>(res);

      if (jsend.status === 'success') {
        setState({ data: jsend.data, loading: false, error: null });
      } else if (jsend.status === 'fail') {
        setState(s => ({ ...s, loading: false, error: 'Request failed' }));
      } else {
        setState(s => ({ ...s, loading: false, error: jsend.message || 'Server error' }));
      }

      return jsend;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Network error');
      setState(s => ({ ...s, loading: false, error: error.message }));
      return { status: 'error', message: error.message } as JSendResponse<T>;
    }
  }, [endpoint]);

  const execute = useCallback((override?: Partial<UseApiOptions<P>>) => makeRequest(override), [makeRequest]);
  const refetch = useCallback(() => makeRequest(), [makeRequest]);

  useEffect(() => {
    if (immediate) void makeRequest();
  }, [immediate, makeRequest]);

  return useMemo(() => ({ ...state, execute, refetch }), [state, execute, refetch]);
}

