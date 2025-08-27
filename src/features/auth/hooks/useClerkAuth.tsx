/**
 * Clerk Authentication Hook
 * 
 * Wrapper around Clerk's built-in hooks to provide unified auth interface
 * that matches our AuthService pattern while using Clerk's recommended approach.
 * 
 * @version 1.0.0
 * @created 2025-08-26
 */

'use client';

import { useAuth, useSignIn, useSignUp, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { AuthUser, AuthSession, AuthError } from '../types';

export interface ClerkAuthHookReturn {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  session: AuthSession | null;
  error: AuthError | null;

  // Actions
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Custom hook that wraps Clerk's authentication hooks
 * and provides our standard auth interface
 */
export function useClerkAuth(): ClerkAuthHookReturn {
  const { isSignedIn, isLoaded, signOut: clerkSignOut } = useAuth();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { user: clerkUser } = useUser();
  const router = useRouter();

  // Convert Clerk user to our AuthUser format
  const convertUser = (clerkUser: any): AuthUser | null => {
    if (!clerkUser) return null;

    const primaryEmail = clerkUser.emailAddresses.find((email: any) => 
      email.id === clerkUser.primaryEmailAddressId
    );
    
    if (!primaryEmail) return null;

    return {
      id: clerkUser.id,
      email: primaryEmail.emailAddress,
      emailVerified: primaryEmail.verification?.status === 'verified',
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 
            primaryEmail.emailAddress.split('@')[0],
      avatar: clerkUser.imageUrl || null,
      provider: 'clerk',
      role: clerkUser.publicMetadata?.role === 'admin' ? 'admin' : 'user',
      metadata: {
        language: 'zh-CN',
        theme: 'system',
        lastLogin: new Date().toISOString(),
        loginCount: (clerkUser.publicMetadata?.loginCount || 0) + 1,
      },
      createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: clerkUser.updatedAt ? new Date(clerkUser.updatedAt).toISOString() : new Date().toISOString(),
    };
  };

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    // 🔍 关键修复：先检查是否已登录
    if (isSignedIn) {
      console.log('用户已经登录，无需重复登录');
      return;
    }

    if (!signIn || !signInLoaded) {
      throw new Error('Sign in not ready');
    }

    try {
      // 第一步：准备登录尝试（使用邮箱标识符）
      const signInAttempt = await signIn.create({
        identifier: email,
      });

      // 第二步：使用密码尝试登录
      const result = await signInAttempt.attemptFirstFactor({
        strategy: 'password',
        password: password,
      });

      if (result.status === 'complete') {
        // 登录成功，自动跳转到管理仪表盘
        console.log('登录成功');
        router.push('/admin/dashboard');
        return;
      } else if (result.status === 'needs_second_factor') {
        // 需要二步验证
        throw new Error('此账户需要二步验证，请完成验证');
      } else {
        // 其他状态
        throw new Error(`登录状态异常: ${result.status}`);
      }
    } catch (error: any) {
      console.error('Clerk sign in error:', error);
      
      // 提供更友好的错误信息
      if (error.errors && error.errors.length > 0) {
        const firstError = error.errors[0];
        switch (firstError.code) {
          case 'form_identifier_not_found':
            throw new Error('未找到此邮箱对应的账户，请检查邮箱地址');
          case 'form_password_incorrect':
            throw new Error('密码错误，请重新输入');
          case 'form_identifier_invalid':
            throw new Error('邮箱格式不正确');
          default:
            throw new Error(firstError.longMessage || firstError.message || '登录失败');
        }
      }
      
      throw new Error(error.message || '登录失败，请稍后重试');
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    // 🔍 检查是否已登录
    if (isSignedIn) {
      console.log('用户已经登录，无需重复登录');
      return;
    }

    if (!signIn || !signInLoaded) {
      throw new Error('Sign in not ready');
    }

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/admin/dashboard',
      });
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error('Google 登录失败');
    }
  };

  // Sign in with GitHub  
  const signInWithGitHub = async () => {
    // 🔍 检查是否已登录
    if (isSignedIn) {
      console.log('用户已经登录，无需重复登录');
      return;
    }

    if (!signIn || !signInLoaded) {
      throw new Error('Sign in not ready');
    }

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_github',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/admin/dashboard',
      });
    } catch (error: any) {
      console.error('GitHub sign in error:', error);
      throw new Error('GitHub 登录失败');
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await clerkSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('登出失败');
    }
  };

  // Create session object (simplified)
  const session: AuthSession | null = isSignedIn && clerkUser ? {
    accessToken: 'clerk_session', // Clerk manages tokens internally
    refreshToken: 'clerk_refresh',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    refreshExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
    user: convertUser(clerkUser)!,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    persistent: true,
  } : null;

  return {
    isAuthenticated: isSignedIn || false,
    isLoading: !isLoaded || !signInLoaded,
    user: convertUser(clerkUser),
    session,
    error: null, // Clerk handles errors through try/catch in actions

    signInWithEmail,
    signInWithGoogle, 
    signInWithGitHub,
    signOut: handleSignOut,
  };
}