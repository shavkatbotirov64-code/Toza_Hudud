// Database jadvallarini ko'rish
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_HWDsbY8gc2xM@ep-sweet-star-ai94ru6h-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function checkTables() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables in database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log('\n🔍 Checking vehicles table columns...');
    const vehiclesTable = result.rows.find(r => r.table_name === 'vehicles');
    
    if (vehiclesTable) {
      console.log(`\n✅ Found table: ${vehiclesTable.table_name}`);
      
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${vehiclesTable.table_name}'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📊 Columns:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('\n❌ vehicles table not found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();
