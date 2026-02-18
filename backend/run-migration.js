// Database migration - patrol ustunlarini qo'shish
const { Client } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://neondb_owner:npg_HWDsbY8gc2xM@ep-sweet-star-ai94ru6h-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read SQL file
    const sql = fs.readFileSync('./add-patrol-columns.sql', 'utf8');
    
    console.log('🔄 Running migration...');
    console.log('SQL:', sql);
    console.log('');
    
    const result = await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

runMigration();
