# Blog Stores 使用指南

## 概述

博客功能模块包含两个主要的状态管理store：

1. **`blog-store.ts`** - 博客列表页面状态管理
2. **`blogDetailStore.ts`** - 博客详情页面状态管理

## blogDetailStore 使用示例

### 基础使用

```tsx
import { 
  useBlogDetailStore,
  useBlogPostContent,
  useBlogRelatedPosts,
  useBlogReadingProgress,
  useBlogUserInteractions,
  useBlogTableOfContents,
  useBlogUIState,
  useBlogDetailUrlSync
} from '@/features/blog/stores';

// 在博客详情页面组件中
function BlogDetailPage({ slug }: { slug: string }) {
  // 1. 文章内容管理
  const { 
    currentPost, 
    isLoading, 
    error, 
    loadPost 
  } = useBlogPostContent();

  // 2. 相关文章推荐
  const { 
    relatedPosts, 
    isLoading: isLoadingRelated,
    loadRelatedPosts 
  } = useBlogRelatedPosts();

  // 3. 阅读进度跟踪
  const { 
    percentage, 
    currentSection,
    updateProgress,
    startTimer 
  } = useBlogReadingProgress();

  // 4. 用户交互
  const { 
    hasLiked, 
    hasBookmarked,
    toggleLike,
    toggleBookmark,
    sharePost 
  } = useBlogUserInteractions();

  // 5. 目录导航
  const { 
    tableOfContents,
    activeHeading,
    setActiveHeading 
  } = useBlogTableOfContents();

  // 6. UI状态管理
  const { 
    isFullscreen,
    showProgressBar,
    toggleFullscreen 
  } = useBlogUIState();

  // 7. URL状态同步
  const { syncStoreFromUrl, syncUrlFromStore } = useBlogDetailUrlSync();

  // 页面初始化
  useEffect(() => {
    // 同步URL状态到store
    syncStoreFromUrl();
    
    // 加载文章内容
    loadPost(slug);
    
    // 开始阅读计时
    startTimer();
  }, [slug]);

  // 处理滚动事件更新阅读进度
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      updateProgress({ percentage: scrollPercent });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [updateProgress]);

  if (isLoading) return <BlogDetailSkeleton />;
  if (error) return <BlogDetailError error={error} />;
  if (!currentPost) return <BlogNotFound />;

  return (
    <div className="blog-detail-page">
      {/* 阅读进度条 */}
      {showProgressBar && (
        <div className="reading-progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${percentage}%` }} 
          />
        </div>
      )}

      {/* 文章内容 */}
      <article className={isFullscreen ? 'fullscreen' : ''}>
        <BlogDetailHeader post={currentPost} />
        <BlogDetailContent post={currentPost} />
        
        {/* 用户交互按钮 */}
        <div className="post-actions">
          <button onClick={toggleLike} className={hasLiked ? 'liked' : ''}>
            {hasLiked ? '已点赞' : '点赞'} ({currentPost.likeCount})
          </button>
          <button onClick={toggleBookmark} className={hasBookmarked ? 'bookmarked' : ''}>
            {hasBookmarked ? '已收藏' : '收藏'}
          </button>
          <button onClick={() => sharePost('twitter')}>
            分享到 Twitter
          </button>
        </div>
      </article>

      {/* 目录导航 */}
      {tableOfContents.length > 0 && (
        <TableOfContents
          items={tableOfContents}
          activeHeading={activeHeading}
          onHeadingClick={setActiveHeading}
        />
      )}

      {/* 相关文章推荐 */}
      <RelatedPosts
        posts={relatedPosts}
        isLoading={isLoadingRelated}
      />

      {/* 全屏切换按钮 */}
      <button 
        onClick={toggleFullscreen}
        className="fullscreen-toggle"
      >
        {isFullscreen ? '退出全屏' : '全屏阅读'}
      </button>
    </div>
  );
}
```

### 高级功能

#### 相关文章推荐配置

```tsx
import { useBlogRelatedPosts } from '@/features/blog/stores';

