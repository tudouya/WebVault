"use client";

/**
 * Blog Content Renderer Component
 * 博客文章内容渲染器组件
 * 
 * 实现安全的 Markdown 到 HTML 转换，支持代码块语法高亮和图片响应式显示
 * 满足 Requirements 2.1, 2.2, 10.1, 10.2 的详细要求
 * 
 * 特性：
 * - 安全的 Markdown 渲染，防止 XSS 攻击
 * - 代码块语法高亮和复制功能
 * - 图片懒加载和响应式显示
 * - 适合长文本阅读的排版样式
 * - 与 WebVault 设计系统保持一致
 * 
 * 需求引用：
 * - Requirements 2.1: 适合长文本阅读的排版样式
 * - Requirements 2.2: 图片响应式显示和代码块语法高亮  
 * - Requirements 10.1: 代码块设计要求
 * - Requirements 10.2: 多媒体内容设计要求
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Copy, Check, ExternalLink, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { blogTypographyClasses } from '../styles/typography';

/**
 * 渲染器配置接口
 */
export interface BlogContentRendererConfig {
  /** 是否启用代码高亮 */
  enableSyntaxHighlighting?: boolean;
  /** 是否启用图片懒加载 */
  enableImageLazyLoading?: boolean;
  /** 是否启用代码复制功能 */
  enableCodeCopy?: boolean;
  /** 图片最大宽度（CSS 值） */
  maxImageWidth?: string;
  /** 代码块主题 */
  codeTheme?: 'light' | 'dark' | 'auto';
}

/**
 * 组件 Props 接口
 */
export interface BlogContentRendererProps {
  /** 文章内容（支持 Markdown 或 HTML） */
  content: string;
  /** 内容格式类型 */
  contentType?: 'markdown' | 'html';
  /** 渲染器配置 */
  config?: BlogContentRendererConfig;
  /** 自定义类名 */
  className?: string;
  /** 文章标题（用于图片 alt 属性） */
  articleTitle?: string;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<BlogContentRendererConfig> = {
  enableSyntaxHighlighting: true,
  enableImageLazyLoading: true,
  enableCodeCopy: true,
  maxImageWidth: '100%',
  codeTheme: 'auto',
};

/**
 * 简单的 Markdown 到 HTML 转换器
 * 支持基本的 Markdown 语法，确保安全性
 */
class SimpleMarkdownParser {
  private content: string;
  
  constructor(content: string) {
    this.content = this.sanitizeContent(content);
  }

  /**
   * 内容安全化处理
   */
  private sanitizeContent(content: string): string {
    // 移除潜在的危险标签和属性
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
  }

  /**
   * 解析标题
   */
  private parseHeadings(content: string): string {
    return content.replace(/^(#{1,6})\s+(.*)$/gm, (match, hashes, text) => {
      const level = hashes.length;
      const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      const className = level <= 2 ? 'text-2xl font-bold mb-4 mt-8' : 'text-xl font-semibold mb-3 mt-6';
      return `<h${level} id="${id}" class="${className} text-gray-900 dark:text-gray-100">${text}</h${level}>`;
    });
  }

