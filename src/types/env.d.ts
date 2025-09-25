/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    // Cloudflare D1 Database binding
    DB: D1Database;

    // Environment variables
    NEXT_PUBLIC_APP_URL?: string;
    DATABASE_URL?: string;

    // Add other bindings and environment variables as needed
    KV?: KVNamespace;
    R2?: R2Bucket;
    DURABLE_OBJECT?: DurableObjectNamespace;
  }
}

export type { CloudflareEnv };