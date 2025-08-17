import React from "react";
import { CalendarDays, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { PublisherInfo } from "../types/detail";

interface PublisherCardProps {
  /** Publisher information */
  publisher?: PublisherInfo | null;
  /** Date when the website was published */
  publishedDate: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show publisher bio information */
  showBio?: boolean;
}

/**
 * PublisherCard Component
 * 
 * Displays publisher information including avatar, name, publication date,
 * and optional bio. Handles graceful fallbacks for missing data.
 * 
 * Features:
 * - Publisher avatar with fallback to default avatar
 * - Publisher name with fallback to "WebVault"
 * - Publication date display
 * - Optional bio information
 * - Accessible design with proper ARIA labels
 * 
 * @param props - PublisherCard properties
 */
const PublisherCard = React.memo(function PublisherCard({
  publisher,
  publishedDate,
  className,
  showBio = true
}: PublisherCardProps) {
  // Fallback data for when publisher information is missing
  const displayName = publisher?.name || "WebVault";
  const displayBio = publisher?.bio;
  const avatarUrl = publisher?.avatar_url;
  
  // Generate initials for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format publication date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card 
      className={cn("publisher-card", className)} 
      role="region" 
      aria-labelledby="publisher-heading"
      aria-describedby="publisher-description"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Publisher Avatar */}
          <Avatar 
            className="h-12 w-12"
            role="img"
            aria-labelledby="publisher-heading"
          >
            {avatarUrl && (
              <AvatarImage
                src={avatarUrl}
                alt={`${displayName} 的头像`}
                className="object-cover"
              />
            )}
            <AvatarFallback 
              className="bg-primary/10 text-primary font-medium"
              aria-label={publisher ? `${displayName} 的首字母缩写` : "默认用户头像"}
            >
              {publisher ? (
                getInitials(displayName)
              ) : (
                <User className="h-6 w-6" aria-hidden="true" />
              )}
            </AvatarFallback>
          </Avatar>

          {/* Publisher Information */}
          <div className="flex-1 min-w-0">
            {/* Publisher Name */}
            <div className="flex items-center gap-2 mb-1">
              <h3 
                id="publisher-heading"
                className="font-semibold text-base text-foreground truncate"
                role="heading"
                aria-level={3}
              >
                {displayName}
              </h3>
              {!publisher && (
                <span 
                  className="inline-flex items-center px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-md"
                  role="status"
                  aria-label="默认发布者"
                >
                  默认
                </span>
              )}
            </div>

            {/* Publication Date */}
            <div 
              className="flex items-center gap-2 text-sm text-muted-foreground mb-2"
              role="group"
              aria-label="发布时间信息"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              <time 
                dateTime={publishedDate}
                aria-label={`发布时间: ${formatDate(publishedDate)}`}
              >
                发布于 {formatDate(publishedDate)}
              </time>
            </div>

            {/* Publisher Bio (Optional) */}
            {showBio && displayBio && (
              <p 
                id="publisher-description"
                className="text-sm text-muted-foreground line-clamp-2 leading-relaxed"
                role="text"
                aria-label="发布者简介"
              >
                {displayBio}
              </p>
            )}

            {/* Publisher Stats (if available) */}
            {publisher?.published_count && (
              <div 
                className="mt-2 text-xs text-muted-foreground"
                role="status"
                aria-label={`已发布 ${publisher.published_count} 个网站`}
              >
                已发布 {publisher.published_count} 个{publisher.published_count === 1 ? '网站' : '网站'}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export { PublisherCard };
export default PublisherCard;