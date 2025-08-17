import React from "react";
import { cn } from "@/lib/utils";
import type { Category } from "../types/category";

interface CategoryTagProps {
  /** Category information */
  category: Category;
  /** Additional CSS classes */
  className?: string;
  /** Click handler for category navigation */
  onClick?: (category: Category) => void;
  /** Whether the category is currently selected */
  selected?: boolean;
  /** Display variant */
  variant?: "default" | "outline" | "secondary";
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * CategoryTag Component
 * 
 * Displays a category as a clickable tag with appropriate styling.
 * Used in website detail pages and other contexts where categories need to be shown.
 * 
 * Features:
 * - Category color theming (if defined)
 * - Click handling for navigation
 * - Multiple size and variant options
 * - Accessible design with keyboard support
 * 
 * @param props - CategoryTag properties
 */
export function CategoryTag({
  category,
  className,
  onClick,
  selected = false,
  variant = "default",
  size = "md"
}: CategoryTagProps) {
  const handleClick = () => {
    onClick?.(category);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleClick();
    }
  };

  // Build the class names based on variant, size, and state
  const baseClasses = "inline-flex items-center font-medium transition-all duration-200 rounded-md";
  
  const variantClasses = {
    default: selected 
      ? "bg-primary text-primary-foreground shadow-sm"
      : "bg-primary/10 text-primary hover:bg-primary/20",
    outline: selected
      ? "border-2 border-primary bg-primary text-primary-foreground"
      : "border border-border text-foreground hover:border-primary/50 hover:bg-primary/5",
    secondary: selected
      ? "bg-secondary text-secondary-foreground shadow-sm"
      : "bg-secondary/50 text-secondary-foreground hover:bg-secondary/80"
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
  };

  const interactiveClasses = onClick 
    ? "cursor-pointer hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1"
    : "";

  // Apply category color if available and variant is default
  const categoryColorStyle = category.color && variant === "default" && !selected
    ? {
        backgroundColor: `${category.color}15`, // 15% opacity
        color: category.color,
        '--category-hover-bg': `${category.color}25` // 25% opacity for hover
      } as React.CSSProperties & { '--category-hover-bg': string }
    : undefined;

  const categoryColorHoverClass = category.color && variant === "default" && !selected
    ? "[&:hover]:bg-[var(--category-hover-bg)]"
    : "";

  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        interactiveClasses,
        categoryColorHoverClass,
        "category-tag",
        className
      )}
      style={categoryColorStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Navigate to ${category.name} category` : undefined}
    >
      {category.name}
    </span>
  );
}

export default CategoryTag;