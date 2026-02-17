// Fill bin to test cleaning
require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

async function fillBin() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Update bin fillLevel to 95 (full)
    const result = await client.query(`
      UPDATE bins 
      SET "fillLevel" = 95, 
          status = 'FULL',
          "updatedAt" = NOW()
      WHERE code = 'ESP32-IBN-SINO'
      RETURNING *;
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Bin filled successfully!');
      console.log('📦 Bin is now FULL (95%)');
      console.log('🚛 Vehicle should go to clean it');
    } else {
      console.log('⚠️ No bin found with code ESP32-IBN-SINO');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fillBin();
