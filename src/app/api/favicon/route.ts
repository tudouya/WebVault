/**
 * Favicon API endpoint
 * 
 * 为网站卡片提供favicon获取服务
 * 支持从domain参数获取favicon或返回默认图标
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json(
      { error: 'Domain parameter is required' },
      { status: 400 }
    );
  }

  try {
    // 尝试从多个favicon源获取图标
    const faviconUrls = [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      `https://favicon.yandex.net/favicon/${domain}`,
      `https://${domain}/favicon.ico`,
    ];

    // 逐个尝试favicon源
    for (const faviconUrl of faviconUrls) {
      try {
        const response = await fetch(faviconUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          next: { revalidate: 3600 }, // 缓存1小时
        });

        if (response.ok) {
          const contentType = response.headers.get('Content-Type') || 'image/x-icon';
          const imageBuffer = await response.arrayBuffer();
          
          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=3600, s-maxage=3600',
              'CDN-Cache-Control': 'public, max-age=86400',
            },
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch favicon from ${faviconUrl}:`, error);
        continue;
      }
    }

    // 如果所有源都失败，返回默认图标
    return NextResponse.redirect(new URL('/assets/icons/default-favicon.png', request.url));
    
  } catch (error) {
    console.error('Favicon API error:', error);
    
    // 返回默认图标
    return NextResponse.redirect(new URL('/assets/icons/default-favicon.png', request.url));
  }
}

// 支持的HTTP方法
export const runtime = 'edge';