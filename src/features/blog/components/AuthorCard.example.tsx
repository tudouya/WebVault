/**
 * AuthorCard Component Example Usage
 * 
 * This file demonstrates how to use the AuthorCard component
 * with different configurations and mock data.
 */

"use client";

import React, { useState } from 'react';
import { AuthorCard } from './AuthorCard';
import type { BlogAuthorDetail } from '../types/detail';

// Example author data for demonstration
const exampleAuthor: BlogAuthorDetail = {
  name: 'Sarah Chen',
  avatar: '/assets/images/avatars/sarah-chen.jpg',
  bio: 'Senior Product Designer with 8+ years of experience building design systems for scaling startups. Previously at Airbnb and Figma.',
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

/**
 * AuthorCard Example Page Component
 * Shows different variations of the AuthorCard component
 */
export function AuthorCardExample() {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollowClick = async (authorId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsFollowing(!isFollowing);
    console.log(`${isFollowing ? 'Unfollowed' : 'Followed'} author:`, authorId);
  };

  const handleSocialClick = (platform: string, url: string) => {
    console.log(`Opening ${platform}:`, url);
    // In real usage, this would open the URL
  };

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AuthorCard Component Examples</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Full Featured Author Card */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Full Featured</h2>
            <AuthorCard
              author={exampleAuthor}
              isFollowing={isFollowing}
              showFollowButton={true}
              showStats={true}
              onFollowClick={handleFollowClick}
              onSocialClick={handleSocialClick}
            />
          </div>

          {/* Minimal Author Card */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Minimal (No Stats)</h2>
            <AuthorCard
              author={exampleAuthor}
              showFollowButton={true}
              showStats={false}
              onFollowClick={handleFollowClick}
              onSocialClick={handleSocialClick}
            />
          </div>

          {/* Read-only Author Card */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Read-only</h2>
            <AuthorCard
              author={exampleAuthor}
              showFollowButton={false}
              showStats={true}
              onSocialClick={handleSocialClick}
            />
          </div>

          {/* Author without avatar */}
          <div>
            <h2 className="text-xl font-semibold mb-4">No Avatar</h2>
            <AuthorCard
              author={{
                ...exampleAuthor,
                avatar: undefined,
                name: 'John Doe'
              }}
              showFollowButton={true}
              showStats={true}
              onFollowClick={handleFollowClick}
              onSocialClick={handleSocialClick}
            />
          </div>

          {/* Author with limited social links */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Limited Social</h2>
            <AuthorCard
              author={{
                ...exampleAuthor,
                socialLinks: {
                  twitter: 'https://twitter.com/sarahchen',
                  website: 'https://sarahchen.design'
                }
              }}
              showFollowButton={true}
              showStats={true}
              onFollowClick={handleFollowClick}
              onSocialClick={handleSocialClick}
            />
          </div>

          {/* Author without bio */}
          <div>
            <h2 className="text-xl font-semibold mb-4">No Bio</h2>
            <AuthorCard
              author={{
                ...exampleAuthor,
                bio: undefined
              }}
              showFollowButton={true}
              showStats={false}
              onFollowClick={handleFollowClick}
              onSocialClick={handleSocialClick}
            />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Usage Instructions</h2>
          <div className="bg-muted p-6 rounded-lg">
            <pre className="text-sm overflow-x-auto">
{`// Basic usage
<AuthorCard 
  author={authorData}
  showFollowButton={true}
  showStats={true}
  onFollowClick={(authorId) => handleFollow(authorId)}
  onSocialClick={(platform, url) => window.open(url, '_blank')}
/>

// Minimal usage
<AuthorCard 
  author={authorData}
  showFollowButton={false}
  showStats={false}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthorCardExample;