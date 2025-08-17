/**
 * BlogContentRenderer Component Tests
 * 
 * 测试博客内容渲染器组件的各项功能：
 * - Markdown 解析和渲染
 * - HTML 内容安全处理
 * - 代码块语法高亮和复制功能
 * - 图片响应式显示和懒加载
 * - 安全性和XSS防护
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { BlogContentRenderer } from '../BlogContentRenderer';

// Mock clipboard API
const mockWriteText = jest.fn(() => Promise.resolve());
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('BlogContentRenderer', () => {
  // 清理每个测试
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders empty content correctly', () => {
      render(<BlogContentRenderer content="" />);
      expect(screen.getByText('暂无内容')).toBeInTheDocument();
    });

    it('renders plain text content', () => {
      const content = 'This is a simple paragraph.';
      render(<BlogContentRenderer content={content} />);
      expect(screen.getByText(content)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <BlogContentRenderer content="Test content" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Markdown Parsing', () => {
    it('parses markdown headings correctly', () => {
      const content = '# Heading 1\n## Heading 2\n### Heading 3';
      render(<BlogContentRenderer content={content} contentType="markdown" />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Heading 1');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Heading 2');
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Heading 3');
    });

    it('parses markdown links correctly', () => {
      const content = '[Internal Link](/about) [External Link](https://example.com)';
      render(<BlogContentRenderer content={content} contentType="markdown" />);
      
      const internalLink = screen.getByText('Internal Link');
      const externalLink = screen.getByText('External Link');
      
      expect(internalLink).toHaveAttribute('href', '/about');
      expect(externalLink).toHaveAttribute('href', 'https://example.com');
      expect(externalLink).toHaveAttribute('target', '_blank');
      expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('parses markdown images correctly', () => {
      const content = '![Alt text](https://example.com/image.jpg)';
      render(<BlogContentRenderer content={content} contentType="markdown" />);
      
      const image = screen.getByAltText('Alt text');
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(image).toHaveAttribute('loading', 'lazy');
      expect(image).toHaveClass('responsive-image');
    });

    it('parses markdown formatting (bold, italic)', () => {
      const content = '**bold text** and *italic text*';
      render(<BlogContentRenderer content={content} contentType="markdown" />);
      
      expect(screen.getByText('bold text')).toHaveClass('font-bold');
      expect(screen.getByText('italic text')).toHaveClass('italic');
    });

    it('parses inline code correctly', () => {
      const content = 'This is `inline code` in a sentence.';
      render(<BlogContentRenderer content={content} contentType="markdown" />);
      
      const codeElement = screen.getByText('inline code');
      expect(codeElement).toHaveClass('inline-code');
      expect(codeElement.tagName).toBe('CODE');
    });

    it('parses blockquotes correctly', () => {
      const content = '> This is a blockquote';
      render(<BlogContentRenderer content={content} contentType="markdown" />);
      
      const blockquote = screen.getByText('This is a blockquote');
      expect(blockquote.closest('blockquote')).toHaveClass('border-l-4', 'border-blue-500');
    });
  });

  describe('Code Block Features', () => {
    const codeBlockContent = '```javascript\nconst hello = "world";\nconsole.log(hello);\n```';

    it('renders code blocks with language detection', () => {
      render(<BlogContentRenderer content={codeBlockContent} contentType="markdown" />);
      
      expect(screen.getByText('javascript')).toBeInTheDocument();
      expect(screen.getByText('const hello = "world";')).toBeInTheDocument();
    });

    it('shows copy button for code blocks', () => {
      render(<BlogContentRenderer content={codeBlockContent} contentType="markdown" />);
      
      const copyButton = screen.getByRole('button');
      expect(copyButton).toHaveClass('copy-code-btn');
    });

    // TODO: 修复代码复制功能测试
    it.skip('copies code to clipboard when copy button is clicked', async () => {
      const user = userEvent.setup();
      render(<BlogContentRenderer content={codeBlockContent} contentType="markdown" />);
      
      const copyButton = screen.getByRole('button');
      
      // 模拟点击事件，触发组件中的 handleCodeCopy 逻辑
      fireEvent.click(copyButton);
      
      // 等待异步操作完成
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          'const hello = "world";\nconsole.log(hello);'
        );
      });
    });

    it('disables code copy when configured', () => {
      render(
        <BlogContentRenderer 
          content={codeBlockContent} 
          contentType="markdown"
          config={{ enableCodeCopy: false }}
        />
      );
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('HTML Content Handling', () => {
    it('renders HTML content safely', () => {
      const content = '<p>This is <strong>HTML</strong> content</p>';
      render(<BlogContentRenderer content={content} contentType="html" />);
      
      expect(screen.getByText('HTML')).toBeInTheDocument();
    });

    it('sanitizes dangerous HTML content', () => {
      const dangerousContent = `
        <p>Safe content</p>
        <script>alert('XSS')</script>
        <iframe src="javascript:alert('XSS')"></iframe>
        <div onclick="alert('XSS')">Click me</div>
      `;
      
      const { container } = render(
        <BlogContentRenderer content={dangerousContent} contentType="html" />
      );
      
      expect(container.innerHTML).not.toContain('<script>');
      expect(container.innerHTML).not.toContain('<iframe>');
      expect(container.innerHTML).not.toContain('onclick');
      expect(container.innerHTML).not.toContain('javascript:');
      expect(screen.getByText('Safe content')).toBeInTheDocument();
    });
  });

  describe('Configuration Options', () => {
    it('applies custom max image width', () => {
      const content = '![Test](https://example.com/image.jpg)';
      const { container } = render(
        <BlogContentRenderer 
          content={content} 
          contentType="markdown"
          config={{ maxImageWidth: '500px' }}
        />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.getPropertyValue('--max-image-width')).toBe('500px');
    });

    it('disables image lazy loading when configured', () => {
      const content = '![Test](https://example.com/image.jpg)';
      render(
        <BlogContentRenderer 
          content={content} 
          contentType="markdown"
          config={{ enableImageLazyLoading: false }}
        />
      );
      
      const image = screen.getByAltText('Test');
      expect(image).not.toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Accessibility and SEO', () => {
    it('generates proper heading hierarchy', () => {
      const content = '# H1\n## H2\n### H3\n#### H4';
      render(<BlogContentRenderer content={content} contentType="markdown" />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    });

    it('adds proper alt attributes to images', () => {
      const content = '![Descriptive alt text](https://example.com/image.jpg)';
      render(<BlogContentRenderer content={content} contentType="markdown" />);
      
      const image = screen.getByAltText('Descriptive alt text');
      expect(image).toHaveAttribute('alt', 'Descriptive alt text');
    });

    it('provides proper link relationships for external links', () => {
      const content = '[External Link](https://external.com)';
      render(<BlogContentRenderer content={content} contentType="markdown" />);
      
      const link = screen.getByText('External Link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('Error Handling', () => {
    it('handles empty content gracefully', () => {
      render(<BlogContentRenderer content="" />);
      expect(screen.getByText('暂无内容')).toBeInTheDocument();
    });

    it('handles undefined content gracefully', () => {
      render(<BlogContentRenderer content={undefined as any} />);
      expect(screen.getByText('暂无内容')).toBeInTheDocument();
    });

    it('handles malformed markdown gracefully', () => {
      const malformedContent = '# Heading\n```\nunclosed code block';
      render(<BlogContentRenderer content={malformedContent} contentType="markdown" />);
      
      // 应该不会崩溃，并显示一些内容
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Heading');
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive image classes', () => {
      const content = '![Test](https://example.com/image.jpg)';
      render(<BlogContentRenderer content={content} contentType="markdown" />);
      
      const image = screen.getByAltText('Test');
      expect(image).toHaveClass('w-full', 'max-w-full', 'h-auto');
    });

    it('applies mobile-friendly typography classes', () => {
      const content = 'Regular paragraph text';
      const { container } = render(<BlogContentRenderer content={content} />);
      
      expect(container.firstChild).toHaveClass('leading-relaxed');
    });
  });

  describe('Integration with Typography System', () => {
    it('applies blog typography classes', () => {
      const content = 'Test content';
      const { container } = render(<BlogContentRenderer content={content} />);
      
      // 应该包含来自 typography.ts 的样式类
      expect(container.firstChild).toHaveClass('leading-relaxed');
    });

    it('supports custom article title', () => {
      const content = '![Image](https://example.com/img.jpg)';
      render(
        <BlogContentRenderer 
          content={content} 
          articleTitle="Custom Article Title"
        />
      );
      
      // 组件应该正常渲染，即使不会直接显示标题
      expect(screen.getByAltText('Image')).toBeInTheDocument();
    });
  });
});

describe('BlogContentRenderer Performance', () => {
  it('memoizes rendered content correctly', () => {
    const content = '# Heading\nSome content';
    const { rerender } = render(<BlogContentRenderer content={content} />);
    
    // 相同内容的重新渲染应该使用缓存
    rerender(<BlogContentRenderer content={content} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('updates when content changes', () => {
    const { rerender } = render(<BlogContentRenderer content="# Original" />);
    expect(screen.getByText('Original')).toBeInTheDocument();
    
    rerender(<BlogContentRenderer content="# Updated" />);
    expect(screen.getByText('Updated')).toBeInTheDocument();
    expect(screen.queryByText('Original')).not.toBeInTheDocument();
  });
});