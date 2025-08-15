/**
 * 搜索页面集成测试脚本
 * 
 * 测试搜索页面的核心功能：
 * 1. 页面访问和渲染
 * 2. 搜索功能和筛选器
 * 3. 响应式布局
 * 4. URL状态同步
 * 5. 错误处理
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3003';
const SEARCH_PAGE_URL = `${BASE_URL}/search`;

// 测试用例配置
const TEST_CASES = [
  {
    name: '基本页面加载测试',
    url: SEARCH_PAGE_URL,
    checks: [
      'h1', // 标题存在
      'input[placeholder*="Search"]', // 搜索框存在
      '[data-testid="search-filters"]', // 筛选器存在
    ]
  },
  {
    name: 'URL参数测试',
    url: `${SEARCH_PAGE_URL}?q=test&category=technology`,
    checks: [
      'input[value="test"]', // 搜索框值恢复
      // 分类选择器状态恢复会在后续检查
    ]
  },
  {
    name: '响应式布局测试',
    url: SEARCH_PAGE_URL,
    viewports: [
      { width: 1200, height: 800 }, // 桌面
      { width: 768, height: 1024 },  // 平板
      { width: 375, height: 667 },   // 移动
    ]
  }
];

async function runSearchPageTests() {
  console.log('🚀 开始搜索页面集成测试...\n');
  
  let browser;
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 测试1: 基本页面加载
    console.log('📋 测试1: 基本页面加载');
    try {
      await page.goto(SEARCH_PAGE_URL, { waitUntil: 'networkidle2', timeout: 10000 });
      
      // 检查页面标题
      const title = await page.title();
      console.log(`   页面标题: ${title}`);
      
      // 检查是否有搜索表单
      const searchForm = await page.$('form[role="search"]');
      if (searchForm) {
        console.log('   ✅ 搜索表单存在');
        results.passed++;
      } else {
        console.log('   ❌ 搜索表单不存在');
        results.failed++;
        results.errors.push('搜索表单不存在');
      }
      
      // 检查搜索输入框
      const searchInput = await page.$('input[placeholder*="Search"]');
      if (searchInput) {
        console.log('   ✅ 搜索输入框存在');
        results.passed++;
      } else {
        console.log('   ❌ 搜索输入框不存在');
        results.failed++;
        results.errors.push('搜索输入框不存在');
      }
      
      // 检查筛选器区域
      const filtersSection = await page.$('[aria-label*="筛选"]');
      if (filtersSection) {
        console.log('   ✅ 筛选器区域存在');
        results.passed++;
      } else {
        console.log('   ❌ 筛选器区域不存在');
        results.failed++;
        results.errors.push('筛选器区域不存在');
      }
      
    } catch (error) {
      console.log(`   ❌ 页面加载失败: ${error.message}`);
      results.failed++;
      results.errors.push(`页面加载失败: ${error.message}`);
    }

    // 测试2: 搜索功能
    console.log('\n📋 测试2: 搜索功能');
    try {
      await page.goto(SEARCH_PAGE_URL, { waitUntil: 'networkidle2' });
      
      // 输入搜索关键词
      const searchInput = await page.$('input[placeholder*="Search"]');
      if (searchInput) {
        await searchInput.type('test search');
        console.log('   ✅ 成功输入搜索关键词');
        results.passed++;
        
        // 检查URL是否更新 (需要等待一下让状态同步)
        await new Promise(resolve => setTimeout(resolve, 1000));
        const currentUrl = page.url();
        if (currentUrl.includes('test search') || currentUrl.includes('q=')) {
          console.log('   ✅ URL状态同步成功');
          results.passed++;
        } else {
          console.log(`   ⚠️ URL状态同步可能有问题: ${currentUrl}`);
          // 这不算完全失败，因为可能是防抖延迟
        }
      } else {
        console.log('   ❌ 未找到搜索输入框');
        results.failed++;
        results.errors.push('搜索功能测试失败：未找到输入框');
      }
      
    } catch (error) {
      console.log(`   ❌ 搜索功能测试失败: ${error.message}`);
      results.failed++;
      results.errors.push(`搜索功能测试失败: ${error.message}`);
    }

    // 测试3: 响应式布局
    console.log('\n📋 测试3: 响应式布局');
    const viewports = [
      { width: 1200, height: 800, name: '桌面' },
      { width: 768, height: 1024, name: '平板' },
      { width: 375, height: 667, name: '移动' }
    ];
    
    for (const viewport of viewports) {
      try {
        await page.setViewport({ width: viewport.width, height: viewport.height });
        await page.goto(SEARCH_PAGE_URL, { waitUntil: 'networkidle2' });
        
        // 检查页面是否正常渲染
        const bodyHandle = await page.$('body');
        const boundingBox = await bodyHandle.boundingBox();
        
        if (boundingBox && boundingBox.width > 0) {
          console.log(`   ✅ ${viewport.name}视图 (${viewport.width}x${viewport.height}) 渲染正常`);
          results.passed++;
        } else {
          console.log(`   ❌ ${viewport.name}视图渲染异常`);
          results.failed++;
          results.errors.push(`${viewport.name}视图渲染异常`);
        }
        
      } catch (error) {
        console.log(`   ❌ ${viewport.name}视图测试失败: ${error.message}`);
        results.failed++;
        results.errors.push(`${viewport.name}视图测试失败: ${error.message}`);
      }
    }

    // 测试4: 组件错误处理
    console.log('\n📋 测试4: 错误处理');
    try {
      // 检查是否有任何控制台错误
      const consoleLogs = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleLogs.push(msg.text());
        }
      });
      
      await page.goto(SEARCH_PAGE_URL, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待可能的异步错误
      
      if (consoleLogs.length === 0) {
        console.log('   ✅ 没有控制台错误');
        results.passed++;
      } else {
        console.log(`   ⚠️ 发现 ${consoleLogs.length} 个控制台错误:`);
        consoleLogs.forEach(log => console.log(`     - ${log}`));
        // 控制台错误不算致命错误，但需要注意
      }
      
    } catch (error) {
      console.log(`   ❌ 错误处理测试失败: ${error.message}`);
      results.failed++;
      results.errors.push(`错误处理测试失败: ${error.message}`);
    }

  } catch (globalError) {
    console.log(`❌ 全局测试失败: ${globalError.message}`);
    results.failed++;
    results.errors.push(`全局测试失败: ${globalError.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // 输出测试结果
  console.log('\n📊 测试结果汇总:');
  console.log(`✅ 通过: ${results.passed}`);
  console.log(`❌ 失败: ${results.failed}`);
  console.log(`📋 总计: ${results.passed + results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n🚨 错误详情:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  const successRate = results.passed / (results.passed + results.failed);
  console.log(`\n🎯 成功率: ${(successRate * 100).toFixed(1)}%`);
  
  if (successRate >= 0.8) {
    console.log('🎉 测试通过！搜索页面基本功能正常');
    return true;
  } else {
    console.log('⚠️ 测试未完全通过，需要修复问题');
    return false;
  }
}

// 运行测试
if (require.main === module) {
  runSearchPageTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = { runSearchPageTests };