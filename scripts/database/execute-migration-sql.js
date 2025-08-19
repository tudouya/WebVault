/**
 * Simple migration executor using Supabase SQL queries
 * 
 * This script loads the migration SQL file and provides instructions
 * for executing it through the Supabase dashboard.
 */

// Load environment variables from .env.local
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '../../.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
} catch (error) {
  console.log('Warning: Could not load .env.local file');
}

const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Admin Auth System Migration Helper');
  console.log('====================================');
  
  const migrationPath = path.join(__dirname, '../../supabase/migrations/20250118120000_admin_auth_system.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📄 Migration file loaded successfully');
  console.log(`📊 Migration contains ${migrationSQL.split('\n').length} lines`);
  console.log('');
  
  // Extract database URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (supabaseUrl) {
    const projectId = supabaseUrl.split('//')[1]?.split('.')[0];
    console.log(`🌐 Supabase Project: ${projectId}`);
    console.log(`🔗 Dashboard URL: https://supabase.com/dashboard/project/${projectId}`);
    console.log('');
  }
  
  console.log('📋 MIGRATION EXECUTION STEPS:');
  console.log('=============================');
  console.log('1. Open your Supabase dashboard');
  console.log('2. Go to SQL Editor');
  console.log('3. Create a new query');
  console.log('4. Copy and paste the migration SQL below');
  console.log('5. Execute the query');
  console.log('');
  
  console.log('📝 MIGRATION SQL:');
  console.log('=================');
  console.log('```sql');
  console.log(migrationSQL);
  console.log('```');
  console.log('');
  
  console.log('⚠️  IMPORTANT NOTES:');
  console.log('====================');
  console.log('- This will create user_profiles and auth_lockouts tables');
  console.log('- RLS policies will be applied automatically');  
  console.log('- Authentication functions will be created');
  console.log('- Indexes will be created for performance');
  console.log('- Make sure to backup your database first!');
  console.log('');
  
  console.log('✅ After execution, run: node scripts/database/verify-migration.js');
}

main().catch(console.error);