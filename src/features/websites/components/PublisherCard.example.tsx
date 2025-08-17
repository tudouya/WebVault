import React from 'react';
import { PublisherCard } from './PublisherCard';
import type { PublisherInfo } from '../types/detail';

/**
 * PublisherCard Examples
 * 
 * This file demonstrates various usage scenarios for the PublisherCard component
 */

// Example publisher data
const fullPublisher: PublisherInfo = {
  id: '1',
  name: 'John Doe',
  avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  bio: 'Full stack developer with a passion for creating beautiful and functional web applications. Loves sharing useful tools and resources.',
  website_url: 'https://johndoe.dev',
  published_count: 12,
  joined_at: '2023-03-15T10:00:00Z'
};

const minimalPublisher: PublisherInfo = {
  id: '2',
  name: 'Jane Smith',
  published_count: 3,
  joined_at: '2024-01-01T00:00:00Z'
};

const singleNamePublisher: PublisherInfo = {
  id: '3',
  name: 'Admin',
  published_count: 25,
  joined_at: '2023-01-01T00:00:00Z'
};

export default function PublisherCardExamples() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">PublisherCard Examples</h2>
        <p className="text-muted-foreground mb-8">
          Different variations of the PublisherCard component showing various data scenarios.
        </p>
      </div>

      {/* Full Publisher Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Full Publisher Information</h3>
        <PublisherCard
          publisher={fullPublisher}
          publishedDate="2024-02-15T14:30:00Z"
          className="max-w-md"
        />
      </div>

      {/* Minimal Publisher Data */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Minimal Publisher Data</h3>
        <PublisherCard
          publisher={minimalPublisher}
          publishedDate="2024-01-20T09:15:00Z"
          className="max-w-md"
        />
      </div>

      {/* Single Name Publisher */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Single Name Publisher</h3>
        <PublisherCard
          publisher={singleNamePublisher}
          publishedDate="2024-01-10T16:45:00Z"
          className="max-w-md"
        />
      </div>

      {/* No Publisher (Fallback) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">No Publisher (Default Fallback)</h3>
        <PublisherCard
          publisher={null}
          publishedDate="2024-01-05T12:00:00Z"
          className="max-w-md"
        />
      </div>

      {/* Without Bio */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Publisher with Bio Hidden</h3>
        <PublisherCard
          publisher={fullPublisher}
          publishedDate="2024-02-10T11:30:00Z"
          showBio={false}
          className="max-w-md"
        />
      </div>

      {/* Side by Side Comparison */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Side by Side Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PublisherCard
            publisher={fullPublisher}
            publishedDate="2024-02-15T14:30:00Z"
          />
          <PublisherCard
            publisher={null}
            publishedDate="2024-02-15T14:30:00Z"
          />
        </div>
      </div>
    </div>
  );
}