// DB client factory for dual-channel runtime (Node SQLite vs Cloudflare D1)
// Note: This file intentionally avoids importing packages that aren't installed yet.

export type DataChannel = 'mock' | 'd1';

export interface DBContext {
  channel: DataChannel;
}

export function detectDataChannel(): DataChannel {
  const isEdge = typeof (globalThis as any).EdgeRuntime !== 'undefined';
  // 检查是否有D1绑定环境变量
  const hasD1Binding = typeof process !== 'undefined' && (
    process.env.NODE_ENV === 'production' ||
    process.env.CLOUDFLARE_DATABASE_ID ||
    typeof (globalThis as any).DB !== 'undefined'
  );

  console.log('DataChannel detection:', { isEdge, hasD1Binding, nodeEnv: process?.env?.NODE_ENV });

  // 在 Edge 运行时或有D1绑定时使用 D1
  if (isEdge || hasD1Binding) return 'd1';
  // 否则使用 mock
  return 'mock';
}

export function getDbContext(): DBContext {
  return { channel: detectDataChannel() };
}

// Placeholder types for future Drizzle clients
export type D1Db = unknown;
export type SqliteDb = unknown;
