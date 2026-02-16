// Update bin fillLevel directly in database
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_xxxxxxxxx@ep-xxxxxxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function updateBinFillLevel() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Update bin fillLevel to 15 (empty)
    const result = await client.query(`
      UPDATE bins 
      SET "fillLevel" = 15, 
          status = 'EMPTY',
          "updatedAt" = NOW()
      WHERE code = 'ESP32-IBN-SINO'
      RETURNING *;
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Bin updated successfully!');
      console.log('📦 Updated bin:', result.rows[0]);
    } else {
      console.log('⚠️ No bin found with code ESP32-IBN-SINO');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updateBinFillLevel();
