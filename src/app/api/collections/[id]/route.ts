import { NextRequest, NextResponse } from 'next/server';
import { collectionsService } from '@/lib/services/collectionsService';

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
 * GET /api/collections/[id]
 * 获取单个集合的详细信息
 *
 * 路径参数:
 * - id: 集合ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const { id } = await params;

    if (!id) {
      return respondError({
        status: 400,
        code: 'bad_request',
        message: '集合ID不能为空',
        requestId,
        errors: {
          id: ['集合ID不能为空'],
        },
      });
    }

    const collection = await collectionsService.getById(id);

    if (!collection) {
      return respondError({
        status: 404,
        code: 'not_found',
        message: '集合不存在',
        requestId,
        errors: {
          id: ['集合不存在'],
        },
      });
    }

    return respondSuccess({
      requestId,
      data: collection,
    });
  } catch (error) {
    console.error('GET /api/collections/[id] error:', error);

    return respondError({
      status: 500,
      code: 'internal_error',
      message: '获取集合详情失败',
      requestId,
      errors: {
        detail: [error instanceof Error ? error.message : '未知错误'],
      },
    });
  }
}

/**
 * 成功响应（非分页）
 */
function respondSuccess({
  requestId,
  data,
}: {
  requestId: string;
  data: unknown;
}) {
  return NextResponse.json(
    {
      code: 0,
      message: 'ok',
      data,
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