function BlogDetailPage() {
  const { setConfig, loadRelatedPosts } = useBlogRelatedPosts();

  // 自定义推荐策略
  const handleChangeStrategy = (strategy: 'category' | 'tags' | 'mixed') => {
    setConfig({ 
      strategy,
      limit: 6,
      minSimilarityScore: 0.3 
    });
    
    // 重新加载相关文章
    if (currentPost?.id) {
      loadRelatedPosts(currentPost.id);
    }
  };
}
```

#### 阅读进度高级跟踪

```tsx
import { useBlogReadingProgress } from '@/features/blog/stores';

function BlogDetailPage() {
  const { 
    percentage,
    totalReadingTime,
    estimatedTimeLeft,
    updateProgress 
  } = useBlogReadingProgress();

  // 监听滚动位置，更新当前阅读章节
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            updateProgress({ 
              currentSection: sectionId,
              estimatedTimeLeft: calculateRemainingTime(percentage)
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    // 观察所有标题元素
    document.querySelectorAll('h1, h2, h3').forEach((heading) => {
      observer.observe(heading);
    });

    return () => observer.disconnect();
  }, [updateProgress]);
}
```

#### 分享状态跟踪

```tsx
import { useBlogUserInteractions } from '@/features/blog/stores';

function ShareButtons() {
  const { shareState, recordShare, sharePost } = useBlogUserInteractions();

  const handleShare = async (platform: string) => {
    // 执行分享操作
    await sharePost(platform);
    
    // 记录分享事件（已自动调用 recordShare）
    console.log('分享统计:', {
      platform,
      totalShares: shareState.shareCount,
      sharedPlatforms: shareState.sharedPlatforms
    });
  };

  return (
    <div className="share-buttons">
      {shareState.hasShared && (
        <p>感谢分享！你已经分享过 {shareState.shareCount} 次</p>
      )}
      
      <button onClick={() => handleShare('twitter')}>
        分享到 Twitter 
        {shareState.sharedPlatforms.includes('twitter') && ' ✓'}
      </button>
    </div>
  );
}
```

## 最佳实践

### 1. 组件职责分离

```tsx
// ✅ 好的做法 - 使用专门的hooks
function BlogArticle() {
  const { currentPost } = useBlogPostContent();
  // 只处理文章展示逻辑
}

function BlogSidebar() {
  const { tableOfContents, activeHeading } = useBlogTableOfContents();
  // 只处理目录导航逻辑
}

// ❌ 避免的做法 - 在一个组件中使用所有store
function BlogDetailPage() {
  const store = useBlogDetailStore(); // 获取所有状态
  // 组件变得臃肿且难以维护
}
```

### 2. 状态同步

```tsx
// 在页面级组件中处理URL状态同步
function BlogDetailLayout() {
  const { syncStoreFromUrl, syncUrlFromStore } = useBlogDetailUrlSync();

  // 页面加载时从URL同步状态
  useEffect(() => {
    syncStoreFromUrl();
  }, []);

  // 状态变化时同步到URL
  useEffect(() => {
    syncUrlFromStore();
  }, [/* 依赖的状态 */]);
}
```

### 3. 错误处理

```tsx
function BlogDetailPage() {
  const { error, retryLoad, setError } = useBlogPostContent();

  const handleRetry = () => {
    setError(null);
    retryLoad();
  };

  if (error) {
    return (
      <BlogErrorBoundary 
        error={error} 
        onRetry={handleRetry}
      />
    );
  }
}
```

### 4. 性能优化

```tsx
// 使用 React.memo 优化相关文章组件
const RelatedPosts = React.memo(function RelatedPosts() {
  const { relatedPosts } = useBlogRelatedPosts();
  
  return (
    <div className="related-posts">
      {relatedPosts.map(post => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  );
});

// 使用 useCallback 优化事件处理函数
function BlogDetailActions() {
  const { toggleLike, toggleBookmark } = useBlogUserInteractions();

  const handleLike = useCallback(() => {
    toggleLike();
  }, [toggleLike]);

  const handleBookmark = useCallback(() => {
    toggleBookmark();
  }, [toggleBookmark]);
}
```

## 状态持久化

store会自动持久化以下用户偏好设置到 sessionStorage：

- `showTableOfContents` - 目录显示状态
- `showProgressBar` - 进度条显示状态  
- `relatedPostsConfig` - 相关文章推荐配置

其他状态（如阅读进度、分享状态等）在页面刷新后会重置，这是有意的设计，以确保每次访问都有新的阅读体验。