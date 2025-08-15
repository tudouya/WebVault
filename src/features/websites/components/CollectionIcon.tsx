import React from "react";
import { cn } from "@/lib/utils";
import type { CollectionIcon as CollectionIconData } from "../types/collection";

interface CollectionIconProps {
  /** Icon data containing character, background color, and text color */
  icon: CollectionIconData;
  /** Additional CSS classes */
  className?: string;
  /** Custom size override (defaults to 64px) */
  size?: number;
  /** Additional styles */
  style?: React.CSSProperties;
}

/**
 * Theme color mapping for collection icons
 * Provides consistent color palette following WebVault design system
 */
const THEME_COLORS = {
  red: {
    background: 'bg-red-500',
    text: 'text-white',
    hsl: 'hsl(339 90% 51%)', // HSL equivalent for custom colors
  },
  blue: {
    background: 'bg-blue-500', 
    text: 'text-white',
    hsl: 'hsl(221 83% 53%)',
  },
  green: {
    background: 'bg-green-500',
    text: 'text-white', 
    hsl: 'hsl(142 71% 45%)',
  },
  yellow: {
    background: 'bg-yellow-500',
    text: 'text-black',
    hsl: 'hsl(48 96% 53%)',
  },
  purple: {
    background: 'bg-purple-500',
    text: 'text-white',
    hsl: 'hsl(262 83% 58%)',
  },
  orange: {
    background: 'bg-orange-500', 
    text: 'text-white',
    hsl: 'hsl(24 95% 53%)',
  },
  pink: {
    background: 'bg-pink-500',
    text: 'text-white',
    hsl: 'hsl(330 81% 60%)',
  },
  indigo: {
    background: 'bg-indigo-500',
    text: 'text-white', 
    hsl: 'hsl(239 84% 67%)',
  },
  cyan: {
    background: 'bg-cyan-500',
    text: 'text-black',
    hsl: 'hsl(187 85% 53%)',
  },
  teal: {
    background: 'bg-teal-500',
    text: 'text-white',
    hsl: 'hsl(173 80% 40%)',
  },
} as const;

/**
 * Helper function to determine if a color is a theme color key
 */
function isThemeColor(color: string): color is keyof typeof THEME_COLORS {
  return color in THEME_COLORS;
}

/**
 * Helper function to get contrasting text color for custom background colors
 * Uses luminance calculation to determine if text should be light or dark
 */
function getContrastingTextColor(backgroundColor: string): string {
  // For hex colors, calculate luminance
  if (backgroundColor.startsWith('#')) {
    const hex = backgroundColor.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16); 
    const b = parseInt(hex.slice(4, 6), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
  
  // For other color formats, default to white text
  return '#ffffff';
}

/**
 * CollectionIconComponent
 * 
 * Renders a 64px colorful rounded icon for collection display.
 * Supports emoji characters, letters, and custom color schemes.
 * 
 * Features:
 * - Fixed 64px × 64px size (customizable via size prop)
 * - 16px border radius for consistency with card design
 * - Theme color support (red, blue, green, etc.)
 * - Custom color support (hex, rgb, hsl)
 * - Automatic text contrast adjustment  
 * - High-resolution display optimization
 * - Emoji and text character rendering
 * 
 * @example
 * ```tsx
 * // Theme color usage
 * <CollectionIcon icon={{ character: "🚀", backgroundColor: "blue", textColor: "white" }} />
 * 
 * // Custom color usage  
 * <CollectionIcon icon={{ character: "A", backgroundColor: "#ff6b6b", textColor: "#ffffff" }} />
 * 
 * // Emoji with auto contrast
 * <CollectionIcon icon={{ character: "✨", backgroundColor: "#ffd93d", textColor: "auto" }} />
 * ```
 */
const CollectionIconComponent = React.memo(function CollectionIconComponent({ 
  icon, 
  className, 
  size = 64,
  style 
}: CollectionIconProps) {
  const { character, backgroundColor, textColor } = icon;
  
  // Determine background styling
  const isThemeBg = isThemeColor(backgroundColor);
  const backgroundClass = isThemeBg ? THEME_COLORS[backgroundColor].background : '';
  const backgroundStyle = isThemeBg ? undefined : { backgroundColor };
  
  // Determine text color styling  
  let textColorValue: string | undefined;
  let textColorClass = '';
  
  if (textColor === 'auto') {
    // Auto-contrast based on background
    if (isThemeBg) {
      textColorClass = THEME_COLORS[backgroundColor].text;
    } else {
      textColorValue = getContrastingTextColor(backgroundColor);
    }
  } else if (textColor === 'white') {
    textColorClass = 'text-white';
  } else if (textColor === 'black') {
    textColorClass = 'text-black';
  } else if (isThemeColor(textColor)) {
    // Theme color text (rare but supported)
    textColorClass = THEME_COLORS[textColor].text;
  } else {
    // Custom color text
    textColorValue = textColor;
  }
  
  // Calculate font size based on character type
  const isEmoji = /\p{Emoji}/u.test(character);
  const fontSize = isEmoji ? Math.floor(size * 0.5) : Math.floor(size * 0.4);
  
  return (
    <div
      className={cn(
        "flex-shrink-0 flex items-center justify-center rounded-lg font-semibold select-none",
        backgroundClass,
        textColorClass,
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: fontSize,
        lineHeight: 1,
        ...backgroundStyle,
        ...(textColorValue && { color: textColorValue }),
        ...style,
      }}
      role="img"
      aria-label={`Collection icon: ${character}`}
      title={`Collection icon: ${character}`}
    >
      {character}
    </div>
  );
});

export { CollectionIconComponent as CollectionIcon };
export default CollectionIconComponent;