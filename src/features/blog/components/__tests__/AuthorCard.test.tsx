/**
 * AuthorCard Component Tests
 * 
 * Tests for the AuthorCard component functionality, rendering, and interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthorCard } from '../AuthorCard';
import type { BlogAuthorDetail } from '../../types/detail';

// Mock the Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onError, ...props }: any) => {
    return (
      <img
        src={src}
        alt={alt}
        onError={onError}
        data-testid="author-avatar"
        {...props}
      />
    );
  },
}));

// Mock author data for testing
const mockAuthor: BlogAuthorDetail = {
  name: 'Sarah Chen',
  avatar: '/assets/images/avatars/sarah-chen.jpg',
  bio: 'Senior Product Designer with 8+ years of experience building design systems for scaling startups.',
  socialLinks: {
    twitter: 'https://twitter.com/sarahchen_design',
    github: 'https://github.com/sarahchen',
    linkedin: 'https://linkedin.com/in/sarahchen-design',
    website: 'https://sarahchen.design',
    email: 'sarah@sarahchen.design'
  },
  stats: {
    postsCount: 23,
    totalLikes: 1245,
    followersCount: 8920
  }
};

// Mock author without optional fields
const minimalAuthor: BlogAuthorDetail = {
  name: 'John Doe',
  avatar: undefined,
};

describe('AuthorCard Component', () => {
  // Test basic rendering
  describe('Basic Rendering', () => {
    it('renders author name correctly', () => {
      render(<AuthorCard author={mockAuthor} />);
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });

    it('renders author bio when provided', () => {
      render(<AuthorCard author={mockAuthor} />);
      expect(screen.getByText(/Senior Product Designer/)).toBeInTheDocument();
    });

    it('renders without bio when not provided', () => {
      render(<AuthorCard author={minimalAuthor} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText(/Senior Product Designer/)).not.toBeInTheDocument();
    });

    it('renders author avatar with correct alt text', () => {
      render(<AuthorCard author={mockAuthor} />);
      const avatar = screen.getByTestId('author-avatar');
      expect(avatar).toHaveAttribute('alt', "Sarah Chen's avatar");
    });

    it('renders fallback avatar when no avatar provided', () => {
      render(<AuthorCard author={minimalAuthor} />);
      expect(screen.getByText('J')).toBeInTheDocument(); // First letter of name
    });
  });

  // Test social links
  describe('Social Links', () => {
    it('renders all social link buttons when provided', () => {
      render(<AuthorCard author={mockAuthor} />);
      
      expect(screen.getByRole('button', { name: /Twitter/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /GitHub/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /LinkedIn/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Website/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Email/i })).toBeInTheDocument();
    });

    it('does not render social links when not provided', () => {
      render(<AuthorCard author={minimalAuthor} />);
      
      expect(screen.queryByRole('button', { name: /Twitter/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /GitHub/i })).not.toBeInTheDocument();
    });

    it('calls onSocialClick callback when social button is clicked', () => {
      const mockSocialClick = jest.fn();
      render(
        <AuthorCard 
          author={mockAuthor} 
          onSocialClick={mockSocialClick}
        />
      );
      
      const twitterButton = screen.getByRole('button', { name: /Twitter/i });
      fireEvent.click(twitterButton);
      
      expect(mockSocialClick).toHaveBeenCalledWith('twitter', 'https://twitter.com/sarahchen_design');
    });
  });

  // Test follow functionality
  describe('Follow Functionality', () => {
    it('renders follow button by default', () => {
      render(<AuthorCard author={mockAuthor} />);
      expect(screen.getByRole('button', { name: /Follow Sarah Chen/i })).toBeInTheDocument();
    });

    it('hides follow button when showFollowButton is false', () => {
      render(<AuthorCard author={mockAuthor} showFollowButton={false} />);
      expect(screen.queryByRole('button', { name: /Follow/i })).not.toBeInTheDocument();
    });

    it('shows "Following" when isFollowing is true', () => {
      render(<AuthorCard author={mockAuthor} isFollowing={true} />);
      expect(screen.getByRole('button', { name: /Unfollow Sarah Chen/i })).toBeInTheDocument();
      expect(screen.getByText('Following')).toBeInTheDocument();
    });

    it('calls onFollowClick callback when follow button is clicked', async () => {
      const mockFollowClick = jest.fn().mockResolvedValue(undefined);
      render(
        <AuthorCard 
          author={mockAuthor} 
          onFollowClick={mockFollowClick}
        />
      );
      
      const followButton = screen.getByRole('button', { name: /Follow Sarah Chen/i });
      fireEvent.click(followButton);
      
      expect(mockFollowClick).toHaveBeenCalledWith('Sarah Chen');
    });

    it('shows loading state when follow action is in progress', async () => {
      const mockFollowClick = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(
        <AuthorCard 
          author={mockAuthor} 
          onFollowClick={mockFollowClick}
        />
      );
      
      const followButton = screen.getByRole('button', { name: /Follow Sarah Chen/i });
      fireEvent.click(followButton);
      
      expect(screen.getByText('Following...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Following...')).not.toBeInTheDocument();
      });
    });
  });

  // Test statistics
  describe('Statistics Display', () => {
    it('renders all statistics when showStats is true', () => {
      render(<AuthorCard author={mockAuthor} showStats={true} />);
      
      expect(screen.getByText('23')).toBeInTheDocument(); // Posts count
      expect(screen.getByText('1.2k')).toBeInTheDocument(); // Likes count (formatted)
      expect(screen.getByText('8.9k')).toBeInTheDocument(); // Followers count (formatted)
      
      expect(screen.getByText('Posts')).toBeInTheDocument();
      expect(screen.getByText('Likes')).toBeInTheDocument();
      expect(screen.getByText('Followers')).toBeInTheDocument();
    });

    it('hides statistics when showStats is false', () => {
      render(<AuthorCard author={mockAuthor} showStats={false} />);
      
      expect(screen.queryByText('Posts')).not.toBeInTheDocument();
      expect(screen.queryByText('Likes')).not.toBeInTheDocument();
      expect(screen.queryByText('Followers')).not.toBeInTheDocument();
    });

    it('does not render statistics when stats are not provided', () => {
      render(<AuthorCard author={minimalAuthor} showStats={true} />);
      
      expect(screen.queryByText('Posts')).not.toBeInTheDocument();
      expect(screen.queryByText('Likes')).not.toBeInTheDocument();
      expect(screen.queryByText('Followers')).not.toBeInTheDocument();
    });

    it('formats large numbers correctly', () => {
      const authorWithLargeStats: BlogAuthorDetail = {
        ...mockAuthor,
        stats: {
          postsCount: 156,
          totalLikes: 15420,
          followersCount: 892000
        }
      };
      
      render(<AuthorCard author={authorWithLargeStats} showStats={true} />);
      
      expect(screen.getByText('156')).toBeInTheDocument(); // Under 1k
      expect(screen.getByText('15k')).toBeInTheDocument(); // Over 10k
      expect(screen.getByText('892k')).toBeInTheDocument(); // Large number
    });
  });

  // Test accessibility
  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      render(<AuthorCard author={mockAuthor} />);
      
      expect(screen.getByRole('button', { name: /Follow Sarah Chen/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Visit Sarah Chen's Twitter/i })).toBeInTheDocument();
    });

    it('has proper alt text for avatar image', () => {
      render(<AuthorCard author={mockAuthor} />);
      const avatar = screen.getByTestId('author-avatar');
      expect(avatar).toHaveAttribute('alt', "Sarah Chen's avatar");
    });
  });

  // Test error handling
  describe('Error Handling', () => {
    it('handles avatar loading error gracefully', () => {
      render(<AuthorCard author={mockAuthor} />);
      
      const avatar = screen.getByTestId('author-avatar');
      fireEvent.error(avatar);
      
      // Should show fallback with first letter
      expect(screen.getByText('S')).toBeInTheDocument();
    });
  });

  // Test customization
  describe('Customization', () => {
    it('applies custom className', () => {
      const { container } = render(
        <AuthorCard author={mockAuthor} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});