/**
 * Application configuration utilities
 * Handles environment-specific configuration with Cloudflare Pages support
 */

/**
 * Get the application URL based on environment
 * Priority: NEXT_PUBLIC_APP_URL > CF_PAGES_URL > localhost
 */
export function getAppUrl(): string {
  // 1. Check for explicit override
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 2. Check for Cloudflare Pages URL (production/preview)
  if (process.env.CF_PAGES_URL) {
    return `https://${process.env.CF_PAGES_URL}`;
  }

  // 3. Default to localhost for development
  return 'http://localhost:3000';
}

/**
 * Get the application name
 */
export function getAppName(): string {
  return process.env.NEXT_PUBLIC_APP_NAME || 'WebVault';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running on Cloudflare Pages
 */
export function isCloudflarePages(): boolean {
  return !!process.env.CF_PAGES;
}

/**
 * Get Cloudflare Pages deployment info
 */
export function getDeploymentInfo() {
  if (!isCloudflarePages()) {
    return null;
  }

  return {
    url: process.env.CF_PAGES_URL,
    branch: process.env.CF_PAGES_BRANCH,
    commitSha: process.env.CF_PAGES_COMMIT_SHA,
    environment: process.env.CF_PAGES_BRANCH === 'main' ? 'production' : 'preview',
  };
}

/**
 * Application configuration object
 */
export const appConfig = {
  name: getAppName(),
  url: getAppUrl(),
  isProduction: isProduction(),
  isCloudflarePages: isCloudflarePages(),
  deployment: getDeploymentInfo(),
} as const;

export default appConfig;