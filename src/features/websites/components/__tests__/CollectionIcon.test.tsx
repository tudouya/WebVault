import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CollectionIcon } from '../CollectionIcon';
import type { CollectionIcon as CollectionIconData } from '../../types/collection';

describe('CollectionIcon', () => {
  const mockIcon: CollectionIconData = {
    character: '🚀',
    backgroundColor: 'blue',
    textColor: 'white'
  };

  it('renders with emoji character', () => {
    const { container } = render(<CollectionIcon icon={mockIcon} />);
    const iconElement = container.firstChild as HTMLElement;
    
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveTextContent('🚀');
    expect(iconElement).toHaveClass('bg-blue-500', 'text-white');
  });

  it('renders with letter character', () => {
    const letterIcon: CollectionIconData = {
      character: 'A',
      backgroundColor: 'red',
      textColor: 'white'
    };
    
    const { container } = render(<CollectionIcon icon={letterIcon} />);
    const iconElement = container.firstChild as HTMLElement;
    
    expect(iconElement).toHaveTextContent('A');
    expect(iconElement).toHaveClass('bg-red-500', 'text-white');
  });

  it('renders with custom colors', () => {
    const customIcon: CollectionIconData = {
      character: 'C',
      backgroundColor: '#ff6b6b',
      textColor: '#ffffff'
    };
    
    const { container } = render(<CollectionIcon icon={customIcon} />);
    const iconElement = container.firstChild as HTMLElement;
    
    expect(iconElement).toHaveTextContent('C');
    expect(iconElement).toHaveStyle({
      backgroundColor: '#ff6b6b',
      color: '#ffffff'
    });
  });

  it('applies auto text color contrast', () => {
    const autoIcon: CollectionIconData = {
      character: '✨',
      backgroundColor: '#ffd93d', // Light yellow
      textColor: 'auto'
    };
    
    const { container } = render(<CollectionIcon icon={autoIcon} />);
    const iconElement = container.firstChild as HTMLElement;
    
    expect(iconElement).toHaveTextContent('✨');
    expect(iconElement).toHaveStyle({
      backgroundColor: '#ffd93d',
      color: '#000000' // Should be dark text for light background
    });
  });

  it('applies custom size', () => {
    const { container } = render(<CollectionIcon icon={mockIcon} size={80} />);
    const iconElement = container.firstChild as HTMLElement;
    
    expect(iconElement).toHaveStyle({
      width: '80px',
      height: '80px'
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <CollectionIcon icon={mockIcon} className="custom-class" />
    );
    const iconElement = container.firstChild as HTMLElement;
    
    expect(iconElement).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    const { container } = render(<CollectionIcon icon={mockIcon} />);
    const iconElement = container.firstChild as HTMLElement;
    
    expect(iconElement).toHaveAttribute('role', 'img');
    expect(iconElement).toHaveAttribute('aria-label', 'Collection icon: 🚀');
    expect(iconElement).toHaveAttribute('title', 'Collection icon: 🚀');
  });

  it('adjusts font size for emoji vs text', () => {
    // Test emoji font size (50% of container)
    const emojiIcon: CollectionIconData = {
      character: '🌟',
      backgroundColor: 'purple',
      textColor: 'white'
    };
    
    const { container: emojiContainer } = render(
      <CollectionIcon icon={emojiIcon} size={64} />
    );
    const emojiElement = emojiContainer.firstChild as HTMLElement;
    expect(emojiElement).toHaveStyle({ fontSize: '32px' }); // 50% of 64px
    
    // Test text font size (40% of container)
    const textIcon: CollectionIconData = {
      character: 'T',
      backgroundColor: 'green',
      textColor: 'white'
    };
    
    const { container: textContainer } = render(
      <CollectionIcon icon={textIcon} size={64} />
    );
    const textElement = textContainer.firstChild as HTMLElement;
    expect(textElement).toHaveStyle({ fontSize: '25px' }); // 40% of 64px (floor)
  });
});