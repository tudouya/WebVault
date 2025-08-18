/**
 * Next.js Authentication Middleware
 * 
 * 认证中间件集成，提供路由保护和会话验证功能。
 * 集成Supabase认证服务，支持登录、注册路径的特殊处理。
 * 
 * Requirements:
 * - 5.1: Session management (会话管理和路由保护)
 * - 为认证路径 (/login, /signup) 添加特殊处理
 * - 仅对受保护路由进行会话验证
 * - 路由保护机制
 * 
 * @version 1.0.0
 * @created 2025-08-17
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Middleware Configuration
// ============================================================================

/**
 * 路由保护配置
 * 
 * 定义不同路径的认证要求和处理逻辑
 */
interface RouteConfig {
  /** 路径模式 */
  pattern: RegExp;
  /** 是否需要认证 */
  requiresAuth: boolean;
  /** 需要的用户角色 */
  requiredRole?: 'admin' | 'user';
  /** 认证失败时的重定向路径 */
  redirectTo?: string;
  /** 已认证用户的重定向路径 (用于登录页面) */
  authenticatedRedirectTo?: string;
}

/**
 * 路由配置表
 * 
 * 按优先级顺序定义路由规则
 */
const ROUTE_CONFIGS: RouteConfig[] = [
  // 认证路径 - 已认证用户重定向到仪表盘
  {
    pattern: /^\/login\/?$/,
    requiresAuth: false,
    authenticatedRedirectTo: '/admin/dashboard',
  },
  {
    pattern: /^\/signup\/?$/,
    requiresAuth: false,
    authenticatedRedirectTo: '/admin/dashboard',
  },
  
  // 认证回调路径 - 允许访问
  {
    pattern: /^\/auth\/callback/,
    requiresAuth: false,
  },
  
  // 管理员区域 - 需要管理员权限
  {
    pattern: /^\/admin/,
    requiresAuth: true,
    requiredRole: 'admin',
    redirectTo: '/login',
  },
  
  // API认证路由 - 允许访问
  {
    pattern: /^\/api\/auth/,
    requiresAuth: false,
  },
  
  // 受保护的API路由 - 需要认证
  {
    pattern: /^\/api\/admin/,
    requiresAuth: true,
    requiredRole: 'admin',
    redirectTo: '/login',
  },
  
  // 提交页面 - 暂时不需要认证 (根据需求可调整)
  {
    pattern: /^\/submit/,
    requiresAuth: false,
  },
  
  // 公共页面 - 不需要认证
  {
    pattern: /^\/$/,
    requiresAuth: false,
  },
  {
    pattern: /^\/search/,
    requiresAuth: false,
  },
  {
    pattern: /^\/category/,
    requiresAuth: false,
  },
  {
    pattern: /^\/collection/,
    requiresAuth: false,
  },
  {
    pattern: /^\/blog/,
    requiresAuth: false,
  },
  {
    pattern: /^\/tag/,
    requiresAuth: false,
  },
  {
    pattern: /^\/website/,
    requiresAuth: false,
  },
];

/**
 * 静态资源和API路径白名单
 * 
 * 这些路径不进行认证检查
 */
const BYPASS_PATHS = [
  '/_next',          // Next.js静态资源
  '/favicon.ico',    // 网站图标
  '/robots.txt',     // 搜索引擎爬虫
  '/sitemap.xml',    // 网站地图
  '/manifest.json',  // PWA清单
  '/sw.js',          // Service Worker
  '/api/favicon',    // 动态图标API
];

// ============================================================================
// Supabase Client for Middleware
// ============================================================================

/**
 * 为中间件创建Supabase客户端
 * 
 * 中间件运行在Edge Runtime，需要特殊配置
 */
function createMiddlewareSupabaseClient(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      detectSessionInUrl: false,
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'webvault-middleware@1.0.0',
      },
    },
  });
}

// ============================================================================
// Session Validation Functions
// ============================================================================

/**
 * 从请求中提取认证令牌
 * 
 * 按优先级检查不同的令牌来源
 */
function extractAuthToken(req: NextRequest): string | null {
  // 1. 检查Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. 检查认证cookie
  const authCookie = req.cookies.get('webvault-auth-token');
  if (authCookie?.value) {
    return authCookie.value;
  }

  // 3. 检查Supabase默认cookie
  const supabaseCookie = req.cookies.get('sb-access-token');
  if (supabaseCookie?.value) {
    return supabaseCookie.value;
  }

  return null;
}

/**
 * 验证用户会话
 * 
 * 使用Supabase客户端验证用户认证状态
 * Requirements: 5.1 (会话验证)
 */
