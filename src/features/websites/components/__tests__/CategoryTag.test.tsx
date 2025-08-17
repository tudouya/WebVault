import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryTag } from '../CategoryTag';
import type { Category } from '../../types/category';

// Mock category data
const mockCategory: Category = {
  id: 'cat-1',
  name: 'Technology',
  description: 'Technology related websites',
  slug: 'technology',
  parentId: null,
  icon_url: '',
  color: '#3b82f6',
  status: 'active',
  sort_order: 1,
  website_count: 50,
  is_expanded: false,
  is_visible: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
};

const mockCategoryWithoutColor: Category = {
  ...mockCategory,
  id: 'cat-2',
  name: 'Business',
  color: undefined
};

describe('CategoryTag', () => {
  it('renders category name correctly', () => {
    render(<CategoryTag category={mockCategory} />);
    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('applies default variant and size', () => {
    render(<CategoryTag category={mockCategory} />);
    const tag = screen.getByText('Technology');
    expect(tag).toHaveClass('px-2.5', 'py-1', 'text-xs'); // md size classes
  });

  it('applies custom variant and size', () => {
    render(<CategoryTag category={mockCategory} variant="outline" size="lg" />);
    const tag = screen.getByText('Technology');
    expect(tag).toHaveClass('border', 'px-3', 'py-1.5', 'text-sm'); // outline variant and lg size
  });

  it('applies selected state styling', () => {
    render(<CategoryTag category={mockCategory} selected={true} />);
    const tag = screen.getByText('Technology');
    expect(tag).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('applies category color when available and variant is default', () => {
    render(<CategoryTag category={mockCategory} />);
    const tag = screen.getByText('Technology');
    
    // Check if style attribute contains the category color
    expect(tag).toHaveStyle({
      color: '#3b82f6'
    });
  });

  it('does not apply category color for non-default variants', () => {
    render(<CategoryTag category={mockCategory} variant="outline" />);
    const tag = screen.getByText('Technology');
    
    // Should not have inline color style
    expect(tag).not.toHaveStyle({
      color: '#3b82f6'
    });
  });

  it('handles missing category color gracefully', () => {
    render(<CategoryTag category={mockCategoryWithoutColor} />);
    const tag = screen.getByText('Business');
    expect(tag).toBeInTheDocument();
    // Should not have any inline styles
    expect(tag).not.toHaveAttribute('style');
  });

  it('calls onClick handler when clicked', () => {
    const mockOnClick = jest.fn();
    render(<CategoryTag category={mockCategory} onClick={mockOnClick} />);
    
    const tag = screen.getByText('Technology');
    fireEvent.click(tag);
    
    expect(mockOnClick).toHaveBeenCalledWith(mockCategory);
  });

  it('supports keyboard navigation', () => {
    const mockOnClick = jest.fn();
    render(<CategoryTag category={mockCategory} onClick={mockOnClick} />);
    
    const tag = screen.getByText('Technology');
    
    // Test Enter key
    fireEvent.keyDown(tag, { key: 'Enter' });
    expect(mockOnClick).toHaveBeenCalledWith(mockCategory);
    
    // Test Space key
    fireEvent.keyDown(tag, { key: ' ' });
    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });

  it('does not trigger onClick for other keys', () => {
    const mockOnClick = jest.fn();
    render(<CategoryTag category={mockCategory} onClick={mockOnClick} />);
    
    const tag = screen.getByText('Technology');
    fireEvent.keyDown(tag, { key: 'Tab' });
    
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('applies interactive styles only when onClick is provided', () => {
    const { rerender } = render(<CategoryTag category={mockCategory} />);
    let tag = screen.getByText('Technology');
    
    // Without onClick, should not have cursor-pointer
    expect(tag).not.toHaveClass('cursor-pointer');
    expect(tag).not.toHaveAttribute('tabIndex');
    expect(tag).not.toHaveAttribute('role');
    
    // With onClick, should have interactive styles
    rerender(<CategoryTag category={mockCategory} onClick={() => {}} />);
    tag = screen.getByText('Technology');
    
    expect(tag).toHaveClass('cursor-pointer');
    expect(tag).toHaveAttribute('tabIndex', '0');
    expect(tag).toHaveAttribute('role', 'button');
  });

  it('applies custom className', () => {
    render(<CategoryTag category={mockCategory} className="custom-class" />);
    const tag = screen.getByText('Technology');
    expect(tag).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes when clickable', () => {
    render(<CategoryTag category={mockCategory} onClick={() => {}} />);
    const tag = screen.getByText('Technology');
    
    expect(tag).toHaveAttribute('role', 'button');
    expect(tag).toHaveAttribute('tabIndex', '0');
    expect(tag).toHaveAttribute('aria-label', 'Navigate to Technology category');
  });

  it('does not have accessibility attributes when not clickable', () => {
    render(<CategoryTag category={mockCategory} />);
    const tag = screen.getByText('Technology');
    
    expect(tag).not.toHaveAttribute('role');
    expect(tag).not.toHaveAttribute('tabIndex');
    expect(tag).not.toHaveAttribute('aria-label');
  });

  it('applies secondary variant correctly', () => {
    render(<CategoryTag category={mockCategory} variant="secondary" />);
    const tag = screen.getByText('Technology');
    expect(tag).toHaveClass('bg-secondary/50', 'text-secondary-foreground');
  });

  it('applies secondary variant with selected state', () => {
    render(<CategoryTag category={mockCategory} variant="secondary" selected={true} />);
    const tag = screen.getByText('Technology');
    expect(tag).toHaveClass('bg-secondary', 'text-secondary-foreground', 'shadow-sm');
  });
});