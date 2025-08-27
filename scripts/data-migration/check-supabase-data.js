/**
 * Supabase Data Check Script
 * 
 * 检查 Supabase 数据库中的现有数据，为迁移做准备
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSupabaseData() {
  console.log('🔍 检查 Supabase 数据库中的数据...\n');

  const tables = [
    'websites',
    'categories', 
    'tags',
    'collections',
    'blog_posts',
    'submissions',
    'user_profiles'
  ];

  for (const table of tables) {
    try {
      console.log(`📊 检查表: ${table}`);
      
      // 检查表是否存在并获取数据量
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ 表不存在或无法访问: ${error.message}`);
        continue;
      }

      console.log(`   ✅ 记录数量: ${count || 0}`);

      // 如果有数据，显示一些样本字段
      if (count > 0) {
        const { data: sample } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (sample && sample[0]) {
          const fields = Object.keys(sample[0]);
          console.log(`   📋 字段: ${fields.join(', ')}`);
        }
      }
      
      console.log(''); // 空行分隔
    } catch (err) {
      console.log(`   ❌ 检查失败: ${err.message}\n`);
    }
  }
}

async function main() {
  try {
    await checkSupabaseData();
    console.log('✅ 数据检查完成！');
  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}