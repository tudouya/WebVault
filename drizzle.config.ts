/**
 * Drizzle Configuration for Cloudflare D1 Database
 * 
 * This configuration sets up Drizzle ORM to work with Cloudflare D1 database,
 * providing schema management, migrations, and type-safe database operations.
 * 
 * Requirements satisfied:
 * - R2.1: Configure D1 database connection
 * - R2.2: Set migration output directory  
 * - Purpose: Configure Drizzle for D1
 * 
 * @see https://orm.drizzle.team/docs/get-started-sqlite
 * @see https://developers.cloudflare.com/d1/reference/drizzle/
 */

import type { Config } from 'drizzle-kit';

export default {
  // Database schema files
  schema: './src/lib/db/schema/*',
  
  // Migration output directory
  out: './src/lib/database/migrations',
  
  // Database dialect - SQLite for D1
  dialect: 'sqlite',
  
  // Database driver configuration for D1
  driver: 'd1-http',
  
  // Database connection
  dbCredentials: {
    // D1 database ID from environment variable
    // This will be provided by Cloudflare when deploying to Workers
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || 'local-d1-database',
    
    // Account ID for Cloudflare API access
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    
    // API token for authentication
    token: process.env.CLOUDFLARE_API_TOKEN || '',
  },
  
  // Enable verbose output for debugging
  verbose: process.env.NODE_ENV === 'development',
  
  // Strict mode for production safety
  strict: process.env.NODE_ENV === 'production',
  
  // Development settings
  breakpoints: process.env.NODE_ENV === 'development',
  
} satisfies Config;