import { NextResponse } from 'next/server';
import { jsendError, jsendFail, jsendSuccess } from '@/lib/utils/jsend';
import { websitesService } from '@/lib/services/websitesService';

export const runtime = 'edge';

function parseBool(v: string | null | undefined): boolean | undefined {
  if (v === null || v === undefined) return undefined;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}

export async function GET(request: Request) {
  try {
    const sp = new URL(request.url).searchParams;
    const page = Number(sp.get('page') || '1');
    const pageSize = Number(sp.get('pageSize') || '12');
    const query = sp.get('query') || sp.get('q') || undefined;
    const category = sp.get('category') || undefined;
    const featured = parseBool(sp.get('featured'));
    const includeAds = parseBool(sp.get('includeAds')) ?? true;
    const minRating = sp.get('minRating') ? Number(sp.get('minRating')) : undefined;

    if (!Number.isFinite(page) || page < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
      return NextResponse.json(jsendFail({ message: 'Invalid pagination parameters' }), { status: 400 });
    }

    const result = await websitesService.list({ page, pageSize, query, category, featured, includeAds, minRating });
    return NextResponse.json(jsendSuccess(result));
  } catch (error: any) {
    return NextResponse.json(jsendError('服务器错误', 'INTERNAL_ERROR', { error: String(error?.message || error) }), { status: 500 });
  }
}
