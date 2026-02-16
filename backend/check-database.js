const { Client } = require('pg');
require('dotenv').config();

async function checkDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Database ga ulandi\n');

    // Bins jadval strukturasini ko'rish
    console.log('📋 Bins jadval strukturasi:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'bins'
      ORDER BY ordinal_position;
    `);
    
    console.table(columns.rows);

    // Mavjud qutilarni ko'rish
    console.log('\n📦 Mavjud qutilar:');
    const bins = await client.query('SELECT * FROM bins LIMIT 5');
    console.log(`Jami: ${bins.rowCount} ta quti`);
    if (bins.rows.length > 0) {
      console.table(bins.rows);
    }

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();
