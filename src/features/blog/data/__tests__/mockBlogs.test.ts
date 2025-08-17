/**
 * Tests for mock blog data functionality
 * 
 * 验证模拟博客数据的完整性和工具函数的正确性
 */

import {
  mockBlogs,
  getMockBlogs,
  getMockBlogCards,
  getMockBlogsPaginated,
  filterMockBlogsByCategory,
  searchMockBlogs,
  getAllMockBlogCategories,
  getBlogCategoryUsageStats,
  getMockBlogStats,
  formatRelativeTime,
  addRelativeTimeToBlogs,
  isValidBlogData,
  validateBlogDataArray
} from '../mockBlogs';

import { BLOG_CATEGORIES, BlogCategoryType } from '../../types';

describe('Mock Blog Data', () => {
  describe('Basic Data Structure', () => {
    it('should have exactly 6 blog posts', () => {
      expect(mockBlogs).toHaveLength(6);
    });

    it('should have all required fields for each blog', () => {
      mockBlogs.forEach(blog => {
        expect(blog).toHaveProperty('id');
        expect(blog).toHaveProperty('title');
        expect(blog).toHaveProperty('excerpt');
        expect(blog).toHaveProperty('slug');
        expect(blog).toHaveProperty('coverImage');
        expect(blog).toHaveProperty('author');
        expect(blog).toHaveProperty('category');
        expect(blog).toHaveProperty('publishedAt');
        
        // Validate author object
        expect(blog.author).toHaveProperty('name');
        expect(typeof blog.author.name).toBe('string');
        
        // Validate category is one of predefined categories
        expect(BLOG_CATEGORIES.slice(1)).toContain(blog.category as BlogCategoryType);
      });
    });

    it('should cover all major categories except All', () => {
      const usedCategories = mockBlogs.map(blog => blog.category);
      const expectedCategories = ['Design', 'Technologies', 'Travel', 'Growth', 'Lifestyle'];
      
      expectedCategories.forEach(category => {
        expect(usedCategories).toContain(category);
      });
    });
  });

  describe('Data Retrieval Functions', () => {
    it('should return all blogs when no limit specified', () => {
      const result = getMockBlogs();
      expect(result).toHaveLength(6);
      expect(result).toEqual(mockBlogs);
    });

    it('should return limited number of blogs', () => {
      const result = getMockBlogs(3);
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockBlogs.slice(0, 3));
    });

    it('should return blogs with offset', () => {
      const result = getMockBlogs(2, 2);
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockBlogs.slice(2, 4));
    });

    it('should return blog cards with default limit', () => {
      const result = getMockBlogCards();
      expect(result).toHaveLength(6);
    });
  });

  describe('Category Filtering', () => {
    it('should return all blogs for All category', () => {
      const result = filterMockBlogsByCategory('All');
      expect(result).toHaveLength(6);
    });

    it('should filter blogs by specific category', () => {
      const result = filterMockBlogsByCategory('Technologies');
      const technologiesBlogs = mockBlogs.filter(blog => blog.category === 'Technologies');
      expect(result).toEqual(technologiesBlogs);
    });

    it('should return empty array for unused category', () => {
      // Assuming no blog uses every single category
      const allCategories = getAllMockBlogCategories();
      const unusedCategory = BLOG_CATEGORIES.find(cat => 
        cat !== 'All' && !allCategories.includes(cat)
      );
      
      if (unusedCategory) {
        const result = filterMockBlogsByCategory(unusedCategory);
        expect(result).toHaveLength(0);
      }
    });
  });

  describe('Search Functionality', () => {
    it('should return all blogs for empty search', () => {
      const result = searchMockBlogs('');
      expect(result).toHaveLength(6);
    });

    it('should search in blog titles', () => {
      const result = searchMockBlogs('Design');
      expect(result.length).toBeGreaterThan(0);
      result.forEach(blog => {
        expect(
          blog.title.toLowerCase().includes('design') ||
          blog.excerpt.toLowerCase().includes('design') ||
          blog.category.toLowerCase().includes('design') ||
          blog.author.name.toLowerCase().includes('design')
        ).toBe(true);
      });
    });

    it('should search in blog excerpts', () => {
      const result = searchMockBlogs('productivity');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should search in author names', () => {
      const result = searchMockBlogs('Sarah');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent search term', () => {
      const result = searchMockBlogs('xyznonexistentterm123');
      expect(result).toHaveLength(0);
    });
  });

  describe('Pagination', () => {
    it('should paginate blogs correctly', () => {
      const result = getMockBlogsPaginated(1, 3, 'All');
      
      expect(result.blogs).toHaveLength(3);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.totalBlogs).toBe(6);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(false);
    });

    it('should handle second page correctly', () => {
      const result = getMockBlogsPaginated(2, 3, 'All');
      
      expect(result.blogs).toHaveLength(3);
      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(true);
    });

    it('should handle invalid page numbers', () => {
      const result = getMockBlogsPaginated(999, 6, 'All');
      
      expect(result.pagination.currentPage).toBe(1); // Should default to valid page
      expect(result.blogs).toHaveLength(6);
    });

    it('should paginate with category filter', () => {
      const techBlogs = filterMockBlogsByCategory('Technologies');
      const result = getMockBlogsPaginated(1, 10, 'Technologies');
      
      expect(result.blogs).toHaveLength(techBlogs.length);
      expect(result.pagination.totalBlogs).toBe(techBlogs.length);
    });
  });

  describe('Statistics', () => {
    it('should return correct blog statistics', () => {
      const stats = getMockBlogStats();
      
      expect(stats.totalBlogs).toBe(6);
      expect(stats.categoriesUsed).toBeGreaterThan(0);
      expect(stats.averageTitleLength).toBeGreaterThan(0);
      expect(stats.categoryStats).toBeInstanceOf(Array);
      expect(stats.mostPopularCategory).toHaveProperty('category');
      expect(stats.mostPopularCategory).toHaveProperty('count');
    });

    it('should return category usage stats', () => {
      const stats = getBlogCategoryUsageStats();
      
      expect(stats).toBeInstanceOf(Array);
      stats.forEach(stat => {
        expect(stat).toHaveProperty('category');
        expect(stat).toHaveProperty('count');
        expect(typeof stat.count).toBe('number');
        expect(stat.count).toBeGreaterThan(0);
      });
    });

    it('should return all used categories', () => {
      const categories = getAllMockBlogCategories();
      
      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThan(0);
      categories.forEach(category => {
        expect(typeof category).toBe('string');
      });
    });
  });

  describe('Time Formatting', () => {
    it('should format recent dates correctly', () => {
      const today = new Date().toISOString();
      const result = formatRelativeTime(today);
      expect(result).toBe('Today');
    });

    it('should format past dates correctly', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(yesterday);
      expect(result).toBe('1d ago');
    });

    it('should add relative time to blogs', () => {
      const blogsWithTime = addRelativeTimeToBlogs(mockBlogs);
      
      expect(blogsWithTime).toHaveLength(6);
      blogsWithTime.forEach(blog => {
        expect(blog).toHaveProperty('relativeTime');
        expect(typeof blog.relativeTime).toBe('string');
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate correct blog data', () => {
      mockBlogs.forEach(blog => {
        expect(isValidBlogData(blog)).toBe(true);
      });
    });

    it('should reject invalid blog data', () => {
      const invalidBlog = {
        id: '1',
        title: 'Test',
        // missing required fields
      };
      
      expect(isValidBlogData(invalidBlog)).toBe(false);
    });

    it('should filter out invalid blogs from array', () => {
      const mixedData = [
        ...mockBlogs,
        { invalid: 'data' },
        { id: '1', title: 'incomplete' }
      ];
      
      const validBlogs = validateBlogDataArray(mixedData);
      expect(validBlogs).toHaveLength(6);
      expect(validBlogs).toEqual(mockBlogs);
    });
  });
});