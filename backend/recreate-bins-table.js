const { Client } = require('pg');
require('dotenv').config();

async function recreateBinsTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Database ga ulandi\n');

    // 1. Eski bins jadvalini to'liq o'chirish
    console.log('🗑️ Eski bins jadvalini o\'chirish...');
    await client.query('DROP TABLE IF EXISTS bins CASCADE;');
    console.log('✅ Eski jadval o\'chirildi');

    // 2. Yangi bins jadvalini yaratish
    console.log('\n📝 Yangi bins jadvalini yaratish...');
    await client.query(`
      CREATE TABLE bins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "binId" VARCHAR(50) NOT NULL UNIQUE,
        code VARCHAR(50),
        location VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        district VARCHAR(100) DEFAULT 'Samarqand',
        latitude NUMERIC(10, 7) NOT NULL,
        longitude NUMERIC(10, 7) NOT NULL,
        status VARCHAR(20) DEFAULT 'EMPTY',
        "fillLevel" INTEGER DEFAULT 15,
        capacity INTEGER DEFAULT 120,
        type VARCHAR(50) DEFAULT 'standard',
        "sensorId" VARCHAR(50),
        "isOnline" BOOLEAN DEFAULT true,
        "batteryLevel" INTEGER DEFAULT 100,
        "lastDistance" NUMERIC(5, 2),
        "lastCleaningTime" TIMESTAMP,
        "totalCleanings" INTEGER DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        "lastUpdate" TIMESTAMP,
        "lastCleaned" TIMESTAMP,
        temperature NUMERIC,
        humidity NUMERIC,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Yangi jadval yaratildi');

    // 3. Test quti qo'shish
    console.log('\n📦 Test quti qo\'shish...');
    const result = await client.query(`
      INSERT INTO bins (
        "binId",
        code,
        location,
        address,
        district,
        latitude,
        longitude,
        status,
        "fillLevel",
        capacity,
        type,
        "isOnline",
        "batteryLevel",
        "isActive"
      ) VALUES (
        'ESP32-IBN-SINO',
        'ESP32-IBN-SINO',
        'Ibn Sino ko''chasi 17A, Samarqand',
        'Ibn Sino ko''chasi 17A, Samarqand',
        'Samarqand',
        39.6742637,
        66.9737814,
        'EMPTY',
        15,
        120,
        'standard',
        true,
        100,
        true
      )
      RETURNING *;
    `);

    console.log('✅ Quti qo\'shildi:');
    console.log(`  - ID: ${result.rows[0].id}`);
    console.log(`  - binId: ${result.rows[0].binId}`);
    console.log(`  - code: ${result.rows[0].code}`);
    console.log(`  - location: ${result.rows[0].location}`);
    console.log(`  - status: ${result.rows[0].status}`);
    console.log(`  - fillLevel: ${result.rows[0].fillLevel}`);

    // 4. Barcha qutilarni ko'rish
    console.log('\n📋 Barcha qutilar:');
    const bins = await client.query('SELECT * FROM bins');
    console.log(`Jami: ${bins.rows.length} ta quti`);
    bins.rows.forEach(bin => {
      console.log(`  - ${bin.binId}: ${bin.status} (${bin.fillLevel}%) - ${bin.location}`);
    });

    console.log('\n✅ Bins jadvali qayta yaratildi!');

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
    console.error(error);
  } finally {
    await client.end();
    console.log('\n🔌 Database ulanish yopildi');
  }
}

recreateBinsTable();
