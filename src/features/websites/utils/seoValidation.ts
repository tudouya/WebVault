/**
 * SEO验证工具
 * 
 * 用于验证网站详情页面的SEO实现是否符合要求：
 * - NFR-3.4.1: 动态meta标签生成
 * - NFR-3.4.2: Open Graph和Twitter Cards支持  
 * - NFR-3.4.3: Schema.org结构化数据标记
 */

import { generateWebsiteMetadata, generateWebsiteStructuredData } from './seoUtils';
import { WebsiteDetailData } from '../types/detail';

/**
 * SEO验证结果类型
 */
export interface SEOValidationResult {
  isValid: boolean;
  score: number; // 0-100分
  passed: string[];
  failed: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * 验证网站详情页面的SEO实现
 * 
 * @param website - 网站详情数据
 * @returns SEO验证结果
 */
export function validatePageSEO(website: WebsiteDetailData): SEOValidationResult {
  const passed: string[] = [];
  const failed: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  try {
    // 生成元数据进行验证
    const metadata = generateWebsiteMetadata(website);
    const structuredData = generateWebsiteStructuredData(website);
    
    // === NFR-3.4.1: 动态Meta标签验证 ===
    
    // 检查基础meta标签
    if (metadata.title && typeof metadata.title === 'string' && metadata.title.length > 0) {
      passed.push('✓ 页面标题已设置');
      
      if (metadata.title.length <= 60) {
        passed.push('✓ 页面标题长度适合SEO (≤60字符)');
      } else {
        warnings.push('⚠ 页面标题可能过长，建议≤60字符');
      }
    } else {
      failed.push('✗ 缺少页面标题');
    }
    
    if (metadata.description && typeof metadata.description === 'string' && metadata.description.length > 0) {
      passed.push('✓ 页面描述已设置');
      
      if (metadata.description.length >= 120 && metadata.description.length <= 160) {
        passed.push('✓ 页面描述长度适合SEO (120-160字符)');
      } else if (metadata.description.length < 120) {
        warnings.push('⚠ 页面描述偏短，建议120-160字符');
      } else {
        warnings.push('⚠ 页面描述过长，建议≤160字符');
      }
    } else {
      failed.push('✗ 缺少页面描述');
    }
    
    if (metadata.keywords && typeof metadata.keywords === 'string' && metadata.keywords.length > 0) {
      passed.push('✓ 关键词已设置');
      
      const keywordCount = metadata.keywords.split(',').length;
      if (keywordCount >= 3 && keywordCount <= 10) {
        passed.push('✓ 关键词数量适中 (3-10个)');
      } else if (keywordCount < 3) {
        warnings.push('⚠ 关键词偏少，建议3-10个');
      } else {
        warnings.push('⚠ 关键词过多，建议≤10个');
      }
    } else {
      warnings.push('⚠ 建议添加关键词');
    }
    
    // 检查robots指令
    if (metadata.robots) {
      passed.push('✓ Robots指令已配置');
      
      if (website.is_public && website.status === 'active') {
        if (metadata.robots.index === true) {
          passed.push('✓ 公开页面允许索引');
        } else {
          failed.push('✗ 公开页面应允许索引');
        }
      } else {
        if (metadata.robots.index === false) {
          passed.push('✓ 非公开页面禁止索引');
        } else {
          warnings.push('⚠ 非公开页面建议禁止索引');
        }
      }
    } else {
      failed.push('✗ 缺少Robots指令');
    }
    
    // 检查规范URL
    if (metadata.alternates?.canonical) {
      passed.push('✓ 规范URL已设置');
      
      if (metadata.alternates.canonical.startsWith('https://')) {
        passed.push('✓ 规范URL使用HTTPS');
      } else {
        warnings.push('⚠ 建议规范URL使用HTTPS');
      }
    } else {
      failed.push('✗ 缺少规范URL');
    }
    
    // === NFR-3.4.2: Open Graph和Twitter Cards验证 ===
    
    // 检查Open Graph
    if (metadata.openGraph) {
      passed.push('✓ Open Graph数据已设置');
      
      const og = metadata.openGraph;
      
      if (og.title && og.title.length > 0) {
        passed.push('✓ OG标题已设置');
      } else {
        failed.push('✗ 缺少OG标题');
      }
      
      if (og.description && og.description.length > 0) {
        passed.push('✓ OG描述已设置');
      } else {
        failed.push('✗ 缺少OG描述');
      }
      
      if (og.type === 'website') {
        passed.push('✓ OG类型正确设置为website');
      } else {
        warnings.push('⚠ OG类型建议设置为website');
      }
      
      if (og.url && og.url.length > 0) {
        passed.push('✓ OG URL已设置');
      } else {
        failed.push('✗ 缺少OG URL');
      }
      
      if (og.siteName && og.siteName === 'WebVault') {
        passed.push('✓ OG站点名称正确');
      } else {
        warnings.push('⚠ OG站点名称建议设置为WebVault');
      }
      
      if (og.locale && og.locale === 'zh_CN') {
        passed.push('✓ OG语言环境正确');
      } else {
        warnings.push('⚠ OG语言环境建议设置为zh_CN');
      }
      
      if (og.images && og.images.length > 0) {
        passed.push('✓ OG图片已设置');
        
        const image = og.images[0];
        if (image.width === 1200 && image.height === 630) {
          passed.push('✓ OG图片尺寸符合推荐比例 (1200x630)');
        } else {
          warnings.push('⚠ 建议OG图片使用1200x630尺寸');
        }
        
        if (image.alt && image.alt.length > 0) {
          passed.push('✓ OG图片alt属性已设置');
        } else {
          warnings.push('⚠ 建议为OG图片设置alt属性');
        }
      } else {
        failed.push('✗ 缺少OG图片');
      }
    } else {
      failed.push('✗ 缺少Open Graph数据');
    }
    
    // 检查Twitter Cards
    if (metadata.twitter) {
      passed.push('✓ Twitter Cards数据已设置');
      
      const twitter = metadata.twitter;
      
      if (twitter.card === 'summary_large_image') {
        passed.push('✓ Twitter卡片类型正确');
      } else {
        warnings.push('⚠ 建议Twitter卡片类型设置为summary_large_image');
      }
      
      if (twitter.title && twitter.title.length > 0) {
        passed.push('✓ Twitter标题已设置');
      } else {
        failed.push('✗ 缺少Twitter标题');
      }
      
      if (twitter.description && twitter.description.length > 0) {
        passed.push('✓ Twitter描述已设置');
      } else {
        failed.push('✗ 缺少Twitter描述');
      }
      
      if (twitter.creator && twitter.creator.length > 0) {
        passed.push('✓ Twitter创建者已设置');
      } else {
        warnings.push('⚠ 建议设置Twitter创建者');
      }
      
      if (twitter.images && twitter.images.length > 0) {
        passed.push('✓ Twitter图片已设置');
      } else {
        failed.push('✗ 缺少Twitter图片');
      }
    } else {
      failed.push('✗ 缺少Twitter Cards数据');
    }
    
    // === NFR-3.4.3: Schema.org结构化数据验证 ===
    
    if (structuredData && typeof structuredData === 'object') {
      passed.push('✓ 结构化数据已生成');
      
      // 检查基础Schema.org属性
      if (structuredData['@context'] === 'https://schema.org') {
        passed.push('✓ Schema.org上下文正确');
      } else {
        failed.push('✗ Schema.org上下文错误');
      }
      
      if (structuredData['@type'] === 'WebPage') {
        passed.push('✓ Schema类型为WebPage');
      } else {
        failed.push('✗ Schema类型应为WebPage');
      }
      
      if (structuredData['@id'] && structuredData['@id'].length > 0) {
        passed.push('✓ Schema ID已设置');
      } else {
        failed.push('✗ 缺少Schema ID');
      }
      
      if (structuredData.name && structuredData.name.length > 0) {
        passed.push('✓ Schema名称已设置');
      } else {
        failed.push('✗ 缺少Schema名称');
      }
      
      if (structuredData.description && structuredData.description.length > 0) {
        passed.push('✓ Schema描述已设置');
      } else {
        warnings.push('⚠ 建议设置Schema描述');
      }
      
      if (structuredData.url && structuredData.url.length > 0) {
        passed.push('✓ Schema URL已设置');
      } else {
        failed.push('✗ 缺少Schema URL');
      }
      
      if (structuredData.datePublished) {
        passed.push('✓ Schema发布时间已设置');
      } else {
        warnings.push('⚠ 建议设置Schema发布时间');
      }
      
      if (structuredData.dateModified) {
        passed.push('✓ Schema修改时间已设置');
      } else {
        warnings.push('⚠ 建议设置Schema修改时间');
      }
      
      if (structuredData.inLanguage) {
        passed.push('✓ Schema语言已设置');
      } else {
        warnings.push('⚠ 建议设置Schema语言');
      }
      
      // 检查主实体 (mainEntity)
      if (structuredData.mainEntity && typeof structuredData.mainEntity === 'object') {
        passed.push('✓ Schema主实体已设置');
        
        const mainEntity = structuredData.mainEntity;
        
        if (mainEntity['@type'] === 'WebSite') {
          passed.push('✓ 主实体类型为WebSite');
        } else {
          warnings.push('⚠ 主实体类型建议设置为WebSite');
        }
        
        if (mainEntity.name && mainEntity.name.length > 0) {
          passed.push('✓ 主实体名称已设置');
        } else {
          failed.push('✗ 缺少主实体名称');
        }
        
        if (mainEntity.url && mainEntity.url.length > 0) {
          passed.push('✓ 主实体URL已设置');
        } else {
          failed.push('✗ 缺少主实体URL');
        }
      } else {
        failed.push('✗ 缺少Schema主实体');
      }
      
      // 检查发布者信息
      if (structuredData.publisher && typeof structuredData.publisher === 'object') {
        passed.push('✓ Schema发布者已设置');
        
        const publisher = structuredData.publisher;
        
        if (publisher['@type'] === 'Organization') {
          passed.push('✓ 发布者类型为Organization');
        } else {
          warnings.push('⚠ 发布者类型建议设置为Organization');
        }
        
        if (publisher.name === 'WebVault') {
          passed.push('✓ 发布者名称正确');
        } else {
          warnings.push('⚠ 发布者名称建议设置为WebVault');
        }
        
        if (publisher.logo && typeof publisher.logo === 'object') {
          passed.push('✓ 发布者Logo已设置');
        } else {
          warnings.push('⚠ 建议设置发布者Logo');
        }
      } else {
        failed.push('✗ 缺少Schema发布者');
      }
      
      // 检查面包屑导航
      if (structuredData.breadcrumb && typeof structuredData.breadcrumb === 'object') {
        passed.push('✓ Schema面包屑已设置');
        
        const breadcrumb = structuredData.breadcrumb;
        
        if (breadcrumb['@type'] === 'BreadcrumbList') {
          passed.push('✓ 面包屑类型正确');
        } else {
          warnings.push('⚠ 面包屑类型建议设置为BreadcrumbList');
        }
        
        if (breadcrumb.itemListElement && Array.isArray(breadcrumb.itemListElement)) {
          const itemCount = breadcrumb.itemListElement.length;
          if (itemCount >= 2) {
            passed.push(`✓ 面包屑项目数量合理 (${itemCount}个)`);
          } else {
            warnings.push('⚠ 面包屑项目建议至少2个');
          }
        } else {
          failed.push('✗ 面包屑缺少项目列表');
        }
      } else {
        warnings.push('⚠ 建议设置Schema面包屑导航');
      }
      
      // 检查关键词
      if (structuredData.keywords && structuredData.keywords.length > 0) {
        passed.push('✓ Schema关键词已设置');
      } else {
        warnings.push('⚠ 建议设置Schema关键词');
      }
    } else {
      failed.push('✗ 缺少结构化数据');
    }
    
    // 计算SEO分数
    const totalChecks = passed.length + failed.length + warnings.length;
    const passedWeight = passed.length * 2;
    const warningWeight = warnings.length * 1;
    const maxPossibleScore = totalChecks * 2;
    
    const score = Math.round((passedWeight + warningWeight) / maxPossibleScore * 100);
    
    // 生成推荐建议
    if (failed.length > 0) {
      recommendations.push('修复所有失败项目以提升SEO效果');
    }
    
    if (warnings.length > 0) {
      recommendations.push('考虑解决警告项目以进一步优化SEO');
    }
    
    if (score >= 90) {
      recommendations.push('SEO实现优秀！可考虑定期检查和更新');
    } else if (score >= 80) {
      recommendations.push('SEO实现良好，还有优化空间');
    } else if (score >= 70) {
      recommendations.push('SEO基础较好，建议优化关键问题');
    } else {
      recommendations.push('SEO需要显著改进，请优先修复失败项目');
    }
    
    return {
      isValid: failed.length === 0,
      score,
      passed,
      failed,
      warnings,
      recommendations,
    };
    
  } catch (error) {
    return {
      isValid: false,
      score: 0,
      passed: [],
      failed: [`✗ SEO验证过程出错: ${error instanceof Error ? error.message : '未知错误'}`],
      warnings: [],
      recommendations: ['请检查网站数据完整性并重试'],
    };
  }
}

/**
 * 输出格式化的SEO验证报告
 * 
 * @param result - SEO验证结果
 * @returns 格式化的报告字符串
 */
export function formatSEOReport(result: SEOValidationResult): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(60));
  lines.push('🔍 网站详情页面 SEO 验证报告');
  lines.push('='.repeat(60));
  lines.push('');
  
  // 总体评分
  lines.push(`📊 SEO 评分: ${result.score}/100`);
  lines.push(`🎯 验证结果: ${result.isValid ? '✅ 通过' : '❌ 需要改进'}`);
  lines.push('');
  
  // 通过的检查项
  if (result.passed.length > 0) {
    lines.push(`✅ 通过的检查项 (${result.passed.length}项):`);
    lines.push('-'.repeat(40));
    result.passed.forEach(item => lines.push(`  ${item}`));
    lines.push('');
  }
  
  // 失败的检查项
  if (result.failed.length > 0) {
    lines.push(`❌ 失败的检查项 (${result.failed.length}项):`);
    lines.push('-'.repeat(40));
    result.failed.forEach(item => lines.push(`  ${item}`));
    lines.push('');
  }
  
  // 警告项
  if (result.warnings.length > 0) {
    lines.push(`⚠️  警告项 (${result.warnings.length}项):`);
    lines.push('-'.repeat(40));
    result.warnings.forEach(item => lines.push(`  ${item}`));
    lines.push('');
  }
  
  // 建议
  if (result.recommendations.length > 0) {
    lines.push('💡 改进建议:');
    lines.push('-'.repeat(40));
    result.recommendations.forEach((item, index) => {
      lines.push(`  ${index + 1}. ${item}`);
    });
    lines.push('');
  }
  
  lines.push('='.repeat(60));
  lines.push('验证完成 - WebVault SEO 验证工具');
  lines.push('='.repeat(60));
  
  return lines.join('\n');
}

/**
 * 验证网站详情页面SEO实现并输出报告
 * 
 * @param website - 网站详情数据
 */
export function validateAndReport(website: WebsiteDetailData): void {
  console.log('🚀 开始验证网站详情页面SEO实现...\n');
  
  const result = validatePageSEO(website);
  const report = formatSEOReport(result);
  
  console.log(report);
  
  // 验证特定需求
  console.log('\n📋 需求验证结果:');
  console.log('-'.repeat(30));
  
  const nfrResults = {
    'NFR-3.4.1': result.passed.some(p => p.includes('页面标题')) && 
                 result.passed.some(p => p.includes('页面描述')) && 
                 result.passed.some(p => p.includes('Robots指令')),
    'NFR-3.4.2': result.passed.some(p => p.includes('Open Graph')) && 
                 result.passed.some(p => p.includes('Twitter Cards')),
    'NFR-3.4.3': result.passed.some(p => p.includes('结构化数据')) && 
                 result.passed.some(p => p.includes('Schema'))
  };
  
  Object.entries(nfrResults).forEach(([nfr, isValid]) => {
    console.log(`  ${nfr}: ${isValid ? '✅ 满足' : '❌ 不满足'}`);
  });
  
  console.log('\n✨ 验证完成！');
}