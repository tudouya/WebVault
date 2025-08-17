import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WebsiteDetailData } from "../types/detail";

interface WebsiteDetailContentProps {
  /** Website detail data */
  website: WebsiteDetailData;
  /** Additional CSS classes */
  className?: string;
}

/**
 * WebsiteDetailContent Component
 * 
 * 网站详情页面的内容区域组件，用于展示：
 * - 网站的详细介绍内容
 * - 网站的扩展描述信息
 * - 网站的功能特性列表
 * 
 * Features:
 * - 响应式设计，支持移动端和桌面端
 * - 优雅的内容为空处理
 * - 语义化HTML结构和ARIA标签
 * - 与现有设计系统保持一致
 * - 支持长文本内容的良好排版
 * 
 * @example
 * ```tsx
 * <WebsiteDetailContent 
 *   website={websiteData}
 *   className="mt-6"
 * />
 * ```
 */
const WebsiteDetailContent = React.memo(function WebsiteDetailContent({
  website,
  className
}: WebsiteDetailContentProps) {
  // 检查是否有任何内容需要显示
  const hasContent = website.content || website.features?.length;
  
  // 如果没有内容，不渲染组件
  if (!hasContent) {
    return null;
  }

  return (
    <article 
      className={cn("space-y-6", className)} 
      role="main" 
      aria-label="网站详细内容"
      itemScope 
      itemType="https://schema.org/WebSite"
    >
      {/* 详细描述内容 */}
      {website.content && (
        <Card 
          role="region"
          aria-labelledby="about-heading"
        >
          <CardHeader>
            <CardTitle 
              id="about-heading"
              className="text-lg font-semibold"
              role="heading"
              aria-level={2}
            >
              关于 {website.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className={cn(
                "prose prose-sm max-w-none",
                "text-foreground",
                "prose-headings:text-foreground",
                "prose-p:text-muted-foreground prose-p:leading-relaxed",
                "prose-strong:text-foreground",
                "prose-em:text-foreground",
                "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
                "prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
                "prose-pre:bg-muted prose-pre:border",
                "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
                "prose-ul:text-muted-foreground prose-ol:text-muted-foreground",
                "prose-li:text-muted-foreground"
              )}
              dangerouslySetInnerHTML={{ 
                __html: website.content.replace(/\n/g, '<br />') 
              }}
              aria-label="Website detailed description"
            />
          </CardContent>
        </Card>
      )}

      {/* 功能特性列表 */}
      {website.features && website.features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul 
              className="space-y-2"
              role="list"
              aria-label="Website key features"
            >
              {website.features.map((feature, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2 text-muted-foreground"
                  role="listitem"
                >
                  <span 
                    className="inline-block w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 定价信息 */}
      {website.pricing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Pricing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* 免费/付费状态 */}
              <div className="flex items-center gap-2">
                <span 
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    website.pricing.is_free
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                  )}
                  role="status"
                  aria-label={website.pricing.is_free ? "Free service" : "Paid service"}
                >
                  {website.pricing.is_free ? "Free" : "Paid"}
                </span>
                
                {website.pricing.has_paid_plans && (
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200"
                    role="status"
                    aria-label="Has premium plans"
                  >
                    Premium Plans Available
                  </span>
                )}
              </div>

              {/* 起始价格 */}
              {website.pricing.starting_price && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Starting from: </span>
                  <span className="text-foreground font-semibold">
                    {website.pricing.starting_price}
                    {website.pricing.currency && ` ${website.pricing.currency}`}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 替代URL信息 */}
      {website.alternative_urls && website.alternative_urls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Alternative URLs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                This website is also available at the following URLs:
              </p>
              <ul 
                className="space-y-1"
                role="list"
                aria-label="Alternative website URLs"
              >
                {website.alternative_urls.map((url, index) => (
                  <li key={index} role="listitem">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                      aria-label={`Alternative URL: ${url}`}
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </article>
  );
});

export { WebsiteDetailContent };
export default WebsiteDetailContent;