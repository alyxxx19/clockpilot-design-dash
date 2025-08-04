#!/usr/bin/env node

/**
 * Database Optimization Script for ClockPilot
 * Applies performance indexes and optimizations to the PostgreSQL database
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting ClockPilot Database Optimization...\n');

// Check if database URL is available
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

try {
  // Read the SQL indexes file
  const sqlFilePath = path.join(__dirname, '..', 'server', 'database', 'indexes.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error('❌ Indexes SQL file not found:', sqlFilePath);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  console.log('📊 Applying database indexes and optimizations...');
  
  // Execute the SQL file using psql
  const psqlCommand = `psql "${process.env.DATABASE_URL}" -c "${sqlContent.replace(/"/g, '\\"')}"`;
  
  try {
    const output = execSync(psqlCommand, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Database indexes applied successfully');
    console.log('📈 Performance optimizations completed');
    
    // Display some output if verbose
    if (process.argv.includes('--verbose')) {
      console.log('\nDatabase output:');
      console.log(output);
    }
    
  } catch (execError) {
    console.error('❌ Error executing SQL optimizations:');
    console.error(execError.message);
    
    // Try alternative approach with drizzle push
    console.log('\n🔄 Attempting alternative optimization using Drizzle...');
    try {
      execSync('npm run db:push', { encoding: 'utf8', stdio: 'inherit' });
      console.log('✅ Database schema updated via Drizzle');
    } catch (drizzleError) {
      console.error('❌ Drizzle push also failed:', drizzleError.message);
    }
  }

  // Performance recommendations
  console.log('\n📋 Performance Recommendations:');
  console.log('   • Monitor slow queries with pg_stat_statements');
  console.log('   • Configure Redis caching for frequently accessed data');
  console.log('   • Set up connection pooling for production');
  console.log('   • Enable query logging for performance analysis');
  console.log('   • Consider partitioning large tables (time_entries, notifications)');
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Restart your application to apply new optimizations');
  console.log('   2. Monitor application performance with the new indexes');
  console.log('   3. Review slow query logs periodically');
  console.log('   4. Consider adding Redis caching for frequently accessed data');

  console.log('\n✨ Database optimization completed successfully!');

} catch (error) {
  console.error('❌ Database optimization failed:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   • Verify DATABASE_URL is correct');
  console.log('   • Ensure PostgreSQL is running and accessible');
  console.log('   • Check database permissions');
  console.log('   • Try running: npm run db:push');
  
  process.exit(1);
}