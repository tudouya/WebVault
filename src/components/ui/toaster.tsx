'use client'

/**
 * Toaster Component - Toast Notifications
 * 
 * Based on Sonner toast library, providing unified notification system for the application.
 * Integrates with the existing shadcn/ui design system and supports dark/light themes.
 * 
 * @version 1.0.0
 * @created 2025-08-18
 */

import { Toaster as Sonner } from 'sonner';
import { useTheme } from 'next-themes';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Application Toaster Component
 * 
 * Provides consistent toast notifications across the application.
 * Automatically adapts to the current theme (dark/light).
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };