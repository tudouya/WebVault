/**
 * Import Data to D1 Script
 * 
 * 将导出的数据导入到 Cloudflare D1 数据库
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const dataDir = path.join(__dirname, 'exported-data');

function executeWranglerCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 执行: ${command}`);
    
    const child = spawn('sh', ['-c', command], {
      stdio: 'pipe',
      cwd: path.join(__dirname, '../..')
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}:\n${stderr}`));
      }
    });
  });
}

async function importTable(tableName) {
  const filePath = path.join(dataDir, `${tableName}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${tableName}.json 文件不存在，跳过`);
    return true;
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data || data.length === 0) {
      console.log(`⚠️  ${tableName} 数据为空，跳过`);
      return true;
    }

    console.log(`📥 导入 ${tableName} (${data.length} 条记录)...`);

    // 生成 SQL INSERT 语句
    const columns = Object.keys(data[0]);
    const insertSQL = data.map(item => {
      const values = columns.map(col => {
        const value = item[col];
        if (value === null || value === undefined) {
          return 'NULL';
        }
        if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`; // 转义单引号
        }
        return value;
      }).join(', ');
      
      return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
    }).join('\n');

    // 写入临时 SQL 文件
    const sqlFile = path.join(__dirname, `temp_${tableName}.sql`);
    fs.writeFileSync(sqlFile, insertSQL, 'utf8');

    try {
      // 执行 wrangler 命令
      await executeWranglerCommand(`wrangler d1 execute webvault-development --file="${sqlFile}"`);
      console.log(`   ✅ ${tableName} 导入成功`);
      
      // 清理临时文件
      fs.unlinkSync(sqlFile);
      return true;
      
    } catch (error) {
      console.error(`   ❌ ${tableName} 导入失败:`, error.message);
      // 清理临时文件
      if (fs.existsSync(sqlFile)) {
        fs.unlinkSync(sqlFile);
      }
      return false;
    }

  } catch (err) {
    console.error(`❌ 处理 ${tableName} 时出现错误:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 开始导入数据到 D1...\n');

  // 检查导出数据目录
  if (!fs.existsSync(dataDir)) {
    console.error('❌ 导出数据目录不存在，请先运行导出脚本');
    process.exit(1);
  }

  const tablesToImport = ['categories', 'tags'];
  let successCount = 0;

  for (const table of tablesToImport) {
    const success = await importTable(table);
    if (success) successCount++;
  }

  console.log(`\n✅ 导入完成! 成功: ${successCount}/${tablesToImport.length}`);
  
  // 验证导入结果
  console.log('\n🔍 验证导入结果...');
  try {
    for (const table of tablesToImport) {
      const result = await executeWranglerCommand(`wrangler d1 execute webvault-development --command="SELECT COUNT(*) as count FROM ${table};"`);
      const match = result.match(/"count":\s*(\d+)/);
      if (match) {
        console.log(`   📊 ${table}: ${match[1]} 条记录`);
      }
    }
  } catch (error) {
    console.log('   ⚠️  验证过程出现错误，但导入可能仍然成功');
  }
}

if (require.main === module) {
  main().catch(console.error);
}