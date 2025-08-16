import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  BrowsablePageSkeleton,
  BrowsableFilterLoadingIndicator,
  BrowsableDataRefreshIndicator,
  BrowsablePageLoadingOverlay,
  BrowsablePageEmptyStateWithLoading,
  BrowsablePageLoadingState,
} from '../BrowsablePageLoadingStates';

describe('BrowsablePageLoadingStates', () => {
  describe('BrowsablePageSkeleton', () => {
    it('renders collection page skeleton correctly', () => {
      render(<BrowsablePageSkeleton pageType="collection" />);
      expect(document.querySelector('.browsable-page-card-skeleton')).toBeInTheDocument();
    });

    it('renders category page skeleton correctly', () => {
      render(<BrowsablePageSkeleton pageType="category" count={3} />);
      const skeletons = document.querySelectorAll('.browsable-page-card-skeleton');
      expect(skeletons).toHaveLength(3);
    });

    it('renders tag page skeleton correctly', () => {
      render(<BrowsablePageSkeleton pageType="tag" />);
      expect(document.querySelector('.browsable-page-card-skeleton')).toBeInTheDocument();
    });
  });

  describe('BrowsableFilterLoadingIndicator', () => {
    it('renders when loading is true', () => {
      render(
        <BrowsableFilterLoadingIndicator 
          isLoading={true} 
          pageType="collection" 
        />
      );
      expect(screen.getByText('Filtering collections...')).toBeInTheDocument();
    });

    it('does not render when loading is false', () => {
      render(
        <BrowsableFilterLoadingIndicator 
          isLoading={false} 
          pageType="collection" 
        />
      );
      expect(screen.queryByText('Filtering collections...')).not.toBeInTheDocument();
    });

    it('renders custom text when provided', () => {
      render(
        <BrowsableFilterLoadingIndicator 
          isLoading={true} 
          pageType="collection" 
          text="Custom filtering text..." 
        />
      );
      expect(screen.getByText('Custom filtering text...')).toBeInTheDocument();
    });
  });

  describe('BrowsableDataRefreshIndicator', () => {
    it('renders when loading is true', () => {
      render(<BrowsableDataRefreshIndicator isLoading={true} />);
      expect(screen.getByText('Refreshing data...')).toBeInTheDocument();
    });

    it('does not render when loading is false', () => {
      render(<BrowsableDataRefreshIndicator isLoading={false} />);
      expect(screen.queryByText('Refreshing data...')).not.toBeInTheDocument();
    });
  });

  describe('BrowsablePageLoadingOverlay', () => {
    it('renders when loading is true', () => {
      render(
        <BrowsablePageLoadingOverlay 
          isLoading={true} 
          pageType="collection" 
        />
      );
      expect(screen.getByText('Loading collections...')).toBeInTheDocument();
    });

    it('does not render when loading is false', () => {
      render(
        <BrowsablePageLoadingOverlay 
          isLoading={false} 
          pageType="collection" 
        />
      );
      expect(screen.queryByText('Loading collections...')).not.toBeInTheDocument();
    });
  });

  describe('BrowsablePageEmptyStateWithLoading', () => {
    it('renders when loading is true', () => {
      render(
        <BrowsablePageEmptyStateWithLoading 
          isLoading={true} 
          pageType="collection" 
        />
      );
      expect(screen.getByText('Loading collections...')).toBeInTheDocument();
    });

    it('does not render when loading is false', () => {
      render(
        <BrowsablePageEmptyStateWithLoading 
          isLoading={false} 
          pageType="collection" 
        />
      );
      expect(screen.queryByText('Loading collections...')).not.toBeInTheDocument();
    });
  });

  describe('BrowsablePageLoadingState', () => {
    it('renders skeleton during initial loading', () => {
      render(
        <BrowsablePageLoadingState
          isInitialLoading={true}
          isFiltering={false}
          isRefreshing={false}
          isPaginating={false}
          pageType="collection"
        />
      );
      expect(document.querySelector('.browsable-page-card-skeleton')).toBeInTheDocument();
    });

    it('renders filter indicator during filtering', () => {
      render(
        <BrowsablePageLoadingState
          isInitialLoading={false}
          isFiltering={true}
          isRefreshing={false}
          isPaginating={false}
          pageType="collection"
        />
      );
      expect(screen.getByText('Filtering collections...')).toBeInTheDocument();
    });

    it('renders refresh indicator during refreshing', () => {
      render(
        <BrowsablePageLoadingState
          isInitialLoading={false}
          isFiltering={false}
          isRefreshing={true}
          isPaginating={false}
          pageType="collection"
        />
      );
      expect(screen.getByText('Refreshing data...')).toBeInTheDocument();
    });

    it('renders overlay during pagination', () => {
      render(
        <BrowsablePageLoadingState
          isInitialLoading={false}
          isFiltering={false}
          isRefreshing={false}
          isPaginating={true}
          pageType="collection"
        />
      );
      expect(screen.getByText('Loading collections...')).toBeInTheDocument();
    });

    it('renders nothing when no loading states are active', () => {
      const { container } = render(
        <BrowsablePageLoadingState
          isInitialLoading={false}
          isFiltering={false}
          isRefreshing={false}
          isPaginating={false}
          pageType="collection"
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });
});