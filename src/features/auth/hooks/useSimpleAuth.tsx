/**
 * 简化的 Clerk 认证 Hook
 * 
 * 直接使用 Clerk 的内置 hooks，不通过复杂的抽象层
 * 
 * @version 1.0.0  
 * @created 2025-08-26
 */

'use client';

import { useAuth, useUser, useSignIn } from '@clerk/nextjs';
import { AuthUser, AuthSession } from '../types';

export function useSimpleAuth() {
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { signIn } = useSignIn();

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

  const user = convertUser(clerkUser);

  // Create simplified session object
  const session: AuthSession | null = isSignedIn && user ? {
    accessToken: 'clerk_session',
    refreshToken: 'clerk_refresh',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    refreshExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
    user: user,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    persistent: true,
  } : null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    // Auth state
    isAuthenticated: isSignedIn || false,
    isLoading: !isLoaded || !userLoaded,
    user,
    session,
    error: null,

    // Actions - simplified
    signOut: handleSignOut,
    
    // Admin checks
    isAdmin: user?.role === 'admin',
    hasValidAdminSession: isSignedIn && user?.role === 'admin',
  };
}