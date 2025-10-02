/**
 * Blog data module exports
 *
 * Mock data has been removed. This file is kept for backward compatibility.
 * All exports return empty arrays or no-op functions.
 */

import type { BlogCardData } from '../types';

// Mock data has been removed - provide empty fallbacks
export const mockBlogs: BlogCardData[] = [];
export const getBlogCardData = (): BlogCardData[] => [];
export const getMockBlogs = (): BlogCardData[] => [];
export const getMockBlogCards = (): BlogCardData[] => [];
export const getMockBlogsPaginated = () => ({ items: [] as BlogCardData[], total: 0, page: 1, pageSize: 10 });
export const filterMockBlogsByCategory = (): BlogCardData[] => [];
export const searchMockBlogs = (): BlogCardData[] => [];
export const getAllMockBlogCategories = (): string[] => [];
export const getBlogCategoryUsageStats = () => ({});
export const getMockBlogStats = () => ({ total: 0, published: 0, draft: 0 });
export const formatRelativeTime = (date: string): string => date;
export const addRelativeTimeToBlogs = (blogs: BlogCardData[]): BlogCardData[] => blogs;
export const isValidBlogData = (): boolean => false;
export const validateBlogDataArray = () => ({ isValid: false, errors: [] as string[] });