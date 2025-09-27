// Website type definitions - centralized exports

// Export all types from the main website types file
export * from './website'
export * from './category'
export * from './collection'
export * from './filters'
export * from './search'
export * from './detail'
export * from './admin'


// Export constants as values, not types
export {
  DEFAULT_SEARCH_HEADER_PROPS,
  DEFAULT_SEARCH_GRID_CONFIG
} from './search'

export {
  DEFAULT_COLLECTION_STATE,
  DEFAULT_COLLECTION_SEARCH_PARAMS
} from './collection'
