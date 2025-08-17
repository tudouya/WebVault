import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PublisherCard } from '../PublisherCard';
import type { PublisherInfo } from '../../types/detail';

// Mock publisher data
const mockPublisher: PublisherInfo = {
  id: '1',
  name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  bio: 'Full stack developer with passion for web technologies',
  website_url: 'https://johndoe.dev',
  published_count: 5,
  joined_at: '2023-01-15T10:00:00Z'
};

const mockPublishedDate = '2024-01-15T10:00:00Z';

describe('PublisherCard', () => {
  it('renders publisher information correctly', () => {
    render(
      <PublisherCard
        publisher={mockPublisher}
        publishedDate={mockPublishedDate}
      />
    );

    // Check publisher name
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check publication date
    expect(screen.getByText(/Published on January 15, 2024/)).toBeInTheDocument();
    
    // Check bio
    expect(screen.getByText('Full stack developer with passion for web technologies')).toBeInTheDocument();
    
    // Check avatar
    const avatar = screen.getByAltText("John Doe's avatar");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    
    // Check published count
    expect(screen.getByText('5 websites published')).toBeInTheDocument();
  });

  it('renders fallback when no publisher is provided', () => {
    render(
      <PublisherCard
        publisher={null}
        publishedDate={mockPublishedDate}
      />
    );

    // Check default name
    expect(screen.getByText('WebVault')).toBeInTheDocument();
    
    // Check default badge
    expect(screen.getByText('Default')).toBeInTheDocument();
    
    // Check publication date still shows
    expect(screen.getByText(/Published on January 15, 2024/)).toBeInTheDocument();
    
    // Check no bio is shown
    expect(screen.queryByText('Full stack developer')).not.toBeInTheDocument();
  });

  it('renders with minimal publisher data', () => {
    const minimalPublisher: PublisherInfo = {
      id: '2',
      name: 'Jane Smith',
      published_count: 1,
      joined_at: '2024-01-01T00:00:00Z'
    };

    render(
      <PublisherCard
        publisher={minimalPublisher}
        publishedDate={mockPublishedDate}
      />
    );

    // Check name
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Check singular published count
    expect(screen.getByText('1 website published')).toBeInTheDocument();
    
    // Check no avatar URL (should show initials)
    expect(screen.getByText('JS')).toBeInTheDocument();
    
    // Check no bio
    expect(screen.queryByText(/Full stack developer/)).not.toBeInTheDocument();
  });

  it('hides bio when showBio is false', () => {
    render(
      <PublisherCard
        publisher={mockPublisher}
        publishedDate={mockPublishedDate}
        showBio={false}
      />
    );

    // Check name is still shown
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check bio is hidden
    expect(screen.queryByText('Full stack developer')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PublisherCard
        publisher={mockPublisher}
        publishedDate={mockPublishedDate}
        className="custom-class"
      />
    );

    const publisherCard = container.querySelector('.publisher-card');
    expect(publisherCard).toHaveClass('custom-class');
  });

  it('handles invalid date gracefully', () => {
    render(
      <PublisherCard
        publisher={mockPublisher}
        publishedDate="invalid-date"
      />
    );

    // Should show the original string when date parsing fails
    expect(screen.getByText(/Published on invalid-date/)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <PublisherCard
        publisher={mockPublisher}
        publishedDate={mockPublishedDate}
      />
    );

    // Check ARIA labels
    expect(screen.getByRole('region', { name: 'Publisher information' })).toBeInTheDocument();
    
    // Check time element with datetime attribute
    const timeElement = screen.getByText(/Published on January 15, 2024/);
    expect(timeElement.closest('time')).toHaveAttribute('dateTime', mockPublishedDate);
  });

  it('handles single word names for initials', () => {
    const singleWordPublisher: PublisherInfo = {
      id: '3',
      name: 'Admin',
      published_count: 10,
      joined_at: '2023-01-01T00:00:00Z'
    };

    render(
      <PublisherCard
        publisher={singleWordPublisher}
        publishedDate={mockPublishedDate}
      />
    );

    // Should show single letter initial
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});