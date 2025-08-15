// Website Hooks

// 搜索相关Hooks
export { 
  useWebsiteSearch, 
  useSimpleSearch,
  type SearchConfig,
  type SearchState,
  type SearchActions,
  type SearchValidation,
} from './useWebsiteSearch';

// 搜索页面专用Hooks
export {
  useSearchFilters,
  useSearchResults,
  useSearchPage,
  type SearchFiltersConfig,
  type SearchFiltersState,
  type SearchFiltersActions,
  type SearchResultsConfig,
  type SearchResultsState,
  type SearchResultsActions,
} from './useSearchPage';