/**
 * RelatedPosts Component Tests
 * 
 * 测试相关文章推荐组件的功能和行为
 * 确保组件正确处理加载状态、错误状态和空状态
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RelatedPosts } from '../RelatedPosts';
import { blogDetailService } from '../../data/blogDetailService';
import type { BlogCardData } from '../../types';

// Mock blogDetailService
jest.mock('../../data/blogDetailService', () => ({
  blogDetailService: {
    getRelatedPosts: jest.fn()
  }
}));

const mockBlogDetailService = blogDetailService as jest.Mocked<typeof blogDetailService>;

// Mock BlogCard component
jest.mock('../BlogCard', () => ({
  BlogCard: ({ blog, onTagClick, onAuthorClick }: any) => (
    <div data-testid={`blog-card-${blog.id}`}>
      <h3>{blog.title}</h3>
      <p>{blog.excerpt}</p>
      <span>{blog.author.name}</span>
      <button onClick={() => onTagClick?.('test-tag')}>Test Tag</button>
      <button onClick={() => onAuthorClick?.(blog.id)}>Test Author</button>
    </div>
  )
}));

// Mock intersection observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Sample test data
const mockRelatedPosts: BlogCardData[] = [
  {
    id: 'related-1',
    title: 'Related Post 1',
    excerpt: 'This is a related post excerpt',
    slug: 'related-post-1',
    coverImage: '/images/related-1.jpg',
    author: {
      name: 'John Doe',
      avatar: '/avatars/john.jpg'
    },
    category: 'Technology',
    publishedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'related-2',
    title: 'Related Post 2',
    excerpt: 'Another related post excerpt',
    slug: 'related-post-2',
    coverImage: '/images/related-2.jpg',
    author: {
      name: 'Jane Smith',
      avatar: '/avatars/jane.jpg'
    },
    category: 'Design',
    publishedAt: '2024-01-02T00:00:00Z'
  },
  {
    id: 'related-3',
    title: 'Related Post 3',
    excerpt: 'Third related post excerpt',
    slug: 'related-post-3',
    coverImage: '/images/related-3.jpg',
    author: {
      name: 'Bob Wilson',
      avatar: '/avatars/bob.jpg'
    },
    category: 'Technology',
    publishedAt: '2024-01-03T00:00:00Z'
  }
];

describe('RelatedPosts Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading skeleton while fetching related posts', () => {
      // Mock a delayed promise
      mockBlogDetailService.getRelatedPosts.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockRelatedPosts), 1000))
      );

      render(<RelatedPosts currentBlogId="current-blog" />);

      // Check for loading skeleton elements
      expect(screen.getByLabelText('Related posts loading')).toBeInTheDocument();
      
      // Check for skeleton structure
      const skeletonCards = screen.getAllByRole('generic');
      expect(skeletonCards.length).toBeGreaterThan(0);
    });
  });

  describe('Success State', () => {
    it('should render related posts when data is successfully loaded', async () => {
      mockBlogDetailService.getRelatedPosts.mockResolvedValue(mockRelatedPosts);

      render(<RelatedPosts currentBlogId="current-blog" />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Related Posts')).toBeInTheDocument();
      });

      // Check that all related posts are rendered
      expect(screen.getByTestId('blog-card-related-1')).toBeInTheDocument();
      expect(screen.getByTestId('blog-card-related-2')).toBeInTheDocument();
      expect(screen.getByTestId('blog-card-related-3')).toBeInTheDocument();

      // Check for proper section labeling
      expect(screen.getByLabelText('Related posts')).toBeInTheDocument();
      expect(screen.getByText('Discover more articles you might find interesting')).toBeInTheDocument();
    });

    it('should respect the limit prop', async () => {
      const limitedPosts = mockRelatedPosts.slice(0, 2);
      mockBlogDetailService.getRelatedPosts.mockResolvedValue(limitedPosts);

      render(<RelatedPosts currentBlogId="current-blog" limit={2} />);

      await waitFor(() => {
        expect(screen.getByText('Related Posts')).toBeInTheDocument();
      });

      // Should only render 2 posts due to limit
      expect(screen.getByTestId('blog-card-related-1')).toBeInTheDocument();
      expect(screen.getByTestId('blog-card-related-2')).toBeInTheDocument();
      expect(screen.queryByTestId('blog-card-related-3')).not.toBeInTheDocument();
    });

    it('should call blogDetailService with correct parameters', async () => {
      mockBlogDetailService.getRelatedPosts.mockResolvedValue(mockRelatedPosts);

      render(
        <RelatedPosts 
          currentBlogId="test-blog" 
          limit={5}
          strategy="category"
          minSimilarityScore={0.3}
        />
      );

      await waitFor(() => {
        expect(mockBlogDetailService.getRelatedPosts).toHaveBeenCalledWith(
          'test-blog',
          {
            strategy: 'category',
            limit: 5,
            excludeCurrentPost: true,
            minSimilarityScore: 0.3
          }
        );
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when data loading fails', async () => {
      const errorMessage = 'Failed to load related posts';
      mockBlogDetailService.getRelatedPosts.mockRejectedValue(new Error(errorMessage));

      render(<RelatedPosts currentBlogId="current-blog" />);

      await waitFor(() => {
        expect(screen.getByLabelText('Related posts error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to Load Related Posts')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should allow retry when error occurs', async () => {
      const errorMessage = 'Network error';
      mockBlogDetailService.getRelatedPosts
        .mockRejectedValueOnce(new Error(errorMessage))
        .mockResolvedValueOnce(mockRelatedPosts);

      render(<RelatedPosts currentBlogId="current-blog" />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Click retry button
      fireEvent.click(screen.getByText('Try Again'));

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText('Related Posts')).toBeInTheDocument();
      });

      // Should have called the service twice (initial + retry)
      expect(mockBlogDetailService.getRelatedPosts).toHaveBeenCalledTimes(2);
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no related posts are found', async () => {
      mockBlogDetailService.getRelatedPosts.mockResolvedValue([]);

      render(<RelatedPosts currentBlogId="current-blog" />);

      await waitFor(() => {
        expect(screen.getByLabelText('No related posts found')).toBeInTheDocument();
      });

      expect(screen.getByText('No Related Posts Found')).toBeInTheDocument();
      expect(screen.getByText(/We couldn't find any related articles/)).toBeInTheDocument();
    });
  });

  describe('Event Handlers', () => {
    it('should call onTagClick when tag is clicked', async () => {
      const onTagClick = jest.fn();
      mockBlogDetailService.getRelatedPosts.mockResolvedValue(mockRelatedPosts);

      render(
        <RelatedPosts 
          currentBlogId="current-blog" 
          onTagClick={onTagClick}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Related Posts')).toBeInTheDocument();
      });

      // Click tag button in first related post
      fireEvent.click(screen.getAllByText('Test Tag')[0]);
      expect(onTagClick).toHaveBeenCalledWith('test-tag');
    });

    it('should call onAuthorClick when author is clicked', async () => {
      const onAuthorClick = jest.fn();
      mockBlogDetailService.getRelatedPosts.mockResolvedValue(mockRelatedPosts);

      render(
        <RelatedPosts 
          currentBlogId="current-blog" 
          onAuthorClick={onAuthorClick}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Related Posts')).toBeInTheDocument();
      });

      // Click author button in first related post
      fireEvent.click(screen.getAllByText('Test Author')[0]);
      expect(onAuthorClick).toHaveBeenCalledWith('related-1');
    });
  });

  describe('Development Mode', () => {
    it('should show strategy information in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockBlogDetailService.getRelatedPosts.mockResolvedValue(mockRelatedPosts);

      render(
        <RelatedPosts 
          currentBlogId="current-blog" 
          strategy="tags"
          limit={3}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Related Posts')).toBeInTheDocument();
      });

      expect(screen.getByText(/Recommended using "tags" strategy/)).toBeInTheDocument();
      expect(screen.getByText(/3 of 3 posts found/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and structure', async () => {
      mockBlogDetailService.getRelatedPosts.mockResolvedValue(mockRelatedPosts);

      render(<RelatedPosts currentBlogId="current-blog" />);

      await waitFor(() => {
        expect(screen.getByText('Related Posts')).toBeInTheDocument();
      });

      // Check section has proper label
      const section = screen.getByLabelText('Related posts');
      expect(section.tagName).toBe('SECTION');

      // Check heading structure
      const heading = screen.getByRole('heading', { name: 'Related Posts' });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('should maintain accessibility during loading state', () => {
      mockBlogDetailService.getRelatedPosts.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockRelatedPosts), 1000))
      );

      render(<RelatedPosts currentBlogId="current-blog" />);

      const loadingSection = screen.getByLabelText('Related posts loading');
      expect(loadingSection.tagName).toBe('SECTION');
    });

    it('should maintain accessibility during error state', async () => {
      mockBlogDetailService.getRelatedPosts.mockRejectedValue(new Error('Test error'));

      render(<RelatedPosts currentBlogId="current-blog" />);

      await waitFor(() => {
        const errorSection = screen.getByLabelText('Related posts error');
        expect(errorSection.tagName).toBe('SECTION');
      });
    });
  });
});