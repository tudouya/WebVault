/**
 * Website utilities index
 * 
 * Centralizes utility functions for the website feature module
 */

export {
  generateWebsiteMetadata,
  generateWebsiteStructuredData,
  validateWebsiteSEOData,
  generateSocialSharingUrls,
} from './seoUtils'

export { generateWebsiteSlug } from './slug'

export {
  mapWebsiteDtoToCard,
  normalizeWebsiteListMeta,
  extractApiErrorMessage,
} from './api'
