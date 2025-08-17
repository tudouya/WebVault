import React from "react";
import { Calendar, Globe, TrendingUp, Eye, Clock, Shield, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WebsiteDetailData } from "../types/detail";
import { PublisherCard } from "./PublisherCard";
import { TagPill } from "./TagPill";
import { CategoryTag } from "./CategoryTag";

interface WebsiteDetailInfoProps {
  /** Website detail data */
  website: WebsiteDetailData;
  /** Additional CSS classes */
  className?: string;
  /** Tag click handler */
  onTagClick?: (tag: string) => void;
  /** Category click handler */
  onCategoryClick?: (category: any) => void;
}

/**
 * WebsiteDetailInfo Component
 * 
 * Displays comprehensive website information in a sidebar layout.
 * Includes publisher information, website metadata, categories, tags, and statistics.
 * 
 * Features:
 * - Publisher information card with avatar and bio
 * - Website basic information (category, language, accessibility)
 * - Tags with click-to-filter functionality
 * - Visit statistics and metrics
 * - Responsive design with sticky positioning
 * - Graceful handling of missing data
 * 
 * Requirements fulfilled:
 * - AC-2.3.1: Displays publisher name and publication date
 * - AC-2.2.3: Shows clickable tags when available
 * 
 * @param props - WebsiteDetailInfo properties
 */
function WebsiteDetailInfo({
  website,
  className,
  onTagClick,
  onCategoryClick
}: WebsiteDetailInfoProps) {
  // Format date helper
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Format number helper
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <aside 
      className={cn("space-y-6", className)}
      role="complementary"
      aria-label="网站详细信息侧边栏"
    >
      {/* Publisher Information Card */}
      <PublisherCard
        publisher={website.publisher}
        publishedDate={website.created_at}
        showBio={true}
        className="sticky top-6"
      />

      {/* Website Information Card */}
      <Card 
        className="website-info-card"
        role="region"
        aria-labelledby="website-info-heading"
      >
        <CardHeader className="pb-3">
          <CardTitle 
            id="website-info-heading"
            className="text-lg flex items-center gap-2"
            role="heading"
            aria-level={2}
          >
            <Globe className="h-5 w-5" aria-hidden="true" />
            网站信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category */}
          {website.category && (
            <div role="group" aria-labelledby="category-label">
              <h4 
                id="category-label"
                className="text-sm font-medium text-muted-foreground mb-2"
                role="heading"
                aria-level={3}
              >
                分类
              </h4>
              <CategoryTag
                category={website.category}
                onClick={onCategoryClick}
                variant="secondary"
                size="md"
                aria-describedby="category-label"
              />
            </div>
          )}

          {/* Language */}
          {website.language && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Language</h4>
              <span className="text-sm text-foreground">{website.language}</span>
            </div>
          )}

          {/* Status */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                website.is_accessible ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm text-foreground">
                {website.is_accessible ? "Accessible" : "Not Accessible"}
              </span>
            </div>
          </div>

          {/* Last Checked */}
          {website.last_checked_at && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Last Checked</h4>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Shield className="h-4 w-4" />
                {formatDate(website.last_checked_at)}
              </div>
            </div>
          )}

          {/* Popularity Score */}
          {website.popularity_score !== undefined && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Popularity</h4>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-foreground">
                  {website.popularity_score.toFixed(1)}/10
                </span>
              </div>
            </div>
          )}

          {/* Created Date */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Added to WebVault</h4>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Calendar className="h-4 w-4" />
              {formatDate(website.created_at)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags Card */}
      {website.tags && website.tags.length > 0 && (
        <Card 
          className="tags-card"
          role="region"
          aria-labelledby="tags-heading"
        >
          <CardHeader className="pb-3">
            <CardTitle 
              id="tags-heading"
              className="text-lg"
              role="heading"
              aria-level={2}
            >
              标签
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="flex flex-wrap gap-2"
              role="group"
              aria-labelledby="tags-heading"
              aria-label={`网站标签，共 ${website.tags.length} 个`}
            >
              {website.tags.map((tag) => (
                <TagPill
                  key={tag}
                  tag={tag}
                  onClick={onTagClick}
                  size="md"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Card */}
      {website.stats && (
        <Card className="stats-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Visit Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total Visits */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Visits</span>
              </div>
              <span className="text-sm font-medium">
                {formatNumber(website.stats.total_visits)}
              </span>
            </div>

            {/* Monthly Visits */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">This Month</span>
              </div>
              <span className="text-sm font-medium">
                {formatNumber(website.stats.monthly_visits)}
              </span>
            </div>

            {/* Average Session Duration */}
            {website.stats.avg_session_duration !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Avg. Session</span>
                </div>
                <span className="text-sm font-medium">
                  {Math.round(website.stats.avg_session_duration / 60)}m
                </span>
              </div>
            )}

            {/* Bounce Rate */}
            {website.stats.bounce_rate !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Bounce Rate</span>
                </div>
                <span className="text-sm font-medium">
                  {website.stats.bounce_rate.toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Features Card */}
      {website.features && website.features.length > 0 && (
        <Card className="features-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {website.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Pricing Card */}
      {website.pricing && (
        <Card className="pricing-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-md",
                website.pricing.is_free 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
              )}>
                {website.pricing.is_free ? "Free" : "Paid"}
              </span>
              {website.pricing.has_paid_plans && (
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded-md">
                  Premium Plans Available
                </span>
              )}
            </div>
            
            {website.pricing.starting_price && (
              <div className="text-sm">
                <span className="text-muted-foreground">Starting from: </span>
                <span className="font-medium text-foreground">
                  {website.pricing.currency || '$'}{website.pricing.starting_price}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </aside>
  );
}

export { WebsiteDetailInfo };
export default WebsiteDetailInfo;