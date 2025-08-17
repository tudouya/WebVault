import React from 'react';
import { WebsiteDetailHero } from './WebsiteDetailHero';
import type { WebsiteDetailData } from '../types/detail';

/**
 * Example usage of WebsiteDetailHero component
 * 
 * This file demonstrates different scenarios and use cases
 * for the WebsiteDetailHero component.
 */

// Example website data with full information
const exampleWebsiteComplete: WebsiteDetailData = {
  id: 'example-1',
  title: 'GitHub - The World\'s Leading Software Development Platform',
  url: 'https://github.com',
  description: 'GitHub is a development platform inspired by the way you work. From open source to business, you can host and review code, manage projects, and build software alongside 50 million developers.',
  favicon_url: 'https://github.githubassets.com/favicons/favicon.svg',
  screenshot_url: 'https://github.githubassets.com/images/modules/site/social-cards/github-social.png',
  content: 'GitHub brings together the world\'s largest community of developers to discover, share, and build better software. From open source projects to private team repositories, we\'re your all-in-one platform for collaborative development.',
  is_accessible: true,
  category_id: 'dev-tools',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  visitCount: 1500000,
  tags: ['development', 'git', 'collaboration', 'open-source'],
  status: 'active' as const,
  isAd: false,
  is_featured: true,
  is_public: true,
  language: 'en',
  popularity_score: 95
};

// Example website data without cover image
const exampleWebsiteNoImage: WebsiteDetailData = {
  id: 'example-2',
  title: 'Hacker News',
  url: 'https://news.ycombinator.com',
  description: 'Hacker News is a social news website focusing on computer science and entrepreneurship.',
  favicon_url: 'https://news.ycombinator.com/favicon.ico',
  is_accessible: true,
  category_id: 'news',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  visitCount: 750000,
  tags: ['news', 'technology', 'startups'],
  status: 'active' as const,
  isAd: false,
  is_featured: false,
  is_public: true
};

// Example website data with accessibility warning
const exampleWebsiteNotAccessible: WebsiteDetailData = {
  id: 'example-3',
  title: 'Example Old Website',
  url: 'https://old-site.example.com',
  description: 'An older website that may have accessibility issues.',
  is_accessible: false,
  category_id: 'archive',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  visitCount: 100,
  tags: ['archive', 'legacy'],
  status: 'active' as const,
  isAd: false,
  is_featured: false,
  is_public: true
};

// Example website data minimal information
const exampleWebsiteMinimal: WebsiteDetailData = {
  id: 'example-4',
  title: 'Simple Blog',
  url: 'https://simpleblog.example.com',
  is_accessible: true,
  category_id: 'blog',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  visitCount: 50,
  tags: [],
  status: 'active' as const,
  isAd: false,
  is_featured: false,
  is_public: true
};

/**
 * Example component showing different WebsiteDetailHero configurations
 */
export function WebsiteDetailHeroExamples() {
  const handleVisit = (websiteId: string, url: string) => {
    console.log(`Visiting website ${websiteId}: ${url}`);
    // In real app, this would track analytics, update visit count, etc.
  };

  return (
    <div className="space-y-12 p-8 bg-background">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">WebsiteDetailHero Examples</h1>
        <p className="text-muted-foreground">
          Different configurations and use cases for the website detail hero component
        </p>
      </div>

      {/* Complete website with all features */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Complete Website (with cover image and extended content)</h2>
        <div className="border rounded-lg p-6">
          <WebsiteDetailHero
            website={exampleWebsiteComplete}
            onVisit={handleVisit}
          />
        </div>
      </section>

      {/* Website without cover image */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Website without Cover Image</h2>
        <div className="border rounded-lg p-6">
          <WebsiteDetailHero
            website={exampleWebsiteNoImage}
            onVisit={handleVisit}
          />
        </div>
      </section>

      {/* Website with accessibility warning */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Website with Accessibility Warning</h2>
        <div className="border rounded-lg p-6">
          <WebsiteDetailHero
            website={exampleWebsiteNotAccessible}
            onVisit={handleVisit}
          />
        </div>
      </section>

      {/* Minimal website data */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Minimal Website Information</h2>
        <div className="border rounded-lg p-6">
          <WebsiteDetailHero
            website={exampleWebsiteMinimal}
            onVisit={handleVisit}
          />
        </div>
      </section>

      {/* Custom styling example */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Custom Styling</h2>
        <div className="border rounded-lg p-6">
          <WebsiteDetailHero
            website={exampleWebsiteComplete}
            onVisit={handleVisit}
            className="bg-muted/50 p-6 rounded-lg"
          />
        </div>
      </section>
    </div>
  );
}

export default WebsiteDetailHeroExamples;