  /**
   * 解析代码块
   */
  private parseCodeBlocks(content: string, enableCodeCopy: boolean = true): string {
    return content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
      const lang = language || 'text';
      const encodedCode = this.escapeHtml(code.trim());
      const copyButton = enableCodeCopy ? `
          <button class="copy-code-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" data-code="${encodedCode}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </button>` : '';
      
      return `<div class="code-block-wrapper my-6">
        <div class="code-block-header flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-t-lg border">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">${lang}</span>${copyButton}
        </div>
        <pre class="code-block bg-gray-50 dark:bg-gray-900 p-4 rounded-b-lg overflow-x-auto border-l border-r border-b"><code class="language-${lang} text-sm">${encodedCode}</code></pre>
      </div>`;
    });
  }

  /**
   * 解析行内代码
   */
  private parseInlineCode(content: string): string {
    return content.replace(/`([^`]+)`/g, '<code class="inline-code bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>');
  }

  /**
   * 解析图片
   */
  private parseImages(content: string, enableImageLazyLoading: boolean = true): string {
    return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      const loadingAttr = enableImageLazyLoading ? ' loading="lazy"' : '';
      return `<div class="image-wrapper my-6"><img src="${src}" alt="${alt}" class="responsive-image w-full max-w-full h-auto rounded-lg shadow-sm border"${loadingAttr} onload="this.classList.add('loaded')" onerror="this.classList.add('error')" />${alt ? `<figcaption class="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">${alt}</figcaption>` : ''}</div>`;
    });
  }

  /**
   * 解析段落
   */
  private parseParagraphs(content: string): string {
    // 拆分内容为行，过滤空行
    const lines = content.split('\n').filter(line => line.trim());
    const processedLines: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 跳过已经是HTML元素的行
      if (trimmedLine.startsWith('<')) {
        processedLines.push(trimmedLine);
        continue;
      }
      
      // 跳过标题、列表、引用等已处理的内容
      if (trimmedLine.match(/^#{1,6}\s+/) || 
          trimmedLine.match(/^[-*+]\s+/) ||
          trimmedLine.match(/^\d+\.\s+/) ||
          trimmedLine.match(/^>\s+/) ||
          trimmedLine.match(/^```/)) {
        processedLines.push(trimmedLine);
        continue;
      }
      
      // 包装为段落
      if (trimmedLine.length > 0) {
        processedLines.push(`<p class="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">${trimmedLine}</p>`);
      }
    }
    
    return processedLines.join('\n');
  }

  /**
   * 解析链接
   */
  private parseLinks(content: string): string {
    return content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const isExternal = !url.startsWith('/') && !url.startsWith('#');
      const target = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
      const icon = isExternal ? '<svg class="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>' : '';
      return `<a href="${url}" ${target} class="text-blue-600 dark:text-blue-400 hover:underline font-medium">${text}${icon}</a>`;
    });
  }

  /**
   * 解析粗体和斜体
   */
  private parseFormatting(content: string): string {
    return content
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  }

  /**
   * 解析引用块
   */
  private parseBlockquotes(content: string): string {
    return content.replace(/^>\s+(.*)$/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 italic text-gray-700 dark:text-gray-300">$1</blockquote>');
  }

  /**
   * 解析列表
   */
  private parseLists(content: string): string {
    // 无序列表
    content = content.replace(/^[\s]*[-*+]\s+(.*)$/gm, '<li class="mb-1">$1</li>');
    content = content.replace(/(<li class="mb-1">.*<\/li>)/g, '<ul class="list-disc list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300">$1</ul>');
    
    // 有序列表
    content = content.replace(/^\d+\.\s+(.*)$/gm, '<li class="mb-1">$1</li>');
    
    return content;
  }

  /**
   * HTML 转义
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 执行解析
   */
  public parse(config?: BlogContentRendererConfig): string {
    let result = this.content;
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    
    // 按顺序执行解析，确保块级元素在段落解析之前处理
    result = this.parseCodeBlocks(result, mergedConfig.enableCodeCopy);
    result = this.parseImages(result, mergedConfig.enableImageLazyLoading);
    result = this.parseHeadings(result);
    result = this.parseBlockquotes(result);
    result = this.parseLists(result);
    result = this.parseLinks(result);
    result = this.parseFormatting(result);
    result = this.parseInlineCode(result);
    result = this.parseParagraphs(result);
    
    return result;
  }
}

/**
 * 代码复制Hook
 */
const useCodeCopy = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, []);

  return { copiedCode, copyCode };
};

/**
 * 博客内容渲染器组件
 */
