/**
 * PageHeader组件单元测试
 */

import { render, screen } from '@testing-library/react';
import { PageHeader } from '../PageHeader';
import type { PageType } from '../../types/page-config';

describe('PageHeader', () => {
  const defaultProps = {
    pageType: 'collection' as PageType,
    title: 'Test Collection'
  };

  it('renders collection page header correctly', () => {
    render(<PageHeader {...defaultProps} />);
    
    expect(screen.getByText('COLLECTION')).toBeInTheDocument();
    expect(screen.getByText('Test Collection')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '页面标题' })).toBeInTheDocument();
  });

  it('renders category page header correctly', () => {
    render(
      <PageHeader 
        pageType="category" 
        title="Web Development" 
        subtitle="Explore development tools and resources"
      />
    );
    
    expect(screen.getByText('CATEGORY')).toBeInTheDocument();
    expect(screen.getByText('Web Development')).toBeInTheDocument();
    expect(screen.getByText('Explore development tools and resources')).toBeInTheDocument();
  });

  it('renders tag page header correctly', () => {
    render(
      <PageHeader 
        pageType="tag" 
        title="React" 
      />
    );
    
    expect(screen.getByText('TAG')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('renders with default titles when not provided', () => {
    render(<PageHeader pageType="category" title="" />);
    
    expect(screen.getByText('Explore by categories')).toBeInTheDocument();
  });

  it('renders with description when provided', () => {
    render(
      <PageHeader 
        pageType="collection" 
        title="Design Tools" 
        description="A curated collection of the best design tools and resources for developers and designers."
      />
    );
    
    expect(screen.getByText('A curated collection of the best design tools and resources for developers and designers.')).toBeInTheDocument();
  });

  it('renders with stats when provided', () => {
    render(
      <PageHeader 
        pageType="collection" 
        title="Design Tools"
        stats={{ count: 42, label: 'websites' }}
      />
    );
    
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('websites')).toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    render(
      <PageHeader 
        {...defaultProps}
        isLoading={true}
      />
    );
    
    expect(screen.getByRole('region', { name: '页面标题加载中' })).toBeInTheDocument();
    // Loading state should show skeleton elements
    const skeletonElements = screen.getByRole('region', { name: '页面标题加载中' }).querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('applies custom className correctly', () => {
    const { container } = render(
      <PageHeader 
        {...defaultProps}
        className="custom-class"
      />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('renders with proper semantic HTML structure', () => {
    render(<PageHeader {...defaultProps} />);
    
    // Should have proper heading structure
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    // Should have proper section structure  
    expect(screen.getByRole('region', { name: '页面标题' })).toBeInTheDocument();
  });

  it('formats large numbers in stats correctly', () => {
    render(
      <PageHeader 
        pageType="collection" 
        title="Popular Sites"
        stats={{ count: 1234567, label: 'total views' }}
      />
    );
    
    // Should format large numbers with commas
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });
});