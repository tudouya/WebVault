import React from 'react';
import { WebsiteDetailInfo } from './WebsiteDetailInfo';
import type { WebsiteDetailData } from '../types/detail';

// Example data for demonstration
const exampleWebsiteDetail: WebsiteDetailData = {
  id: 'website-1',
  title: 'Amazing Web Development Tool',
  description: 'A comprehensive tool for modern web development with real-time collaboration and advanced features.',
  url: 'https://amazing-webdev-tool.com',
  favicon_url: 'https://amazing-webdev-tool.com/favicon.ico',
  tags: ['Web Development', 'Collaboration', 'JavaScript', 'React', 'TypeScript', 'DevTools'],
  category_id: 'web-dev',
  status: 'active',
  visitCount: 12500,
  rating: 4.8,
  is_featured: true,
  is_public: true,
  isAd: false,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-20T14:45:00Z',
  language: 'English',
  popularity_score: 9.2,
  last_checked_at: '2024-01-20T08:00:00Z',
  is_accessible: true,
  publisher: {
    id: 'publisher-1',
    name: 'Alex Chen',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Full-stack developer and open source enthusiast. Building tools to make web development more accessible and enjoyable.',
    website_url: 'https://alexchen.dev',
    published_count: 25,
    joined_at: '2023-03-15T00:00:00Z'
  },
  category: {
    id: 'web-dev',
    name: 'Web Development',
    description: 'Tools and resources for web developers',
    slug: 'web-development',
    parentId: 'technology',
    icon_url: '',
    color: '#059669',
    status: 'active',
    sort_order: 1,
    website_count: 150,
    is_expanded: false,
    is_visible: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  stats: {
    total_visits: 12500,
    monthly_visits: 3200,
    weekly_visits: 750,
    daily_visits: 105,
    bounce_rate: 28.5,
    avg_session_duration: 450
  },
  features: [
    'Real-time collaboration',
    'Version control integration',
    'Live preview',
    'Code completion',
    'Built-in testing tools',
    'Deployment automation'
  ],
  pricing: {
    is_free: true,
    has_paid_plans: true,
    starting_price: '19.99',
    currency: '$'
  },
  social_links: {
    twitter: 'https://twitter.com/amazingwebdev',
    github: 'https://github.com/amazingwebdev/tool',
    linkedin: 'https://linkedin.com/company/amazingwebdev'
  }
};

const minimalWebsiteDetail: WebsiteDetailData = {
  id: 'website-2',
  title: 'Simple Portfolio Site',
  description: 'A clean and minimal portfolio website template.',
  url: 'https://simple-portfolio.com',
  tags: ['Portfolio', 'Design'],
  category_id: 'design',
  status: 'active',
  visitCount: 245,
  rating: 4.2,
  is_featured: false,
  is_public: true,
  isAd: false,
  created_at: '2024-01-10T00:00:00Z',
  updated_at: '2024-01-10T00:00:00Z',
  is_accessible: true
};

/**
 * Example usage of WebsiteDetailInfo component
 * 
 * This example demonstrates:
 * - Full-featured website with all data available
 * - Minimal website with only required data
 * - Event handlers for tag and category clicks
 * - Custom styling and responsive behavior
 */
export function WebsiteDetailInfoExample() {
  const handleTagClick = (tag: string) => {
    console.log('Tag clicked:', tag);
    // In a real app, this would navigate to tag filter page
  };

  const handleCategoryClick = (category: { id: string; name: string; slug: string }) => {
    console.log('Category clicked:', category);
    // In a real app, this would navigate to category page
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      <section>
        <h2 className="text-2xl font-bold mb-6">Full-Featured Website Detail Info</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area simulation */}
          <div className="lg:col-span-2">
            <div className="bg-muted/50 rounded-lg p-8 h-96 flex items-center justify-center">
              <p className="text-muted-foreground">Main content area (hero, description, etc.)</p>
            </div>
          </div>
          
          {/* Sidebar with WebsiteDetailInfo */}
          <div className="lg:col-span-1">
            <WebsiteDetailInfo
              website={exampleWebsiteDetail}
              onTagClick={handleTagClick}
              onCategoryClick={handleCategoryClick}
              className="space-y-4"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Minimal Website Detail Info</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area simulation */}
          <div className="lg:col-span-2">
            <div className="bg-muted/50 rounded-lg p-8 h-64 flex items-center justify-center">
              <p className="text-muted-foreground">Main content area (minimal data)</p>
            </div>
          </div>
          
          {/* Sidebar with minimal data */}
          <div className="lg:col-span-1">
            <WebsiteDetailInfo
              website={minimalWebsiteDetail}
              onTagClick={handleTagClick}
              onCategoryClick={handleCategoryClick}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Mobile View Simulation</h2>
        <div className="max-w-md mx-auto border rounded-lg p-4">
          <div className="bg-muted/50 rounded p-4 mb-4 h-32 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Mobile hero section</p>
          </div>
          
          <WebsiteDetailInfo
            website={exampleWebsiteDetail}
            onTagClick={handleTagClick}
            onCategoryClick={handleCategoryClick}
            className="space-y-3"
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Component Features Demonstration</h2>
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">Key Features:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Publisher Information:</strong> Shows author details with avatar, bio, and publication count</li>
            <li>• <strong>Website Metadata:</strong> Category, language, accessibility status, and popularity score</li>
            <li>• <strong>Interactive Tags:</strong> Clickable tags that trigger filter navigation</li>
            <li>• <strong>Visit Statistics:</strong> Formatted visitor counts and engagement metrics</li>
            <li>• <strong>Key Features:</strong> Bullet-point list of website highlights</li>
            <li>• <strong>Pricing Information:</strong> Free/paid status with plan details</li>
            <li>• <strong>Responsive Design:</strong> Adapts to different screen sizes</li>
            <li>• <strong>Sticky Positioning:</strong> Publisher card stays in view during scroll</li>
            <li>• <strong>Graceful Fallbacks:</strong> Handles missing data elegantly</li>
            <li>• <strong>Accessibility:</strong> Proper ARIA labels and keyboard navigation</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default WebsiteDetailInfoExample;