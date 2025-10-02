/**
 * Collection API Service
 *
 * 前端调用 Collection API 的服务层
 * 提供类型安全的 API 调用方法
 * 遵循项目的 API 响应规范（.ruler/specs/api-response.md）
 */

import type { CollectionListParams, CollectionListResult, CollectionDetail } from '@/features/collections/types';

/**
 * API 基础URL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '';

/**
 * 项目 API 响应格式
 */
interface ApiSuccessResponse<T = unknown> {
  code: 0;
  message: string;
  data: T;
  requestId: string;
  timestamp: string;
  meta?: Record<string, unknown>;
  links?: {
    next: string | null;
    prev: string | null;
  };
}

interface ApiErrorResponse {
  status: number;
  code: string;
  message: string;
  errors?: Record<string, string[]>;
  requestId: string;
  timestamp: string;
}

type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * API 错误类
 */
export class CollectionApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'CollectionApiError';
  }
}

/**
 * 发起 API 请求（返回完整响应）
 */
async function fetchApiWithMeta<T>(url: string, options?: RequestInit): Promise<ApiSuccessResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const json: ApiResponse<T> = await response.json();

    // 成功响应
    if ('code' in json && json.code === 0) {
      return json as ApiSuccessResponse<T>;
    }

    // 错误响应
    if ('status' in json) {
      throw new CollectionApiError(
        json.message,
        json.code,
        json.status,
        json.errors
      );
    }

    throw new CollectionApiError('未知的响应格式', undefined, response.status);
  } catch (error) {
    if (error instanceof CollectionApiError) {
      throw error;
    }

    // 网络错误或其他错误
    throw new CollectionApiError(
      error instanceof Error ? error.message : '网络请求失败'
    );
  }
}

/**
 * 发起 API 请求（仅返回 data）
 */
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetchApiWithMeta<T>(url, options);
  return response.data;
}

/**
 * Collection API Service
 */
export const collectionApiService = {
  /**
   * 获取集合列表
   *
   * @param params - 查询参数
   * @returns 集合列表结果
   */
  async list(params: CollectionListParams = {}): Promise<CollectionListResult> {
    const searchParams = new URLSearchParams();

    if (params.search) {
      searchParams.set('search', params.search);
    }
    if (params.page) {
      searchParams.set('page', params.page.toString());
    }
    if (params.pageSize) {
      searchParams.set('pageSize', params.pageSize.toString());
    }
    if (params.featured !== undefined && params.featured !== 'all') {
      searchParams.set('featured', params.featured.toString());
    }
    if (params.orderBy) {
      searchParams.set('orderBy', params.orderBy);
    }

    const url = `${API_BASE_URL}/api/collections?${searchParams.toString()}`;

    // 获取完整响应（包含 meta）
    const response = await fetchApiWithMeta<CollectionListResult['items']>(url);

    // 构建 CollectionListResult
    const meta = response.meta as {
      page: number;
      per_page: number;
      total: number;
      total_pages: number;
      has_more: boolean;
    };

    return {
      items: response.data,
      page: meta.page,
      pageSize: meta.per_page,
      total: meta.total,
      hasMore: meta.has_more,
    };
  },

  /**
   * 获取单个集合详情
   *
   * @param id - 集合ID
   * @returns 集合详情
   */
  async getById(id: string): Promise<CollectionDetail> {
    const url = `${API_BASE_URL}/api/collections/${id}`;
    return fetchApi<CollectionDetail>(url);
  },

  /**
   * 获取所有可用标签
   * 注意：当前 API 不支持此功能，返回空数组
   *
   * @returns 标签列表
   */
  async getTags(): Promise<string[]> {
    // TODO: 后续实现 /api/collections/tags 端点
    return [];
  },
};

export default collectionApiService;