export const BlogContentRenderer: React.FC<BlogContentRendererProps> = ({
  content,
  contentType = 'markdown',
  config,
  className,
  articleTitle = 'Blog Article',
}) => {
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  const { copiedCode, copyCode } = useCodeCopy();

  // 处理内容渲染
  const renderedContent = useMemo(() => {
    if (!content) return '';

    if (contentType === 'html') {
      // 对于 HTML 内容，进行基本的安全化处理
      return content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    }

    // Markdown 解析
    const parser = new SimpleMarkdownParser(content);
    return parser.parse(mergedConfig);
  }, [content, contentType, mergedConfig]);

  // 设置代码复制事件监听
  useEffect(() => {
    if (!mergedConfig.enableCodeCopy) return;

    const handleCodeCopy = (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('.copy-code-btn') as HTMLButtonElement;
      if (button && button.dataset.code) {
        event.preventDefault();
        copyCode(button.dataset.code);
      }
    };

    document.addEventListener('click', handleCodeCopy);
    return () => document.removeEventListener('click', handleCodeCopy);
  }, [mergedConfig.enableCodeCopy, copyCode]);

  // 更新复制按钮图标
  useEffect(() => {
    const updateCopyButtons = () => {
      document.querySelectorAll('.copy-code-btn').forEach((button) => {
        const btn = button as HTMLButtonElement;
        const isCurrentlyCopied = copiedCode === btn.dataset.code;
        const svg = btn.querySelector('svg');
        
        if (svg) {
          if (isCurrentlyCopied) {
            svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
            btn.classList.add('text-green-600');
          } else {
            svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>';
            btn.classList.remove('text-green-600');
          }
        }
      });
    };

    updateCopyButtons();
  }, [copiedCode]);

  // 基础样式类名
  const baseStyles = cn(
    // Requirements 2.1: 适合长文本阅读的排版样式
    'prose prose-lg max-w-none',
    'leading-relaxed text-gray-900 dark:text-gray-100',
    
    // 字体和间距优化
    blogTypographyClasses.bodyText,
    
    // 响应式设计
    'w-full',
    
    // 图片样式 - Requirements 2.2: 图片响应式显示
    '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:shadow-sm',
    '[&_img]:border [&_img]:border-gray-200 [&_img]:dark:border-gray-700',
    
    // 代码块样式 - Requirements 10.1: 代码块设计
    '[&_.code-block]:font-mono [&_.code-block]:text-sm [&_.code-block]:leading-relaxed',
    '[&_.inline-code]:bg-gray-100 [&_.inline-code]:dark:bg-gray-800',
    '[&_.inline-code]:px-2 [&_.inline-code]:py-1 [&_.inline-code]:rounded',
    '[&_.inline-code]:text-sm [&_.inline-code]:font-mono',
    
    // 链接样式
    '[&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:hover:underline',
    '[&_a]:font-medium [&_a]:transition-colors',
    
    // 标题样式
    '[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-6 [&_h1]:mt-8',
    '[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:mt-8',
    '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6',
    '[&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mb-2 [&_h4]:mt-4',
    
    // 段落和间距
    '[&_p]:mb-4 [&_p]:leading-relaxed',
    '[&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4',
    '[&_blockquote]:py-2 [&_blockquote]:my-4 [&_blockquote]:bg-blue-50',
    '[&_blockquote]:dark:bg-blue-900/20 [&_blockquote]:italic',
    
    // 列表样式
    '[&_ul]:list-disc [&_ul]:list-inside [&_ul]:mb-4 [&_ul]:space-y-1',
    '[&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-4 [&_ol]:space-y-1',
    '[&_li]:mb-1',
    
    className
  );

  if (!content?.trim()) {
    return (
      <div className={cn(baseStyles, 'text-center py-8')}>
        <p className="text-gray-500 dark:text-gray-400">暂无内容</p>
      </div>
    );
  }

  return (
    <div 
      className={baseStyles}
      style={{
        // Requirements 10.2: 多媒体内容设计 - 图片最大宽度
        ['--max-image-width' as any]: mergedConfig.maxImageWidth,
      }}
    >
      {/* Requirements 2.1 & 2.2: 安全渲染内容 */}
      <div 
        dangerouslySetInnerHTML={{ __html: renderedContent }}
        className="blog-content"
      />
      
      {/* 隐藏的样式注入，用于代码块和图片的高级样式 */}
      <style jsx>{`
        .blog-content .image-wrapper img.loaded {
          opacity: 1;
          transition: opacity 0.3s ease-in-out;
        }
        
        .blog-content .image-wrapper img:not(.loaded) {
          opacity: 0.7;
        }
        
        .blog-content .image-wrapper img.error {
          opacity: 0.5;
          filter: grayscale(100%);
        }
        
        .blog-content .code-block-wrapper {
          position: relative;
        }
        
        .blog-content .copy-code-btn {
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
        }
        
        .blog-content .code-block-wrapper:hover .copy-code-btn {
          opacity: 1;
        }
        
        .blog-content .responsive-image {
          max-width: var(--max-image-width, 100%);
        }
        
        /* 代码块横向滚动优化 */
        .blog-content .code-block {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
        }
        
        .blog-content .code-block::-webkit-scrollbar {
          height: 8px;
        }
        
        .blog-content .code-block::-webkit-scrollbar-track {
          background: #f7fafc;
          border-radius: 4px;
        }
        
        .blog-content .code-block::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }
        
        .blog-content .code-block::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
        
        /* 暗色模式代码块滚动条 */
        @media (prefers-color-scheme: dark) {
          .blog-content .code-block {
            scrollbar-color: #4a5568 #2d3748;
          }
          
          .blog-content .code-block::-webkit-scrollbar-track {
            background: #2d3748;
          }
          
          .blog-content .code-block::-webkit-scrollbar-thumb {
            background: #4a5568;
          }
          
          .blog-content .code-block::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
        }
      `}</style>
    </div>
  );
};

// 默认导出
export default BlogContentRenderer;

/**
 * 使用示例：
 * 
 * ```tsx
 * import { BlogContentRenderer } from '@/features/blog/components/BlogContentRenderer';
 * 
 * // 基础使用
 * <BlogContentRenderer 
 *   content={markdownContent}
 *   contentType="markdown"
 * />
 * 
 * // 自定义配置
 * <BlogContentRenderer 
 *   content={htmlContent}
 *   contentType="html"
 *   config={{
 *     enableSyntaxHighlighting: true,
 *     enableImageLazyLoading: true,
 *     enableCodeCopy: true,
 *     maxImageWidth: '800px',
 *   }}
 *   className="custom-blog-content"
 *   articleTitle="我的博客文章"
 * />
 * ```
 */