async function validateUserSession(req: NextRequest) {
  try {
    const supabase = createMiddlewareSupabaseClient(req);
    
    // 获取当前用户会话
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return {
        isAuthenticated: false,
        user: null,
        error: error?.message || 'No authenticated user',
      };
    }

    // 获取用户角色信息
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || 'user';

    return {
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: userRole,
        emailVerified: !!user.email_confirmed_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('[Middleware] Session validation error:', error);
    return {
      isAuthenticated: false,
      user: null,
      error: 'Session validation failed',
    };
  }
}

// ============================================================================
// Route Matching and Protection Logic
// ============================================================================

/**
 * 匹配路由配置
 * 
 * 根据请求路径找到对应的路由配置
 */
function matchRouteConfig(pathname: string): RouteConfig | null {
  for (const config of ROUTE_CONFIGS) {
    if (config.pattern.test(pathname)) {
      return config;
    }
  }
  return null;
}

/**
 * 检查路径是否应该跳过认证
 * 
 * 静态资源和白名单路径不进行认证检查
 */
function shouldBypassAuth(pathname: string): boolean {
  return BYPASS_PATHS.some(path => pathname.startsWith(path));
}

/**
 * 创建重定向响应
 * 
 * 处理认证重定向，保留原始请求路径用于登录后跳转
 */
function createRedirectResponse(
  req: NextRequest,
  redirectTo: string,
  preserveReturnUrl = true
): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = redirectTo;
  
  // 保留返回URL用于登录后跳转
  if (preserveReturnUrl && redirectTo === '/login') {
    const returnUrl = req.nextUrl.pathname + req.nextUrl.search;
    if (returnUrl !== '/login') {
      url.searchParams.set('returnUrl', returnUrl);
    }
  }
  
  return NextResponse.redirect(url);
}

// ============================================================================
// Main Middleware Function
// ============================================================================

/**
 * Next.js 中间件主函数
 * 
 * 处理所有路由请求，实现认证检查和路由保护
 * 
 * Features:
 * - 认证路径特殊处理 (/login, /signup)
 * - 受保护路由的会话验证
 * - 角色权限检查
 * - 自动重定向逻辑
 * 
 * Requirements: 5.1 (路由保护)
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 跳过静态资源和白名单路径
  if (shouldBypassAuth(pathname)) {
    return NextResponse.next();
  }

  // 查找匹配的路由配置
  const routeConfig = matchRouteConfig(pathname);
  
  // 如果没有匹配的配置，允许访问
  if (!routeConfig) {
    return NextResponse.next();
  }

  // 不需要认证的路由
  if (!routeConfig.requiresAuth) {
    // 对于登录/注册页面，检查用户是否已认证
    if (routeConfig.authenticatedRedirectTo) {
      const { isAuthenticated } = await validateUserSession(req);
      
      if (isAuthenticated) {
        // 已认证用户重定向到指定页面
        return createRedirectResponse(
          req,
          routeConfig.authenticatedRedirectTo,
          false
        );
      }
    }
    
    return NextResponse.next();
  }

  // 需要认证的路由 - 执行会话验证
  const { isAuthenticated, user, error } = await validateUserSession(req);

  if (!isAuthenticated) {
    // 未认证 - 重定向到登录页面
    console.log(`[Middleware] Access denied for ${pathname}: ${error}`);
    return createRedirectResponse(
      req,
      routeConfig.redirectTo || '/login'
    );
  }

  // 检查角色权限
  if (routeConfig.requiredRole && user?.role !== routeConfig.requiredRole) {
    console.log(`[Middleware] Access denied for ${pathname}: insufficient role (required: ${routeConfig.requiredRole}, actual: ${user?.role})`);
    
    // 权限不足 - 根据当前角色重定向
    if (user?.role === 'user') {
      // 普通用户尝试访问管理员区域，重定向到首页
      return createRedirectResponse(req, '/', false);
    } else {
      // 其他情况重定向到登录页面
      return createRedirectResponse(req, '/login', false);
    }
  }

  // 通过所有检查 - 允许访问
  return NextResponse.next();
}

// ============================================================================
// Middleware Configuration Export
// ============================================================================

/**
 * 中间件匹配器配置
 * 
 * 定义中间件应该运行的路径模式
 */
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了:
     * - api路由 (handled by individual route configs)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// ============================================================================
// Development Helpers
// ============================================================================

/**
 * 开发环境下的中间件日志记录
 * 
 * 仅在开发模式下输出详细的调试信息
 */
function logMiddlewareAction(
  pathname: string,
  action: string,
  details?: Record<string, any>
) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${pathname} -> ${action}`, details || '');
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * 中间件用户接口
 */
interface MiddlewareUser {
  id: string;
  email: string | undefined;
  role: 'admin' | 'user';
  emailVerified: boolean;
}

/**
 * 会话验证结果接口
 */
interface SessionValidationResult {
  isAuthenticated: boolean;
  user: MiddlewareUser | null;
  error: string | null;
}

export type { MiddlewareUser, SessionValidationResult };