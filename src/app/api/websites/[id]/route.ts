import { NextResponse } from 'next/server';
import { jsendError, jsendFail, jsendSuccess } from '@/lib/utils/jsend';
import { websitesService } from '@/lib/services/websitesService';

export const runtime = 'edge';

export async function GET(_request: Request, { params }: any) {
  try {
    const { id } = params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json(jsendFail({ message: 'Invalid id' }), { status: 400 });
    }

    const website = await websitesService.getById(id);
    if (!website) {
      return NextResponse.json(jsendFail({ message: 'Not found' }), { status: 404 });
    }

    return NextResponse.json(jsendSuccess(website));
  } catch (error: any) {
    return NextResponse.json(jsendError('服务器错误', 'INTERNAL_ERROR', { error: String(error?.message || error) }), { status: 500 });
  }
}
