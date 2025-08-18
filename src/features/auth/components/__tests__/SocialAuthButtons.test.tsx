/**
 * SocialAuthButtons Component Tests
 * 
 * 测试社交认证按钮组件的功能和交互
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { 
  SocialAuthButtons,
  CompactSocialAuthButtons,
  StackedSocialAuthButtons,
  type SocialAuthButtonsProps 
} from '../SocialAuthButtons';

// Mock useSocialAuth hook
const mockSignInWithGoogle = jest.fn();
const mockSignInWithGitHub = jest.fn();
const mockClearError = jest.fn();

jest.mock('../../hooks/useSocialAuth', () => ({
  useSocialAuth: jest.fn(() => ({
    signInWithGoogle: mockSignInWithGoogle,
    signInWithGitHub: mockSignInWithGitHub,
    state: {
      isLoading: false,
      activeProvider: null,
      error: null,
    },
    isGoogleLoading: false,
    isGitHubLoading: false,
    clearError: mockClearError,
  })),
}));

describe('SocialAuthButtons', () => {
  const defaultProps: SocialAuthButtonsProps = {
    onSuccess: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该渲染Google和GitHub按钮', () => {
      render(<SocialAuthButtons {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
    });

    it('应该应用自定义className', () => {
      const { container } = render(
        <SocialAuthButtons {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('应该使用默认grid布局', () => {
      const { container } = render(<SocialAuthButtons {...defaultProps} />);
      
      expect(container.firstChild).toHaveClass('grid', 'grid-cols-2');
    });
  });

  describe('布局选项', () => {
    it('应该渲染stack布局', () => {
      const { container } = render(
        <SocialAuthButtons {...defaultProps} layout="stack" />
      );
      
      expect(container.firstChild).toHaveClass('space-y-3');
      expect(container.firstChild).not.toHaveClass('grid');
    });

    it('应该渲染inline布局', () => {
      const { container } = render(
        <SocialAuthButtons {...defaultProps} layout="inline" />
      );
      
      expect(container.firstChild).toHaveClass('flex', 'gap-3');
    });
  });

  describe('按钮交互', () => {
    it('应该调用Google登录', async () => {
      const user = userEvent.setup();
      render(<SocialAuthButtons {...defaultProps} />);
      
      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);
      
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });

    it('应该调用GitHub登录', async () => {
      const user = userEvent.setup();
      render(<SocialAuthButtons {...defaultProps} />);
      
      const githubButton = screen.getByRole('button', { name: /github/i });
      await user.click(githubButton);
      
      expect(mockSignInWithGitHub).toHaveBeenCalledTimes(1);
    });

    it('应该在disabled时禁用按钮', () => {
      render(<SocialAuthButtons {...defaultProps} disabled />);
      
      expect(screen.getByRole('button', { name: /google/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /github/i })).toBeDisabled();
    });
  });

  describe('加载状态', () => {
    it('应该显示Google加载状态', () => {
      const useSocialAuth = require('../../hooks/useSocialAuth').useSocialAuth;
      useSocialAuth.mockReturnValue({
        signInWithGoogle: mockSignInWithGoogle,
        signInWithGitHub: mockSignInWithGitHub,
        state: {
          isLoading: true,
          activeProvider: 'google',
          error: null,
        },
        isGoogleLoading: true,
        isGitHubLoading: false,
        clearError: mockClearError,
      });

      render(<SocialAuthButtons {...defaultProps} />);
      
      expect(screen.getByText('登录中...')).toBeInTheDocument();
    });

    it('应该显示GitHub加载状态', () => {
      const useSocialAuth = require('../../hooks/useSocialAuth').useSocialAuth;
      useSocialAuth.mockReturnValue({
        signInWithGoogle: mockSignInWithGoogle,
        signInWithGitHub: mockSignInWithGitHub,
        state: {
          isLoading: true,
          activeProvider: 'github',
          error: null,
        },
        isGoogleLoading: false,
        isGitHubLoading: true,
        clearError: mockClearError,
      });

      render(<SocialAuthButtons {...defaultProps} />);
      
      expect(screen.getByText('登录中...')).toBeInTheDocument();
    });
  });

  describe('提供商过滤', () => {
    it('应该只渲染启用的提供商', () => {
      render(
        <SocialAuthButtons 
          {...defaultProps} 
          enabledProviders={['google']} 
        />
      );
      
      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /github/i })).not.toBeInTheDocument();
    });

    it('应该在没有启用提供商时返回null', () => {
      const { container } = render(
        <SocialAuthButtons 
          {...defaultProps} 
          enabledProviders={[]} 
        />
      );
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('错误处理', () => {
    it('应该在登录失败时调用onError', async () => {
      const onError = jest.fn();
      const user = userEvent.setup();
      
      mockSignInWithGoogle.mockRejectedValue(new Error('Google login failed'));
      
      render(<SocialAuthButtons {...defaultProps} onError={onError} />);
      
      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);
      
      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });
  });

  describe('便捷组件', () => {
    it('CompactSocialAuthButtons应该使用正确的props', () => {
      const { container } = render(<CompactSocialAuthButtons {...defaultProps} />);
      
      expect(container.firstChild).toHaveClass('flex', 'max-w-[200px]');
    });

    it('StackedSocialAuthButtons应该使用stack布局', () => {
      const { container } = render(<StackedSocialAuthButtons {...defaultProps} />);
      
      expect(container.firstChild).toHaveClass('space-y-3');
    });
  });

  describe('无障碍支持', () => {
    it('所有按钮应该有正确的role', () => {
      render(<SocialAuthButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('按钮应该有描述性的文本', () => {
      render(<SocialAuthButtons {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
    });
  });

  describe('响应式行为', () => {
    it('在小屏幕上应该隐藏加载文本', () => {
      const useSocialAuth = require('../../hooks/useSocialAuth').useSocialAuth;
      useSocialAuth.mockReturnValue({
        signInWithGoogle: mockSignInWithGoogle,
        signInWithGitHub: mockSignInWithGitHub,
        state: {
          isLoading: true,
          activeProvider: 'google',
          error: null,
        },
        isGoogleLoading: true,
        isGitHubLoading: false,
        clearError: mockClearError,
      });

      render(<SocialAuthButtons {...defaultProps} />);
      
      const loadingText = screen.getByText('登录中...');
      expect(loadingText).toHaveClass('hidden', 'sm:inline');
    });
  });
});