import { NextResponse } from 'next/server';
import { jsendSuccess } from '@/lib/utils/jsend';
import { getDbContext } from '@/lib/db/client';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET() {
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) && Boolean(process.env.CLERK_SECRET_KEY);
  let d1Configured = false;
  try {
    // In Pages/Edge dev/prod this should exist
    const env = getRequestContext().env as any;
    d1Configured = Boolean(env?.DB);
  } catch {
    d1Configured = Boolean(process.env.CLOUDFLARE_DATABASE_ID);
  }

  return NextResponse.json(
    jsendSuccess({
      ok: true,
      clerkConfigured,
      d1Configured,
      dataChannel: getDbContext().channel,
    }),
    { status: 200 }
  );
}
