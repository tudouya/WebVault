/**
 * SocialShare 组件简化测试
 * 
 * 测试核心功能和基础渲染
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { SocialShare } from '../SocialShare';

// Mock window.open
const mockWindowOpen = jest.fn();
Object.assign(window, { open: mockWindowOpen });

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined)
  }
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SocialShare - 基础功能', () => {
  const defaultProps = {
    title: '测试文章标题',
    url: 'https://example.com/test-article',
    description: '这是一篇测试文章的描述'
  };

  it('应该正确渲染所有分享按钮', () => {
    render(<SocialShare {...defaultProps} />);
    
    // 检查标题
    expect(screen.getByText('分享文章')).toBeInTheDocument();
    
    // 检查分享按钮
    expect(screen.getByRole('button', { name: /分享到 Twitter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /分享到 Facebook/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /分享到 LinkedIn/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /分享到新浪微博/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /分享到微信/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /复制文章链接/i })).toBeInTheDocument();
  });

  it('应该支持紧凑模式', () => {
    render(<SocialShare {...defaultProps} variant="compact" />);
    
    // 紧凑模式下不显示按钮文字
    expect(screen.queryByText('Twitter')).not.toBeInTheDocument();
    expect(screen.queryByText('Facebook')).not.toBeInTheDocument();
  });

  it('应该支持隐藏标题', () => {
    render(<SocialShare {...defaultProps} showTitle={false} />);
    
    expect(screen.queryByText('分享文章')).not.toBeInTheDocument();
  });

  it('点击Twitter按钮应该打开分享窗口', async () => {
    const user = userEvent.setup();
    render(<SocialShare {...defaultProps} />);
    
    const twitterButton = screen.getByRole('button', { name: /分享到 Twitter/i });
    await user.click(twitterButton);
    
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'width=600,height=400,scrollbars=yes,resizable=yes'
    );
  });

  it('点击Facebook按钮应该打开分享窗口', async () => {
    const user = userEvent.setup();
    render(<SocialShare {...defaultProps} />);
    
    const facebookButton = screen.getByRole('button', { name: /分享到 Facebook/i });
    await user.click(facebookButton);
    
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('facebook.com/sharer'),
      '_blank',
      'width=600,height=400,scrollbars=yes,resizable=yes'
    );
  });

  it('应该正确编码URL参数', async () => {
    const user = userEvent.setup();
    const propsWithSpecialChars = {
      title: '测试标题 & 特殊字符',
      url: 'https://example.com/test?param=value&other=test',
      description: '描述包含 & 和其他特殊字符'
    };
    
    render(<SocialShare {...propsWithSpecialChars} />);
    
    const twitterButton = screen.getByRole('button', { name: /分享到 Twitter/i });
    await user.click(twitterButton);
    
    const expectedUrl = mockWindowOpen.mock.calls[0][0];
    
    // 确保URL被正确编码
    expect(expectedUrl).toContain(encodeURIComponent(propsWithSpecialChars.title));
    expect(expectedUrl).toContain(encodeURIComponent(propsWithSpecialChars.url));
  });

  it('应该具有正确的ARIA标签', () => {
    render(<SocialShare {...defaultProps} />);
    
    // 检查region标签
    expect(screen.getByRole('region', { name: '社交分享' })).toBeInTheDocument();
    
    // 检查group标签
    expect(screen.getByRole('group', { name: '社交平台分享按钮' })).toBeInTheDocument();
  });
});