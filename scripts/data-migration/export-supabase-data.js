/**
 * Export Supabase Data Script
 * 
 * 导出 Supabase 数据库中的 categories 和 tags 数据
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 确保输出目录存在
const outputDir = path.join(__dirname, 'exported-data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function exportTable(tableName) {
  console.log(`📤 导出 ${tableName} 数据...`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`❌ 导出 ${tableName} 失败:`, error.message);
      return false;
    }

    if (!data || data.length === 0) {
      console.log(`   ⚠️  ${tableName} 表为空，跳过`);
      return true;
    }

    // 生成 UUID 的辅助函数
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    // 转换数据格式以适配 D1
    const convertedData = data.map(item => ({
      ...item,
      // 确保有 UUID (如果原来没有的话)
      id: item.id || generateUUID(),
      // 确保时间戳格式正确
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
    }));

    // 保存到文件
    const filePath = path.join(outputDir, `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(convertedData, null, 2), 'utf8');
    
    console.log(`   ✅ 导出 ${convertedData.length} 条记录到 ${filePath}`);
    return true;
    
  } catch (err) {
    console.error(`❌ 导出 ${tableName} 时出现错误:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 开始导出 Supabase 数据...\n');
  
  const tablesToExport = ['categories', 'tags'];
  let successCount = 0;
  
  for (const table of tablesToExport) {
    const success = await exportTable(table);
    if (success) successCount++;
  }
  
  console.log(`\n✅ 导出完成! 成功: ${successCount}/${tablesToExport.length}`);
  console.log(`📁 数据保存在: ${outputDir}`);
}

if (require.main === module) {
  main().catch(console.error);
}